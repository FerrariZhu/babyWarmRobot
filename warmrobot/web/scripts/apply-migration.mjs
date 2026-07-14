/**
 * Apply a Supabase migration SQL file.
 * Requires SUPABASE_DB_URL in web/.env.local
 *
 *   npm run db:migrate -- 20240101000008_baby_profile_fields.sql
 *   npm run db:migrate -- supabase/scripts/clear_dirty_data.sql
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { WEB_ROOT, withPgClient } from "./db-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

function resolveSqlPath(arg) {
  if (!arg) {
    throw new Error(
      "请指定 SQL 文件，例如：npm run db:migrate -- 20240101000008_baby_profile_fields.sql"
    );
  }

  const candidates = [
    join(WEB_ROOT, "..", "supabase", "migrations", arg),
    join(WEB_ROOT, "..", "supabase", "scripts", arg),
    join(process.cwd(), arg),
    arg,
  ];

  for (const path of candidates) {
    if (existsSync(path)) return path;
  }

  throw new Error(`找不到 SQL 文件：${arg}`);
}

async function main() {
  const sqlPath = resolveSqlPath(process.argv[2]);
  const sql = readFileSync(sqlPath, "utf8");

  await withPgClient(async (client) => {
    await client.query(sql);
  });

  console.log(`已执行：${sqlPath}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
