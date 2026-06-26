import { redirect } from "next/navigation";
import type { Scenario, Variant } from "@baby-outfit/core";
import { getDashboardData } from "@/lib/dashboard";
import { AppShell } from "@/components/stitch/app-shell";
import { LiveWeatherSection } from "@/components/stitch/live-weather-section";
import { DashboardRecommendations } from "@/components/stitch/dashboard-recommendations";
import { MaterialIcon } from "@/components/stitch/material-icon";
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

  return (
    <AppShell babyName={baby?.name} avatarUrl={baby?.avatar_url} babyGender={baby?.gender}>
      <main className="mt-6 flex w-full max-w-[1200px] flex-col gap-[40px] px-margin-mobile md:px-margin-desktop">
        {!baby && (
          <section className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-8 text-center cloud-shadow">
            <MaterialIcon name="child_care" className="mb-3 text-[48px] text-primary/40" />
            <h2 className="font-headline-md-mobile mb-2 text-on-surface">还没有宝宝档案</h2>
            <p className="font-body-md mb-6 text-on-surface-variant">
              添加宝宝信息后即可查看天气并根据衣柜推荐穿搭。
            </p>
            <Link
              href="/profile/add"
              className="font-label-caps inline-flex min-h-touch-target-min items-center justify-center gap-2 rounded-full bg-primary px-8 text-on-primary shadow-sm transition-all hover:opacity-90 active:scale-95"
            >
              <MaterialIcon name="add" className="text-[20px]" />
              添加宝宝
            </Link>
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

        {baby && weather && recommendations.length > 0 && (
          <DashboardRecommendations
            recommendations={recommendations}
            initialVariant={variant}
            itemMeta={itemMeta}
            activityLevel={baby.activity_level}
          />
        )}
      </main>
    </AppShell>
  );
}
