import {
  recommendAllVariants,
  type BabyProfile,
  type Scenario,
  type WardrobeItem,
} from "@warmrobot/core";
import type { DbBaby, DbClothingItem, DbProfile } from "@/lib/db/types";
import type { ClothingDisplayMeta } from "@/lib/clothing-display";
import { requireUser } from "@/lib/supabase/session";
import { getWeatherForProfile, weatherCityLabel } from "@/lib/weather";

export async function getDashboardData(scenario: Scenario = "outdoor") {
  const session = await requireUser();
  if (!session) return null;
  const { supabase, user } = session;

  const [{ data: profile }, { data: babies }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, city, latitude, longitude")
      .eq("id", user.id)
      .single<DbProfile>(),
    supabase
      .from("babies")
      .select(
        "id, name, birth_date, gender, activity_level, current_size_label, is_active, avatar_url"
      )
      .eq("user_id", user.id)
      .order("is_active", { ascending: false })
      .order("created_at", { ascending: true }),
  ]);

  const baby = babies?.[0] as DbBaby | undefined;
  if (!baby) {
    return {
      user,
      profile,
      baby: null,
      wardrobe: [] as WardrobeItem[],
      weather: null,
      recommendations: [],
      itemMeta: {} as Record<string, ClothingDisplayMeta>,
    };
  }

  const [{ data: pref }, { data: items }, weatherResult] = await Promise.all([
    supabase
      .from("baby_warmth_preferences")
      .select("warmth_offset")
      .eq("baby_id", baby.id)
      .maybeSingle(),
    supabase
      .from("clothing_items")
      .select(
        "id, name, category, warmth_score, size_label, image_url, is_available, thickness, breathability, season_tags"
      )
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("warmth_score", { ascending: false }),
    getWeatherForProfile(profile),
  ]);

  const itemMeta: Record<string, ClothingDisplayMeta> = {};
  for (const row of (items ?? []) as DbClothingItem[]) {
    itemMeta[row.id] = {
      category: row.category,
      thickness: row.thickness,
      breathability: row.breathability ?? null,
      seasonTags: row.season_tags,
    };
  }

  const wardrobe: WardrobeItem[] = ((items ?? []) as DbClothingItem[]).map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    warmthScore: Number(item.warmth_score),
    sizeLabel: item.size_label,
    imageUrl: item.image_url,
    isAvailable: item.is_available,
  }));

  const weather = weatherResult
    ? {
        temp: weatherResult.temp,
        feelsLike: weatherResult.feelsLike,
        humidity: weatherResult.humidity,
        windSpeed: weatherResult.windSpeed,
        pressure: weatherResult.pressure,
        text: weatherResult.text,
        precipProbability: weatherResult.precipProbability,
        uvIndex: weatherResult.uvIndex,
      }
    : null;
  const weatherCity = weatherCityLabel(profile, weatherResult);

  const babyProfile: BabyProfile = {
    id: baby.id,
    name: baby.name,
    birthDate: baby.birth_date,
    activityLevel: baby.activity_level,
    currentSizeLabel: baby.current_size_label,
    warmthOffset: pref?.warmth_offset ? Number(pref.warmth_offset) : 0,
  };

  let recommendations: ReturnType<typeof recommendAllVariants> = [];
  if (weather && wardrobe.length > 0) {
    try {
      recommendations = recommendAllVariants({
        weather,
        baby: babyProfile,
        wardrobe,
        scenario,
      });
    } catch (error) {
      console.error("[getDashboardData] recommendAllVariants failed:", error);
    }
  }

  return {
    user,
    profile,
    baby,
    wardrobe,
    weather,
    weatherCity,
    recommendations,
    itemMeta,
  };
}
