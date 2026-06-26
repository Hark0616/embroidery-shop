// Tipos de la base de datos Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          id: string
          created_at: string
          user_id: string | null
          action: string
          resource: string
          details: Json | null
          ip_address: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id?: string | null
          action: string
          resource: string
          details?: Json | null
          ip_address?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string | null
          action?: string
          resource?: string
          details?: Json | null
          ip_address?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          parent_id: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          parent_id?: string | null
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          parent_id?: string | null
          order_index?: number
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          image_url: string | null
          affiliate_link: string
          brand: 'Natura' | 'NovaVenta'
          category_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          image_url?: string | null
          affiliate_link: string
          brand: 'Natura' | 'NovaVenta'
          category_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          affiliate_link?: string
          brand?: 'Natura' | 'NovaVenta'
          category_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      product_drops: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          status: 'draft' | 'published' | 'hidden'
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          status?: 'draft' | 'published' | 'hidden'
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          status?: 'draft' | 'published' | 'hidden'
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      ready_products: {
        Row: {
          id: string
          drop_id: string | null
          base_product_id: string | null
          design_id: string | null
          name: string
          slug: string
          sku: string | null
          short_description: string | null
          description: string | null
          status: 'draft' | 'published' | 'hidden' | 'sold_out'
          primary_color: string | null
          available_colors: string[]
          available_sizes: string[]
          price: number
          compare_at_price: number | null
          hero_image_url: string
          gallery_image_urls: string[]
          tags: string[]
          is_featured: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          drop_id?: string | null
          base_product_id?: string | null
          design_id?: string | null
          name: string
          slug: string
          sku?: string | null
          short_description?: string | null
          description?: string | null
          status?: 'draft' | 'published' | 'hidden' | 'sold_out'
          primary_color?: string | null
          available_colors?: string[]
          available_sizes?: string[]
          price: number
          compare_at_price?: number | null
          hero_image_url: string
          gallery_image_urls?: string[]
          tags?: string[]
          is_featured?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          drop_id?: string | null
          base_product_id?: string | null
          design_id?: string | null
          name?: string
          slug?: string
          sku?: string | null
          short_description?: string | null
          description?: string | null
          status?: 'draft' | 'published' | 'hidden' | 'sold_out'
          primary_color?: string | null
          available_colors?: string[]
          available_sizes?: string[]
          price?: number
          compare_at_price?: number | null
          hero_image_url?: string
          gallery_image_urls?: string[]
          tags?: string[]
          is_featured?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      base_products: {
        Row: {
          id: string
          name: string
          slug: string
          product_type: string | null
          base_price: number
          colors: string[]
          sizes: string[]
          stock_status: string
          image_url: string
          back_image_url: string | null
          texture_map_url: string | null
          color_images: Json | null
          placements: Json | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          product_type?: string | null
          base_price: number
          colors: string[]
          sizes: string[]
          stock_status: string
          image_url: string
          back_image_url?: string | null
          texture_map_url?: string | null
          color_images?: Json | null
          placements?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          product_type?: string | null
          base_price?: number
          colors?: string[]
          sizes?: string[]
          stock_status?: string
          image_url?: string
          back_image_url?: string | null
          texture_map_url?: string | null
          color_images?: Json | null
          placements?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      garment_mockups: {
        Row: {
          id: string
          product_id: string
          name: string
          slug: string
          view: 'front' | 'back' | 'side' | 'detail'
          color_name: string | null
          image_url: string
          shadow_map_url: string | null
          variants: Json
          status: 'draft' | 'needs_calibration' | 'calibrated' | 'published'
          is_public: boolean
          surfaces: Json
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          name: string
          slug: string
          view?: 'front' | 'back' | 'side' | 'detail'
          color_name?: string | null
          image_url: string
          shadow_map_url?: string | null
          variants?: Json
          status?: 'draft' | 'needs_calibration' | 'calibrated' | 'published'
          is_public?: boolean
          surfaces?: Json
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          name?: string
          slug?: string
          view?: 'front' | 'back' | 'side' | 'detail'
          color_name?: string | null
          image_url?: string
          shadow_map_url?: string | null
          variants?: Json
          status?: 'draft' | 'needs_calibration' | 'calibrated' | 'published'
          is_public?: boolean
          surfaces?: Json
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      embroidery_designs: {
        Row: {
          id: string
          name: string
          category: string
          price_modifier: number
          dimensions: string
          image_url: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          price_modifier: number
          dimensions: string
          image_url: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          price_modifier?: number
          dimensions?: string
          image_url?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      config_global: {
        Row: {
          key: string
          value: string
          created_at: string
          updated_at: string
        }
        Insert: {
          key: string
          value: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          key?: string
          value?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Tipos de conveniencia
export type Category = Database['public']['Tables']['categories']['Row']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']

export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

export type ProductDrop = Database['public']['Tables']['product_drops']['Row']
export type ReadyProduct = Database['public']['Tables']['ready_products']['Row']
export type BaseProduct = Database['public']['Tables']['base_products']['Row']
export type EmbroideryDesign = Database['public']['Tables']['embroidery_designs']['Row']
export type GarmentMockup = Database['public']['Tables']['garment_mockups']['Row']

export type MockupVariant = {
  id: string
  colorName: string | null
  imageUrl: string
  shadowMapUrl?: string | null
  isPrimary?: boolean
}

export type CalibrationPoint = {
  x: number
  y: number
}

/** Legacy 4-corner quad format (backwards compatibility) */
export type QuadPoints = {
  topLeft: CalibrationPoint
  topRight: CalibrationPoint
  bottomRight: CalibrationPoint
  bottomLeft: CalibrationPoint
}

export type CalibrationSurface = {
  id: string
  label: string
  type: 'quad' | 'mesh'
  view: 'front' | 'back' | 'side' | 'detail'
  size: 'small' | 'medium' | 'large'

  /** Legacy quad points — used when type === 'quad' */
  points?: QuadPoints

  /** Mesh grid size — e.g. 5 means a 5×5 grid of control points */
  gridSize?: number
  /** Flat array of mesh points in row-major order (length = gridSize × gridSize) */
  meshPoints?: CalibrationPoint[]
  /** Indices of points manually pinned by the user (won't auto-interpolate) */
  pinnedPoints?: number[]

  opacity?: number
  shadowOpacity?: number
  blendMode?: 'normal' | 'multiply' | 'overlay'
}
