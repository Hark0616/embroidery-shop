'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import type { ProductDrop, ReadyProduct } from '@/lib/types/database'

type ReadyProductWithDrop = ReadyProduct & {
  product_drops?: Pick<ProductDrop, 'name' | 'slug'> | null
}

interface ReadyProductPurchaseProps {
  product: ReadyProductWithDrop
  leadTime: string
}

function formatPrice(value: number) {
  return `$${Number(value || 0).toLocaleString('es-CO')}`
}

export default function ReadyProductPurchase({ product, leadTime }: ReadyProductPurchaseProps) {
  const images = useMemo(() => {
    const unique = [product.hero_image_url, ...(product.gallery_image_urls || [])].filter(Boolean)
    return Array.from(new Set(unique))
  }, [product.hero_image_url, product.gallery_image_urls])

  const [activeImage, setActiveImage] = useState(images[0] || product.hero_image_url)
  const [selectedColor, setSelectedColor] = useState(product.primary_color || product.available_colors[0] || '')
  const [selectedSize, setSelectedSize] = useState(product.available_sizes[0] || '')
  const isSoldOut = product.status === 'sold_out'
  const canBuy = !isSoldOut && !!selectedSize && (!!selectedColor || product.available_colors.length === 0)

  const whatsappUrl = useMemo(() => {
    const phone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '573013732290'
    const message = `Hola, quiero pedir:
- Producto: ${product.name}
- Precio: ${formatPrice(product.price)} COP
- Color: ${selectedColor || 'Unico'}
- Talla: ${selectedSize || 'Por confirmar'}
- Link: ${typeof window !== 'undefined' ? window.location.href : `/shop/${product.slug}`}

Tiempo estimado: ${leadTime}`

    return `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`
  }, [leadTime, product.name, product.price, product.slug, selectedColor, selectedSize])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <section className="lg:col-span-7">
        <div className="relative aspect-[4/5] bg-gray-100 border border-industrial-gray/10 overflow-hidden">
          <Image
            src={activeImage}
            alt={product.name}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 58vw"
          />
        </div>

        {images.length > 1 && (
          <div className="grid grid-cols-5 gap-2 mt-3">
            {images.map(image => (
              <button
                key={image}
                type="button"
                onClick={() => setActiveImage(image)}
                className={`relative aspect-square bg-gray-100 border overflow-hidden ${
                  activeImage === image ? 'border-industrial-black' : 'border-industrial-gray/10'
                }`}
                aria-label="Cambiar foto"
              >
                <Image src={image} alt="" fill className="object-cover" sizes="120px" />
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="lg:col-span-5">
        <div className="sticky top-24">
          {product.product_drops?.name && (
            <p className="font-mono text-[10px] uppercase tracking-widest text-industrial-gray mb-3">
              {product.product_drops.name}
            </p>
          )}

          <h1 className="font-heading font-black text-3xl md:text-5xl uppercase tracking-tighter leading-none mb-4">
            {product.name}
          </h1>

          {product.short_description && (
            <p className="text-sm text-industrial-gray leading-relaxed mb-6">
              {product.short_description}
            </p>
          )}

          <div className="flex items-end gap-3 mb-8">
            <p className="font-heading font-black text-3xl">
              {formatPrice(product.price)}
            </p>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <p className="font-mono text-sm text-industrial-gray line-through mb-1">
                {formatPrice(product.compare_at_price)}
              </p>
            )}
          </div>

          {product.available_colors.length > 0 && (
            <div className="mb-8">
              <h2 className="font-bold text-xs uppercase tracking-widest mb-3">
                Color
              </h2>
              <div className="flex flex-wrap gap-2">
                {product.available_colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-3 border text-xs font-bold uppercase tracking-widest ${
                      selectedColor === color
                        ? 'bg-industrial-black border-industrial-black text-white'
                        : 'border-industrial-gray/20 hover:border-industrial-black'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mb-8">
            <h2 className="font-bold text-xs uppercase tracking-widest mb-3">
              Talla
            </h2>
            <div className="flex flex-wrap gap-2">
              {product.available_sizes.map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setSelectedSize(size)}
                  className={`h-12 min-w-12 px-4 border text-xs font-bold uppercase tracking-widest ${
                    selectedSize === size
                      ? 'bg-industrial-black border-industrial-black text-white'
                      : 'border-industrial-gray/20 hover:border-industrial-black'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <a
            href={canBuy ? whatsappUrl : '#'}
            target={canBuy ? '_blank' : undefined}
            rel="noopener noreferrer"
            onClick={event => {
              if (!canBuy) event.preventDefault()
            }}
            aria-disabled={!canBuy}
            className={`block w-full text-center py-5 font-black uppercase tracking-widest transition-colors ${
              canBuy
                ? 'bg-industrial-black text-industrial-warning hover:bg-industrial-warning hover:text-industrial-black'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSoldOut ? 'Agotado' : 'Comprar por WhatsApp'}
          </a>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div className="border border-industrial-gray/10 p-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-industrial-gray">Produccion</p>
              <p className="font-bold text-xs mt-1">{leadTime}</p>
            </div>
            <div className="border border-industrial-gray/10 p-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-industrial-gray">Bordado</p>
              <p className="font-bold text-xs mt-1">Hecho bajo pedido</p>
            </div>
            <div className="border border-industrial-gray/10 p-3">
              <p className="font-mono text-[10px] uppercase tracking-widest text-industrial-gray">Compra</p>
              <p className="font-bold text-xs mt-1">Confirmacion por WhatsApp</p>
            </div>
          </div>

          {product.description && (
            <div className="mt-8 border-t border-industrial-gray/10 pt-6">
              <h2 className="font-bold text-xs uppercase tracking-widest mb-3">Detalles</h2>
              <p className="text-sm text-industrial-gray leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
