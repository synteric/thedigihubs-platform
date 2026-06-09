import { spawnSync } from 'node:child_process';

const containerName = process.env.POSTGRES_CONTAINER_NAME || 'thedigihubs-postgres';
const timeoutMs = Number(process.env.POSTGRES_WAIT_TIMEOUT_MS || 90000);
const startedAt = Date.now();

function inspectHealth() {
  const result = spawnSync('docker', ['inspect', '-f', '{{.State.Health.Status}}', containerName], {
    encoding: 'utf8',
    stdio: 'pipe',
  });

  if (result.status !== 0) {
    return 'starting';
  }

  return result.stdout.trim();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

console.log(`Waiting for ${containerName} to become healthy...`);

while (Date.now() - startedAt < timeoutMs) {
  const status = inspectHealth();
  if (status === 'healthy') {
    console.log(`${containerName} is healthy.`);
    process.exit(0);
  }
  if (status === 'unhealthy') {
    console.error(`${containerName} reported unhealthy status.`);
    process.exit(1);
  }
  await sleep(1500);
}

console.error(`${containerName} did not become healthy within ${Math.round(timeoutMs / 1000)} seconds.`);
process.exit(1);
