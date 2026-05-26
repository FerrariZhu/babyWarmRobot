-- ============================================================
-- Storage bucket for clothing images
-- Run after 001_initial_schema.sql
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'clothing-images',
  'clothing-images',
  true,
  5242880,  -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- 用户只能上传/管理自己文件夹下的图片
-- 路径约定: {user_id}/{item_id}.jpg

create policy "clothing_images_select"
  on storage.objects for select
  using (bucket_id = 'clothing-images');

create policy "clothing_images_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'clothing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "clothing_images_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'clothing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "clothing_images_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'clothing-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
