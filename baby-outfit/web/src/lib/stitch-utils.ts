import type { RecommendResult } from "@baby-outfit/core";

export function weatherIcon(text: string): string {
  if (text.includes("晴")) return "partly_cloudy_day";
  if (text.includes("云")) return "cloud";
  if (text.includes("雨")) return "rainy";
  if (text.includes("雪")) return "snowing";
  if (text.includes("雾")) return "foggy";
  return "partly_cloudy_day";
}

export function layerLabel(layerOrder: number): string {
  if (layerOrder >= 3) return "外层";
  if (layerOrder === 2) return "中层";
  if (layerOrder === 1) return "内层";
  return "配饰";
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
