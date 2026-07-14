-- migrate:no-transaction
-- ============================================================
-- Step 1/2: Add new clothing_category enum values
-- MUST be committed before running 20240101000011_clothing_category_hierarchy.sql
-- In Supabase SQL Editor: run this file alone, then run 011 separately.
-- ============================================================

alter type public.clothing_category add value if not exists 'bodysuit_short';
alter type public.clothing_category add value if not exists 'bodysuit_long';
alter type public.clothing_category add value if not exists 'footed_romper';
alter type public.clothing_category add value if not exists 'base_top';
alter type public.clothing_category add value if not exists 'sweater';
alter type public.clothing_category add value if not exists 'fleece_top';
alter type public.clothing_category add value if not exists 'vest';
alter type public.clothing_category add value if not exists 'pants_long';
alter type public.clothing_category add value if not exists 'pants_short';
alter type public.clothing_category add value if not exists 'pants_padded';
alter type public.clothing_category add value if not exists 'outer_shell';
alter type public.clothing_category add value if not exists 'outer_down';
alter type public.clothing_category add value if not exists 'outer_cotton';
alter type public.clothing_category add value if not exists 'outer_rain_uv';
alter type public.clothing_category add value if not exists 'sleep_sack';
alter type public.clothing_category add value if not exists 'pajamas';
