-- ============================================================
-- Baby profile: warmth_preference enum on preferences table
-- Run after 20240101000007_product_catalog.sql
-- ============================================================

alter table public.baby_warmth_preferences
  add column if not exists warmth_preference text not null default 'neutral'
    check (warmth_preference in (
      'runs_cold',
      'slightly_cold',
      'neutral',
      'slightly_hot',
      'runs_hot'
    ));

comment on column public.baby_warmth_preferences.warmth_preference is
  '温度偏好：runs_cold=怕冷, slightly_cold=偏怕冷, neutral=正常, slightly_hot=偏怕热, runs_hot=怕热';

-- 从既有 warmth_offset 回填
update public.baby_warmth_preferences
set warmth_preference = case
  when warmth_offset >= 6 then 'runs_cold'
  when warmth_offset >= 2 then 'slightly_cold'
  when warmth_offset <= -6 then 'runs_hot'
  when warmth_offset <= -2 then 'slightly_hot'
  else 'neutral'
end
where warmth_preference = 'neutral' and warmth_offset is distinct from 0;

create or replace function public.sync_warmth_offset_from_preference()
returns trigger
language plpgsql
as $$
begin
  new.warmth_offset := case new.warmth_preference
    when 'runs_cold' then 8
    when 'slightly_cold' then 4
    when 'neutral' then 0
    when 'slightly_hot' then -4
    when 'runs_hot' then -8
    else 0
  end;
  return new;
end;
$$;

drop trigger if exists baby_warmth_preferences_sync_offset on public.baby_warmth_preferences;

create trigger baby_warmth_preferences_sync_offset
  before insert or update of warmth_preference
  on public.baby_warmth_preferences
  for each row execute function public.sync_warmth_offset_from_preference();

-- 触发一次同步，保证 offset 与 preference 一致
update public.baby_warmth_preferences
set warmth_preference = warmth_preference;
