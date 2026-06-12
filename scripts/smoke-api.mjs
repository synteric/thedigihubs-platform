import { existsSync, readFileSync } from 'node:fs';

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeApiUrl(value) {
  return value
    .replace(/\/$/, '')
    .replace('http://localhost:', 'http://127.0.0.1:');
}

async function check(url, timeoutMs = 30000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
    return { url, ok: response.status >= 200 && response.status < 400, status: response.status };
  } catch (error) {
    return { url, ok: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkWithRetry(url, attempts = 3) {
  let result = await check(url);
  for (let attempt = 2; attempt <= attempts && !result.ok; attempt += 1) {
    await sleep(1500 * attempt);
    result = await check(url);
  }
  return result;
}

const env = { ...parseEnv(), ...process.env };
const apiUrl = normalizeApiUrl(env.SMOKE_API_URL || 'http://127.0.0.1:4000/api');
const checks = ['/health', '/ready'].map((path) => `${apiUrl}${path}`);

console.log(`Checking TheDigiHubs API at ${apiUrl}`);

let failed = false;

for (const url of checks) {
  const result = await checkWithRetry(url, 3);
  const label = result.status ? `HTTP ${result.status}` : result.error;
  console.log(`${result.ok ? 'OK' : 'FAIL'} ${result.url} ${label}`);
  if (!result.ok) failed = true;
}

if (failed) {
  console.error('One or more API checks failed.');
  process.exit(1);
}

console.log('API smoke check passed.');
