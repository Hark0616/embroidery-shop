-- =============================================
-- MIGRATION: INIT EMBROIDERY SCHEMA
-- Description: Sets up tables for the Made-to-Order Embroidery E-commerce
-- Tables: config_global, base_products, embroidery_designs
-- =============================================

-- 1. CONFIG GLOBAL (Lead Times & Global Settings)
CREATE TABLE IF NOT EXISTS config_global (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initial Data for config_global
INSERT INTO config_global (key, value) VALUES
('lead_time_message', 'Fabricación bajo pedido: 15 días hábiles')
ON CONFLICT (key) DO NOTHING;

-- 2. BASE PRODUCTS (Garments)
CREATE TABLE IF NOT EXISTS base_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- Added slug for URL routing
  base_price NUMERIC(10, 2) NOT NULL,
  image_url TEXT NOT NULL, -- Main image (e.g., front of hoodie)
  colors TEXT[] DEFAULT '{}', -- Array of color codes/names e.g. ['#000000', '#FFFFFF']
  sizes TEXT[] DEFAULT '{}', -- Array of sizes e.g. ['S', 'M', 'L', 'XL']
  stock_status TEXT DEFAULT 'available', -- 'available', 'out_of_stock', 'pre_order'
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. EMBROIDERY DESIGNS
CREATE TABLE IF NOT EXISTS embroidery_designs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price_modifier NUMERIC(10, 2) NOT NULL DEFAULT 0,
  image_url TEXT NOT NULL, -- Transparent PNG
  category TEXT NOT NULL, -- 'Anime', 'Minimalist', etc.
  dimensions TEXT, -- '10x10cm'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SECURITY (Row Level Security - RLS)
-- =============================================

-- Enable RLS
ALTER TABLE config_global ENABLE ROW LEVEL SECURITY;
ALTER TABLE base_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE embroidery_designs ENABLE ROW LEVEL SECURITY;

-- Policies for config_global
CREATE POLICY "Public Read Config"
  ON config_global FOR SELECT
  USING (true);

CREATE POLICY "Admin All Access Config"
  ON config_global FOR ALL
  USING (auth.role() = 'authenticated'); -- Assuming authenticated users are admins for this project

-- Policies for base_products
CREATE POLICY "Public Read Base Products"
  ON base_products FOR SELECT
  USING (true);

CREATE POLICY "Admin All Access Base Products"
  ON base_products FOR ALL
  USING (auth.role() = 'authenticated');

-- Policies for embroidery_designs
CREATE POLICY "Public Read Designs"
  ON embroidery_designs FOR SELECT
  USING (true);

CREATE POLICY "Admin All Access Designs"
  ON embroidery_designs FOR ALL
  USING (auth.role() = 'authenticated');

-- =============================================
-- INDEXES & TRIGGERS
-- =============================================

-- Indexes
CREATE INDEX IF NOT EXISTS idx_base_products_slug ON base_products(slug);
CREATE INDEX IF NOT EXISTS idx_embroidery_category ON embroidery_designs(category);

-- Updated_at Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_config_updated_at
  BEFORE UPDATE ON config_global
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_base_products_updated_at
  BEFORE UPDATE ON base_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
