-- =============================================
-- MIGRATION: GARMENT MOCKUPS AND CALIBRATED SURFACES
-- Description: Adds private/public mockups per garment with calibration data.
-- =============================================

alter table base_products
add column if not exists product_type text default 'apparel';

create table if not exists garment_mockups (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references base_products(id) on delete cascade,
  name text not null,
  slug text not null,
  view text not null default 'front' check (view in ('front', 'back', 'side', 'detail')),
  color_name text,
  image_url text not null,
  shadow_map_url text,
  status text not null default 'needs_calibration'
    check (status in ('draft', 'needs_calibration', 'calibrated', 'published')),
  is_public boolean not null default false,
  surfaces jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(product_id, slug)
);

alter table garment_mockups enable row level security;

create policy "Public read published garment mockups"
  on garment_mockups for select
  using (is_public = true and status = 'published');

create policy "Authenticated read garment mockups"
  on garment_mockups for select
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins manage garment mockups"
  on garment_mockups for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create index if not exists idx_garment_mockups_product on garment_mockups(product_id);
create index if not exists idx_garment_mockups_public on garment_mockups(is_public, status);
create index if not exists idx_garment_mockups_slug on garment_mockups(product_id, slug);

drop trigger if exists update_garment_mockups_updated_at on garment_mockups;
create trigger update_garment_mockups_updated_at
  before update on garment_mockups
  for each row
  execute function update_updated_at_column();
