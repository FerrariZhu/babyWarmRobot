import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  parseTaobaoProductUrl,
  splitPastedProductInput,
  detectProductPlatform,
} from "@/lib/taobao-product-parser";
import {
  getDefaultMaterialId,
  recordParseJob,
  resolveMaterialId,
  toApiParseResponse,
  type ProductParsePayload,
} from "@/lib/product-parse-response";

function guessNameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const slug = pathname.split("/").filter(Boolean).pop() ?? "Imported Item";
    return decodeURIComponent(slug)
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return "Imported Item";
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    source_url?: string;
    title_hint?: string | null;
  };

  const rawInput = body.source_url?.trim();
  if (!rawInput) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const { sourceUrl, titleHint: shareTitle } = splitPastedProductInput(rawInput);
  const titleHint = body.title_hint?.trim() || shareTitle;
  const platform = detectProductPlatform(sourceUrl);

  let parsed: Awaited<ReturnType<typeof parseTaobaoProductUrl>> | null = null;

  if (platform === "taobao" || platform === "tmall") {
    parsed = await parseTaobaoProductUrl(sourceUrl, titleHint);
  }

  const defaultMaterialId = await getDefaultMaterialId(supabase);
  const name = parsed?.name ?? guessNameFromUrl(sourceUrl);
  const materialId =
    (parsed?.materialHint
      ? await resolveMaterialId(supabase, parsed.materialHint)
      : undefined) ?? defaultMaterialId;

  const result: ProductParsePayload = {
    name,
    category: parsed?.category ?? "bodysuit_long",
    material_id: materialId,
    thickness: parsed?.thickness ?? "medium",
    size_label: parsed?.sizeLabel ?? null,
    image_url: parsed?.imageUrl ?? null,
    price_text: parsed?.priceText ?? null,
    platform: parsed?.platform ?? platform,
    item_id: parsed?.itemId ?? null,
    canonical_url: parsed?.canonicalUrl ?? sourceUrl,
    source: parsed?.source ?? "fallback",
    warnings: parsed?.warnings ?? [],
    material_hint: parsed?.materialHint ?? null,
  };

  const job = await recordParseJob(
    supabase,
    user.id,
    parsed?.canonicalUrl ?? sourceUrl,
    result
  );

  return NextResponse.json(toApiParseResponse(result, job?.id ?? null));
}
