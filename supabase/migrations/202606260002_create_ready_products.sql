-- =============================================
-- MIGRATION: DROPS AND READY-TO-BUY PRODUCTS
-- Description: Adds curated drops/categories and final-photo products for ads.
-- =============================================

create table if not exists product_drops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  image_url text,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'hidden')),
  sort_order integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists ready_products (
  id uuid primary key default gen_random_uuid(),
  drop_id uuid references product_drops(id) on delete set null,
  base_product_id uuid references base_products(id) on delete set null,
  design_id uuid references embroidery_designs(id) on delete set null,
  name text not null,
  slug text unique not null,
  sku text,
  short_description text,
  description text,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'hidden', 'sold_out')),
  primary_color text,
  available_colors text[] not null default '{}',
  available_sizes text[] not null default '{}',
  price numeric(10, 2) not null,
  compare_at_price numeric(10, 2),
  hero_image_url text not null,
  gallery_image_urls text[] not null default '{}',
  tags text[] not null default '{}',
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table product_drops enable row level security;
alter table ready_products enable row level security;

drop policy if exists "Public read visible product drops" on product_drops;
create policy "Public read visible product drops"
  on product_drops for select
  using (status in ('published', 'hidden'));

drop policy if exists "Admins manage product drops" on product_drops;
create policy "Admins manage product drops"
  on product_drops for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Public read published ready products" on ready_products;
create policy "Public read published ready products"
  on ready_products for select
  using (status in ('published', 'hidden', 'sold_out'));

drop policy if exists "Admins manage ready products" on ready_products;
create policy "Admins manage ready products"
  on ready_products for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create index if not exists idx_product_drops_slug on product_drops(slug);
create index if not exists idx_product_drops_status_order on product_drops(status, sort_order);
create index if not exists idx_ready_products_slug on ready_products(slug);
create index if not exists idx_ready_products_drop on ready_products(drop_id);
create index if not exists idx_ready_products_status_featured on ready_products(status, is_featured, sort_order);

drop trigger if exists update_product_drops_updated_at on product_drops;
create trigger update_product_drops_updated_at
  before update on product_drops
  for each row
  execute function update_updated_at_column();

drop trigger if exists update_ready_products_updated_at on ready_products;
create trigger update_ready_products_updated_at
  before update on ready_products
  for each row
  execute function update_updated_at_column();
