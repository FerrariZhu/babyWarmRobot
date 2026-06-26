import type { ClothingCategory } from "@baby-outfit/core";

export type CategoryGroupCode =
  | "bodysuit_group"
  | "top_group"
  | "bottom_group"
  | "outer_group"
  | "sleep_group"
  | "accessory_group"
  | "other_group";

export interface CategoryItem {
  code: ClothingCategory;
  label: string;
  layerOrder: number;
}

export interface CategoryGroup {
  code: CategoryGroupCode;
  label: string;
  sortOrder: number;
  items: CategoryItem[];
}

export const CLOTHING_CATEGORY_GROUPS: CategoryGroup[] = [
  {
    code: "bodysuit_group",
    label: "连体类",
    sortOrder: 1,
    items: [
      { code: "bodysuit_short", label: "包屁衣", layerOrder: 1 },
      { code: "bodysuit_long", label: "长袖连体", layerOrder: 1 },
      { code: "footed_romper", label: "连脚爬服", layerOrder: 1 },
    ],
  },
  {
    code: "top_group",
    label: "上衣类",
    sortOrder: 2,
    items: [
      { code: "base_top", label: "打底衫", layerOrder: 1 },
      { code: "sweater", label: "毛衣/针织", layerOrder: 2 },
      { code: "fleece_top", label: "卫衣/抓绒", layerOrder: 2 },
      { code: "vest", label: "马甲/背心", layerOrder: 2 },
    ],
  },
  {
    code: "bottom_group",
    label: "下装类",
    sortOrder: 3,
    items: [
      { code: "pants_long", label: "长裤/打底裤", layerOrder: 1 },
      { code: "pants_short", label: "短裤", layerOrder: 1 },
      { code: "pants_padded", label: "羽绒裤/棉裤", layerOrder: 1 },
    ],
  },
  {
    code: "outer_group",
    label: "外套类",
    sortOrder: 4,
    items: [
      { code: "outer_shell", label: "普通外套", layerOrder: 3 },
      { code: "outer_down", label: "羽绒服", layerOrder: 3 },
      { code: "outer_cotton", label: "棉服", layerOrder: 3 },
      { code: "outer_rain_uv", label: "雨衣/防晒衣", layerOrder: 3 },
    ],
  },
  {
    code: "sleep_group",
    label: "睡衣类",
    sortOrder: 5,
    items: [
      { code: "sleep_sack", label: "睡袋", layerOrder: 1 },
      { code: "pajamas", label: "睡衣/家居服", layerOrder: 1 },
    ],
  },
  {
    code: "accessory_group",
    label: "配件类",
    sortOrder: 6,
    items: [
      { code: "hat", label: "帽子", layerOrder: 0 },
      { code: "socks", label: "袜子", layerOrder: 0 },
      { code: "gloves", label: "手套", layerOrder: 0 },
      { code: "scarf", label: "围巾/围脖", layerOrder: 0 },
    ],
  },
  {
    code: "other_group",
    label: "其他",
    sortOrder: 7,
    items: [{ code: "other", label: "其他", layerOrder: 0 }],
  },
];

const ALL_ITEMS = CLOTHING_CATEGORY_GROUPS.flatMap((g) => g.items);

export const ALL_CLOTHING_CATEGORIES: ClothingCategory[] = ALL_ITEMS.map((i) => i.code);

export const CATEGORY_LABELS: Record<ClothingCategory, string> = Object.fromEntries(
  ALL_ITEMS.map((i) => [i.code, i.label])
) as Record<ClothingCategory, string>;

export const CATEGORY_OPTIONS: { value: ClothingCategory; label: string }[] = ALL_ITEMS.map(
  (i) => ({ value: i.code, label: i.label })
);

const LEGACY_CATEGORY_MAP: Record<string, ClothingCategory> = {
  bodysuit: "bodysuit_long",
  inner: "base_top",
  mid: "sweater",
  outer: "outer_shell",
  pants: "pants_long",
  sleepwear: "sleep_sack",
};

export function isClothingCategory(value: string): value is ClothingCategory {
  return ALL_CLOTHING_CATEGORIES.includes(value as ClothingCategory);
}

export function normalizeCategoryCode(value: string | undefined | null): ClothingCategory | null {
  if (!value) return null;
  if (isClothingCategory(value)) return value;
  return LEGACY_CATEGORY_MAP[value] ?? null;
}

export function getCategoryLabel(code: string): string {
  const normalized = normalizeCategoryCode(code);
  if (normalized) return CATEGORY_LABELS[normalized];
  return code;
}

export function getCategoryGroup(code: string): CategoryGroup | undefined {
  const normalized = normalizeCategoryCode(code);
  if (!normalized) return undefined;
  return CLOTHING_CATEGORY_GROUPS.find((g) => g.items.some((i) => i.code === normalized));
}

export const TOPS_CATEGORIES: ClothingCategory[] = [
  "bodysuit_short",
  "bodysuit_long",
  "footed_romper",
  "base_top",
  "sweater",
  "fleece_top",
  "vest",
  "pajamas",
];

export const BOTTOMS_CATEGORIES: ClothingCategory[] = [
  "pants_long",
  "pants_short",
  "pants_padded",
];

export const OUTERWEAR_CATEGORIES: ClothingCategory[] = [
  "outer_shell",
  "outer_down",
  "outer_cotton",
  "outer_rain_uv",
];

export const SLEEP_CATEGORIES: ClothingCategory[] = ["sleep_sack", "pajamas"];

export const OUTER_LAYER_CATEGORIES: ClothingCategory[] = OUTERWEAR_CATEGORIES;
