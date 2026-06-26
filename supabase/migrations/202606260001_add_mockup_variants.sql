-- =============================================
-- MIGRATION: MOCKUP COLOR VARIANTS
-- Description: Stores multiple color images under one calibrated mockup.
-- =============================================

alter table garment_mockups
add column if not exists variants jsonb not null default '[]'::jsonb;

update garment_mockups
set variants = jsonb_build_array(
  jsonb_build_object(
    'id', coalesce(nullif(color_name, ''), 'default'),
    'colorName', color_name,
    'imageUrl', image_url,
    'shadowMapUrl', shadow_map_url,
    'isPrimary', true
  )
)
where variants = '[]'::jsonb
  and image_url is not null;
