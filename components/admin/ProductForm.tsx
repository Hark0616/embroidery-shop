'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import ImageUploader from './ImageUploader'
import type { Product, Category } from '@/lib/types/database'

interface ProductFormProps {
  product?: Product | null
  categories: Category[]
  action: (formData: FormData) => Promise<{ error?: string } | void>
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
  const { pending } = useFormStatus()
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-3 bg-jungle-deep text-mint text-xs tracking-[0.15em] uppercase
        hover:bg-jungle transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending 
        ? 'Guardando...' 
        : isEditing ? 'Actualizar Producto' : 'Crear Producto'
      }
    </button>
  )
}

export default function ProductForm({ product, categories, action }: ProductFormProps) {
  const [imageUrl, setImageUrl] = useState(product?.image_url || '')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    // Agregar la URL de imagen al formData
    formData.set('image_url', imageUrl)
    
    const result = await action(formData)
    if (result?.error) {
      setError(result.error)
    }
  }

  return (
    <form action={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm text-sm">
          {error}
        </div>
      )}

      {/* Nombre */}
      <div>
        <label htmlFor="name" className="block text-jungle-muted text-xs tracking-wide uppercase mb-2">
          Nombre del producto *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={product?.name}
          className="w-full px-4 py-3 bg-white border border-mint-border rounded-sm
            text-jungle-deep
            focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold
            transition-colors duration-200"
          placeholder="Ej: Perfume Luna Femenino"
        />
      </div>

      {/* Descripción */}
      <div>
        <label htmlFor="description" className="block text-jungle-muted text-xs tracking-wide uppercase mb-2">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={product?.description || ''}
          className="w-full px-4 py-3 bg-white border border-mint-border rounded-sm
            text-jungle-deep resize-none
            focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold
            transition-colors duration-200"
          placeholder="Describe el producto..."
        />
      </div>

      {/* Precio y Marca */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="price" className="block text-jungle-muted text-xs tracking-wide uppercase mb-2">
            Precio *
          </label>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={product?.price}
            className="w-full px-4 py-3 bg-white border border-mint-border rounded-sm
              text-jungle-deep
              focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold
              transition-colors duration-200"
            placeholder="99.90"
          />
        </div>

        <div>
          <label htmlFor="brand" className="block text-jungle-muted text-xs tracking-wide uppercase mb-2">
            Marca *
          </label>
          <select
            id="brand"
            name="brand"
            required
            defaultValue={product?.brand || 'Natura'}
            className="w-full px-4 py-3 bg-white border border-mint-border rounded-sm
              text-jungle-deep
              focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold
              transition-colors duration-200"
          >
            <option value="Natura">Natura</option>
            <option value="NovaVenta">NovaVenta</option>
          </select>
        </div>
      </div>

      {/* Categoría */}
      <div>
        <label htmlFor="category_id" className="block text-jungle-muted text-xs tracking-wide uppercase mb-2">
          Categoría
        </label>
        <select
          id="category_id"
          name="category_id"
          defaultValue={product?.category_id || ''}
          className="w-full px-4 py-3 bg-white border border-mint-border rounded-sm
            text-jungle-deep
            focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold
            transition-colors duration-200"
        >
          <option value="">Sin categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Enlace de afiliado */}
      <div>
        <label htmlFor="affiliate_link" className="block text-jungle-muted text-xs tracking-wide uppercase mb-2">
          Enlace de afiliado *
        </label>
        <input
          id="affiliate_link"
          name="affiliate_link"
          type="url"
          required
          defaultValue={product?.affiliate_link}
          className="w-full px-4 py-3 bg-white border border-mint-border rounded-sm
            text-jungle-deep
            focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold
            transition-colors duration-200"
          placeholder="https://natura.com.br/producto/..."
        />
      </div>

      {/* Imagen */}
      <div>
        <label className="block text-jungle-muted text-xs tracking-wide uppercase mb-2">
          Imagen del producto
        </label>
        <ImageUploader
          currentImageUrl={product?.image_url}
          onImageUploaded={setImageUrl}
        />
        <input type="hidden" name="image_url" value={imageUrl} />
      </div>

      {/* Activo */}
      <div className="flex items-center gap-3">
        <input
          id="is_active"
          name="is_active"
          type="checkbox"
          defaultChecked={product?.is_active ?? true}
          value="true"
          className="w-5 h-5 rounded border-mint-border text-jungle-deep 
            focus:ring-gold/30 focus:ring-2"
        />
        <label htmlFor="is_active" className="text-jungle-deep text-sm">
          Producto activo (visible en la tienda)
        </label>
      </div>

      {/* Botones */}
      <div className="flex items-center gap-4 pt-4">
        <SubmitButton isEditing={!!product} />
        <a
          href="/admin/productos"
          className="px-6 py-3 border border-jungle-deep text-jungle-deep text-xs tracking-[0.15em] uppercase
            hover:bg-jungle-deep hover:text-mint transition-colors duration-200"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}

