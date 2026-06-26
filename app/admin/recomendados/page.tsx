import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { ProductDrop, ReadyProduct } from '@/lib/types/database'

type ReadyProductWithDrop = ReadyProduct & {
  product_drops?: Pick<ProductDrop, 'name' | 'slug'> | null
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: 'Borrador',
    published: 'Publicado',
    hidden: 'Oculto',
    sold_out: 'Agotado',
  }
  return labels[status] || status
}

export default async function AdminRecommendedPage() {
  const supabase = await createClient()

  const [{ data: drops }, { data: products }] = await Promise.all([
    supabase
      ? supabase.from('product_drops').select('*').order('sort_order').order('created_at', { ascending: false })
      : { data: [] },
    supabase
      ? supabase
          .from('ready_products')
          .select('*, product_drops(name, slug)')
          .order('sort_order')
          .order('created_at', { ascending: false })
      : { data: [] },
  ])

  const dropRows = (drops || []) as ProductDrop[]
  const productRows = (products || []) as ReadyProductWithDrop[]

  return (
    <div className="p-8 bg-industrial-light min-h-screen">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-heading font-black text-3xl uppercase tracking-tighter text-industrial-black">
            Recomendados
          </h1>
          <p className="font-mono text-xs text-industrial-gray mt-2 uppercase tracking-widest">
            Drops y productos armados con fotos finales para venta directa.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/recomendados/drops/new"
            className="px-5 py-3 border border-industrial-black text-industrial-black text-xs font-bold uppercase tracking-widest hover:bg-white transition-colors"
          >
            + Nuevo Drop
          </Link>
          <Link
            href="/admin/recomendados/productos/new"
            className="px-5 py-3 bg-industrial-black text-white text-xs font-bold uppercase tracking-widest hover:bg-industrial-gray transition-colors"
          >
            + Producto Armado
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-1 xl:grid-cols-[0.8fr_1.2fr] gap-8">
        <div className="bg-white border border-industrial-gray/20 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-industrial-gray/10 flex items-center justify-between">
            <h2 className="font-heading font-black text-lg uppercase tracking-tight">Drops / Categorias</h2>
            <span className="font-mono text-[10px] uppercase tracking-widest text-industrial-gray">
              {dropRows.length} total
            </span>
          </div>
          <div className="divide-y divide-industrial-gray/10">
            {dropRows.map(drop => (
              <div key={drop.id} className="p-5 flex gap-4">
                <div className="h-16 w-16 bg-gray-100 border border-industrial-gray/10 overflow-hidden flex-shrink-0">
                  {drop.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={drop.image_url} alt={drop.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-300 text-xs">DROP</div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold uppercase tracking-tight truncate">{drop.name}</h3>
                    <span className="text-[9px] font-mono uppercase tracking-widest bg-gray-100 px-2 py-0.5">
                      {statusLabel(drop.status)}
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-industrial-gray uppercase tracking-widest">
                    /{drop.slug}
                  </p>
                  {drop.description && (
                    <p className="text-xs text-industrial-gray mt-2 line-clamp-2">{drop.description}</p>
                  )}
                </div>
              </div>
            ))}
            {dropRows.length === 0 && (
              <div className="p-8 text-center font-mono text-xs uppercase tracking-widest text-industrial-gray">
                Crea tu primer drop para agrupar productos armados.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-industrial-gray/20 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-industrial-gray/10 flex items-center justify-between">
            <h2 className="font-heading font-black text-lg uppercase tracking-tight">Productos Armados</h2>
            <span className="font-mono text-[10px] uppercase tracking-widest text-industrial-gray">
              {productRows.length} total
            </span>
          </div>
          <table className="w-full text-left">
            <thead className="bg-industrial-black text-white font-mono text-[10px] uppercase tracking-widest">
              <tr>
                <th className="px-5 py-3 font-normal">Foto</th>
                <th className="px-5 py-3 font-normal">Producto</th>
                <th className="px-5 py-3 font-normal">Drop</th>
                <th className="px-5 py-3 font-normal text-right">Precio</th>
                <th className="px-5 py-3 font-normal text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-gray/10">
              {productRows.map(product => (
                <tr key={product.id} className="hover:bg-industrial-light/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="h-16 w-14 bg-gray-100 border border-industrial-gray/10 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={product.hero_image_url} alt={product.name} className="h-full w-full object-cover" />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold uppercase tracking-tight">{product.name}</p>
                    <p className="font-mono text-[10px] text-industrial-gray uppercase tracking-widest">
                      /shop/{product.slug}
                    </p>
                    {product.is_featured && (
                      <span className="inline-block mt-2 text-[9px] font-bold uppercase tracking-widest bg-industrial-warning px-2 py-1">
                        Recomendado
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-industrial-gray">
                    {product.product_drops?.name || 'Sin drop'}
                  </td>
                  <td className="px-5 py-4 text-right font-mono text-sm">
                    ${product.price.toLocaleString('es-CO')}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="inline-block text-[9px] font-mono uppercase tracking-widest bg-gray-100 px-2 py-1">
                      {statusLabel(product.status)}
                    </span>
                  </td>
                </tr>
              ))}
              {productRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-industrial-gray font-mono text-xs uppercase tracking-widest">
                    Aun no hay productos armados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
