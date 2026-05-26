import { redirect } from "next/navigation";
import type { Scenario, Variant } from "@baby-outfit/core";
import { getDashboardData } from "@/lib/dashboard";
import { AppShell } from "@/components/stitch/app-shell";
import { LiveWeatherSection } from "@/components/stitch/live-weather-section";
import { OutfitCard } from "@/components/stitch/outfit-card";
import { WhyThisWorks } from "@/components/stitch/why-this-works";
import { SwapSetLink } from "@/components/stitch/swap-set-link";
import { MaterialIcon } from "@/components/stitch/material-icon";
import { pickDefaultRecommendation } from "@/lib/stitch-utils";
import Link from "next/link";

const SCENARIOS: Scenario[] = ["outdoor", "indoor", "sleep"];
const VARIANTS: Variant[] = ["default", "warmer", "cooler"];

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string; variant?: string }>;
}) {
  const params = await searchParams;
  const scenario = (SCENARIOS.includes(params.scenario as Scenario)
    ? params.scenario
    : "outdoor") as Scenario;
  const variant = (VARIANTS.includes(params.variant as Variant)
    ? params.variant
    : "default") as Variant;

  const data = await getDashboardData(scenario);
  if (!data) redirect("/login");

  const { baby, profile, wardrobe, weather, weatherCity, recommendations, itemMeta } = data;
  const recommendation =
    recommendations.find((r) => r.variant === variant) ??
    pickDefaultRecommendation(recommendations);

  return (
    <AppShell babyName={baby?.name} avatarUrl={baby?.avatar_url}>
      <main className="mt-6 flex w-full max-w-[1200px] flex-col gap-[40px] px-margin-mobile md:px-margin-desktop">
        {!baby && (
          <section className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center">
            <MaterialIcon name="child_care" className="mb-3 text-[48px] text-primary/40" />
            <p className="font-body-md text-on-surface-variant">
              还没有宝宝档案，请先在 Supabase 添加或检查 RLS 权限。
            </p>
          </section>
        )}

        {baby && (
          <LiveWeatherSection fallbackWeather={weather} fallbackCity={weatherCity ?? profile?.city} />
        )}

        {baby && wardrobe.length === 0 && (
          <section className="rounded-xl bg-surface-container-lowest p-6 text-center cloud-shadow">
            <p className="font-body-md text-on-surface-variant">衣柜还是空的，请先添加衣物。</p>
            <Link href="/add" className="font-label-caps mt-4 inline-block text-primary hover:underline">
              添加衣物
            </Link>
          </section>
        )}

        {baby && weather && recommendation && recommendation.pieces.length > 0 && (
          <section className="flex flex-col gap-6">
            <div className="flex items-end justify-between">
              <h2 className="font-headline-md-mobile text-on-background">今日推荐</h2>
              <SwapSetLink currentVariant={recommendation.variant} scenario={scenario} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {recommendation.pieces.map((piece) => (
                <OutfitCard
                  key={piece.item.id}
                  piece={piece}
                  meta={itemMeta[piece.item.id]}
                  activityLevel={baby.activity_level}
                />
              ))}
            </div>
            <WhyThisWorks reason={recommendation.reason} />
          </section>
        )}
      </main>
    </AppShell>
  );
}
