-- ============================================================
-- Wardrobe scan jobs, wardrobe-scans storage, catalog embeddings
-- Run after 20240101000014_code_query_indexes.sql
-- ============================================================

create extension if not exists vector;

alter type public.item_source add value if not exists 'wardrobe_scan';

-- Storage bucket for wardrobe scan photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wardrobe-scans',
  'wardrobe-scans',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

create policy "wardrobe_scans_select"
  on storage.objects for select
  using (bucket_id = 'wardrobe-scans');

create policy "wardrobe_scans_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'wardrobe-scans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "wardrobe_scans_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'wardrobe-scans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "wardrobe_scans_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'wardrobe-scans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Wardrobe scan job log
create table if not exists public.wardrobe_scan_jobs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  scan_image_url  text,
  status          text not null default 'success' check (status in ('pending', 'success', 'failed')),
  item_count      integer not null default 0,
  result          jsonb not null default '{}',
  error_message   text,
  created_at      timestamptz not null default now(),
  completed_at    timestamptz
);

comment on table public.wardrobe_scan_jobs is '衣柜拍照批量识别任务日志';

create index if not exists wardrobe_scan_jobs_user_created_idx
  on public.wardrobe_scan_jobs (user_id, created_at desc);

alter table public.wardrobe_scan_jobs enable row level security;

create policy "wardrobe_scan_jobs_select_own"
  on public.wardrobe_scan_jobs for select using (auth.uid() = user_id);

create policy "wardrobe_scan_jobs_insert_own"
  on public.wardrobe_scan_jobs for insert with check (auth.uid() = user_id);

create policy "wardrobe_scan_jobs_update_own"
  on public.wardrobe_scan_jobs for update using (auth.uid() = user_id);

-- Catalog text embeddings for similar-SKU matching
alter table public.product_catalog
  add column if not exists embedding_text text,
  add column if not exists embedding vector(1536);

comment on column public.product_catalog.embedding_text is '用于生成 embedding 的拼接文本（title + 属性）';
comment on column public.product_catalog.embedding is 'OpenAI text-embedding-3-small 向量';

-- IVFFlat index created after embeddings are populated (see generate-catalog-embeddings.mjs)

-- Match catalog by cosine similarity (query embedding provided by API)
create or replace function public.match_catalog_by_embedding(
  p_embedding vector(1536),
  p_match_count integer default 3,
  p_min_similarity double precision default 0.72
)
returns table (
  id uuid,
  title text,
  pic_url text,
  inferred_category text,
  inferred_thickness text,
  material_hint text,
  similarity double precision
)
language sql
stable
security definer
set search_path = public
as $$
  select
    pc.id,
    pc.title,
    pc.pic_url,
    pc.inferred_category,
    pc.inferred_thickness,
    pc.material_hint,
    1 - (pc.embedding <=> p_embedding) as similarity
  from public.product_catalog pc
  where pc.embedding is not null
    and 1 - (pc.embedding <=> p_embedding) >= p_min_similarity
  order by pc.embedding <=> p_embedding
  limit greatest(1, least(p_match_count, 10));
$$;

grant execute on function public.match_catalog_by_embedding(vector, integer, double precision)
  to anon, authenticated, service_role;
