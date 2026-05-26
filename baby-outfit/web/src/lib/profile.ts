import { createClient } from "@/lib/supabase/server";
import type { DbBaby, DbClothingItem, DbProfile } from "@/lib/db/types";
import { CATEGORY_LABELS } from "@/lib/db/types";

export async function getProfilePageData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, city, avatar_url")
    .eq("id", user.id)
    .single<DbProfile & { avatar_url?: string | null }>();

  const { data: babies } = await supabase
    .from("babies")
    .select(
      "id, name, birth_date, current_size_label, activity_level, is_active, avatar_url, height_cm, weight_kg"
    )
    .eq("user_id", user.id)
    .order("is_active", { ascending: false });

  const baby = babies?.[0] as
    | (DbBaby & { avatar_url?: string | null; height_cm?: number | null; weight_kg?: number | null })
    | undefined;

  const { data: pref } = baby
    ? await supabase
        .from("baby_warmth_preferences")
        .select("warmth_offset")
        .eq("baby_id", baby.id)
        .maybeSingle()
    : { data: null };

  const { count: wardrobeCount } = await supabase
    .from("clothing_items")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("deleted_at", null);

  const { data: items } = await supabase
    .from("clothing_items")
    .select("category")
    .eq("user_id", user.id)
    .is("deleted_at", null);

  const { data: categories } = await supabase
    .from("categories")
    .select("code, name_zh")
    .eq("is_active", true);

  const categoryNameByCode = Object.fromEntries(
    ((categories ?? []) as { code: string; name_zh: string }[]).map((c) => [c.code, c.name_zh])
  );

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
    wardrobeCount: wardrobeCount ?? 0,
    topCategoryLabel: topCategory
      ? (categoryNameByCode[topCategory] ??
        CATEGORY_LABELS[topCategory as keyof typeof CATEGORY_LABELS] ??
        topCategory)
      : null,
  };
}
