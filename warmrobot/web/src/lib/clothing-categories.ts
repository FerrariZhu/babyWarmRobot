import {
  CATEGORY_LAYER_ORDER,
  OUTERWEAR_CATEGORIES,
  SLEEP_OUTFIT_CATEGORIES,
  type ClothingCategory,
} from "@warmrobot/core";

export type CategoryGroupCode =
  | "bodysuit_group"
  | "top_group"
  | "bottom_group"
  | "shoes_group"
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

function categoryItem(code: ClothingCategory, label: string): CategoryItem {
  return { code, label, layerOrder: CATEGORY_LAYER_ORDER[code] };
}

export const CLOTHING_CATEGORY_GROUPS: CategoryGroup[] = [
  {
    code: "bodysuit_group",
    label: "连体衣",
    sortOrder: 1,
    items: [
      categoryItem("bodysuit_short", "短袖包屁衣"),
      categoryItem("bodysuit_long", "长袖包屁衣"),
    ],
  },
  {
    code: "top_group",
    label: "上衣",
    sortOrder: 2,
    items: [
      categoryItem("tshirt_short", "短袖 T 恤"),
      categoryItem("tshirt_long", "长袖 T 恤"),
      categoryItem("thermal_top", "秋衣"),
      categoryItem("sweater", "毛衣/针织"),
      categoryItem("fleece_top", "卫衣/抓绒"),
      categoryItem("vest", "马甲/背心"),
      categoryItem("outer_uv", "防晒衣"),
      categoryItem("outer_shell", "春秋外套"),
      categoryItem("outer_cotton", "棉衣"),
      categoryItem("outer_down", "羽绒服"),
    ],
  },
  {
    code: "bottom_group",
    label: "下装",
    sortOrder: 3,
    items: [
      categoryItem("long_johns", "秋裤"),
      categoryItem("pants_short", "短裤"),
      categoryItem("pants_mid", "中裤"),
      categoryItem("pants_long", "长裤"),
    ],
  },
  {
    code: "shoes_group",
    label: "鞋子",
    sortOrder: 4,
    items: [
      categoryItem("shoes_sandal", "凉鞋"),
      categoryItem("shoes_sneaker", "运动鞋"),
      categoryItem("shoes_leather", "皮鞋"),
      categoryItem("shoes_boot", "高帮靴"),
    ],
  },
  {
    code: "accessory_group",
    label: "配件",
    sortOrder: 5,
    items: [
      categoryItem("hat", "帽子"),
      categoryItem("scarf", "围巾"),
      categoryItem("gloves", "手套"),
      categoryItem("socks", "袜子"),
    ],
  },
  {
    code: "other_group",
    label: "其他",
    sortOrder: 6,
    items: [categoryItem("other", "其他")],
  },
];

const ALL_ITEMS = CLOTHING_CATEGORY_GROUPS.flatMap((group) => group.items);

export const ALL_CLOTHING_CATEGORIES: ClothingCategory[] = ALL_ITEMS.map((item) => item.code);

export const CATEGORY_LABELS: Record<ClothingCategory, string> = Object.fromEntries(
  ALL_ITEMS.map((item) => [item.code, item.label])
) as Record<ClothingCategory, string>;

export const CATEGORY_OPTIONS: { value: ClothingCategory; label: string }[] = ALL_ITEMS.map(
  (item) => ({ value: item.code, label: item.label })
);

const LEGACY_CATEGORY_MAP: Record<string, ClothingCategory> = {
  bodysuit: "bodysuit_long",
  inner: "thermal_top",
  base_top: "thermal_top",
  mid: "sweater",
  outer: "outer_shell",
  pants: "pants_long",
  sleepwear: "other",
  footed_romper: "bodysuit_long",
  pants_padded: "pants_long",
  outer_rain_uv: "outer_uv",
  sleep_sack: "other",
  pajamas: "other",
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
  return CLOTHING_CATEGORY_GROUPS.find((group) =>
    group.items.some((item) => item.code === normalized)
  );
}

export function getCategoryLayerOrder(code: string): number {
  const normalized = normalizeCategoryCode(code);
  if (!normalized) return 0;
  return CATEGORY_LAYER_ORDER[normalized];
}

export { OUTERWEAR_CATEGORIES, SLEEP_OUTFIT_CATEGORIES as SLEEP_CATEGORIES };

export const TOPS_CATEGORIES: ClothingCategory[] = [
  "bodysuit_short",
  "bodysuit_long",
  "tshirt_short",
  "tshirt_long",
  "thermal_top",
  "sweater",
  "fleece_top",
  "vest",
  "outer_uv",
  "outer_shell",
  "outer_cotton",
  "outer_down",
];

export const BOTTOMS_CATEGORIES: ClothingCategory[] = [
  "long_johns",
  "pants_short",
  "pants_mid",
  "pants_long",
];

export const OUTER_LAYER_CATEGORIES: ClothingCategory[] = OUTERWEAR_CATEGORIES;
