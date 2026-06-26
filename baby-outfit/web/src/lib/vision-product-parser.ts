import type { ClothingCategory } from "@baby-outfit/core";
import type { ThicknessLevel } from "@/lib/db/types";
import {
  inferCategoryFromTitle,
  inferSizeLabelFromTitle,
  inferThicknessFromTitle,
} from "@/lib/taobao-product-parser";
import { ALL_CLOTHING_CATEGORIES, normalizeCategoryCode } from "@/lib/clothing-categories";

const VALID_THICKNESS = new Set<ThicknessLevel>(["thin", "medium", "thick"]);

export type VisionExtractResult = {
  name: string;
  category: ClothingCategory;
  thickness: ThicknessLevel;
  sizeLabel: string | null;
  priceText: string | null;
  materialHint: string | null;
  warnings: string[];
};

type VisionModelJson = {
  name?: string;
  category?: string;
  thickness?: string;
  size_label?: string;
  price_text?: string;
  material_hint?: string;
  warnings?: string[];
};

function parseModelJson(text: string): VisionModelJson | null {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;

  try {
    return JSON.parse(candidate) as VisionModelJson;
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1)) as VisionModelJson;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function normalizeCategory(value: string | undefined, title: string): ClothingCategory {
  const normalized = normalizeCategoryCode(value);
  if (normalized) return normalized;
  return inferCategoryFromTitle(title);
}

function normalizeThickness(value: string | undefined, title: string): ThicknessLevel {
  if (value && VALID_THICKNESS.has(value as ThicknessLevel)) {
    return value as ThicknessLevel;
  }
  return inferThicknessFromTitle(title);
}

export async function extractProductFromScreenshot(
  imageBase64: string,
  mimeType: string
): Promise<VisionExtractResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "未配置 OPENAI_API_KEY，无法使用截图识别。请在 web/.env.local 添加密钥，或改用淘宝分享文案（含「商品名」）解析。"
    );
  }

  const model = process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini";
  const dataUrl = `data:${mimeType};base64,${imageBase64}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            `你是婴儿服装商品信息提取助手。根据电商商品页截图，提取字段并只输出 JSON，不要 markdown。category 只能是 ${ALL_CLOTHING_CATEGORIES.join(", ")}。thickness 只能是 thin, medium, thick。`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: '分析这张淘宝/天猫/京东等平台婴儿服装商品页截图，返回 JSON：{"name":"商品全称","category":"...","thickness":"...","size_label":"如80或6-12M，没有则null","price_text":"如¥99","material_hint":"材质关键词","warnings":["不确定时的说明"]}',
            },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(45_000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`截图识别失败（${res.status}）${errText.slice(0, 120)}`);
  }

  const payload = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("截图识别未返回内容");

  const parsed = parseModelJson(content);
  if (!parsed?.name?.trim()) {
    throw new Error("未能从截图中识别商品名称，请换一张包含标题区域的清晰截图。");
  }

  const name = parsed.name.trim();
  const category = normalizeCategory(parsed.category, name);
  const thickness = normalizeThickness(parsed.thickness, name);
  const sizeLabel =
    parsed.size_label?.trim() || inferSizeLabelFromTitle(name + (parsed.material_hint ?? ""));

  return {
    name,
    category,
    thickness,
    sizeLabel,
    priceText: parsed.price_text?.trim() || null,
    materialHint: parsed.material_hint?.trim() || name,
    warnings: [
      ...(parsed.warnings ?? []),
      "信息来自截图识别，请核对后保存。",
    ],
  };
}
