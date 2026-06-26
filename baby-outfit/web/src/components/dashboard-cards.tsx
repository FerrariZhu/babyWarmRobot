import type { RecommendResult } from "@baby-outfit/core";
import { LAYER_LABELS } from "@/lib/db/types";
import { getCategoryLabel } from "@/lib/clothing-categories";

export function WeatherCard({
  city,
  weather,
}: {
  city?: string | null;
  weather: {
    temp: number;
    feelsLike: number;
    humidity: number;
    windSpeed: number;
    text: string;
  };
}) {
  return (
    <section className="rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 p-5 text-white shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-sky-100">{city ?? "当前位置"} · 今日天气</p>
          <p className="mt-1 text-4xl font-semibold">{Math.round(weather.temp)}°C</p>
          <p className="mt-1 text-sm text-sky-100">
            体感 {Math.round(weather.feelsLike)}°C · {weather.text}
          </p>
        </div>
        <div className="text-right text-sm text-sky-100">
          <p>湿度 {weather.humidity}%</p>
          <p className="mt-1">风速 {weather.windSpeed.toFixed(1)} m/s</p>
        </div>
      </div>
    </section>
  );
}

export function RecommendationCard({ result }: { result: RecommendResult }) {
  const variantLabel =
    result.variant === "warmer"
      ? "偏暖"
      : result.variant === "cooler"
        ? "偏凉"
        : "标准";

  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">{variantLabel}方案</h3>
        <div className="text-right text-sm">
          <span className="text-muted">目标 </span>
          <span className="font-medium">{result.requiredWarmth}</span>
          <span className="mx-1 text-muted">·</span>
          <span className="text-muted">实际 </span>
          <span className="font-medium text-primary">{result.actualWarmth}</span>
        </div>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-muted">{result.reason}</p>

      <ul className="space-y-3">
        {result.pieces.map(({ item, layerOrder }) => (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-xl bg-background px-3 py-3"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-lg">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                "👕"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{item.name}</p>
              <p className="text-xs text-muted">
                {LAYER_LABELS[layerOrder] ?? "配件"} · {getCategoryLabel(item.category)} ·
                保暖 {item.warmthScore}
                {item.sizeLabel ? ` · ${item.sizeLabel}码` : ""}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </article>
  );
}
