/**
 * Generate text embeddings for product_catalog rows (Phase 2).
 *
 *   node scripts/generate-catalog-embeddings.mjs
 *   node scripts/generate-catalog-embeddings.mjs --limit 50
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { withPgClient } from "./db-env.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = join(__dirname, "..");

function loadEnvLocal() {
  const envPath = join(WEB_ROOT, ".env.local");
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

function getEmbeddingConfig() {
  const apiKey =
    process.env.EMBEDDING_API_KEY?.trim() ||
    process.env.VISION_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  return {
    baseUrl: (
      process.env.EMBEDDING_BASE_URL ||
      process.env.VISION_BASE_URL ||
      "https://api.siliconflow.cn/v1"
    ).replace(/\/+$/, ""),
    model: process.env.EMBEDDING_MODEL || "BAAI/bge-large-zh-v1.5",
    apiKey,
  };
}

function buildEmbeddingText(row) {
  return [
    row.title,
    row.inferred_category ? `类别:${row.inferred_category}` : null,
    row.inferred_thickness ? `厚度:${row.inferred_thickness}` : null,
    row.material_hint ? `材质:${row.material_hint}` : null,
    row.props_name ? `属性:${row.props_name}` : null,
  ]
    .filter(Boolean)
    .join(" | ");
}

async function createEmbedding(text, config) {
  const response = await fetch(`${config.baseUrl}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      input: text.slice(0, 8000),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Embedding API ${response.status}: ${err.slice(0, 120)}`);
  }

  const payload = await response.json();
  return payload.data?.[0]?.embedding;
}

function parseLimitArg() {
  const idx = process.argv.indexOf("--limit");
  if (idx >= 0 && process.argv[idx + 1]) {
    const n = Number(process.argv[idx + 1]);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
}

async function main() {
  const limit = parseLimitArg();
  const embeddingConfig = getEmbeddingConfig();
  if (!embeddingConfig) {
    throw new Error(
      "未配置 Embedding。设置 EMBEDDING_API_KEY 或复用 VISION_API_KEY（硅基流动）"
    );
  }

  console.log(`Embedding: siliconflow / ${embeddingConfig.model}`);

  await withPgClient(async (client) => {
    const { rows } = await client.query(
      `select id, title, inferred_category, inferred_thickness, material_hint, props_name
       from public.product_catalog
       where embedding is null
       order by fetched_at desc
       ${limit ? `limit ${limit}` : ""}`
    );

    if (rows.length === 0) {
      console.log("No catalog rows need embeddings.");
      return;
    }

    console.log(`Generating embeddings for ${rows.length} catalog rows...`);

    for (const row of rows) {
      const embeddingText = buildEmbeddingText(row);
      try {
        const embedding = await createEmbedding(embeddingText, embeddingConfig);
        if (!embedding?.length) {
          console.warn(`  skip ${row.id}: empty embedding`);
          continue;
        }
        const vectorLiteral = `[${embedding.join(",")}]`;
        await client.query(
          `update public.product_catalog
           set embedding_text = $2, embedding = $3::vector, updated_at = now()
           where id = $1`,
          [row.id, embeddingText, vectorLiteral]
        );
        console.log(`  ok ${row.title.slice(0, 50)}`);
      } catch (error) {
        console.error(`  fail ${row.id}:`, error instanceof Error ? error.message : error);
      }
    }

    await client.query(`
      create index if not exists product_catalog_embedding_hnsw_idx
        on public.product_catalog
        using hnsw (embedding vector_cosine_ops)
    `);
    console.log("Embedding index ensured.");
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
