import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { loadBackendDatabaseEnv } from './load-db-env.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(__dirname, '..');

const dbUrl = loadBackendDatabaseEnv();
if (!dbUrl) {
  console.error(
    '缺少 DATABASE_URL。\n' +
      '在 web/.env.local 设置 SUPABASE_DB_URL：\n' +
      'https://supabase.com/dashboard/project/ocyzsyjohwyepmfvugrj/settings/database',
  );
  process.exit(1);
}

const prismaArgs = process.argv.slice(2);
const result = spawnSync('npx', ['prisma', ...prismaArgs], {
  cwd: backendRoot,
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
