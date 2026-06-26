import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateReadyProduct } from '@/lib/actions/ready-products'
import type { BaseProduct, EmbroideryDesign, ProductDrop, ReadyProduct } from '@/lib/types/database'

export default async function EditReadyProductPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  if (!supabase) notFound()

  const [{ data: product }, { data: drops }, { data: baseProducts }, { data: designs }] = await Promise.all([
    supabase.from('ready_products').select('*').eq('id', params.id).single(),
    supabase.from('product_drops').select('*').order('sort_order').order('name'),
    supabase.from('base_products').select('*').order('name'),
    supabase.from('embroidery_designs').select('*').order('name'),
  ])

  if (!product) notFound()

  const readyProduct = product as ReadyProduct
  const dropRows = (drops || []) as ProductDrop[]
  const baseProductRows = (baseProducts || []) as BaseProduct[]
  const designRows = (designs || []) as EmbroideryDesign[]

  return (
    <div className="p-8 bg-industrial-light min-h-screen">
      <div className="max-w-3xl mx-auto bg-white border border-industrial-gray/20 shadow-sm p-8">
        <div className="mb-8">
          <Link href="/admin/recomendados" className="font-mono text-xs text-industrial-gray uppercase tracking-widest hover:text-industrial-black">
            ← Volver a drops listos
          </Link>
          <h1 className="font-heading font-black text-2xl uppercase tracking-tighter text-industrial-black mt-4 mb-2">
            Editar producto listo
          </h1>
          <p className="font-mono text-xs text-industrial-gray uppercase tracking-widest">
            Oferta vendible con fotos finales. Impacta home, shop y detalle de compra.
          </p>
        </div>

        <form action={updateReadyProduct} className="space-y-8">
          <input type="hidden" name="product_id" value={readyProduct.id} />

          <section className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                  Nombre
                </label>
                <input name="name" type="text" required defaultValue={readyProduct.name} className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                  Slug
                </label>
                <input name="slug" type="text" defaultValue={readyProduct.slug} className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                  Drop
                </label>
                <select name="drop_id" defaultValue={readyProduct.drop_id || ''} className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none">
                  <option value="">Sin drop</option>
                  {dropRows.map(drop => <option key={drop.id} value={drop.id}>{drop.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                  Prenda interna
                </label>
                <select name="base_product_id" defaultValue={readyProduct.base_product_id || ''} className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none">
                  <option value="">Sin vincular</option>
                  {baseProductRows.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                  Diseño interno
                </label>
                <select name="design_id" defaultValue={readyProduct.design_id || ''} className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none">
                  <option value="">Sin vincular</option>
                  {designRows.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                Descripción corta
              </label>
              <input name="short_description" type="text" defaultValue={readyProduct.short_description || ''} className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none" />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                Descripción larga
              </label>
              <textarea name="description" rows={4} defaultValue={readyProduct.description || ''} className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none" />
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                Precio final
              </label>
              <input name="price" type="number" required min="1" step="1" defaultValue={readyProduct.price} className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                Precio antes opcional
              </label>
              <input name="compare_at_price" type="number" min="0" step="1" defaultValue={readyProduct.compare_at_price || ''} className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                Color principal
              </label>
              <input name="primary_color" type="text" defaultValue={readyProduct.primary_color || ''} className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                Colores disponibles
              </label>
              <input name="available_colors" type="text" defaultValue={readyProduct.available_colors.join(', ')} className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                Tallas disponibles
              </label>
              <input name="available_sizes" type="text" required defaultValue={readyProduct.available_sizes.join(', ')} className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                SKU / código interno
              </label>
              <input name="sku" type="text" defaultValue={readyProduct.sku || ''} className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none" />
            </div>
          </section>

          <section className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                Cambiar foto principal final
              </label>
              <input name="hero_image" type="file" accept="image/*" className="w-full text-sm font-mono text-industrial-gray file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-industrial-black file:text-white hover:file:bg-industrial-gray" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                Reemplazar galería si subes fotos
              </label>
              <input name="gallery_images" type="file" accept="image/*" multiple className="w-full text-sm font-mono text-industrial-gray file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-industrial-black file:text-white hover:file:bg-industrial-gray" />
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                Estado
              </label>
              <select name="status" defaultValue={readyProduct.status} className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none">
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
              <input name="sort_order" type="number" defaultValue={readyProduct.sort_order} className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                Tags para ads
              </label>
              <input name="tags" type="text" defaultValue={readyProduct.tags.join(', ')} className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none" />
            </div>
          </section>

          <label className="flex items-center gap-3">
            <input type="checkbox" name="is_featured" defaultChecked={readyProduct.is_featured} className="w-4 h-4 text-industrial-black focus:ring-industrial-warning border-gray-300 rounded" />
            <span className="text-xs font-bold uppercase tracking-widest text-industrial-black">
              Mostrar como destacado en Home
            </span>
          </label>

          <div className="pt-6 flex gap-4">
            <Link href="/admin/recomendados" className="px-6 py-3 border border-industrial-gray text-industrial-black text-xs font-bold uppercase tracking-widest hover:bg-gray-50 text-center">
              Cancelar
            </Link>
            <button type="submit" className="flex-1 px-6 py-3 bg-industrial-black text-white text-xs font-bold uppercase tracking-widest hover:bg-industrial-gray transition-colors">
              Guardar producto listo
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
