-- ============================================================
-- Stitch UI fields — avatar, growth stats, favorites, breathability
-- Run after 005_seed_mock_data.sql
-- ============================================================

-- Baby profile hero (Profile page)
alter table public.babies
  add column if not exists avatar_url text,
  add column if not exists height_cm numeric(5, 1) check (height_cm is null or height_cm > 0),
  add column if not exists weight_kg numeric(5, 2) check (weight_kg is null or weight_kg > 0);

comment on column public.babies.avatar_url is '宝宝头像 URL';
comment on column public.babies.height_cm is '身高 cm，Profile 页展示';
comment on column public.babies.weight_kg is '体重 kg，Profile 页展示';

-- Wardrobe card favorites + outfit secondary badge
alter table public.clothing_items
  add column if not exists is_favorite boolean not null default false,
  add column if not exists breathability text
    check (breathability is null or breathability in ('low', 'medium', 'high'));

comment on column public.clothing_items.is_favorite is '用户收藏';
comment on column public.clothing_items.breathability is '透气等级，推荐卡片 secondary badge';

create index if not exists clothing_items_favorite_idx
  on public.clothing_items (user_id, is_favorite)
  where is_favorite = true and deleted_at is null;

-- Demo: backfill breathability from thickness
update public.clothing_items
set breathability = case thickness
  when 'thin' then 'high'
  when 'medium' then 'medium'
  when 'thick' then 'low'
  else 'medium'
end
where breathability is null;

-- Demo: sample avatar + growth stats for active babies
update public.babies b
set
  height_cm = 72 + (extract(day from b.birth_date)::int % 15),
  weight_kg = 8.5 + (extract(day from b.birth_date)::int % 40) / 10.0
where height_cm is null;

-- Allow clients to preview warmth before save
grant execute on function public.compute_warmth_score(
  public.clothing_category, uuid, public.thickness_level, integer
) to authenticated;
