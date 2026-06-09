import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const envPath = '.env';
const containerName = process.env.POSTGRES_CONTAINER_NAME || 'thedigihubs-postgres';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: options.inherit ? 'inherit' : 'pipe',
  });

  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout?.trim() || '',
    stderr: result.stderr?.trim() || '',
    error: result.error,
  };
}

function parseEnv(text) {
  const values = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator === -1) continue;
    values[line.slice(0, separator).trim()] = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
  }
  return values;
}

function mask(value) {
  if (!value) return '(empty)';
  if (value.length <= 4) return '****';
  return `${value.slice(0, 2)}****${value.slice(-2)}`;
}

function parseDatabaseUrl(value) {
  try {
    const url = new URL(value);
    return {
      protocol: url.protocol,
      username: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      host: url.hostname,
      port: url.port || '5432',
      database: url.pathname.replace(/^\//, ''),
      schema: url.searchParams.get('schema') || 'public',
    };
  } catch {
    return null;
  }
}

function inspectContainerEnv() {
  const result = run('docker', ['inspect', '-f', '{{range .Config.Env}}{{println .}}{{end}}', containerName]);
  if (!result.ok) return null;
  const env = {};
  for (const line of result.stdout.split(/\r?\n/)) {
    const separator = line.indexOf('=');
    if (separator === -1) continue;
    env[line.slice(0, separator)] = line.slice(separator + 1);
  }
  return env;
}

function inspectHealth() {
  const result = run('docker', ['inspect', '-f', '{{.State.Health.Status}}', containerName]);
  return result.ok ? result.stdout : 'not-running';
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 90000) {
    const health = inspectHealth();
    if (health === 'healthy') return health;
    if (health === 'unhealthy') return health;
    await sleep(1500);
  }
  return inspectHealth();
}

function psql(args, password) {
  const dockerArgs = ['exec'];
  if (password !== undefined) {
    dockerArgs.push('-e', `PGPASSWORD=${password}`);
  }
  dockerArgs.push(containerName, 'psql', ...args);
  return run('docker', dockerArgs);
}

function sqlText(result) {
  return result.stdout || result.stderr || '(no output)';
}

console.log('TheDigiHubs database doctor');
console.log('----------------------------');

if (!existsSync(envPath)) {
  console.error('Missing .env file. Run pnpm setup:env first.');
  process.exit(1);
}

const env = parseEnv(readFileSync(envPath, 'utf8'));
const databaseUrl = parseDatabaseUrl(env.DATABASE_URL || '');
const hostPort = env.POSTGRES_HOST_PORT || '55432';

if (!databaseUrl) {
  console.error('DATABASE_URL is missing or invalid in .env.');
  process.exit(1);
}

console.log(`.env DATABASE_URL user: ${databaseUrl.username}`);
console.log(`.env DATABASE_URL password: ${mask(databaseUrl.password)}`);
console.log(`.env DATABASE_URL database: ${databaseUrl.database}`);
console.log(`.env DATABASE_URL host: ${databaseUrl.host}:${databaseUrl.port}`);
console.log(`Host-side Docker Postgres port: ${hostPort}`);

console.log('');
console.log('Starting Docker Postgres if needed...');
run('docker', ['compose', 'up', '-d', '--force-recreate', 'postgres'], { inherit: true });

const health = await waitForHealth();
console.log(`Docker container: ${containerName}`);
console.log(`Docker health: ${health}`);

const containerEnv = inspectContainerEnv();
if (containerEnv) {
  console.log(`Container POSTGRES_USER: ${containerEnv.POSTGRES_USER || '(not set)'}`);
  console.log(`Container POSTGRES_PASSWORD: ${mask(containerEnv.POSTGRES_PASSWORD)}`);
  console.log(`Container POSTGRES_DB: ${containerEnv.POSTGRES_DB || '(not set)'}`);
} else {
  console.log('Container env could not be inspected.');
}

console.log('');
console.log('Testing password authentication against the database...');
const passwordAuth = psql(
  ['-h', '127.0.0.1', '-U', databaseUrl.username, '-d', databaseUrl.database, '-tAc', 'select current_user || \'@\' || current_database();'],
  databaseUrl.password,
);

if (passwordAuth.ok) {
  console.log(`OK inside container: ${passwordAuth.stdout}`);
} else {
  console.log('FAILED: password authentication did not work inside the container.');
}

if (!passwordAuth.ok) {
  console.log(sqlText(passwordAuth));

  console.log('');
  console.log('Asking Postgres whether the .env role/database exist through the local container socket...');
  const socketAuth = psql(
    ['-U', databaseUrl.username, '-d', databaseUrl.database, '-tAc', 'select current_user || \'@\' || current_database();'],
  );

  if (socketAuth.ok) {
    console.log(`Role and database exist: ${socketAuth.stdout}`);
    console.log('');
    console.log('Diagnosis: the database exists, but the stored password does not match .env.');
    console.log('For this fresh starter build, run: pnpm docker:db:reset');
    process.exit(2);
  }

  console.log('The .env role/database did not open through the local socket either.');
  console.log(sqlText(socketAuth));

  console.log('');
  console.log('Trying to list visible roles/databases from common local superuser names...');
  for (const candidate of [databaseUrl.username, containerEnv?.POSTGRES_USER, 'postgres'].filter(Boolean)) {
    const roleList = psql(['-U', candidate, '-d', 'postgres', '-tAc', 'select string_agg(rolname, \', \' order by rolname) from pg_roles;']);
    const dbList = psql(['-U', candidate, '-d', 'postgres', '-tAc', 'select string_agg(datname, \', \' order by datname) from pg_database where datistemplate = false;']);
    if (roleList.ok || dbList.ok) {
      console.log(`Connected locally as ${candidate}.`);
      if (roleList.ok) console.log(`Roles: ${roleList.stdout}`);
      if (dbList.ok) console.log(`Databases: ${dbList.stdout}`);
      console.log('');
      console.log('Diagnosis: Docker is running a database volume initialized with different users/databases than .env expects.');
      console.log('For this fresh starter build, run: pnpm docker:db:reset');
      process.exit(2);
    }
  }

  console.log('Could not query roles/databases from the container.');
  console.log('Diagnosis: Postgres is running, but the local database volume is not usable with the current project credentials.');
  console.log('For this fresh starter build, run: pnpm docker:db:reset');
  process.exit(2);
}

console.log('');
console.log(`Testing the host-published Docker port through host.docker.internal:${hostPort}...`);
const hostPortAuth = psql(
  ['-h', 'host.docker.internal', '-p', hostPort, '-U', databaseUrl.username, '-d', databaseUrl.database, '-tAc', 'select current_user || \'@\' || current_database();'],
  databaseUrl.password,
);

if (hostPortAuth.ok) {
  console.log(`OK on host-published port: ${hostPortAuth.stdout}`);
  console.log('');
  console.log('Database credentials are valid for Docker and the host-published port. You can run: pnpm db:push && pnpm db:seed');
  process.exit(0);
}

console.log('FAILED: Docker Postgres accepts the credentials internally, but the host-published port did not.');
console.log(sqlText(hostPortAuth));
console.log('');
console.log('Diagnosis: Prisma from Windows is not reaching the same Postgres endpoint that Docker is running.');
console.log(`Expected host endpoint: 127.0.0.1:${hostPort}`);
console.log('Run: pnpm docker:db:setup');
process.exit(2);
