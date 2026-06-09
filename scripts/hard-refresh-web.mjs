import { spawnSync } from 'node:child_process';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: options.silent ? 'pipe' : 'inherit',
    shell: process.platform === 'win32',
  });
  return result.status === 0;
}

function output(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  return result.status === 0 ? result.stdout.trim() : '';
}

console.log('Stopping TheDigiHubs web container...');
run('docker', ['compose', 'stop', 'web'], { silent: true });
run('docker', ['compose', 'rm', '-f', 'web'], { silent: true });

const project = output('docker', ['compose', 'ls', '--format', 'json'])
  .split('\n')
  .map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  })
  .find((item) => item?.Name && item?.ConfigFiles?.includes('docker-compose.yml'))?.Name;

const volumeCandidates = [
  `${project || 'thedigihubs-starter'}_web-next-cache`,
  'thedigihubs-starter_web-next-cache',
  'i-am-building-a-production-saas_web-next-cache',
].filter(Boolean);

for (const volume of new Set(volumeCandidates)) {
  run('docker', ['volume', 'rm', volume], { silent: true });
}

console.log('Rebuilding and restarting TheDigiHubs web container...');
if (!run('docker', ['compose', 'up', '--build', '--force-recreate', '-d', 'web'])) {
  process.exit(1);
}

console.log('Web cache cleared. Open http://localhost:3000/register and http://localhost:3000/subscribe');
