-- ============================================================
-- Materials constant table
-- Run after 002_storage_setup.sql
-- ============================================================

-- ------------------------------------------------------------
-- 1. materials — 材质常量表（保暖计算与商品解析的单源）
-- ------------------------------------------------------------
create table public.materials (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,   -- 与 fabric_material enum 对齐，如 cotton_light
  name_zh      text not null,          -- 中文展示名
  name_en      text,                   -- 英文展示名（可选）
  description  text,
  base_warmth  numeric(5, 2) not null
                 check (base_warmth >= 0 and base_warmth <= 100),
  keywords     text[] not null default '{}',  -- 商品页/OCR 匹配关键词
  sort_order   integer not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),

  constraint materials_code_not_empty check (char_length(trim(code)) > 0),
  constraint materials_name_zh_not_empty check (char_length(trim(name_zh)) > 0)
);

comment on table public.materials is '材质常量表：基础保暖分、展示名、解析关键词';
comment on column public.materials.code is '稳定标识，与 fabric_material enum 值一致';
comment on column public.materials.base_warmth is '材料基础保暖分 0-100，不含厚度/类目系数';
comment on column public.materials.keywords is '网店标题/吊牌 OCR 匹配用，如 {纯棉,全棉}';

create index materials_is_active_sort_idx
  on public.materials (is_active, sort_order);

-- ------------------------------------------------------------
-- 2. RLS — 所有人可读启用的材质
-- ------------------------------------------------------------
alter table public.materials enable row level security;

create policy "materials_select_active"
  on public.materials for select
  using (is_active = true);

-- ------------------------------------------------------------
-- 3. Seed — 与 001 中 fabric_material enum / calc_warmth_score 对齐
-- ------------------------------------------------------------
insert into public.materials
  (code, name_zh, name_en, description, base_warmth, keywords, sort_order)
values
  (
    'cotton_light',
    '薄棉 / 纯棉单面',
    'Light cotton',
    '夏季室内、单面纯棉、薄款包屁衣',
    15,
    array['薄棉', '纯棉', '全棉', '单面', '精梳棉', 'cotton'],
    1
  ),
  (
    'cotton_heavy',
    '厚棉 / 罗纹棉',
    'Heavy cotton',
    '春秋日常、双面棉、罗纹、毛圈',
    25,
    array['厚棉', '罗纹', '双面棉', '毛圈', 'heavy cotton'],
    2
  ),
  (
    'bamboo',
    '竹纤维',
    'Bamboo fiber',
    '透气吸湿，略优于薄棉',
    18,
    array['竹纤维', '竹棉', 'bamboo'],
    3
  ),
  (
    'fleece',
    '抓绒',
    'Fleece',
    '秋冬中层，轻便保暖',
    40,
    array['抓绒', '摇粒绒', 'fleece', 'polar fleece'],
    4
  ),
  (
    'wool_light',
    '薄针织 / 羊毛',
    'Light wool',
    '薄毛衣、针织开衫',
    50,
    array['羊毛', '针织', 'merino', 'wool'],
    5
  ),
  (
    'wool_heavy',
    '厚毛衣',
    'Heavy wool',
    '厚针织、羊绒类',
    60,
    array['厚毛衣', '羊绒', 'cashmere', 'heavy wool'],
    6
  ),
  (
    'down_light',
    '薄羽绒',
    'Light down',
    '轻量羽绒外套/连体',
    70,
    array['薄羽绒', '轻羽绒', 'light down'],
    7
  ),
  (
    'down_heavy',
    '厚羽绒',
    'Heavy down',
    '深冬高充绒量羽绒',
    85,
    array['厚羽绒', '高充绒', 'heavy down', '90绒', '95绒'],
    8
  ),
  (
    'waterproof',
    '防风防水',
    'Waterproof shell',
    '防风防雨外层，保暖一般但挡风',
    35,
    array['防风', '防水', '冲锋', '软壳', 'windproof', 'waterproof'],
    9
  ),
  (
    'other',
    '其他材质',
    'Other',
    '无法归类时使用',
    20,
    array[]::text[],
    99
  );

-- ------------------------------------------------------------
-- 4. calc_warmth_score — 改从 materials 表读取 base_warmth
-- ------------------------------------------------------------
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
  base_material numeric;
  thickness_mul numeric;
  coverage_mul  numeric;
begin
  select m.base_warmth
    into base_material
  from public.materials m
  where m.code = p_material::text
    and m.is_active = true;

  if base_material is null then
    base_material := 20;
  end if;

  thickness_mul := case p_thickness
    when 'thin'   then 1.0
    when 'medium' then 1.3
    when 'thick'  then 1.6
    else 1.0
  end;

  coverage_mul := case p_category
    when 'bodysuit'  then 1.0
    when 'inner'     then 0.9
    when 'mid'       then 1.1
    when 'outer'     then 1.2
    when 'pants'     then 0.8
    when 'sleepwear' then 1.1
    when 'hat'       then 1.0
    when 'socks'     then 1.0
    when 'gloves'    then 1.0
    when 'scarf'     then 1.0
    else 1.0
  end;

  return least(100, round(base_material * thickness_mul * coverage_mul, 2));
end;
$$;

comment on function public.calc_warmth_score is
  '保暖值 = materials.base_warmth × 厚度系数 × 类目系数，上限 100';

-- ------------------------------------------------------------
-- 5. 关键词匹配辅助函数（网店/OCR 解析用）
-- ------------------------------------------------------------
create or replace function public.match_material_by_keywords(p_text text)
returns public.fabric_material
language sql
stable
as $$
  select m.code::public.fabric_material
  from public.materials m
  where m.is_active = true
    and m.code <> 'other'
    and exists (
      select 1
      from unnest(m.keywords) kw
      where p_text ilike '%' || kw || '%'
    )
  order by m.sort_order
  limit 1;
$$;

comment on function public.match_material_by_keywords is
  '从商品标题/吊牌文本匹配材质，未命中返回 null';
