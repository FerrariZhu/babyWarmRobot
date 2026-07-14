-- ============================================================
-- Schema fixes — integrity, constants, warmth calc, RLS
-- Run after 003_materials.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. Constant tables: categories, thicknesses, size_labels
-- ------------------------------------------------------------
create table public.categories (
  id                    uuid primary key default gen_random_uuid(),
  code                  text not null unique,
  name_zh               text not null,
  name_en               text,
  description           text,
  layer_order           smallint not null default 0,  -- 0=配件, 1=内, 2=中, 3=外
  coverage_multiplier   numeric(4, 2) not null default 1.0
                          check (coverage_multiplier > 0),
  warmth_bonus          numeric(5, 2) not null default 0,
  outdoor_required_below numeric(5, 2),  -- 外出且体感低于此值时建议必选，null=无规则
  sort_order            integer not null default 0,
  is_active             boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  constraint categories_code_not_empty check (char_length(trim(code)) > 0),
  constraint categories_name_zh_not_empty check (char_length(trim(name_zh)) > 0)
);

comment on table public.categories is '类目常量：层级、覆盖系数、配件加分、外出必选规则';

create table public.thicknesses (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,
  name_zh      text not null,
  name_en      text,
  multiplier   numeric(4, 2) not null default 1.0 check (multiplier > 0),
  sort_order   integer not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint thicknesses_code_not_empty check (char_length(trim(code)) > 0),
  constraint thicknesses_name_zh_not_empty check (char_length(trim(name_zh)) > 0)
);

comment on table public.thicknesses is '厚度常量：保暖系数';

create table public.size_labels (
  code            text primary key,
  name_zh         text not null,
  age_months_min  integer not null default 0 check (age_months_min >= 0),
  age_months_max  integer not null default 36 check (age_months_max >= age_months_min),
  sort_order      integer not null default 0,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

comment on table public.size_labels is '0-3 岁标准码数，用于推荐过滤';

-- materials: add updated_at
alter table public.materials
  add column if not exists updated_at timestamptz not null default now();

create trigger materials_updated_at
  before update on public.materials
  for each row execute function public.set_updated_at();

create trigger categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger thicknesses_updated_at
  before update on public.thicknesses
  for each row execute function public.set_updated_at();

-- Seed categories
insert into public.categories
  (code, name_zh, name_en, layer_order, coverage_multiplier, warmth_bonus, outdoor_required_below, sort_order)
values
  ('bodysuit',  '连体衣 / 包屁衣', 'Bodysuit',  1, 1.00, 0, null,  1),
  ('inner',     '内层打底',         'Inner layer', 1, 0.90, 0, null,  2),
  ('mid',       '中层',             'Mid layer',   2, 1.10, 0, null,  3),
  ('outer',     '外层外套',         'Outer layer', 3, 1.20, 0, null,  4),
  ('pants',     '裤子',             'Pants',       1, 0.80, 0, null,  5),
  ('sleepwear', '睡袋 / 睡衣',      'Sleepwear',   1, 1.10, 0, null,  6),
  ('hat',       '帽子',             'Hat',         0, 1.00, 8, 15.0,  7),
  ('socks',     '袜子',             'Socks',       0, 1.00, 5, 10.0,  8),
  ('gloves',    '手套',             'Gloves',      0, 1.00, 5, 5.0,   9),
  ('scarf',     '围巾',             'Scarf',       0, 1.00, 0, null, 10),
  ('other',     '其他',             'Other',       0, 1.00, 0, null, 99);

-- Seed thicknesses
insert into public.thicknesses (code, name_zh, name_en, multiplier, sort_order)
values
  ('thin',   '薄',   'Thin',   1.0, 1),
  ('medium', '中',   'Medium', 1.3, 2),
  ('thick',  '厚',   'Thick',  1.6, 3);

-- Seed size labels (0-3 岁常用码)
insert into public.size_labels (code, name_zh, age_months_min, age_months_max, sort_order)
values
  ('52',  '52码',  0,  3,  1),
  ('59',  '59码',  1,  6,  2),
  ('66',  '66码',  3,  9,  3),
  ('73',  '73码',  6, 12,  4),
  ('80',  '80码',  9, 18,  5),
  ('90',  '90码', 12, 24,  6),
  ('100', '100码', 18, 36,  7);

-- RLS for new constant tables
alter table public.categories enable row level security;
alter table public.thicknesses enable row level security;
alter table public.size_labels enable row level security;

create policy "categories_select_active"
  on public.categories for select using (is_active = true);

create policy "thicknesses_select_active"
  on public.thicknesses for select using (is_active = true);

create policy "size_labels_select_active"
  on public.size_labels for select using (is_active = true);

-- ------------------------------------------------------------
-- 2. Profiles — 微信小程序预留
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists wechat_openid text,
  add column if not exists wechat_unionid text;

create unique index if not exists profiles_wechat_openid_unique
  on public.profiles (wechat_openid) where wechat_openid is not null;

-- ------------------------------------------------------------
-- 3. Babies — 码数、年龄校验、唯一 active
-- ------------------------------------------------------------
alter table public.babies
  add column if not exists current_size_label text references public.size_labels (code),
  add column if not exists current_size_updated_at timestamptz;

alter table public.babies
  drop constraint if exists babies_birth_date_valid;

alter table public.babies
  add constraint babies_birth_date_valid check (birth_date <= current_date);

comment on column public.babies.current_size_label is '当前穿着码数，推荐时过滤衣柜';

-- 迁移前：每个用户只保留一个 is_active（保留最近更新的）
with ranked_active_babies as (
  select
    id,
    row_number() over (
      partition by user_id
      order by updated_at desc, created_at desc
    ) as rn
  from public.babies
  where is_active = true
)
update public.babies b
set is_active = false
from ranked_active_babies r
where b.id = r.id
  and r.rn > 1;

create unique index if not exists babies_one_active_per_user
  on public.babies (user_id) where is_active = true;

create or replace function public.ensure_single_active_baby()
returns trigger
language plpgsql
as $$
begin
  if new.is_active then
    update public.babies
      set is_active = false
    where user_id = new.user_id
      and id <> new.id
      and is_active = true;
  end if;
  return new;
end;
$$;

create trigger babies_single_active
  after insert or update of is_active on public.babies
  for each row
  when (new.is_active)
  execute function public.ensure_single_active_baby();

-- ------------------------------------------------------------
-- 4. Baby warmth preferences — 个性化冷暖偏移
-- ------------------------------------------------------------
create table public.baby_warmth_preferences (
  baby_id        uuid primary key references public.babies (id) on delete cascade,
  warmth_offset  numeric(5, 2) not null default 0
                   check (warmth_offset >= -20 and warmth_offset <= 20),
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.baby_warmth_preferences is '每宝宝冷暖偏好偏移，用于个性化推荐';
comment on column public.baby_warmth_preferences.warmth_offset is '在所需保暖值上加减，正=偏暖';

create trigger baby_warmth_preferences_updated_at
  before update on public.baby_warmth_preferences
  for each row execute function public.set_updated_at();

alter table public.baby_warmth_preferences enable row level security;

create policy "baby_prefs_select_own"
  on public.baby_warmth_preferences for select
  using (
    exists (
      select 1 from public.babies b
      where b.id = baby_id and b.user_id = auth.uid()
    )
  );

create policy "baby_prefs_insert_own"
  on public.baby_warmth_preferences for insert
  with check (
    exists (
      select 1 from public.babies b
      where b.id = baby_id and b.user_id = auth.uid()
    )
  );

create policy "baby_prefs_update_own"
  on public.baby_warmth_preferences for update
  using (
    exists (
      select 1 from public.babies b
      where b.id = baby_id and b.user_id = auth.uid()
    )
  );

create policy "baby_prefs_delete_own"
  on public.baby_warmth_preferences for delete
  using (
    exists (
      select 1 from public.babies b
      where b.id = baby_id and b.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 5. Clothing items — material_id、软删除、归属校验
-- ------------------------------------------------------------
alter table public.clothing_items
  add column if not exists material_id uuid references public.materials (id),
  add column if not exists deleted_at timestamptz;

update public.clothing_items ci
set material_id = m.id
from public.materials m
where ci.material_id is null
  and m.code = ci.material::text;

alter table public.clothing_items
  alter column material_id set not null;

create index if not exists clothing_items_material_id_idx
  on public.clothing_items (material_id);

create index if not exists clothing_items_rec_query_idx
  on public.clothing_items (user_id, category, warmth_score)
  where is_available = true and deleted_at is null;

comment on column public.clothing_items.material_id is '材质 FK，与 material enum 由 trigger 同步';
comment on column public.clothing_items.deleted_at is '软删除时间戳，非 null 表示已删除';

-- material_id ↔ material enum 双向同步
create or replace function public.sync_clothing_material_fields()
returns trigger
language plpgsql
as $$
begin
  if new.material_id is distinct from old.material_id
     or (tg_op = 'INSERT' and new.material_id is not null) then
    select m.code::public.fabric_material
      into new.material
    from public.materials m
    where m.id = new.material_id;

    if new.material is null then
      raise exception 'invalid material_id: %', new.material_id;
    end if;
  elsif new.material is distinct from old.material then
    select m.id
      into new.material_id
    from public.materials m
    where m.code = new.material::text
      and m.is_active = true;

    if new.material_id is null then
      raise exception 'invalid material code: %', new.material;
    end if;
  end if;

  return new;
end;
$$;

create trigger clothing_items_sync_material
  before insert or update of material_id, material on public.clothing_items
  for each row execute function public.sync_clothing_material_fields();

-- baby 必须属于同一用户
create or replace function public.check_clothing_item_baby_owner()
returns trigger
language plpgsql
as $$
begin
  if new.baby_id is not null and not exists (
    select 1 from public.babies b
    where b.id = new.baby_id and b.user_id = new.user_id
  ) then
    raise exception 'baby_id % does not belong to user_id %', new.baby_id, new.user_id;
  end if;
  return new;
end;
$$;

create trigger clothing_items_check_baby_owner
  before insert or update of baby_id, user_id on public.clothing_items
  for each row execute function public.check_clothing_item_baby_owner();

-- ------------------------------------------------------------
-- 6. Clothing templates — material_id + 自动保暖分
-- ------------------------------------------------------------
alter table public.clothing_templates
  add column if not exists material_id uuid references public.materials (id);

update public.clothing_templates t
set material_id = m.id
from public.materials m
where t.material_id is null
  and m.code = t.material::text;

alter table public.clothing_templates
  alter column material_id set not null;

-- ------------------------------------------------------------
-- 7. Unified warmth score computation
-- ------------------------------------------------------------
create or replace function public.compute_warmth_score(
  p_category public.clothing_category,
  p_material_id uuid,
  p_thickness public.thickness_level,
  p_weight_grams integer default null
)
returns numeric
language plpgsql
stable
as $$
declare
  base_material numeric;
  thickness_mul numeric;
  coverage_mul  numeric;
  warmth_bonus  numeric;
  score         numeric;
  weight_adj    numeric;
begin
  select m.base_warmth
    into base_material
  from public.materials m
  where m.id = p_material_id and m.is_active = true;

  if base_material is null then
    base_material := 20;
  end if;

  select t.multiplier
    into thickness_mul
  from public.thicknesses t
  where t.code = p_thickness::text and t.is_active = true;

  if thickness_mul is null then
    thickness_mul := 1.0;
  end if;

  select c.coverage_multiplier, c.warmth_bonus
    into coverage_mul, warmth_bonus
  from public.categories c
  where c.code = p_category::text and c.is_active = true;

  if coverage_mul is null then
    coverage_mul := 1.0;
    warmth_bonus := 0;
  end if;

  score := base_material * thickness_mul * coverage_mul + coalesce(warmth_bonus, 0);

  -- 重量修正：500g 为基准，每 ±100g ±2 分
  if p_weight_grams is not null and p_weight_grams > 0 then
    weight_adj := ((p_weight_grams - 500)::numeric / 100.0) * 2.0;
    score := score + weight_adj;
  end if;

  return least(100, greatest(0, round(score, 2)));
end;
$$;

comment on function public.compute_warmth_score is
  '保暖值 = 材料基础分 × 厚度系数 × 类目系数 + 配件加分 + 重量修正';

-- 兼容旧函数签名
create or replace function public.calc_warmth_score(
  p_category public.clothing_category,
  p_material public.fabric_material,
  p_thickness public.thickness_level
)
returns numeric
language plpgsql
stable
as $$
declare
  v_material_id uuid;
begin
  select id into v_material_id
  from public.materials
  where code = p_material::text and is_active = true;

  return public.compute_warmth_score(p_category, v_material_id, p_thickness, null);
end;
$$;

create or replace function public.clothing_items_set_warmth_score()
returns trigger
language plpgsql
as $$
begin
  new.warmth_score := public.compute_warmth_score(
    new.category,
    new.material_id,
    new.thickness,
    new.weight_grams
  );
  return new;
end;
$$;

drop trigger if exists clothing_items_warmth_score on public.clothing_items;

create trigger clothing_items_warmth_score
  before insert or update of category, material_id, material, thickness, weight_grams
  on public.clothing_items
  for each row execute function public.clothing_items_set_warmth_score();

-- 合并 sync + warmth，避免 trigger 字母序导致 sync 晚于 warmth 执行
create or replace function public.clothing_templates_before_save()
returns trigger
language plpgsql
as $$
begin
  if new.material_id is distinct from old.material_id
     or (tg_op = 'INSERT' and new.material_id is not null) then
    select m.code::public.fabric_material into new.material
    from public.materials m where m.id = new.material_id;
  elsif new.material is distinct from old.material then
    select m.id into new.material_id
    from public.materials m
    where m.code = new.material::text and m.is_active = true;
  end if;

  new.warmth_score := public.compute_warmth_score(
    new.category,
    new.material_id,
    new.thickness,
    null
  );
  return new;
end;
$$;

create trigger clothing_templates_before_save
  before insert or update of category, material_id, material, thickness
  on public.clothing_templates
  for each row execute function public.clothing_templates_before_save();

-- 重算已有模板保暖分
update public.clothing_templates t
set warmth_score = public.compute_warmth_score(t.category, t.material_id, t.thickness, null);

-- 重算已有衣柜单品保暖分
update public.clothing_items ci
set warmth_score = public.compute_warmth_score(ci.category, ci.material_id, ci.thickness, ci.weight_grams);

-- ------------------------------------------------------------
-- 8. Outfit recommendations — 场景、时段、扩展天气
-- ------------------------------------------------------------
alter table public.outfit_recommendations
  add column if not exists scenario text not null default 'outdoor',
  add column if not exists time_slot text not null default 'morning',
  add column if not exists weather_latitude numeric(9, 6),
  add column if not exists weather_longitude numeric(9, 6),
  add column if not exists weather_uv_index numeric(4, 1),
  add column if not exists weather_precip_mm numeric(6, 2),
  add column if not exists weather_precip_probability integer
    check (weather_precip_probability is null
      or (weather_precip_probability >= 0 and weather_precip_probability <= 100));

alter table public.outfit_recommendations
  drop constraint if exists outfit_recommendations_scenario_check;

alter table public.outfit_recommendations
  add constraint outfit_recommendations_scenario_check
    check (scenario in ('indoor', 'outdoor', 'sleep'));

alter table public.outfit_recommendations
  drop constraint if exists outfit_recommendations_time_slot_check;

alter table public.outfit_recommendations
  add constraint outfit_recommendations_time_slot_check
    check (time_slot in ('morning', 'afternoon', 'evening', 'night'));

-- 扩展唯一约束：同一天可按场景出多套推荐
alter table public.outfit_recommendations
  drop constraint if exists outfit_recommendations_baby_id_recommended_date_variant_key;

alter table public.outfit_recommendations
  add constraint outfit_recommendations_baby_date_variant_scenario_key
    unique (baby_id, recommended_date, variant, scenario);

create index if not exists outfit_recommendations_baby_date_idx
  on public.outfit_recommendations (baby_id, recommended_date desc);

comment on column public.outfit_recommendations.scenario is 'indoor/outdoor/sleep';
comment on column public.outfit_recommendations.time_slot is '推荐时段';

-- ------------------------------------------------------------
-- 9. Recommendation items — 快照、SET NULL、PK 重构
-- ------------------------------------------------------------
alter table public.outfit_recommendation_items
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists item_name text,
  add column if not exists item_category public.clothing_category,
  add column if not exists item_material public.fabric_material,
  add column if not exists warmth_score_snapshot numeric(5, 2),
  add column if not exists image_url_snapshot text,
  add column if not exists is_worn boolean not null default false;

-- 回填 id
update public.outfit_recommendation_items
set id = gen_random_uuid()
where id is null;

alter table public.outfit_recommendation_items
  alter column id set not null;

-- 回填快照
update public.outfit_recommendation_items ri
set
  item_name = coalesce(ri.item_name, c.name),
  item_category = coalesce(ri.item_category, c.category),
  item_material = coalesce(ri.item_material, c.material),
  warmth_score_snapshot = coalesce(ri.warmth_score_snapshot, c.warmth_score),
  image_url_snapshot = coalesce(ri.image_url_snapshot, c.image_url)
from public.clothing_items c
where c.id = ri.clothing_item_id;

update public.outfit_recommendation_items
set item_name = '已删除单品'
where item_name is null;

alter table public.outfit_recommendation_items
  alter column item_name set not null;

-- 切换主键 & 外键删除策略
alter table public.outfit_recommendation_items
  drop constraint if exists outfit_recommendation_items_pkey;

alter table public.outfit_recommendation_items
  add primary key (id);

alter table public.outfit_recommendation_items
  drop constraint if exists outfit_recommendation_items_clothing_item_id_fkey;

alter table public.outfit_recommendation_items
  alter column clothing_item_id drop not null;

alter table public.outfit_recommendation_items
  add constraint outfit_recommendation_items_clothing_item_id_fkey
    foreign key (clothing_item_id)
    references public.clothing_items (id)
    on delete set null;

create unique index if not exists rec_items_rec_clothing_unique
  on public.outfit_recommendation_items (recommendation_id, clothing_item_id)
  where clothing_item_id is not null;

-- 插入时自动填快照 + 校验归属
create or replace function public.outfit_rec_items_before_insert()
returns trigger
language plpgsql
as $$
declare
  v_user_id uuid;
  v_item record;
begin
  select r.user_id into v_user_id
  from public.outfit_recommendations r
  where r.id = new.recommendation_id;

  if v_user_id is null then
    raise exception 'recommendation not found: %', new.recommendation_id;
  end if;

  if new.clothing_item_id is not null then
    select c.name, c.category, c.material, c.warmth_score, c.image_url, c.user_id
      into v_item
    from public.clothing_items c
    where c.id = new.clothing_item_id;

    if v_item.user_id is null then
      raise exception 'clothing_item not found: %', new.clothing_item_id;
    end if;

    if v_item.user_id <> v_user_id then
      raise exception 'clothing_item % does not belong to recommendation user', new.clothing_item_id;
    end if;

    new.item_name := coalesce(new.item_name, v_item.name);
    new.item_category := coalesce(new.item_category, v_item.category);
    new.item_material := coalesce(new.item_material, v_item.material);
    new.warmth_score_snapshot := coalesce(new.warmth_score_snapshot, v_item.warmth_score);
    new.image_url_snapshot := coalesce(new.image_url_snapshot, v_item.image_url);
  end if;

  if new.item_name is null or char_length(trim(new.item_name)) = 0 then
    raise exception 'item_name is required (populate snapshot or provide clothing_item_id)';
  end if;

  return new;
end;
$$;

create trigger outfit_rec_items_before_insert
  before insert on public.outfit_recommendation_items
  for each row execute function public.outfit_rec_items_before_insert();

-- rec_items UPDATE policy（补漏）
drop policy if exists "rec_items_update_own" on public.outfit_recommendation_items;

create policy "rec_items_update_own"
  on public.outfit_recommendation_items for update
  using (
    exists (
      select 1 from public.outfit_recommendations r
      where r.id = recommendation_id and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.outfit_recommendations r
      where r.id = recommendation_id and r.user_id = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 10. URL parse jobs — 网店链接异步解析
-- ------------------------------------------------------------
create table public.url_parse_jobs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  source_url       text not null,
  status           text not null default 'pending'
                     check (status in ('pending', 'processing', 'success', 'failed')),
  result           jsonb not null default '{}',
  error_message    text,
  clothing_item_id uuid references public.clothing_items (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  completed_at     timestamptz,

  constraint url_parse_jobs_url_not_empty check (char_length(trim(source_url)) > 0)
);

comment on table public.url_parse_jobs is '网店链接解析任务，前端轮询状态';

create index url_parse_jobs_user_created_idx
  on public.url_parse_jobs (user_id, created_at desc);

create trigger url_parse_jobs_updated_at
  before update on public.url_parse_jobs
  for each row execute function public.set_updated_at();

alter table public.url_parse_jobs enable row level security;

create policy "url_parse_jobs_select_own"
  on public.url_parse_jobs for select using (auth.uid() = user_id);

create policy "url_parse_jobs_insert_own"
  on public.url_parse_jobs for insert with check (auth.uid() = user_id);

create policy "url_parse_jobs_update_own"
  on public.url_parse_jobs for update using (auth.uid() = user_id);

create policy "url_parse_jobs_delete_own"
  on public.url_parse_jobs for delete using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 11. Weather cache — 匿名用户可读未过期缓存
-- ------------------------------------------------------------
drop policy if exists "weather_cache_select_valid_anon" on public.weather_cache;

create policy "weather_cache_select_valid_anon"
  on public.weather_cache for select
  to anon
  using (expires_at > now());

-- ------------------------------------------------------------
-- 12. match_material_by_keywords — 优先长关键词
-- ------------------------------------------------------------
create or replace function public.match_material_by_keywords(p_text text)
returns public.fabric_material
language sql
stable
as $$
  select matched.code::public.fabric_material
  from (
    select m.code, m.sort_order, char_length(kw) as kw_len
    from public.materials m
    cross join lateral unnest(m.keywords) as kw
    where m.is_active = true
      and m.code <> 'other'
      and p_text ilike '%' || kw || '%'
  ) matched
  order by matched.kw_len desc, matched.sort_order
  limit 1;
$$;
