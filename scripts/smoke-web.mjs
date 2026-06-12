import { existsSync, readFileSync } from 'node:fs';

const publicPaths = [
  '/',
  '/platform',
  '/resources',
  '/partners',
  '/solutions/buyers',
  '/solutions/suppliers',
  '/register',
  '/subscribe',
  '/contact',
  '/sitemap.xml',
  '/robots.txt',
];

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

function normalizeBaseUrl(value) {
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
const baseUrl = normalizeBaseUrl(env.SMOKE_BASE_URL || 'http://127.0.0.1:3000');

console.log(`Checking TheDigiHubs public web pages at ${baseUrl}`);

const home = await checkWithRetry(`${baseUrl}/`, 5);
if (!home.ok && !home.status) {
  console.error(`Unable to connect to ${baseUrl}.`);
  console.error('');
  console.error('Start the web app first, then run this check again:');
  console.error('  pnpm dev:web');
  console.error('');
  console.error('Or, if you are using Docker:');
  console.error('  pnpm docker:web:doctor');
  console.error('');
  console.error('To check the live website instead, run:');
  console.error("  $env:SMOKE_BASE_URL='https://www.thedigihubs.com'; pnpm smoke:web");
  process.exit(1);
}

let failed = false;

for (const path of publicPaths) {
  const result = await checkWithRetry(`${baseUrl}${path}`, 3);
  const label = result.status ? `HTTP ${result.status}` : result.error;
  console.log(`${result.ok ? 'OK' : 'FAIL'} ${result.url} ${label}`);
  if (!result.ok) failed = true;
}

if (failed) {
  console.error('One or more public web checks failed.');
  process.exit(1);
}

console.log('Public web smoke check passed.');
