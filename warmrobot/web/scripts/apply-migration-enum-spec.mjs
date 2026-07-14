/**
 * Apply enum spec migrations (012 + 013) in two steps.
 * PostgreSQL requires enum value commits before use in the same session.
 *
 *   npm run db:migrate:enum
 *
 * Requires SUPABASE_DB_URL in web/.env.local
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { WEB_ROOT, withPgClient } from "./db-env.mjs";

const MIGRATIONS = [
  "20240101000012_enum_spec_values.sql",
  "20240101000013_enum_spec_sync.sql",
];

async function runFile(client, filename) {
  const path = join(WEB_ROOT, "..", "supabase", "migrations", filename);
  const sql = readFileSync(path, "utf8");
  await client.query(sql);
  console.log(`✓ ${filename}`);
}

async function main() {
  for (const file of MIGRATIONS) {
    await withPgClient((client) => runFile(client, file));
  }
  console.log("枚举 migration 已全部执行。");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
