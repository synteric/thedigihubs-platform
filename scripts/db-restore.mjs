import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, extname, resolve } from 'node:path';
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

function latestBackup() {
  if (!existsSync(backupDir)) return null;
  const backups = readdirSync(backupDir)
    .filter((file) => extname(file) === '.dump')
    .sort()
    .reverse();
  return backups[0] ? resolve(backupDir, backups[0]) : null;
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

if (process.env.RESTORE_CONFIRM !== 'YES') {
  console.error('Restore is destructive. Re-run with RESTORE_CONFIRM=YES after confirming the target database is correct.');
  process.exit(1);
}

const env = { ...parseEnv(), ...process.env };
if (!env.DATABASE_URL) {
  console.error('DATABASE_URL is required before restoring a database backup.');
  process.exit(1);
}

const selectedBackup = process.argv[2] || latestBackup();
if (!selectedBackup) {
  console.error('Backup file not found. Pass a .dump path or create one with pnpm db:backup first.');
  process.exit(1);
}

const sourcePath = resolve(selectedBackup);
if (!existsSync(sourcePath) || extname(sourcePath) !== '.dump') {
  console.error('Backup file not found. Pass a .dump path or create one with pnpm db:backup first.');
  process.exit(1);
}

const database = parseDatabaseUrl(env.DATABASE_URL);

if (database.host === 'postgres' || env.DB_BACKUP_USE_DOCKER === 'true') {
  const containerPath = `/tmp/${basename(sourcePath)}`;
  run('docker', ['cp', sourcePath, `${containerName}:${containerPath}`]);
  run('docker', [
    'exec',
    '-e',
    `PGPASSWORD=${database.password}`,
    containerName,
    'pg_restore',
    '-U',
    database.username,
    '-d',
    database.database,
    '--clean',
    '--if-exists',
    containerPath,
  ]);
  run('docker', ['exec', containerName, 'rm', '-f', containerPath]);
} else {
  run('pg_restore', ['--clean', '--if-exists', '--dbname', database.value, sourcePath], {
    env: { ...process.env, PGPASSWORD: database.password },
  });
}

console.log(`Database restored from: ${sourcePath}`);
