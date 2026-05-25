-- Add new columns to base_products for 3D visualizer and custom placements
ALTER TABLE base_products 
ADD COLUMN IF NOT EXISTS back_image_url TEXT,
ADD COLUMN IF NOT EXISTS texture_map_url TEXT,
ADD COLUMN IF NOT EXISTS color_images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS placements JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
