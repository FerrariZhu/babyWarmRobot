import type { ClothingCategory } from "@baby-outfit/core";
import type { ThicknessLevel } from "@/lib/db/types";

export type ClothingFitType = "slim" | "regular" | "loose";

export const FIT_TYPE_OPTIONS: { value: ClothingFitType; label: string }[] = [
  { value: "slim", label: "修身" },
  { value: "regular", label: "标准" },
  { value: "loose", label: "宽松" },
];

const CATEGORY_BASE_WEIGHT: Record<ClothingCategory, number> = {
  bodysuit_short: 80,
  bodysuit_long: 120,
  footed_romper: 130,
  base_top: 80,
  sweater: 150,
  fleece_top: 140,
  vest: 90,
  pants_long: 90,
  pants_short: 60,
  pants_padded: 150,
  outer_shell: 180,
  outer_down: 200,
  outer_cotton: 220,
  outer_rain_uv: 160,
  sleep_sack: 350,
  pajamas: 120,
  hat: 30,
  socks: 25,
  gloves: 20,
  scarf: 40,
  other: 120,
};

const SIZE_SCALE: Record<string, number> = {
  "52": 0.75,
  "59": 0.85,
  "66": 1.0,
  "73": 1.1,
  "80": 1.2,
  "90": 1.35,
  "100": 1.5,
};

const MATERIAL_DENSITY: Record<string, number> = {
  cotton_light: 1.0,
  cotton_heavy: 1.15,
  bamboo: 0.95,
  fleece: 1.1,
  wool_light: 1.2,
  wool_heavy: 1.35,
  down_light: 0.75,
  down_heavy: 0.9,
  waterproof: 1.25,
  other: 1.0,
};

const THICKNESS_WEIGHT: Record<ThicknessLevel, number> = {
  thin: 0.85,
  medium: 1.0,
  thick: 1.25,
};

const FIT_WEIGHT: Record<ClothingFitType, number> = {
  slim: 0.9,
  regular: 1.0,
  loose: 1.15,
};

export function estimateClothingWeightGrams(input: {
  category: string;
  materialCode: string;
  thickness: string;
  sizeLabel: string;
  fitType?: ClothingFitType;
}): number | null {
  const { category, materialCode, thickness, sizeLabel, fitType = "regular" } = input;
  if (!category || !materialCode || !thickness || !sizeLabel) return null;

  const base =
    CATEGORY_BASE_WEIGHT[category as ClothingCategory] ?? CATEGORY_BASE_WEIGHT.other;
  const sizeScale = SIZE_SCALE[sizeLabel] ?? 1.0;
  const materialDensity = MATERIAL_DENSITY[materialCode] ?? 1.0;
  const thicknessWeight = THICKNESS_WEIGHT[thickness as ThicknessLevel] ?? 1.0;
  const fitWeight = FIT_WEIGHT[fitType] ?? 1.0;

  return Math.max(1, Math.round(base * sizeScale * materialDensity * thicknessWeight * fitWeight));
}

export function isClothingFitType(value: string): value is ClothingFitType {
  return FIT_TYPE_OPTIONS.some((o) => o.value === value);
}
