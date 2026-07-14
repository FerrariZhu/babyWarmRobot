import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(__dirname, '..');
const webEnvLocal = join(backendRoot, '..', 'web', '.env.local');
const backendEnv = join(backendRoot, '.env');

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

export function loadBackendDatabaseEnv() {
  loadEnvFile(backendEnv);
  loadEnvFile(webEnvLocal);
  const supabaseDb = process.env.SUPABASE_DB_URL?.trim();
  if (supabaseDb) {
    process.env.DATABASE_URL = supabaseDb;
  }
  return process.env.DATABASE_URL?.trim() ?? '';
}
