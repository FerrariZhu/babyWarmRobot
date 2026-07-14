import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { loadBackendDatabaseEnv } from './load-db-env.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = join(__dirname, '..', 'prisma', 'lessons-schema.sql');

const dbUrl = loadBackendDatabaseEnv();
if (!dbUrl) {
  console.error('缺少 SUPABASE_DB_URL');
  process.exit(1);
}

const sql = readFileSync(sqlPath, 'utf8');
const client = new pg.Client({
  connectionString: dbUrl.replace(/[?&]sslmode=[^&]*/g, '').replace(/\?$/, ''),
  ssl: { rejectUnauthorized: false },
});

await client.connect();
try {
  await client.query(sql);
  console.log('Lessons schema applied OK');
} finally {
  await client.end();
}
