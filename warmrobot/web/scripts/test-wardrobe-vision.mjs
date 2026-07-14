/**
 * Test wardrobe vision via SiliconFlow (Qwen3-VL).
 *
 *   node scripts/test-wardrobe-vision.mjs photo.jpg
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

const CATEGORIES = [
  "bodysuit_short", "bodysuit_long", "tshirt_short", "tshirt_long", "thermal_top",
  "long_johns", "fleece_top", "sweater", "vest", "outer_down", "outer_cotton",
  "outer_uv", "outer_shell", "pants_short", "pants_mid", "pants_long",
  "shoes_boot", "shoes_leather", "shoes_sneaker", "shoes_sandal",
  "hat", "socks", "gloves", "scarf", "other",
];

function getVisionConfig() {
  const apiKey = process.env.VISION_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("Missing VISION_API_KEY in web/.env.local");
    process.exit(1);
  }

  return {
    baseUrl: (process.env.VISION_BASE_URL || "https://api.siliconflow.cn/v1").replace(/\/+$/, ""),
    model: process.env.VISION_MODEL || "Qwen/Qwen3-VL-8B-Instruct",
    apiKey,
  };
}

function mimeForPath(path) {
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

const systemPrompt = `你是婴儿服装衣柜识别助手。识别照片中每一件独立的婴儿服装。
只输出 JSON。category 只能是：${CATEGORIES.join(", ")}。thickness 只能是 thin, medium, thick。
输出：{"items":[{"name_guess":"...","category":"...","thickness":"...","material_hint":"...","confidence":0.8,"region_description":"...","color_hint":"..."}],"scene_notes":"...","warnings":[]}`;

async function scanImage(imagePath, config) {
  const buffer = readFileSync(imagePath);
  const base64 = buffer.toString("base64");
  const mime = mimeForPath(imagePath);
  const userText = "分析这张婴儿衣柜/衣物平铺照片，列出所有可辨认的独立衣物。";
  const dataUrl = `data:${mime};base64,${base64}`;

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.1,
      max_tokens: 8192,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API ${response.status}: ${err.slice(0, 200)}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  return JSON.parse(content);
}

async function main() {
  const paths = process.argv.slice(2);
  if (paths.length === 0) {
    console.error("Usage: node scripts/test-wardrobe-vision.mjs <image> [image2...]");
    process.exit(1);
  }

  const config = getVisionConfig();
  console.log(`Provider: siliconflow / ${config.model} @ ${config.baseUrl}`);

  for (const imagePath of paths) {
    console.log(`\n=== ${imagePath} ===`);
    try {
      const result = await scanImage(imagePath, config);
      const items = result.items ?? [];
      console.log(`Detected: ${items.length} items`);
      console.log(`Scene: ${result.scene_notes ?? "—"}`);
      if (result.warnings?.length) console.log(`Warnings: ${result.warnings.join("; ")}`);
      for (const [i, item] of items.entries()) {
        console.log(
          `  [${i + 1}] ${item.name_guess} | ${item.category} | ${item.thickness} | conf=${item.confidence ?? "?"} | ${item.material_hint ?? ""}`
        );
      }
    } catch (error) {
      console.error(`  Error: ${error instanceof Error ? error.message : error}`);
    }
  }
}

main();
