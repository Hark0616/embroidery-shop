-- =============================================
-- SCHEMA DE BASE DE DATOS TEXERE
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  affiliate_link TEXT NOT NULL,
  brand VARCHAR(50) NOT NULL CHECK (brand IN ('Natura', 'NovaVenta')),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- DATOS INICIALES
-- =============================================

-- Insertar categorías de ejemplo
INSERT INTO categories (name, slug, order_index) VALUES
  ('Perfumes', 'perfumes', 1),
  ('Cuidados diarios', 'cuidados-diarios', 2),
  ('Cabello', 'cabello', 3),
  ('Rostro', 'rostro', 4),
  ('Maquillaje', 'maquillaje', 5),
  ('Hogar', 'hogar', 6),
  ('Cocina', 'cocina', 7)
ON CONFLICT (slug) DO NOTHING;

-- Insertar subcategorías de Perfumes
INSERT INTO categories (name, slug, parent_id, order_index)
SELECT 'Masculino', 'perfumes-masculino', id, 1 FROM categories WHERE slug = 'perfumes'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, parent_id, order_index)
SELECT 'Femenino', 'perfumes-femenino', id, 2 FROM categories WHERE slug = 'perfumes'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, parent_id, order_index)
SELECT 'Niños', 'perfumes-ninos', id, 3 FROM categories WHERE slug = 'perfumes'
ON CONFLICT (slug) DO NOTHING;

-- =============================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- =============================================

-- Habilitar RLS en las tablas
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede leer categorías
CREATE POLICY "Categorías públicas para lectura"
  ON categories FOR SELECT
  USING (true);

-- Política: Solo usuarios autenticados pueden modificar categorías
CREATE POLICY "Solo autenticados modifican categorías"
  ON categories FOR ALL
  USING (auth.role() = 'authenticated');

-- Política: Cualquiera puede leer productos activos
CREATE POLICY "Productos activos públicos"
  ON products FOR SELECT
  USING (is_active = true OR auth.role() = 'authenticated');

-- Política: Solo usuarios autenticados pueden modificar productos
CREATE POLICY "Solo autenticados modifican productos"
  ON products FOR ALL
  USING (auth.role() = 'authenticated');

-- =============================================
-- STORAGE BUCKET PARA IMÁGENES
-- =============================================
-- Ejecutar en la sección de Storage o con la API:
-- 1. Crear bucket llamado "product-images"
-- 2. Hacer el bucket público para lectura
-- 3. Permitir uploads solo a usuarios autenticados

