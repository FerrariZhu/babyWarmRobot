import type { ClothingCategory } from "@baby-outfit/core";

export type Breathability = "low" | "medium" | "high";
export type ThicknessLevel = "thin" | "medium" | "thick";

export interface DbBaby {
  id: string;
  name: string;
  birth_date: string;
  activity_level: import("@baby-outfit/core").ActivityLevel;
  current_size_label: string | null;
  is_active: boolean;
  avatar_url?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
}

export interface DbClothingItem {
  id: string;
  name: string;
  category: ClothingCategory;
  warmth_score: number;
  size_label: string | null;
  image_url: string | null;
  is_available: boolean;
  is_favorite?: boolean;
  thickness?: ThicknessLevel | null;
  material_id?: string | null;
  weight_grams?: number | null;
  season_tags?: string[] | null;
  breathability?: Breathability | null;
}

export interface DbProfile {
  display_name: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  avatar_url?: string | null;
}

export interface DbMaterial {
  id: string;
  code: string;
  name: string;
}

export interface DbSizeLabel {
  code: string;
  label: string;
}

export interface DbCategory {
  code: string;
  label: string;
  layer_order: number;
}

export interface DbThickness {
  code: ThicknessLevel;
  label: string;
}

export const CATEGORY_LABELS: Record<ClothingCategory, string> = {
  bodysuit: "连体衣",
  inner: "内层",
  mid: "中层",
  outer: "外层",
  pants: "裤子",
  sleepwear: "睡袋",
  hat: "帽子",
  socks: "袜子",
  gloves: "手套",
  scarf: "围巾",
  other: "其他",
};

export const CATEGORY_OPTIONS: { value: ClothingCategory; label: string }[] = [
  { value: "bodysuit", label: "Onesie / Bodysuit" },
  { value: "sleepwear", label: "Sleep Sack" },
  { value: "pants", label: "Pants / Leggings" },
  { value: "mid", label: "Sweater / Cardigan" },
  { value: "outer", label: "Outerwear" },
  { value: "inner", label: "Base Layer" },
  { value: "hat", label: "Hat" },
  { value: "socks", label: "Socks" },
  { value: "other", label: "Other" },
];

export const THICKNESS_OPTIONS: { value: ThicknessLevel; label: string }[] = [
  { value: "thin", label: "Thin" },
  { value: "medium", label: "Medium" },
  { value: "thick", label: "Thick" },
];

export const SCENARIO_LABELS: Record<import("@baby-outfit/core").Scenario, string> = {
  indoor: "室内",
  outdoor: "外出",
  sleep: "睡眠",
};

export const LAYER_LABELS: Record<number, string> = {
  0: "配件",
  1: "内层",
  2: "中层",
  3: "外层",
};
