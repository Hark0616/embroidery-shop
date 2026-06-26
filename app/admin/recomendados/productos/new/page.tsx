'use server'

import { createClient } from '@/lib/supabase/server'
import { createReadyProduct } from '@/lib/actions/ready-products'
import type { BaseProduct, EmbroideryDesign, ProductDrop } from '@/lib/types/database'

export default async function NewReadyProductPage() {
  const supabase = await createClient()

  const [{ data: drops }, { data: baseProducts }, { data: designs }] = await Promise.all([
    supabase ? supabase.from('product_drops').select('*').order('sort_order').order('name') : { data: [] },
    supabase ? supabase.from('base_products').select('*').order('name') : { data: [] },
    supabase ? supabase.from('embroidery_designs').select('*').order('name') : { data: [] },
  ])

  const dropRows = (drops || []) as ProductDrop[]
  const baseProductRows = (baseProducts || []) as BaseProduct[]
  const designRows = (designs || []) as EmbroideryDesign[]

  return (
    <div className="p-8 bg-industrial-light min-h-screen">
      <div className="max-w-3xl mx-auto bg-white border border-industrial-gray/20 shadow-sm p-8">
        <h1 className="font-heading font-black text-2xl uppercase tracking-tighter text-industrial-black mb-2">
          Producto Armado
        </h1>
        <p className="font-mono text-xs text-industrial-gray uppercase tracking-widest mb-8">
          Oferta vendible con fotos finales. No depende del Studio publico.
        </p>

        <form action={createReadyProduct} className="space-y-8">
          <section className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                  Nombre
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
                  placeholder="Ej: Hoodie Guerrero Anime Negro"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                  Slug
                </label>
                <input
                  name="slug"
                  type="text"
                  className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
                  placeholder="hoodie-guerrero-anime-negro"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                  Drop / categoria
                </label>
                <select
                  name="drop_id"
                  className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
                >
                  <option value="">Sin drop</option>
                  {dropRows.map(drop => (
                    <option key={drop.id} value={drop.id}>{drop.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                  Prenda interna opcional
                </label>
                <select
                  name="base_product_id"
                  className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
                >
                  <option value="">Sin vincular</option>
                  {baseProductRows.map(product => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                  Diseno interno opcional
                </label>
                <select
                  name="design_id"
                  className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
                >
                  <option value="">Sin vincular</option>
                  {designRows.map(design => (
                    <option key={design.id} value={design.id}>{design.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                Descripcion corta
              </label>
              <input
                name="short_description"
                type="text"
                className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
                placeholder="Hoodie bordado bajo pedido con arte original estilo anime."
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                Descripcion larga
              </label>
              <textarea
                name="description"
                rows={4}
                className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
                placeholder="Detalles de la prenda, bordado, cuidado y produccion."
              />
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                Precio final
              </label>
              <input
                name="price"
                type="number"
                required
                min="1"
                step="1"
                className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
                placeholder="135000"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                Precio antes opcional
              </label>
              <input
                name="compare_at_price"
                type="number"
                min="0"
                step="1"
                className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
                placeholder="150000"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                Color principal
              </label>
              <input
                name="primary_color"
                type="text"
                className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
                placeholder="Negro"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                Colores disponibles
              </label>
              <input
                name="available_colors"
                type="text"
                className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
                placeholder="Negro, Crema, Blanco"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                Tallas disponibles
              </label>
              <input
                name="available_sizes"
                type="text"
                required
                className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
                placeholder="S, M, L, XL"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                SKU / codigo interno
              </label>
              <input
                name="sku"
                type="text"
                className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
                placeholder="TXR-HOD-001"
              />
            </div>
          </section>

          <section className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                Foto principal final
              </label>
              <input
                name="hero_image"
                type="file"
                accept="image/*"
                required
                className="w-full text-sm font-mono text-industrial-gray file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-industrial-black file:text-white hover:file:bg-industrial-gray"
              />
              <p className="text-[10px] text-gray-500 mt-1">Esta es la imagen que vera el cliente y el anuncio.</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                Galeria de fotos finales
              </label>
              <input
                name="gallery_images"
                type="file"
                accept="image/*"
                multiple
                className="w-full text-sm font-mono text-industrial-gray file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-industrial-black file:text-white hover:file:bg-industrial-gray"
              />
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                Estado
              </label>
              <select
                name="status"
                defaultValue="draft"
                className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
                <option value="hidden">Oculto por link</option>
                <option value="sold_out">Agotado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                Orden
              </label>
              <input
                name="sort_order"
                type="number"
                defaultValue="0"
                className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                Tags para ads
              </label>
              <input
                name="tags"
                type="text"
                className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
                placeholder="anime, hoodie, negro"
              />
            </div>
          </section>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="is_featured"
              className="w-4 h-4 text-industrial-black focus:ring-industrial-warning border-gray-300 rounded"
            />
            <span className="text-xs font-bold uppercase tracking-widest text-industrial-black">
              Mostrar como recomendado en Home
            </span>
          </label>

          <div className="pt-6 flex gap-4">
            <a
              href="/admin/recomendados"
              className="px-6 py-3 border border-industrial-gray text-industrial-black text-xs font-bold uppercase tracking-widest hover:bg-gray-50 text-center"
            >
              Cancelar
            </a>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-industrial-black text-white text-xs font-bold uppercase tracking-widest hover:bg-industrial-gray transition-colors"
            >
              Crear Producto Armado
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
