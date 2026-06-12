import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const backupDir = resolve('backups');
const containerName = process.env.POSTGRES_CONTAINER_NAME || 'thedigihubs-postgres';

function parseEnv() {
  if (!existsSync('.env')) return {};
  const env = {};
  for (const rawLine of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator === -1) continue;
    env[line.slice(0, separator).trim()] = line.slice(separator + 1).trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

function parseDatabaseUrl(value) {
  const url = new URL(value);
  return {
    value,
    host: url.hostname,
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, '').split('/')[0],
  };
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: 'inherit',
    ...options,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const env = { ...parseEnv(), ...process.env };
if (!env.DATABASE_URL) {
  console.error('DATABASE_URL is required before creating a database backup.');
  process.exit(1);
}

const database = parseDatabaseUrl(env.DATABASE_URL);
mkdirSync(backupDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const fileName = `thedigihubs-${stamp}.dump`;
const targetPath = resolve(backupDir, fileName);

if (database.host === 'postgres' || env.DB_BACKUP_USE_DOCKER === 'true') {
  const containerPath = `/tmp/${fileName}`;
  run('docker', [
    'exec',
    '-e',
    `PGPASSWORD=${database.password}`,
    containerName,
    'pg_dump',
    '-U',
    database.username,
    '-d',
    database.database,
    '-F',
    'c',
    '-f',
    containerPath,
  ]);
  run('docker', ['cp', `${containerName}:${containerPath}`, targetPath]);
  run('docker', ['exec', containerName, 'rm', '-f', containerPath]);
} else {
  run('pg_dump', [database.value, '-F', 'c', '-f', targetPath], {
    env: { ...process.env, PGPASSWORD: database.password },
  });
}

console.log(`Database backup created: ${resolve(backupDir, basename(targetPath))}`);
