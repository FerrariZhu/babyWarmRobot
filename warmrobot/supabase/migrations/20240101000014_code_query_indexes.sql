-- ============================================================
-- Query indexes aligned with application read patterns
-- (postgres-patterns: equality columns first, partial indexes for scoped filters)
-- ============================================================

-- Wardrobe list: user_id + deleted_at filter + created_at desc
-- web/src/lib/wardrobe.ts
create index if not exists clothing_items_user_created_active_idx
  on public.clothing_items (user_id, created_at desc)
  where deleted_at is null;

-- Dashboard recommendation wardrobe: user_id + warmth_score desc
-- web/src/lib/dashboard.ts
create index if not exists clothing_items_user_warmth_active_idx
  on public.clothing_items (user_id, warmth_score desc)
  where deleted_at is null;

-- Active baby lookup: user_id + is_active + created_at
-- web/src/lib/wardrobe.ts, dashboard.ts, profile.ts
create index if not exists babies_user_active_created_idx
  on public.babies (user_id, is_active desc, created_at asc);

-- Category picker with grouping metadata
-- web/src/lib/wardrobe.ts (extend select to group_code when needed)
create index if not exists categories_active_sort_idx
  on public.categories (is_active, sort_order)
  where is_active = true;
