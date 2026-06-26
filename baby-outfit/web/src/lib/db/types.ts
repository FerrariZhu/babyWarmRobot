import type { ClothingCategory } from "@baby-outfit/core";
import type { BabyGender, WarmthPreference } from "@/lib/baby-profile";
import type { ClothingFitType } from "@/lib/clothing-weight";
import {
  CATEGORY_LABELS,
  CATEGORY_OPTIONS,
} from "@/lib/clothing-categories";

export { CATEGORY_LABELS, CATEGORY_OPTIONS };

export type Breathability = "low" | "medium" | "high";
export type ThicknessLevel = "thin" | "medium" | "thick";

export interface DbBaby {
  id: string;
  name: string;
  birth_date: string;
  gender?: BabyGender | "unknown" | null;
  activity_level: import("@baby-outfit/core").ActivityLevel;
  current_size_label: string | null;
  is_active: boolean;
  avatar_url?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  warmth_preference?: WarmthPreference | null;
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
  fit_type?: ClothingFitType | null;
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
  group_code?: string | null;
  group_name_zh?: string | null;
}

export interface DbThickness {
  code: ThicknessLevel;
  label: string;
}

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
