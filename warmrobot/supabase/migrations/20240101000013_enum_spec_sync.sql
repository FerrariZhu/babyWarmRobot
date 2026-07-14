-- ============================================================
-- Step 2/2: Sync DB constants to 枚举.md spec (2026-06-03)
-- Run AFTER 20240101000012_enum_spec_values.sql has committed
-- ============================================================

-- 1. Remap legacy categories on clothing data
update public.clothing_items set category = 'bodysuit_long' where category = 'footed_romper';
update public.clothing_items set category = 'thermal_top' where category = 'base_top';
update public.clothing_items set category = 'pants_long' where category = 'pants_padded';
update public.clothing_items set category = 'outer_uv' where category = 'outer_rain_uv';
update public.clothing_items set category = 'other' where category in ('sleep_sack', 'pajamas');

update public.clothing_templates set category = 'bodysuit_long' where category = 'footed_romper';
update public.clothing_templates set category = 'thermal_top' where category = 'base_top';
update public.clothing_templates set category = 'pants_long' where category = 'pants_padded';
update public.clothing_templates set category = 'outer_uv' where category = 'outer_rain_uv';
update public.clothing_templates set category = 'other' where category in ('sleep_sack', 'pajamas');

-- 2. Extra columns on clothing_items
alter table public.clothing_items
  add column if not exists fill_type text
    check (fill_type is null or fill_type in ('cotton_wadding', 'polyester_fill')),
  add column if not exists bodysuit_style text
    check (bodysuit_style is null or bodysuit_style in ('triangle', 'brief', 'long_leg')),
  add column if not exists pant_length text
    check (pant_length is null or pant_length in ('seven_tenth', 'nine_tenth', 'full_length')),
  add column if not exists sock_height text
    check (sock_height is null or sock_height in ('ankle', 'mid_calf', 'over_calf'));

comment on column public.clothing_items.fill_type is '棉衣填充物，仅 outer_cotton';
comment on column public.clothing_items.bodysuit_style is '包屁衣款式';
comment on column public.clothing_items.pant_length is '外裤裤长';
comment on column public.clothing_items.sock_height is '袜筒高度';

-- 3. Materials — spec §3.1 (7 项 + unspecified for shoes)
insert into public.materials
  (code, name_zh, name_en, description, base_warmth, keywords, sort_order, is_active)
values
  (
    'cotton', '棉', 'Cotton', '纯棉、全棉', 22,
    array['纯棉', '全棉', '精梳棉', 'cotton', '棉质'], 1, true
  ),
  (
    'modal', '莫代尔', 'Modal', '贴身衣物', 18,
    array['莫代尔', 'modal', '兰精'], 2, true
  ),
  (
    'fleece', '摇粒绒', 'Fleece', '抓绒、摇粒绒', 28,
    array['摇粒绒', '抓绒', 'fleece', '珊瑚绒'], 3, true
  ),
  (
    'acrylic', '腈纶', 'Acrylic', '仿羊毛，毛衣常见', 24,
    array['腈纶', 'acrylic', '仿羊毛'], 4, true
  ),
  (
    'polyester', '涤纶', 'Polyester', '聚酯纤维、化纤', 20,
    array['涤纶', '聚酯', 'polyester', '化纤'], 5, true
  ),
  (
    'wool', '羊毛', 'Wool', '羊毛、羊绒', 32,
    array['羊毛', '羊绒', 'wool', 'cashmere'], 6, true
  ),
  (
    'down', '羽绒', 'Down', '羽绒填充', 45,
    array['羽绒', '鹅绒', '鸭绒', 'down'], 7, true
  ),
  (
    'unspecified', '未指定', 'Unspecified', '鞋子等不参与保暖计算的类别', 0,
    array[]::text[], 99, true
  )
on conflict (code) do update set
  name_zh = excluded.name_zh,
  name_en = excluded.name_en,
  description = excluded.description,
  base_warmth = excluded.base_warmth,
  keywords = excluded.keywords,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- Remap existing items from legacy material codes
update public.clothing_items ci
set material_id = m_new.id
from public.materials m_old
join public.materials m_new on m_new.code = case m_old.code
  when 'cotton_light' then 'cotton'
  when 'cotton_heavy' then 'cotton'
  when 'bamboo' then 'modal'
  when 'wool_light' then 'wool'
  when 'wool_heavy' then 'wool'
  when 'down_light' then 'down'
  when 'down_heavy' then 'down'
  when 'waterproof' then 'polyester'
  when 'other' then 'cotton'
  else m_old.code
end
where ci.material_id = m_old.id
  and m_old.code in (
    'cotton_light', 'cotton_heavy', 'bamboo', 'wool_light', 'wool_heavy',
    'down_light', 'down_heavy', 'waterproof', 'other'
  );

update public.clothing_templates t
set material_id = m_new.id
from public.materials m_old
join public.materials m_new on m_new.code = case m_old.code
  when 'cotton_light' then 'cotton'
  when 'cotton_heavy' then 'cotton'
  when 'bamboo' then 'modal'
  when 'wool_light' then 'wool'
  when 'wool_heavy' then 'wool'
  when 'down_light' then 'down'
  when 'down_heavy' then 'down'
  when 'waterproof' then 'polyester'
  when 'other' then 'cotton'
  else m_old.code
end
where t.material_id = m_old.id
  and m_old.code in (
    'cotton_light', 'cotton_heavy', 'bamboo', 'wool_light', 'wool_heavy',
    'down_light', 'down_heavy', 'waterproof', 'other'
  );

update public.materials
set is_active = false
where code in (
  'cotton_light', 'cotton_heavy', 'bamboo', 'wool_light', 'wool_heavy',
  'down_light', 'down_heavy', 'waterproof', 'other'
);

-- 4. Size labels — spec §6.1 + §6.2 (22 项)
insert into public.size_labels (code, name_zh, age_months_min, age_months_max, sort_order, is_active)
values
  ('48',   '48（早产/小胎）', 0,   1,   1,  true),
  ('52',   '52（0–1月）',     0,   1,   2,  true),
  ('59',   '59（1–3月）',     1,   3,   3,  true),
  ('66',   '66（3–6月）',     3,   6,   4,  true),
  ('73',   '73（6–9月）',     6,   9,   5,  true),
  ('80',   '80（9–12月）',    9,   12,  6,  true),
  ('90',   '90（12–18月）',   12,  18,  7,  true),
  ('100',  '100（18–24月）',  18,  24,  8,  true),
  ('110',  '110（2–3岁）',    24,  36,  9,  true),
  ('120',  '120（3–4岁）',    36,  48,  10, true),
  ('130',  '130（4–5岁）',    48,  60,  11, true),
  ('140',  '140（5–6岁）',    60,  72,  12, true),
  ('150',  '150（6–7岁）',    72,  84,  13, true),
  ('160',  '160（7–8岁）',    84,  96,  14, true),
  ('165',  '165（8岁+）',     96,  144, 15, true),
  ('S',    'S（110–120cm）',  48,  60,  16, true),
  ('M',    'M（120–130cm）',  60,  72,  17, true),
  ('L',    'L（130–140cm）',  72,  84,  18, true),
  ('XL',   'XL（140–150cm）', 84,  96,  19, true),
  ('2XL',  '2XL（150–160cm）',96, 108, 20, true),
  ('3XL',  '3XL（160–165cm）',108,120, 21, true),
  ('4XL',  '4XL（165cm+）',   120, 180, 22, true)
on conflict (code) do update set
  name_zh = excluded.name_zh,
  age_months_min = excluded.age_months_min,
  age_months_max = excluded.age_months_max,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- 5. Categories — spec §1 (25 项 · 6 组)
update public.categories
set is_active = false
where code in (
  'footed_romper', 'base_top', 'pants_padded', 'outer_rain_uv',
  'sleep_sack', 'pajamas',
  'bodysuit', 'inner', 'mid', 'outer', 'pants', 'sleepwear'
);

insert into public.categories
  (code, name_zh, name_en, layer_order, coverage_multiplier, warmth_bonus, outdoor_required_below, sort_order, group_code, group_name_zh, group_sort_order)
values
  ('bodysuit_short', '短袖包屁衣',   'Short bodysuit',     1, 1.00, 0, null,  1, 'bodysuit_group',  '连体衣', 1),
  ('bodysuit_long',  '长袖包屁衣',   'Long bodysuit',      1, 1.00, 0, null,  2, 'bodysuit_group',  '连体衣', 1),
  ('tshirt_short',   '短袖 T 恤',    'Short sleeve tee',   1, 0.85, 0, null,  3, 'top_group',       '上衣',   2),
  ('tshirt_long',    '长袖 T 恤',    'Long sleeve tee',    1, 0.90, 0, null,  4, 'top_group',       '上衣',   2),
  ('thermal_top',    '秋衣',         'Thermal top',        1, 0.92, 0, null,  5, 'top_group',       '上衣',   2),
  ('sweater',        '毛衣/针织',    'Sweater',            2, 1.10, 0, null,  6, 'top_group',       '上衣',   2),
  ('fleece_top',     '卫衣/抓绒',    'Fleece top',         2, 1.05, 0, null,  7, 'top_group',       '上衣',   2),
  ('vest',           '马甲/背心',    'Vest',               2, 0.70, 0, null,  8, 'top_group',       '上衣',   2),
  ('outer_uv',       '防晒衣',       'UV jacket',          3, 0.75, 0, null,  9, 'top_group',       '上衣',   2),
  ('outer_shell',    '春秋外套',     'Shell jacket',       3, 1.15, 0, null, 10, 'top_group',       '上衣',   2),
  ('outer_cotton',   '棉衣',         'Cotton coat',        3, 1.20, 0, null, 11, 'top_group',       '上衣',   2),
  ('outer_down',     '羽绒服',       'Down jacket',        3, 1.25, 0, null, 12, 'top_group',       '上衣',   2),
  ('long_johns',     '秋裤',         'Long johns',         1, 0.88, 0, null, 13, 'bottom_group',    '下装',   3),
  ('pants_short',    '短裤',         'Shorts',             1, 0.65, 0, null, 14, 'bottom_group',    '下装',   3),
  ('pants_mid',      '中裤',         'Capri pants',        1, 0.72, 0, null, 15, 'bottom_group',    '下装',   3),
  ('pants_long',     '长裤',         'Long pants',         1, 0.80, 0, null, 16, 'bottom_group',    '下装',   3),
  ('shoes_sandal',   '凉鞋',         'Sandals',            0, 1.00, 0, null, 17, 'shoes_group',     '鞋子',   4),
  ('shoes_sneaker',  '运动鞋',       'Sneakers',           0, 1.00, 0, null, 18, 'shoes_group',     '鞋子',   4),
  ('shoes_leather',  '皮鞋',         'Leather shoes',      0, 1.00, 0, null, 19, 'shoes_group',     '鞋子',   4),
  ('shoes_boot',     '高帮靴',       'Boots',              0, 1.00, 0, null, 20, 'shoes_group',     '鞋子',   4),
  ('hat',            '帽子',         'Hat',                0, 1.00, 8, 15.0, 21, 'accessory_group', '配件',   5),
  ('scarf',          '围巾',         'Scarf',              0, 1.00, 0, null, 22, 'accessory_group', '配件',   5),
  ('gloves',         '手套',         'Gloves',             0, 1.00, 5, 5.0,  23, 'accessory_group', '配件',   5),
  ('socks',          '袜子',         'Socks',              0, 1.00, 5, 10.0, 24, 'accessory_group', '配件',   5),
  ('other',          '其他',         'Other',              0, 1.00, 0, null, 99, 'other_group',     '其他',   6)
on conflict (code) do update set
  name_zh = excluded.name_zh,
  name_en = excluded.name_en,
  layer_order = excluded.layer_order,
  coverage_multiplier = excluded.coverage_multiplier,
  warmth_bonus = excluded.warmth_bonus,
  outdoor_required_below = excluded.outdoor_required_below,
  sort_order = excluded.sort_order,
  group_code = excluded.group_code,
  group_name_zh = excluded.group_name_zh,
  group_sort_order = excluded.group_sort_order,
  is_active = true,
  updated_at = now();

-- 6. Recalculate warmth scores
update public.clothing_items ci
set warmth_score = public.compute_warmth_score(ci.category, ci.material_id, ci.thickness, ci.weight_grams);

update public.clothing_templates t
set warmth_score = public.compute_warmth_score(t.category, t.material_id, t.thickness, null);
