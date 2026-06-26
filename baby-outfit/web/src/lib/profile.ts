import { createClient } from "@/lib/supabase/server";
import type { DbBaby, DbClothingItem, DbProfile } from "@/lib/db/types";
import { getCategoryLabel } from "@/lib/clothing-categories";

export async function getProfilePageData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: babies }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, city, avatar_url")
      .eq("id", user.id)
      .single<DbProfile & { avatar_url?: string | null }>(),
    supabase
      .from("babies")
      .select(
        "id, name, birth_date, gender, current_size_label, activity_level, is_active, avatar_url, height_cm, weight_kg"
      )
      .eq("user_id", user.id)
      .order("is_active", { ascending: false }),
  ]);

  const baby = babies?.[0] as
    | (DbBaby & { avatar_url?: string | null; height_cm?: number | null; weight_kg?: number | null })
    | undefined;

  const [
    { data: pref },
    { count: wardrobeCount },
    { data: items },
  ] = await Promise.all([
    baby
      ? supabase
          .from("baby_warmth_preferences")
          .select("warmth_offset, warmth_preference")
          .eq("baby_id", baby.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("clothing_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("deleted_at", null),
    supabase
      .from("clothing_items")
      .select("category")
      .eq("user_id", user.id)
      .is("deleted_at", null),
  ]);

  const categoryCounts = ((items ?? []) as Pick<DbClothingItem, "category">[]).reduce<
    Record<string, number>
  >((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1;
    return acc;
  }, {});

  const topCategory =
    Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    user,
    profile,
    baby,
    warmthOffset: pref?.warmth_offset ? Number(pref.warmth_offset) : 0,
    warmthPreference: pref?.warmth_preference ?? "neutral",
    wardrobeCount: wardrobeCount ?? 0,
    topCategoryLabel: topCategory ? getCategoryLabel(topCategory) : null,
  };
}
