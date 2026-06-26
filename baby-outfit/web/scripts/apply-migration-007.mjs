/**
 * Apply migration 007_product_catalog.sql to Supabase Postgres.
 * Requires SUPABASE_DB_URL in web/.env.local
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(__dirname, "..");

function loadEnvFile(path) {
  try {
    const text = readFileSync(path, "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
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
  } catch {
    /* optional */
  }
}

loadEnvFile(join(WEB_ROOT, ".env.local"));

async function main() {
  const dbUrl = process.env.SUPABASE_DB_URL?.trim();
  if (!dbUrl) {
    throw new Error(
      "请在 web/.env.local 设置 SUPABASE_DB_URL（Supabase Dashboard → Settings → Database → Connection string）"
    );
  }

  const sqlPath = join(WEB_ROOT, "..", "supabase", "migrations", "007_product_catalog.sql");
  const sql = readFileSync(sqlPath, "utf8");

  const pg = (await import("pg")).default;
  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log("Migration 007 applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
