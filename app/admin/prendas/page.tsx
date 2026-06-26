import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { BaseProduct } from '@/lib/types/database'
import { getMockupImageForColor } from '@/lib/mockup-variants'

type MockupSummary = {
  id: string
  status: string
  is_public: boolean
  surfaces: unknown
  image_url?: string
  color_name?: string | null
  shadow_map_url?: string | null
  variants?: unknown
}

type ProductWithMockups = BaseProduct & {
  garment_mockups?: MockupSummary[]
}



function getSurfaceCount(mockup: MockupSummary) {
  if (!mockup.surfaces || typeof mockup.surfaces !== 'object' || Array.isArray(mockup.surfaces)) {
    return 0
  }

  return Object.keys(mockup.surfaces).length
}

function getWorkflowState(product: ProductWithMockups) {
  const mockups = product.garment_mockups || []
  const calibratedCount = mockups.filter(mockup => getSurfaceCount(mockup) > 0).length
  const publishedCount = mockups.filter(mockup => mockup.is_public && mockup.status === 'published').length

  if (mockups.length === 0) {
    return {
      label: 'Sin mockups',
      detail: 'Agrega fotos de la prenda',
      className: 'border-gray-300 text-gray-500 bg-gray-50',
      mockupText: '0 mockups',
    }
  }

  if (product.is_active && publishedCount > 0) {
    return {
      label: 'Publicado',
      detail: `${publishedCount} visible${publishedCount === 1 ? '' : 's'} en tienda`,
      className: 'border-green-500 text-green-700 bg-green-50',
      mockupText: `${calibratedCount}/${mockups.length} calibrados`,
    }
  }

  // Permisivo: permitir publicar aunque no estén todos o si es activado sin mockups
  if (product.is_active) {
    return {
      label: 'Publicado',
      detail: `${publishedCount} visible${publishedCount === 1 ? '' : 's'} en tienda`,
      className: 'border-green-500 text-green-700 bg-green-50',
      mockupText: `${calibratedCount}/${mockups.length} calibrados`,
    }
  }

  if (publishedCount > 0) {
    return {
      label: 'Listo',
      detail: 'Puede publicarse',
      className: 'border-industrial-warning text-industrial-black bg-industrial-warning/10',
      mockupText: `${calibratedCount}/${mockups.length} calibrados`,
    }
  }

  if (calibratedCount > 0) {
    return {
      label: 'En revisión',
      detail: 'Falta publicar mockup',
      className: 'border-blue-400 text-blue-700 bg-blue-50',
      mockupText: `${calibratedCount}/${mockups.length} calibrados`,
    }
  }

  return {
    label: 'Pendiente',
    detail: 'Falta calibrar',
    className: 'border-red-300 text-red-700 bg-red-50',
    mockupText: `0/${mockups.length} calibrados`,
  }
}

export default async function PrendasPage() {
  const supabase = await createClient()
  let products: ProductWithMockups[] = []
  let loadError = ''
  let migrationWarning = ''

  if (supabase) {
    const result = await supabase
      .from('base_products')
      .select('*, garment_mockups(id, status, is_public, surfaces, image_url, color_name, shadow_map_url, variants)')
      .order('created_at', { ascending: false })

    if (result.error) {
      console.error('Error loading garments with mockup variants:', result.error)

      const fallback = await supabase
        .from('base_products')
        .select('*, garment_mockups(id, status, is_public, surfaces, image_url, color_name, shadow_map_url)')
        .order('created_at', { ascending: false })

      if (fallback.error) {
        console.error('Error loading garments fallback:', fallback.error)
        loadError = fallback.error.message
      } else {
        products = (fallback.data || []) as ProductWithMockups[]
        migrationWarning = 'Falta aplicar la migracion de variantes de mockup. Las prendas existen, pero algunos datos nuevos se cargaron en modo compatibilidad.'
      }
    } else {
      products = (result.data || []) as ProductWithMockups[]
    }
  }

  return (
    <div className="p-8 bg-industrial-light min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="font-heading font-black text-3xl uppercase tracking-tighter text-industrial-black">
            Prendas Base
          </h1>
          <p className="font-mono text-xs text-industrial-gray mt-2 uppercase tracking-widest">
            Hoodies, Camisetas y otros soportes (Stock Cero)
          </p>
        </div>
        <div className="flex gap-4">
          <a
            href="/admin/prendas/new"
            className="inline-flex items-center gap-2 px-6 py-4 bg-industrial-black text-industrial-white 
              text-xs font-bold tracking-widest uppercase hover:bg-industrial-gray transition-colors duration-200 border border-industrial-gray"
          >
            Crear prenda
          </a>
        </div>
      </div>

      {migrationWarning && (
        <div className="bg-industrial-warning/10 border border-industrial-warning p-5 mb-6">
          <h2 className="font-heading font-black text-lg uppercase tracking-tighter text-industrial-black mb-1">
            Prendas cargadas en modo compatibilidad
          </h2>
          <p className="font-mono text-xs text-industrial-gray uppercase tracking-widest leading-relaxed">
            {migrationWarning} Ejecuta <span className="font-bold">supabase/migrations/20260626_add_mockup_variants.sql</span>.
          </p>
        </div>
      )}

      {loadError && (
        <div className="bg-white border border-red-200 p-8 mb-6">
          <h2 className="font-heading font-black text-xl uppercase tracking-tighter text-red-700 mb-2">
            No se pudieron cargar las prendas
          </h2>
          <p className="font-mono text-xs text-industrial-gray uppercase tracking-widest leading-relaxed">
            {loadError}
          </p>
        </div>
      )}

      {/* Tabla de Prendas */}
      {!loadError && <div className="bg-white border border-industrial-gray/20 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-industrial-black text-industrial-white font-mono text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-normal">Imagen</th>
              <th className="px-6 py-4 font-normal">Producto</th>
              <th className="px-6 py-4 font-normal">Precio Base</th>

              <th className="px-6 py-4 font-normal">Variantes</th>
              <th className="px-6 py-4 font-normal">Mockups</th>
              <th className="px-6 py-4 font-normal text-center">Publicación</th>
              <th className="px-6 py-4 font-normal text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-industrial-gray/10">
            {products?.map((product: ProductWithMockups) => {
              const workflow = getWorkflowState(product)
              const firstMockup = product.garment_mockups?.find(m => m.is_public && m.status === 'published') || product.garment_mockups?.[0]
              const displayImage = firstMockup ? getMockupImageForColor(firstMockup as any) : product.image_url

              return (
                <tr key={product.id} className="hover:bg-industrial-light/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="w-16 h-16 bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                      {displayImage ? (
                        <img
                          src={displayImage}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] text-gray-400 font-mono">SIN IMAGEN</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-industrial-black uppercase tracking-tight">{product.name}</p>
                    <p className="text-xs text-gray-400 font-mono mt-1">{product.slug}</p>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-industrial-black">
                    ${product.base_price?.toLocaleString()}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {product.colors?.map((c: string) => (
                        <span key={c} className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: c === 'Negro' ? '#000' : c === 'Blanco' ? '#fff' : 'gray' }} title={c} />
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 font-mono">
                      {product.sizes?.join(', ')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-mono text-xs text-industrial-black uppercase tracking-widest">
                      {workflow.mockupText}
                    </p>
                    <p className="font-mono text-[10px] text-industrial-gray uppercase tracking-widest mt-1">
                      {workflow.detail}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-2 py-1 text-[10px] uppercase tracking-widest font-bold border ${workflow.className}`}>
                      {workflow.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col gap-2 items-end">
                      <Link href={`/admin/prendas/${product.id}`} className="text-industrial-black font-bold uppercase tracking-widest text-xs hover:underline">
                        Gestionar
                      </Link>
                      <Link href={`/admin/prendas/${product.id}/mockups/new`} className="text-industrial-gray font-bold uppercase tracking-widest text-xs hover:text-industrial-black hover:underline">
                        Agregar mockup
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
            {(!products || products.length === 0) && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500 font-mono text-xs uppercase">
                  No hay prendas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>}
    </div>
  )
}
