import Image from 'next/image'
import Link from 'next/link'
import { createPublicClient } from '@/lib/supabase/server'
import { buildShopHref, normalizeShopFilter } from '@/lib/shop/filters'
import type { ProductDrop, ReadyProduct } from '@/lib/types/database'

export const revalidate = 0

type ReadyProductWithDrop = ReadyProduct & {
  product_drops?: Pick<ProductDrop, 'name' | 'slug'> | null
}

const TAG_LABELS: Record<string, string> = {
  rebelde: 'Rebelde',
  delicado: 'Delicado',
  geek: 'Geek',
  tierno: 'Tierno',
  minimal: 'Minimal',
}

function formatPrice(value: number) {
  return `$${Number(value || 0).toLocaleString('es-CO')}`
}

export default async function ShopPage({ searchParams }: { searchParams?: { tag?: string; drop?: string } }) {
  const supabase = createPublicClient()
  const activeTag = normalizeShopFilter(searchParams?.tag)
  const activeDrop = normalizeShopFilter(searchParams?.drop)
  let products: ReadyProductWithDrop[] = []
  let drops: ProductDrop[] = []
  let activeDropRow: ProductDrop | null = null

  if (supabase) {
    const { data: dropData } = await supabase
      .from('product_drops')
      .select('*')
      .eq('status', 'published')
      .order('sort_order')
      .order('created_at', { ascending: false })

    drops = (dropData || []) as ProductDrop[]
    activeDropRow = activeDrop ? drops.find(drop => drop.slug === activeDrop) || null : null

    let query = supabase
      .from('ready_products')
      .select('*, product_drops(name, slug)')
      .in('status', ['published', 'sold_out'])

    if (activeDrop) {
      if (activeDropRow) {
        query = query.eq('drop_id', activeDropRow.id)
      } else {
        query = query.eq('drop_id', '00000000-0000-0000-0000-000000000000')
      }
    }

    if (activeTag) {
      query = query.contains('tags', [activeTag])
    }

    const { data, error } = await query
      .order('sort_order')
      .order('created_at', { ascending: false })

    if (!error && data) {
      products = data as ReadyProductWithDrop[]
    }
  }

  const pageTitle = activeDropRow
    ? activeDropRow.name
    : activeTag
      ? TAG_LABELS[activeTag] || activeTag
      : 'Recomendados'

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
      <header className="mb-10 md:mb-14">
        <p className="font-mono text-[10px] uppercase tracking-widest text-industrial-gray mb-3">
          Prendas listas para pedir
        </p>
        <h1 className="font-heading font-black text-4xl md:text-6xl uppercase tracking-tighter leading-none mb-4">
          {pageTitle}
        </h1>
        <p className="text-sm text-industrial-gray max-w-2xl leading-relaxed">
          Combinaciones ya resueltas con fotos finales. Elige talla, color y confirma tu pedido por WhatsApp.
        </p>
        {(activeTag || activeDropRow) && (
          <Link
            href="/shop"
            className="inline-block mt-5 font-mono text-[10px] uppercase tracking-widest text-industrial-black hover:text-industrial-warning"
          >
            Ver todos los recomendados
          </Link>
        )}
      </header>

      {drops.length > 0 && (
        <nav className="flex gap-2 overflow-x-auto pb-4 mb-8 border-b border-industrial-gray/10">
          <Link
            href={buildShopHref({ tag: activeTag })}
            className={`px-4 py-2 border text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${
              !activeDrop
                ? 'bg-industrial-black border-industrial-black text-white'
                : 'border-industrial-gray/20 text-industrial-gray hover:border-industrial-black'
            }`}
          >
            Todos
          </Link>
          {drops.map(drop => (
            <Link
              key={drop.id}
              href={buildShopHref({ drop: drop.slug, tag: activeTag })}
              className={`px-4 py-2 border text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${
                activeDrop === drop.slug
                  ? 'bg-industrial-black border-industrial-black text-white'
                  : 'border-industrial-gray/20 text-industrial-gray hover:border-industrial-black'
              }`}
            >
              {drop.name}
            </Link>
          ))}
        </nav>
      )}

      {products.length === 0 ? (
        <div className="border border-dashed border-industrial-gray/30 py-20 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-industrial-gray">
            {activeTag
              ? 'Pronto publicaremos productos para este estilo.'
              : 'Pronto publicaremos nuevos recomendados.'}
          </p>
          <Link
            href={activeTag ? '/shop' : 'https://wa.me/573013732290'}
            target={activeTag ? undefined : '_blank'}
            className="inline-block mt-6 px-6 py-3 bg-industrial-black text-white text-xs font-bold uppercase tracking-widest hover:bg-industrial-warning hover:text-industrial-black transition-colors"
          >
            {activeTag ? 'Ver todos' : 'Pedir por WhatsApp'}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {products.map(product => (
            <Link
              key={product.id}
              href={`/shop/${product.slug}`}
              className="group bg-white border border-transparent hover:border-industrial-gray/20 transition-all duration-300"
            >
              <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden">
                <Image
                  src={product.hero_image_url}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                {product.status === 'sold_out' && (
                  <span className="absolute top-3 right-3 bg-industrial-black text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1">
                    Agotado
                  </span>
                )}
                {product.is_featured && product.status !== 'sold_out' && (
                  <span className="absolute top-3 left-3 bg-industrial-warning text-industrial-black text-[10px] font-bold uppercase tracking-widest px-2 py-1">
                    Recomendado
                  </span>
                )}
              </div>
              <div className="py-4">
                {product.product_drops?.name && (
                  <p className="font-mono text-[10px] uppercase tracking-widest text-industrial-gray mb-1">
                    {product.product_drops.name}
                  </p>
                )}
                <h2 className="font-bold text-lg uppercase tracking-tight group-hover:text-industrial-warning transition-colors">
                  {product.name}
                </h2>
                <div className="flex items-center justify-between mt-2">
                  <p className="font-mono text-sm text-industrial-black">
                    {formatPrice(product.price)}
                  </p>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-industrial-gray group-hover:text-industrial-black">
                    Ver prenda
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
