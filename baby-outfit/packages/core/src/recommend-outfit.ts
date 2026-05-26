import { calcRequiredWarmth } from "./required-warmth";
import type {
  ClothingCategory,
  RecommendInput,
  RecommendResult,
  Variant,
  WardrobeItem,
} from "./types";

const LAYER_BY_CATEGORY: Record<ClothingCategory, number> = {
  inner: 1,
  bodysuit: 1,
  pants: 1,
  mid: 2,
  outer: 3,
  sleepwear: 1,
  hat: 0,
  socks: 0,
  gloves: 0,
  scarf: 0,
  other: 0,
};

const CORE_CATEGORIES: ClothingCategory[] = ["bodysuit", "inner", "mid", "outer", "pants", "sleepwear"];
const ACCESSORY_CATEGORIES: ClothingCategory[] = ["hat", "socks", "gloves", "scarf"];

function filterWardrobe(wardrobe: WardrobeItem[], sizeLabel?: string | null): WardrobeItem[] {
  return wardrobe.filter((item) => {
    if (item.isAvailable === false) return false;
    if (!sizeLabel || !item.sizeLabel) return true;
    return item.sizeLabel === sizeLabel;
  });
}

function pickBest(
  items: WardrobeItem[],
  target: number,
  picked: WardrobeItem[]
): WardrobeItem | null {
  const used = new Set(picked.map((p) => p.id));
  const candidates = items.filter((i) => !used.has(i.id));
  if (candidates.length === 0) return null;

  return candidates.reduce((best, item) => {
    const bestDiff = Math.abs(best.warmthScore - target);
    const itemDiff = Math.abs(item.warmthScore - target);
    return itemDiff < bestDiff ? item : best;
  });
}

function buildReason(
  babyName: string,
  weatherText: string,
  feelsLike: number,
  scenario: string,
  variant: Variant
): string {
  const variantText =
    variant === "warmer" ? "（偏暖方案）" : variant === "cooler" ? "（偏凉方案）" : "";
  return `${babyName}今日${scenario === "outdoor" ? "外出" : scenario === "sleep" ? "睡眠" : "室内"}，天气${weatherText}，体感约${Math.round(feelsLike)}°C${variantText}。以下按洋葱式分层搭配，核心保暖后配必要配件。`;
}

export function recommendOutfit(input: RecommendInput): RecommendResult {
  const {
    weather,
    baby,
    wardrobe,
    scenario,
    timeSlot,
    variant = "default",
  } = input;

  const requiredWarmth = calcRequiredWarmth({
    weather,
    baby,
    scenario,
    timeSlot,
    variant,
  });

  const available = filterWardrobe(wardrobe, baby.currentSizeLabel);
  const corePool =
    scenario === "sleep"
      ? available.filter((i) => i.category === "sleepwear" || i.category === "bodysuit")
      : available.filter((i) => CORE_CATEGORIES.includes(i.category));

  const picked: WardrobeItem[] = [];
  const layerTargets =
    scenario === "sleep"
      ? [requiredWarmth]
      : [
          Math.round(requiredWarmth * 0.35),
          Math.round(requiredWarmth * 0.35),
          Math.round(requiredWarmth * 0.3),
        ];

  if (scenario === "sleep") {
    const sleepItem = pickBest(
      corePool.filter((i) => i.category === "sleepwear" || i.category === "bodysuit"),
      requiredWarmth,
      picked
    );
    if (sleepItem) picked.push(sleepItem);
  } else {
    for (let layer = 1; layer <= 3; layer += 1) {
      const layerItems = corePool.filter((i) => LAYER_BY_CATEGORY[i.category] === layer);
      const item = pickBest(layerItems, layerTargets[layer - 1] ?? requiredWarmth / 3, picked);
      if (item) picked.push(item);
    }

    if (picked.length === 0) {
      const fallback = pickBest(corePool, requiredWarmth, picked);
      if (fallback) picked.push(fallback);
    }
  }

  if (weather.feelsLike < 15) {
    const hat = pickBest(
      available.filter((i) => i.category === "hat"),
      40,
      picked
    );
    if (hat) picked.push(hat);
  }

  if (weather.feelsLike < 10) {
    const socks = pickBest(
      available.filter((i) => i.category === "socks"),
      25,
      picked
    );
    if (socks) picked.push(socks);
  }

  if (weather.feelsLike < 5) {
    const gloves = pickBest(
      available.filter((i) => i.category === "gloves"),
      30,
      picked
    );
    if (gloves) picked.push(gloves);
  }

  if (weather.windSpeed > 6 || weather.text.includes("雨")) {
    const outer = available.find(
      (i) => i.category === "outer" && !picked.some((p) => p.id === i.id)
    );
    if (outer && !picked.some((p) => p.id === outer.id)) {
      const replaceIdx = picked.findIndex((i) => i.category === "outer");
      if (replaceIdx >= 0) picked[replaceIdx] = outer;
      else picked.push(outer);
    }
  }

  const actualWarmth = Math.min(
    100,
    picked.reduce((sum, item) => sum + item.warmthScore, 0) * 0.55
  );

  const pieces = picked.map((item) => ({
    item,
    layerOrder: LAYER_BY_CATEGORY[item.category] || (ACCESSORY_CATEGORIES.includes(item.category) ? 0 : 1),
  }));

  pieces.sort((a, b) => b.layerOrder - a.layerOrder || b.item.warmthScore - a.item.warmthScore);

  return {
    requiredWarmth,
    actualWarmth: Math.round(actualWarmth),
    pieces,
    reason: buildReason(baby.name, weather.text, weather.feelsLike, scenario, variant),
    variant,
  };
}

export function recommendAllVariants(
  base: Omit<RecommendInput, "variant">
): RecommendResult[] {
  return (["default", "warmer", "cooler"] as Variant[]).map((variant) =>
    recommendOutfit({ ...base, variant })
  );
}
