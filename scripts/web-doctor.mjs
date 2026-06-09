import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const webUrl = 'http://127.0.0.1:3000';

function run(label, command, args, options = {}) {
  console.log(`\n${label}`);
  console.log(`${command} ${args.join(' ')}`);

  const result = spawnSync(command, args, {
    cwd: rootDir,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    ...options,
  });

  if (result.stdout?.trim()) console.log(result.stdout.trim());
  if (result.stderr?.trim()) console.error(result.stderr.trim());

  return result;
}

function runLive(label, command, args, options = {}) {
  console.log(`\n${label}`);
  console.log(`${command} ${args.join(' ')}`);

  return spawnSync(command, args, {
    cwd: rootDir,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: 'inherit',
    env: {
      ...process.env,
      COMPOSE_PROGRESS: 'plain',
    },
    ...options,
  });
}

async function waitForWeb() {
  const started = Date.now();
  const timeoutMs = 90_000;

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(webUrl, { cache: 'no-store' });
      if (response.ok || response.status < 500) {
        return { ok: true, status: response.status };
      }
    } catch {
      // The dev server is still booting.
    }

    await new Promise((resolveWait) => setTimeout(resolveWait, 2500));
    process.stdout.write('.');
  }

  console.log('');
  return { ok: false };
}

console.log('TheDigiHubs web doctor');
console.log('----------------------');

const dockerVersion = run('Checking Docker...', 'docker', ['version', '--format', '{{.Server.Version}}']);
if (dockerVersion.status !== 0) {
  console.error('\nDocker is not responding. Start Docker Desktop, wait until it says it is running, then run this again.');
  process.exit(1);
}

const infraUp = runLive(
  'Starting shared services...',
  'docker',
  ['compose', 'up', '-d', 'postgres', 'redis', 'meilisearch', 'minio', 'mailhog'],
);

if (infraUp.status !== 0) {
  console.error('\nDocker could not start the shared services. Recent container status follows.');
  run('Container status', 'docker', ['compose', 'ps']);
  process.exit(infraUp.status ?? 1);
}

const appUp = runLive(
  'Starting app containers from existing local images...',
  'docker',
  ['compose', 'up', '--no-build', '--force-recreate', '-d', 'api', 'worker', 'web'],
);

if (appUp.status !== 0) {
  console.error('\nDocker could not start the app containers from local images.');
  console.error('If Docker says an image is missing, run pnpm docker:refresh after your internet/DNS connection to registry.npmjs.org is stable.');
  run('Container status', 'docker', ['compose', 'ps']);
  run('Web logs', 'docker', ['compose', 'logs', '--tail=120', 'web']);
  run('API logs', 'docker', ['compose', 'logs', '--tail=120', 'api']);
  process.exit(appUp.status ?? 1);
}

run('Container status', 'docker', ['compose', 'ps']);

console.log(`\nWaiting for ${webUrl} to answer`);
const web = await waitForWeb();

if (web.ok) {
  console.log(`\nOK: The web app answered with HTTP ${web.status}.`);
  console.log('Open: http://localhost:3000');
  process.exit(0);
}

console.error(`\nThe web app did not answer at ${webUrl}. Recent logs follow.`);
run('Web logs', 'docker', ['compose', 'logs', '--tail=160', 'web']);
run('API logs', 'docker', ['compose', 'logs', '--tail=160', 'api']);
run('Container status', 'docker', ['compose', 'ps']);
process.exit(1);
