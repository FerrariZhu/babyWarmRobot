import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isClothingCategory } from "@/lib/clothing-categories";
import { estimateClothingWeightGrams, isClothingFitType } from "@/lib/clothing-weight";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    name,
    category,
    material_id,
    thickness = "medium",
    size_label,
    fit_type = "regular",
    weight_grams,
    baby_id,
    source_url,
    image_url,
    source_metadata,
    parse_job_id,
  } = body;

  if (!name || !category || !material_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!isClothingCategory(String(category))) {
    return NextResponse.json({ error: "无效的类别" }, { status: 400 });
  }
  if (!isClothingFitType(String(fit_type))) {
    return NextResponse.json({ error: "无效的版型" }, { status: 400 });
  }

  const { data: material, error: materialError } = await supabase
    .from("materials")
    .select("code")
    .eq("id", material_id)
    .eq("is_active", true)
    .maybeSingle();

  if (materialError) {
    return NextResponse.json({ error: materialError.message }, { status: 500 });
  }
  if (!material?.code) {
    return NextResponse.json({ error: "无效的材质" }, { status: 400 });
  }

  let resolvedWeight =
    weight_grams != null && weight_grams !== "" ? Number(weight_grams) : null;
  if (resolvedWeight == null || Number.isNaN(resolvedWeight)) {
    resolvedWeight = estimateClothingWeightGrams({
      category,
      materialCode: material.code,
      thickness,
      sizeLabel: size_label ?? "",
      fitType: fit_type,
    });
  }

  const breathability =
    thickness === "thin" ? "high" : thickness === "thick" ? "low" : "medium";

  const { data, error } = await supabase
    .from("clothing_items")
    .insert({
      user_id: user.id,
      baby_id: baby_id ?? null,
      name: String(name).trim(),
      category,
      material_id,
      thickness,
      size_label: size_label ?? null,
      fit_type,
      weight_grams: resolvedWeight,
      source_url: source_url ?? null,
      image_url: image_url ?? null,
      source_metadata:
        source_metadata && typeof source_metadata === "object" ? source_metadata : {},
      source: source_url ? "url" : "manual",
      breathability,
      is_available: true,
    })
    .select("id, name, size_label, breathability, image_url, weight_grams, fit_type")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (parse_job_id && typeof parse_job_id === "string") {
    await supabase
      .from("url_parse_jobs")
      .update({ clothing_item_id: data.id })
      .eq("id", parse_job_id)
      .eq("user_id", user.id);
  }

  return NextResponse.json(data);
}
