'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface ImageUploaderProps {
  currentImageUrl?: string | null
  onImageUploaded: (url: string) => void
}

export default function ImageUploader({ currentImageUrl, onImageUploaded }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen')
      return
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen debe ser menor a 5MB')
      return
    }

    setError(null)
    setUploading(true)

    try {
      const supabase = createClient()
      
      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `products/${fileName}`

      // Subir a Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      setPreview(publicUrl)
      onImageUploaded(publicUrl)
    } catch (err) {
      console.error('Error uploading image:', err)
      setError('Error al subir la imagen. Intenta de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  function handleRemove() {
    setPreview(null)
    onImageUploaded('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      {/* Preview */}
      {preview ? (
        <div className="relative w-full aspect-square max-w-xs bg-white border border-mint-border rounded-sm overflow-hidden">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full
              flex items-center justify-center hover:bg-red-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full aspect-square max-w-xs
          border-2 border-dashed border-mint-border rounded-sm cursor-pointer
          hover:border-gold hover:bg-mint/30 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {uploading ? (
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-jungle-deep" />
            ) : (
              <>
                <svg className="w-10 h-10 text-jungle-muted mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                  />
                </svg>
                <p className="text-sm text-jungle-muted">
                  <span className="font-medium text-jungle-deep">Clic para subir</span>
                </p>
                <p className="text-xs text-jungle-muted mt-1">
                  PNG, JPG, WEBP (máx. 5MB)
                </p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {/* Campo oculto para URL manual (fallback) */}
      <details className="text-sm">
        <summary className="text-jungle-muted cursor-pointer hover:text-jungle-deep">
          ¿Prefieres pegar una URL?
        </summary>
        <input
          type="url"
          placeholder="https://ejemplo.com/imagen.jpg"
          className="mt-2 w-full px-4 py-2 bg-white border border-mint-border rounded-sm
            text-jungle-deep text-sm
            focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
          onChange={(e) => {
            const url = e.target.value
            if (url) {
              setPreview(url)
              onImageUploaded(url)
            }
          }}
        />
      </details>
    </div>
  )
}

