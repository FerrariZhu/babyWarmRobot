-- ============================================================
-- Step 2/2: Category hierarchy data migration
-- Run AFTER 20240101000010_clothing_category_enum_values.sql has committed
-- ============================================================

-- 1. Migrate legacy enum values on clothing data
update public.clothing_items set category = 'bodysuit_long' where category = 'bodysuit';
update public.clothing_items set category = 'base_top' where category = 'inner';
update public.clothing_items set category = 'sweater' where category = 'mid';
update public.clothing_items set category = 'outer_shell' where category = 'outer';
update public.clothing_items set category = 'pants_long' where category = 'pants';
update public.clothing_items set category = 'sleep_sack' where category = 'sleepwear';

update public.clothing_templates set category = 'bodysuit_long' where category = 'bodysuit';
update public.clothing_templates set category = 'base_top' where category = 'inner';
update public.clothing_templates set category = 'sweater' where category = 'mid';
update public.clothing_templates set category = 'outer_shell' where category = 'outer';
update public.clothing_templates set category = 'pants_long' where category = 'pants';
update public.clothing_templates set category = 'sleep_sack' where category = 'sleepwear';

-- 2. Add group columns to categories table
alter table public.categories
  add column if not exists group_code text,
  add column if not exists group_name_zh text,
  add column if not exists group_sort_order integer not null default 0;

-- 3. Replace category seeds (remove mock ext_cat_* and legacy flat rows)
delete from public.categories
where code like 'ext\_%' escape '\'
   or code in ('bodysuit', 'inner', 'mid', 'outer', 'pants', 'sleepwear');

insert into public.categories
  (code, name_zh, name_en, layer_order, coverage_multiplier, warmth_bonus, outdoor_required_below, sort_order, group_code, group_name_zh, group_sort_order)
values
  ('bodysuit_short', '包屁衣',       'Short bodysuit',     1, 1.00, 0, null,  1, 'bodysuit_group', '连体类', 1),
  ('bodysuit_long',  '长袖连体',     'Long bodysuit',      1, 1.00, 0, null,  2, 'bodysuit_group', '连体类', 1),
  ('footed_romper',  '连脚爬服',     'Footed romper',      1, 0.95, 0, null,  3, 'bodysuit_group', '连体类', 1),
  ('base_top',       '打底衫',       'Base top',           1, 0.90, 0, null,  4, 'top_group',      '上衣类', 2),
  ('sweater',        '毛衣/针织',    'Sweater',            2, 1.10, 0, null,  5, 'top_group',      '上衣类', 2),
  ('fleece_top',     '卫衣/抓绒',    'Fleece top',         2, 1.05, 0, null,  6, 'top_group',      '上衣类', 2),
  ('vest',           '马甲/背心',    'Vest',               2, 0.70, 0, null,  7, 'top_group',      '上衣类', 2),
  ('pants_long',     '长裤/打底裤',  'Long pants',         1, 0.80, 0, null,  8, 'bottom_group',   '下装类', 3),
  ('pants_short',    '短裤',         'Shorts',             1, 0.65, 0, null,  9, 'bottom_group',   '下装类', 3),
  ('pants_padded',   '羽绒裤/棉裤',  'Padded pants',       1, 0.90, 0, null, 10, 'bottom_group',   '下装类', 3),
  ('outer_shell',    '普通外套',     'Shell jacket',       3, 1.15, 0, null, 11, 'outer_group',    '外套类', 4),
  ('outer_down',     '羽绒服',       'Down jacket',        3, 1.25, 0, null, 12, 'outer_group',    '外套类', 4),
  ('outer_cotton',   '棉服',         'Cotton coat',        3, 1.20, 0, null, 13, 'outer_group',    '外套类', 4),
  ('outer_rain_uv',  '雨衣/防晒衣',  'Rain / UV jacket',   3, 1.00, 0, null, 14, 'outer_group',    '外套类', 4),
  ('sleep_sack',     '睡袋',         'Sleep sack',         1, 1.10, 0, null, 15, 'sleep_group',    '睡衣类', 5),
  ('pajamas',        '睡衣/家居服',  'Pajamas',            1, 0.95, 0, null, 16, 'sleep_group',    '睡衣类', 5),
  ('hat',            '帽子',         'Hat',                0, 1.00, 8, 15.0, 17, 'accessory_group', '配件类', 6),
  ('socks',          '袜子',         'Socks',              0, 1.00, 5, 10.0, 18, 'accessory_group', '配件类', 6),
  ('gloves',         '手套',         'Gloves',             0, 1.00, 5, 5.0,  19, 'accessory_group', '配件类', 6),
  ('scarf',          '围巾/围脖',    'Scarf',              0, 1.00, 0, null, 20, 'accessory_group', '配件类', 6),
  ('other',          '其他',         'Other',              0, 1.00, 0, null, 99, 'other_group',    '其他',   7)
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

-- 4. Recalculate warmth scores after category remap
update public.clothing_items ci
set warmth_score = public.compute_warmth_score(ci.category, ci.material_id, ci.thickness, ci.weight_grams);

update public.clothing_templates t
set warmth_score = public.compute_warmth_score(t.category, t.material_id, t.thickness, null);
