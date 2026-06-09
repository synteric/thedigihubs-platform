import { spawnSync } from 'node:child_process';
import { basename } from 'node:path';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: options.capture ? 'pipe' : 'inherit',
    encoding: 'utf8',
  });

  if (result.error) {
    throw result.error;
  }

  if (!options.allowFailure && result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  return result;
}

function volumeExists(name) {
  const result = run('docker', ['volume', 'inspect', name], { allowFailure: true, capture: true });
  return result.status === 0;
}

const projectName = process.env.COMPOSE_PROJECT_NAME || basename(process.cwd());
const candidates = [
  `${projectName}_postgres-data`,
  'thedigihubs-starter_postgres-data',
];

console.log('Stopping local Docker Postgres...');
run('docker', ['compose', 'stop', 'postgres'], { allowFailure: true });
run('docker', ['compose', 'rm', '-f', 'postgres'], { allowFailure: true });

for (const volume of [...new Set(candidates)]) {
  if (!volumeExists(volume)) continue;
  console.log(`Removing Docker volume ${volume}...`);
  run('docker', ['volume', 'rm', volume]);
}

console.log('Local Docker database volume reset complete.');
