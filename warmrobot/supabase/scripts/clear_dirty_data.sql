-- ============================================================
-- 清空 mock / 用户录入的脏数据（保留 001/003/004 系统参考表）
-- 在 Supabase Dashboard → SQL Editor 中执行，或：
--   SUPABASE_DB_URL=... node web/scripts/clear-dirty-data.mjs
-- ============================================================

begin;

-- 1. 用户业务数据（全部账号）
delete from public.outfit_recommendation_items;
delete from public.outfit_recommendations;
delete from public.clothing_items;
delete from public.baby_warmth_preferences;
delete from public.babies;
delete from public.url_parse_jobs;

-- 2. 缓存与外部商品目录
delete from public.weather_cache;

do $$
begin
  if exists (
    select 1 from pg_tables
    where schemaname = 'public' and tablename = 'product_catalog'
  ) then
    delete from public.product_catalog;
  end if;
end $$;

-- 3. Demo / mock 种子（005 及旧版标记）

delete from public.clothing_templates
where description like 'seed:demo:%'
   or name like '模板单品 #%';

delete from public.materials where code like 'ext_mat_%' or code like 'mock_mat_%';
delete from public.categories where code like 'ext_cat_%' or code like 'mock_cat_%';
delete from public.thicknesses where code like 'ext_thick_%' or code like 'mock_thick_%';
delete from public.size_labels where code like 'ext_size_%' or code like 'mock_size_%';

-- 4. 用户档案与 Auth（demo + 所有已注册测试账号）
delete from public.profiles;
delete from auth.identities;
delete from auth.users;

-- 5. Storage 衣柜图片
delete from storage.objects where bucket_id = 'clothing-images';

commit;

-- 验证
select 'profiles' as tbl, count(*)::text as cnt from public.profiles
union all select 'babies', count(*)::text from public.babies
union all select 'clothing_items', count(*)::text from public.clothing_items
union all select 'outfit_recommendations', count(*)::text from public.outfit_recommendations
union all select 'weather_cache', count(*)::text from public.weather_cache
union all select 'product_catalog', count(*)::text from public.product_catalog
union all select 'url_parse_jobs', count(*)::text from public.url_parse_jobs
union all select 'auth.users', count(*)::text from auth.users;
