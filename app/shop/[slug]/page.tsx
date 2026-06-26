import { notFound } from 'next/navigation'
import { createPublicClient } from '@/lib/supabase/server'
import { getDeliveryTime, getWhatsAppConfig } from '@/lib/actions/config'
import ReadyProductPurchase from '@/components/shop/ReadyProductPurchase'
import type { ProductDrop, ReadyProduct } from '@/lib/types/database'

export const revalidate = 0

type ReadyProductWithDrop = ReadyProduct & {
  product_drops?: Pick<ProductDrop, 'name' | 'slug'> | null
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = createPublicClient()
  const { data: product } = supabase
    ? await supabase
        .from('ready_products')
        .select('name, short_description')
        .eq('slug', params.slug)
        .in('status', ['published', 'hidden', 'sold_out'])
        .single()
    : { data: null }

  return {
    title: product ? `${product.name} | TEXERE.ART` : 'Producto no encontrado',
    description: product?.short_description || 'Prenda bordada lista para pedir.',
  }
}

export default async function ReadyProductPage({ params }: { params: { slug: string } }) {
  const supabase = createPublicClient()

  const { data: product, error } = supabase
    ? await supabase
        .from('ready_products')
        .select('*, product_drops(name, slug)')
        .eq('slug', params.slug)
        .in('status', ['published', 'hidden', 'sold_out'])
        .single()
    : { data: null, error: null }

  if (error || !product) {
    notFound()
  }

  const [leadTime, whatsapp] = await Promise.all([
    getDeliveryTime(),
    getWhatsAppConfig(),
  ])

  return (
    <div className="min-h-screen bg-white">
      <ReadyProductPurchase product={product as ReadyProductWithDrop} leadTime={leadTime} whatsappPhone={whatsapp.phone} />
    </div>
  )
}
