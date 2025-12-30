import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

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
        <a
          href="https://supabase.com/dashboard/project/_/editor"
          target="_blank"
          className="inline-flex items-center gap-2 px-6 py-4 bg-industrial-warning text-industrial-black 
            text-xs font-bold tracking-widest uppercase hover:bg-white transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Gestionar en Supabase ↗
        </a>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-industrial-gray/10">
            {designs?.map((design: any) => (
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
                  <span className="inline-block px-2 py-1 bg-gray-100 text-xs font-mono uppercase tracking-wide text-gray-600">
                    {design.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-mono text-sm text-industrial-black">
                  +${design.price_modifier?.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-block w-3 h-3 rounded-full ${design.is_active ? 'bg-industrial-warning' : 'bg-gray-300'}`} />
                </td>
              </tr>
            ))}
            {(!designs || designs.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-mono text-xs uppercase">
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

