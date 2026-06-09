import { appendFileSync, copyFileSync, existsSync, readFileSync } from 'node:fs';

const envPath = '.env';
const examplePath = '.env.example';

function readKeys(path) {
  const keys = new Set();
  const content = readFileSync(path, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator === -1) continue;
    keys.add(line.slice(0, separator).trim());
  }
  return keys;
}

function missingExampleLines() {
  const envKeys = readKeys(envPath);
  return readFileSync(examplePath, 'utf8')
    .split(/\r?\n/)
    .filter((rawLine) => {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) return false;
      const separator = line.indexOf('=');
      if (separator === -1) return false;
      return !envKeys.has(line.slice(0, separator).trim());
    });
}

if (existsSync(envPath) && existsSync(examplePath)) {
  const lines = missingExampleLines();
  if (lines.length) {
    appendFileSync(envPath, `\n# Added from .env.example\n${lines.join('\n')}\n`);
    console.log(`Updated .env with ${lines.length} missing value(s) from .env.example`);
  } else {
    console.log('.env already exists');
  }
} else if (existsSync(examplePath)) {
  copyFileSync(examplePath, envPath);
  console.log('Created .env from .env.example');
} else if (existsSync(envPath)) {
  console.log('.env already exists');
} else {
  console.error('Missing .env and .env.example. Create .env before starting Docker.');
  process.exit(1);
}
