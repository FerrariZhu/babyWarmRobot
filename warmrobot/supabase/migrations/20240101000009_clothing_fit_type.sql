-- ============================================================
-- Clothing fit type (版型)
-- Run after 20240101000008_baby_profile_fields.sql
-- ============================================================

alter table public.clothing_items
  add column if not exists fit_type text not null default 'regular'
    check (fit_type in ('slim', 'regular', 'loose'));

comment on column public.clothing_items.fit_type is '版型：slim=修身, regular=标准, loose=宽松';
