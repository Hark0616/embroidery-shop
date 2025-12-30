'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { deleteProduct, toggleProductActive } from '@/lib/actions/products'
import type { Product } from '@/lib/types/database'

interface ProductWithCategory extends Product {
  category?: { id: string; name: string; slug: string } | null
}

interface ProductTableProps {
  products: ProductWithCategory[]
}

export default function ProductTable({ products }: ProductTableProps) {
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Estás segura de eliminar "${name}"?`)) return
    
    setDeleting(id)
    await deleteProduct(id)
    setDeleting(null)
  }

  async function handleToggle(id: string, currentState: boolean) {
    await toggleProductActive(id, !currentState)
  }

  if (products.length === 0) {
    return (
      <div className="bg-white border border-mint-border rounded-sm p-12 text-center">
        <svg className="w-16 h-16 text-mint-border mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" 
          />
        </svg>
        <h3 className="text-jungle-deep font-heading text-lg mb-2">
          No hay productos aún
        </h3>
        <p className="text-jungle-muted text-sm mb-6">
          Crea tu primer producto para verlo aquí
        </p>
        <Link
          href="/admin/productos/nuevo"
          className="inline-flex items-center gap-2 px-5 py-3 bg-jungle-deep text-mint 
            text-xs tracking-[0.15em] uppercase hover:bg-jungle transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Crear Producto
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white border border-mint-border rounded-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-mint/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-jungle-muted uppercase tracking-wide">
              Producto
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-jungle-muted uppercase tracking-wide">
              Precio
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-jungle-muted uppercase tracking-wide">
              Marca
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-jungle-muted uppercase tracking-wide">
              Categoría
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-jungle-muted uppercase tracking-wide">
              Estado
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-jungle-muted uppercase tracking-wide">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-mint-border">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-mint/20 transition-colors">
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  {product.image_url ? (
                    <div className="relative w-12 h-12 bg-mint rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={product.image_url}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-mint rounded flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-jungle-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                        />
                      </svg>
                    </div>
                  )}
                  <span className="font-medium text-jungle-deep text-sm">
                    {product.name}
                  </span>
                </div>
              </td>
              <td className="px-4 py-4 text-gold font-medium">
                ${product.price.toFixed(2)}
              </td>
              <td className="px-4 py-4 text-jungle-muted text-sm">
                {product.brand}
              </td>
              <td className="px-4 py-4 text-jungle-muted text-sm">
                {product.category?.name || '—'}
              </td>
              <td className="px-4 py-4">
                <button
                  onClick={() => handleToggle(product.id, product.is_active)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors
                    ${product.is_active 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {product.is_active ? 'Activo' : 'Inactivo'}
                </button>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/admin/productos/${product.id}`}
                    className="p-2 text-jungle-muted hover:text-jungle-deep hover:bg-mint rounded transition-colors"
                    title="Editar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                      />
                    </svg>
                  </Link>
                  <button
                    onClick={() => handleDelete(product.id, product.name)}
                    disabled={deleting === product.id}
                    className="p-2 text-jungle-muted hover:text-red-600 hover:bg-red-50 rounded transition-colors
                      disabled:opacity-50"
                    title="Eliminar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                      />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

