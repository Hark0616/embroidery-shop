-- =============================================
-- TEXERE.ART CURRENT SCHEMA
-- Bordados, prendas base, mockups, drops y productos armados.
-- =============================================

create extension if not exists pgcrypto;

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  user_id uuid,
  action text not null,
  resource text not null,
  details jsonb,
  ip_address text
);

create table if not exists config_global (
  key text primary key,
  value text not null,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

insert into config_global (key, value)
values ('delivery_time_message', '15 DÍAS HÁBILES')
on conflict (key) do nothing;

create table if not exists base_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  product_type text default 'apparel',
  base_price numeric(10, 2) not null,
  image_url text not null,
  colors text[] default '{}',
  sizes text[] default '{}',
  stock_status text default 'available',
  description text,
  back_image_url text,
  texture_map_url text,
  color_images jsonb default '{}'::jsonb,
  placements jsonb default '{}'::jsonb,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists embroidery_designs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_modifier numeric(10, 2) not null default 0,
  image_url text not null,
  category text not null,
  dimensions text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists garment_mockups (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references base_products(id) on delete cascade,
  name text not null,
  slug text not null,
  view text not null default 'front' check (view in ('front', 'back', 'side', 'detail')),
  color_name text,
  image_url text not null,
  shadow_map_url text,
  variants jsonb not null default '[]'::jsonb,
  status text not null default 'needs_calibration'
    check (status in ('draft', 'needs_calibration', 'calibrated', 'published')),
  is_public boolean not null default false,
  surfaces jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(product_id, slug)
);

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

create index if not exists idx_base_products_slug on base_products(slug);
create index if not exists idx_embroidery_category on embroidery_designs(category);
create index if not exists idx_garment_mockups_product on garment_mockups(product_id);
create index if not exists idx_garment_mockups_public on garment_mockups(is_public, status);
create index if not exists idx_garment_mockups_slug on garment_mockups(product_id, slug);
create index if not exists idx_product_drops_slug on product_drops(slug);
create index if not exists idx_product_drops_status_order on product_drops(status, sort_order);
create index if not exists idx_ready_products_slug on ready_products(slug);
create index if not exists idx_ready_products_drop on ready_products(drop_id);
create index if not exists idx_ready_products_status_featured on ready_products(status, is_featured, sort_order);

alter table audit_logs enable row level security;
alter table config_global enable row level security;
alter table base_products enable row level security;
alter table embroidery_designs enable row level security;
alter table garment_mockups enable row level security;
alter table product_drops enable row level security;
alter table ready_products enable row level security;

drop policy if exists "Public Read Config" on config_global;
create policy "Public Read Config"
  on config_global for select
  using (true);

drop policy if exists "Admin All Access Config" on config_global;
create policy "Admin All Access Config"
  on config_global for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Public Read Base Products" on base_products;
create policy "Public Read Base Products"
  on base_products for select
  using (is_active = true);

drop policy if exists "Admin All Access Base Products" on base_products;
create policy "Admin All Access Base Products"
  on base_products for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Public Read Designs" on embroidery_designs;
create policy "Public Read Designs"
  on embroidery_designs for select
  using (is_active = true);

drop policy if exists "Admin All Access Designs" on embroidery_designs;
create policy "Admin All Access Designs"
  on embroidery_designs for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Public read published garment mockups" on garment_mockups;
create policy "Public read published garment mockups"
  on garment_mockups for select
  using (is_public = true and status = 'published');

drop policy if exists "Admins manage garment mockups" on garment_mockups;
create policy "Admins manage garment mockups"
  on garment_mockups for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

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

drop trigger if exists update_config_updated_at on config_global;
create trigger update_config_updated_at
  before update on config_global
  for each row
  execute function update_updated_at_column();

drop trigger if exists update_base_products_updated_at on base_products;
create trigger update_base_products_updated_at
  before update on base_products
  for each row
  execute function update_updated_at_column();

drop trigger if exists update_garment_mockups_updated_at on garment_mockups;
create trigger update_garment_mockups_updated_at
  before update on garment_mockups
  for each row
  execute function update_updated_at_column();

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
