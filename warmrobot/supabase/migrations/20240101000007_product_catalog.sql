-- ============================================================
-- External product catalog (Taobao / Tmall reference data)
-- Run after 006_stitch_ui_fields.sql
-- ============================================================

create table if not exists public.product_catalog (
  id                uuid primary key default gen_random_uuid(),

  -- Platform identifiers
  platform          text not null check (platform in ('taobao', 'tmall', 'unknown')),
  item_id           text not null,
  sku_id            text not null default '',
  source_url        text not null,
  canonical_url     text,

  -- Core product info
  title             text not null,
  short_desc        text,
  brand             text,
  brand_id          text,
  category_id       text,
  root_category_id  text,

  -- Pricing
  price             numeric(12, 2),
  promotion_price   numeric(12, 2),
  original_price    numeric(12, 2),
  price_text        text,

  -- Media
  pic_url           text,
  item_imgs         jsonb default '[]',
  desc_img          jsonb default '[]',
  video             jsonb,

  -- Inventory & sales
  stock_num         integer,
  min_num           integer,
  total_sold        text,

  -- Shop / seller
  shop_id           text,
  shop_name         text,
  seller_id         text,
  seller_nick       text,
  shop_type         text,
  is_tmall          boolean,

  -- Attributes & SKUs
  props             jsonb default '[]',
  props_name        text,
  props_list        jsonb default '{}',
  property_alias    text,
  skus              jsonb default '[]',

  -- Shipping & location
  location          text,
  post_fee          numeric(10, 2),
  express_fee       numeric(10, 2),

  -- Inferred clothing fields (for future wardrobe matching)
  inferred_category text,
  inferred_thickness text,
  inferred_size_label text,
  material_hint     text,

  -- Full API payload for future use
  raw_payload       jsonb not null default '{}',

  fetched_at        timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint product_catalog_item_id_not_empty check (char_length(trim(item_id)) > 0),
  constraint product_catalog_title_not_empty check (char_length(trim(title)) > 0),
  constraint product_catalog_source_url_not_empty check (char_length(trim(source_url)) > 0)
);

comment on table public.product_catalog is '外部商品目录（淘宝/天猫），供推荐与比价等未来功能使用';
comment on column public.product_catalog.raw_payload is 'OneBound item_get 完整原始响应';

create unique index if not exists product_catalog_item_sku_unique
  on public.product_catalog (item_id, sku_id);

create index if not exists product_catalog_platform_idx
  on public.product_catalog (platform);

create index if not exists product_catalog_fetched_at_idx
  on public.product_catalog (fetched_at desc);

create trigger product_catalog_updated_at
  before update on public.product_catalog
  for each row execute function public.set_updated_at();

-- Reference data: readable by all, writable via service role or upsert RPC
alter table public.product_catalog enable row level security;

create policy "product_catalog_select_all"
  on public.product_catalog for select
  using (true);

-- SECURITY DEFINER upsert so batch import can run without service role
create or replace function public.upsert_product_catalog(p_row jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.product_catalog (
    platform,
    item_id,
    sku_id,
    source_url,
    canonical_url,
    title,
    short_desc,
    brand,
    brand_id,
    category_id,
    root_category_id,
    price,
    promotion_price,
    original_price,
    price_text,
    pic_url,
    item_imgs,
    desc_img,
    video,
    stock_num,
    min_num,
    total_sold,
    shop_id,
    shop_name,
    seller_id,
    seller_nick,
    shop_type,
    is_tmall,
    props,
    props_name,
    props_list,
    property_alias,
    skus,
    location,
    post_fee,
    express_fee,
    inferred_category,
    inferred_thickness,
    inferred_size_label,
    material_hint,
    raw_payload,
    fetched_at
  )
  values (
    coalesce(p_row->>'platform', 'unknown'),
    p_row->>'item_id',
    coalesce(nullif(p_row->>'sku_id', ''), ''),
    p_row->>'source_url',
    nullif(p_row->>'canonical_url', ''),
    p_row->>'title',
    nullif(p_row->>'short_desc', ''),
    nullif(p_row->>'brand', ''),
    nullif(p_row->>'brand_id', ''),
    nullif(p_row->>'category_id', ''),
    nullif(p_row->>'root_category_id', ''),
    nullif(p_row->>'price', '')::numeric,
    nullif(p_row->>'promotion_price', '')::numeric,
    nullif(p_row->>'original_price', '')::numeric,
    nullif(p_row->>'price_text', ''),
    nullif(p_row->>'pic_url', ''),
    coalesce(p_row->'item_imgs', '[]'::jsonb),
    coalesce(p_row->'desc_img', '[]'::jsonb),
    p_row->'video',
    nullif(p_row->>'stock_num', '')::integer,
    nullif(p_row->>'min_num', '')::integer,
    nullif(p_row->>'total_sold', ''),
    nullif(p_row->>'shop_id', ''),
    nullif(p_row->>'shop_name', ''),
    nullif(p_row->>'seller_id', ''),
    nullif(p_row->>'seller_nick', ''),
    nullif(p_row->>'shop_type', ''),
    (p_row->>'is_tmall')::boolean,
    coalesce(p_row->'props', '[]'::jsonb),
    nullif(p_row->>'props_name', ''),
    coalesce(p_row->'props_list', '{}'::jsonb),
    nullif(p_row->>'property_alias', ''),
    coalesce(p_row->'skus', '[]'::jsonb),
    nullif(p_row->>'location', ''),
    nullif(p_row->>'post_fee', '')::numeric,
    nullif(p_row->>'express_fee', '')::numeric,
    nullif(p_row->>'inferred_category', ''),
    nullif(p_row->>'inferred_thickness', ''),
    nullif(p_row->>'inferred_size_label', ''),
    nullif(p_row->>'material_hint', ''),
    coalesce(p_row->'raw_payload', '{}'::jsonb),
    coalesce((p_row->>'fetched_at')::timestamptz, now())
  )
  on conflict (item_id, sku_id)
  do update set
    platform = excluded.platform,
    source_url = excluded.source_url,
    canonical_url = excluded.canonical_url,
    title = excluded.title,
    short_desc = excluded.short_desc,
    brand = excluded.brand,
    brand_id = excluded.brand_id,
    category_id = excluded.category_id,
    root_category_id = excluded.root_category_id,
    price = excluded.price,
    promotion_price = excluded.promotion_price,
    original_price = excluded.original_price,
    price_text = excluded.price_text,
    pic_url = excluded.pic_url,
    item_imgs = excluded.item_imgs,
    desc_img = excluded.desc_img,
    video = excluded.video,
    stock_num = excluded.stock_num,
    min_num = excluded.min_num,
    total_sold = excluded.total_sold,
    shop_id = excluded.shop_id,
    shop_name = excluded.shop_name,
    seller_id = excluded.seller_id,
    seller_nick = excluded.seller_nick,
    shop_type = excluded.shop_type,
    is_tmall = excluded.is_tmall,
    props = excluded.props,
    props_name = excluded.props_name,
    props_list = excluded.props_list,
    property_alias = excluded.property_alias,
    skus = excluded.skus,
    location = excluded.location,
    post_fee = excluded.post_fee,
    express_fee = excluded.express_fee,
    inferred_category = excluded.inferred_category,
    inferred_thickness = excluded.inferred_thickness,
    inferred_size_label = excluded.inferred_size_label,
    material_hint = excluded.material_hint,
    raw_payload = excluded.raw_payload,
    fetched_at = excluded.fetched_at,
    updated_at = now()
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function public.upsert_product_catalog(jsonb) to anon, authenticated, service_role;
