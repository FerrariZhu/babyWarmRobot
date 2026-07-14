import {
  ACCESSORY_CATEGORIES,
  CATEGORY_LAYER_ORDER,
  CORE_OUTFIT_CATEGORIES,
  OUTERWEAR_CATEGORIES,
  SLEEP_OUTFIT_CATEGORIES,
} from "./clothing-taxonomy";
import { calcRequiredWarmth } from "./required-warmth";
import type {
  ClothingCategory,
  RecommendInput,
  RecommendResult,
  Variant,
  WardrobeItem,
  WeatherSnapshot,
} from "./types";
import {
  GLOVES_FEELS_LIKE_THRESHOLD_C,
  GLOVES_TARGET_WARMTH,
  HAT_FEELS_LIKE_THRESHOLD_C,
  HAT_TARGET_WARMTH,
  LAYER_WARMTH_RATIOS,
  MAX_WARMTH_SCORE,
  ONION_LAYER_COUNT,
  OUTER_LAYER_WIND_SPEED_THRESHOLD,
  OUTFIT_WARMTH_COMBINATION_FACTOR,
  SOCKS_FEELS_LIKE_THRESHOLD_C,
  SOCKS_TARGET_WARMTH,
} from "./warmth-thresholds";

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

function appendPicked(picked: WardrobeItem[], item: WardrobeItem | null): WardrobeItem[] {
  return item ? [...picked, item] : picked;
}

function pickLayeredCoreItems(
  corePool: WardrobeItem[],
  requiredWarmth: number,
  initialPicked: WardrobeItem[]
): WardrobeItem[] {
  const layerTargets = LAYER_WARMTH_RATIOS.map((ratio) => Math.round(requiredWarmth * ratio));
  let picked = initialPicked;

  for (let layer = 1; layer <= ONION_LAYER_COUNT; layer += 1) {
    const layerItems = corePool.filter((i) => CATEGORY_LAYER_ORDER[i.category] === layer);
    const fallbackTarget = requiredWarmth / ONION_LAYER_COUNT;
    picked = appendPicked(
      picked,
      pickBest(layerItems, layerTargets[layer - 1] ?? fallbackTarget, picked)
    );
  }

  if (picked.length === initialPicked.length) {
    picked = appendPicked(picked, pickBest(corePool, requiredWarmth, picked));
  }

  return picked;
}

function pickSleepCoreItem(
  corePool: WardrobeItem[],
  requiredWarmth: number,
  picked: WardrobeItem[]
): WardrobeItem[] {
  const sleepPool = corePool.filter((i) => SLEEP_OUTFIT_CATEGORIES.includes(i.category));
  return appendPicked(picked, pickBest(sleepPool, requiredWarmth, picked));
}

function pickColdWeatherAccessories(
  available: WardrobeItem[],
  weather: WeatherSnapshot,
  picked: WardrobeItem[]
): WardrobeItem[] {
  let result = picked;

  if (weather.feelsLike < HAT_FEELS_LIKE_THRESHOLD_C) {
    result = appendPicked(
      result,
      pickBest(
        available.filter((i) => i.category === "hat"),
        HAT_TARGET_WARMTH,
        result
      )
    );
  }

  if (weather.feelsLike < SOCKS_FEELS_LIKE_THRESHOLD_C) {
    result = appendPicked(
      result,
      pickBest(
        available.filter((i) => i.category === "socks"),
        SOCKS_TARGET_WARMTH,
        result
      )
    );
  }

  if (weather.feelsLike < GLOVES_FEELS_LIKE_THRESHOLD_C) {
    result = appendPicked(
      result,
      pickBest(
        available.filter((i) => i.category === "gloves"),
        GLOVES_TARGET_WARMTH,
        result
      )
    );
  }

  return result;
}

function replaceOrAppendOuterLayer(picked: WardrobeItem[], outer: WardrobeItem): WardrobeItem[] {
  const replaceIdx = picked.findIndex((i) => OUTERWEAR_CATEGORIES.includes(i.category));
  if (replaceIdx >= 0) {
    return picked.map((item, idx) => (idx === replaceIdx ? outer : item));
  }
  return [...picked, outer];
}

function applyWindOrRainOuterLayer(
  available: WardrobeItem[],
  weather: WeatherSnapshot,
  picked: WardrobeItem[]
): WardrobeItem[] {
  const needsOuter =
    weather.windSpeed > OUTER_LAYER_WIND_SPEED_THRESHOLD || weather.text.includes("雨");
  if (!needsOuter) return picked;

  const preferUv = weather.text.includes("晴") || weather.text.includes("晒");
  const outerCandidates = available.filter(
    (i) => OUTERWEAR_CATEGORIES.includes(i.category) && !picked.some((p) => p.id === i.id)
  );

  const outer =
    (preferUv ? outerCandidates.find((i) => i.category === "outer_uv") : null) ??
    outerCandidates.find((i) => i.category === "outer_shell") ??
    outerCandidates[0];

  return outer ? replaceOrAppendOuterLayer(picked, outer) : picked;
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
      ? available.filter((i) => SLEEP_OUTFIT_CATEGORIES.includes(i.category))
      : available.filter((i) => CORE_OUTFIT_CATEGORIES.includes(i.category));

  let picked: WardrobeItem[] =
    scenario === "sleep"
      ? pickSleepCoreItem(corePool, requiredWarmth, [])
      : pickLayeredCoreItems(corePool, requiredWarmth, []);

  picked = pickColdWeatherAccessories(available, weather, picked);
  picked = applyWindOrRainOuterLayer(available, weather, picked);

  const actualWarmth = Math.min(
    MAX_WARMTH_SCORE,
    picked.reduce((sum, item) => sum + item.warmthScore, 0) * OUTFIT_WARMTH_COMBINATION_FACTOR
  );

  const pieces = picked.map((item) => ({
    item,
    layerOrder:
      CATEGORY_LAYER_ORDER[item.category] ||
      (ACCESSORY_CATEGORIES.includes(item.category) ? 0 : 1),
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
