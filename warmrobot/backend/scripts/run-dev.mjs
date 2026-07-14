import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadBackendDatabaseEnv } from './load-db-env.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(__dirname, '..');

const dbUrl = loadBackendDatabaseEnv();
if (!dbUrl) {
  console.error(
    '缺少 DATABASE_URL / SUPABASE_DB_URL。\n' +
      '在 web/.env.local 添加：\n' +
      'SUPABASE_DB_URL=postgresql://postgres.ocyzsyjohwyepmfvugrj:[密码]@...\n' +
      '获取：https://supabase.com/dashboard/project/ocyzsyjohwyepmfvugrj/settings/database',
  );
  process.exit(1);
}

const child = spawn('npx', ['nest', 'start', '--watch'], {
  cwd: backendRoot,
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32',
});

child.on('exit', (code) => process.exit(code ?? 0));
