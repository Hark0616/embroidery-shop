import type { ReadyProduct } from '../types/database'
import { DEFAULT_WHATSAPP_PHONE, normalizeWhatsAppPhone } from '../config/whatsapp'

export type ReadyProductCheckoutProduct = Pick<ReadyProduct, 'id' | 'slug' | 'name' | 'price'>

export type ReadyProductCheckoutVariant = {
  color?: string | null
  size?: string | null
  sourceUrl?: string | null
}

export type ReadyProductCheckoutPayload = {
  checkoutType: 'whatsapp'
  productId: string
  slug: string
  name: string
  price: number
  color: string
  size: string
  sourceUrl: string
}

export type ReadyProductCheckoutOptions = {
  phone?: string | null
}

export function formatCopPrice(value: number) {
  return `$${Number(value || 0).toLocaleString('es-CO')}`
}

function normalizePhone(phone: string | null | undefined) {
  return normalizeWhatsAppPhone(phone || DEFAULT_WHATSAPP_PHONE)
}

export function buildReadyProductCheckoutPayload(
  product: ReadyProductCheckoutProduct,
  variant: ReadyProductCheckoutVariant = {},
): ReadyProductCheckoutPayload {
  return {
    checkoutType: 'whatsapp',
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    color: variant.color || 'Unico',
    size: variant.size || 'Por confirmar',
    sourceUrl: variant.sourceUrl || `/shop/${product.slug}`,
  }
}

export function buildReadyProductCheckoutMessage(
  product: ReadyProductCheckoutProduct,
  variant: ReadyProductCheckoutVariant = {},
  leadTime?: string | null,
) {
  const payload = buildReadyProductCheckoutPayload(product, variant)
  const lines = [
    'Hola, quiero pedir:',
    `- Producto: ${payload.name}`,
    `- Precio: ${formatCopPrice(payload.price)} COP`,
    `- Color: ${payload.color}`,
    `- Talla: ${payload.size}`,
    `- Link: ${payload.sourceUrl}`,
  ]

  if (leadTime) {
    lines.push('', `Tiempo estimado: ${leadTime}`)
  }

  return lines.join('\n')
}

export function buildReadyProductCheckoutUrl(
  product: ReadyProductCheckoutProduct,
  variant: ReadyProductCheckoutVariant = {},
  leadTime?: string | null,
  options: ReadyProductCheckoutOptions = {},
) {
  const phone = normalizePhone(options.phone || process.env.NEXT_PUBLIC_WHATSAPP_PHONE)
  const message = buildReadyProductCheckoutMessage(product, variant, leadTime)

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
}
