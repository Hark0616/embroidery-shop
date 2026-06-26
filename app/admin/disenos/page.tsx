import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { updateDesignStatus } from '@/lib/actions/designs'
import { isMoodCategoryCompatible } from '@/lib/moods/catalog'

export default async function DisenosPage() {
  const supabase = await createClient()
  const { data: designs } = await supabase
    ?.from('embroidery_designs')
    .select('*')
    .order('created_at', { ascending: false }) || { data: [] }

  return (
    <div className="p-8 bg-industrial-light min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="font-heading font-black text-3xl uppercase tracking-tighter text-industrial-black">
            Diseños de Bordado
          </h1>
          <p className="font-mono text-xs text-industrial-gray mt-2 uppercase tracking-widest">
            Catálogo de diseños disponibles para personalización
          </p>
        </div>
        <div className="flex gap-4">
          <a
            href="/admin/disenos/new"
            className="inline-flex items-center gap-2 px-6 py-4 bg-industrial-black text-industrial-white 
              text-xs font-bold tracking-widest uppercase hover:bg-industrial-gray transition-colors duration-200 border border-industrial-gray"
          >
            + Nuevo Diseño
          </a>
        </div>
      </div>

      {/* Tabla de Diseños */}
      <div className="bg-white border border-industrial-gray/20 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-industrial-black text-industrial-white font-mono text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-normal">Imagen</th>
              <th className="px-6 py-4 font-normal">Nombre</th>
              <th className="px-6 py-4 font-normal">Categoría</th>
              <th className="px-6 py-4 font-normal text-right">Precio Extra</th>
              <th className="px-6 py-4 font-normal text-center">Estado</th>
              <th className="px-6 py-4 font-normal text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-industrial-gray/10">
            {designs?.map((design: import('@/lib/types/database').EmbroideryDesign) => (
              <tr key={design.id} className="hover:bg-industrial-light/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="w-16 h-16 bg-gray-100 flex items-center justify-center p-2 border border-gray-200">
                    <img
                      src={design.image_url}
                      alt={design.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-industrial-black">{design.name}</p>
                  <p className="text-xs text-gray-400 font-mono mt-1">{design.dimensions}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-2 py-1 text-xs font-mono uppercase tracking-wide ${
                    isMoodCategoryCompatible(design.category)
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {design.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-mono text-sm text-industrial-black">
                  +${design.price_modifier?.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-block w-3 h-3 rounded-full ${design.is_active ? 'bg-industrial-warning' : 'bg-gray-300'}`} />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex flex-col items-end gap-2">
                    <Link href={`/admin/disenos/${design.id}`} className="font-bold uppercase tracking-widest text-xs text-industrial-black hover:underline">
                      Editar
                    </Link>
                    <form action={updateDesignStatus}>
                      <input type="hidden" name="design_id" value={design.id} />
                      <input type="hidden" name="is_active" value={design.is_active ? 'false' : 'true'} />
                      <button type="submit" className="font-bold uppercase tracking-widest text-[10px] text-industrial-gray hover:text-industrial-black">
                        {design.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {(!designs || designs.length === 0) && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-mono text-xs uppercase">
                  No hay diseños registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

