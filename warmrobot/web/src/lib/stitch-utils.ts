import type { RecommendResult } from "@warmrobot/core";
import { LAYER_LABELS } from "@/lib/db/types";

export function weatherIcon(text: string): string {
  if (text.includes("晴")) return "partly_cloudy_day";
  if (text.includes("云")) return "cloud";
  if (text.includes("雨")) return "rainy";
  if (text.includes("雪")) return "snowing";
  if (text.includes("雾")) return "foggy";
  return "partly_cloudy_day";
}

export function layerLabel(layerOrder: number): string {
  const clamped = Math.min(3, Math.max(0, layerOrder));
  return LAYER_LABELS[clamped] ?? LAYER_LABELS[0];
}

export function pickDefaultRecommendation(
  recommendations: RecommendResult[]
): RecommendResult | undefined {
  return (
    recommendations.find((r) => r.variant === "default") ?? recommendations[0]
  );
}

export function nextVariant(current: string): "default" | "warmer" | "cooler" {
  if (current === "default") return "warmer";
  if (current === "warmer") return "cooler";
  return "default";
}

export function variantLabel(variant: string): string {
  if (variant === "warmer") return "偏暖方案";
  if (variant === "cooler") return "偏凉方案";
  return "标准方案";
}
