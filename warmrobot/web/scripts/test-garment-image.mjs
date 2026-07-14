/**
 * Test garment preview pipeline (bbox crop → cloud beautify → white product card).
 *
 *   npm run test:garment-image -- path/to/photo.jpg
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { processGarmentImage } from "../src/lib/garment-image-pipeline.ts";

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

const inputPath = resolve(process.argv[2] ?? "");
if (!inputPath || !existsSync(inputPath)) {
  console.error("Usage: npm run test:garment-image -- <image-path>");
  process.exit(1);
}

const buffer = readFileSync(inputPath);
const ext = inputPath.toLowerCase();
const mimeType = ext.endsWith(".png")
  ? "image/png"
  : ext.endsWith(".webp")
    ? "image/webp"
    : "image/jpeg";

const bbox = { x: 0.1, y: 0.1, w: 0.35, h: 0.45 };

const result = await processGarmentImage({
  imageBuffer: buffer,
  mimeType,
  boundingBox: bbox,
});

const outDir = join(WEB_ROOT, ".tmp");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "garment-preview.webp");
writeFileSync(outPath, result.buffer);

if (result.warning) console.log("warning:", result.warning);
console.log("written:", outPath);
