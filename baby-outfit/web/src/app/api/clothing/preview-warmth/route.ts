import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeWarmthScore } from "@/lib/warmth-score";
import { estimateClothingWeightGrams, isClothingFitType } from "@/lib/clothing-weight";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const {
    category,
    material_id,
    thickness,
    size_label,
    fit_type = "regular",
    weight_grams,
  } = await request.json();
  if (!category || !material_id || !thickness) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const [{ data: material, error: materialError }, { data: thicknessRow, error: thicknessError }, { data: cat, error: categoryError }] =
    await Promise.all([
      supabase
        .from("materials")
        .select("base_warmth, code")
        .eq("id", material_id)
        .eq("is_active", true)
        .maybeSingle(),
      supabase
        .from("thicknesses")
        .select("multiplier")
        .eq("code", thickness)
        .eq("is_active", true)
        .maybeSingle(),
      supabase
        .from("categories")
        .select("coverage_multiplier, warmth_bonus")
        .eq("code", category)
        .eq("is_active", true)
        .maybeSingle(),
    ]);

  if (materialError || thicknessError || categoryError) {
    return NextResponse.json(
      { error: materialError?.message ?? thicknessError?.message ?? categoryError?.message },
      { status: 500 }
    );
  }

  const fitType = isClothingFitType(String(fit_type)) ? fit_type : "regular";
  let parsedWeight =
    weight_grams != null && weight_grams !== "" ? Number(weight_grams) : null;
  if ((parsedWeight == null || Number.isNaN(parsedWeight)) && material?.code && size_label) {
    parsedWeight = estimateClothingWeightGrams({
      category,
      materialCode: material.code,
      thickness,
      sizeLabel: size_label,
      fitType,
    });
  }

  const warmth_score = computeWarmthScore({
    baseWarmth: material?.base_warmth != null ? Number(material.base_warmth) : null,
    thicknessMultiplier: thicknessRow?.multiplier != null ? Number(thicknessRow.multiplier) : null,
    coverageMultiplier: cat?.coverage_multiplier != null ? Number(cat.coverage_multiplier) : null,
    warmthBonus: cat?.warmth_bonus != null ? Number(cat.warmth_bonus) : null,
    weightGrams: parsedWeight != null && !Number.isNaN(parsedWeight) ? parsedWeight : null,
  });

  return NextResponse.json({
    warmth_score,
    weight_grams: parsedWeight,
  });
}
