import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function loadEnvFile(filePath: string): Record<string, string> {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const env: Record<string, string> = {};
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
    return env;
  } catch {
    return {};
  }
}

async function globalSetup() {
  // 1) Load test env from tests/env.test and set into process.env (for test runner + prisma client in tests)
  const envFile = path.join(__dirname, 'env.test');
  const testEnv = loadEnvFile(envFile);
  for (const [k, v] of Object.entries(testEnv)) {
    process.env[k] = v;
  }

  // 2) Prepare test database (SQLite) - delete old file if exists then run prisma migrate deploy
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.startsWith('file:')) {
    const rel = dbUrl.replace('file:', '');
    const dbPath = path.isAbsolute(rel) ? rel : path.join(process.cwd(), rel);
    try {
      fs.rmSync(dbPath, { force: true });
      // ensure parent dir exists
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    } catch {}
  }

  // 3) Run migrations so schema is ready for the dev server and tests
  try {
    execSync('npx prisma migrate deploy --schema=prisma/schema.prisma', {
      stdio: 'inherit',
    });
  } catch (e) {
    console.error('Failed to run prisma migrate deploy for test DB');
    throw e;
  }
}

export default globalSetup;
