import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  needs_calibration: 'Pendiente',
  calibrated: 'Calibrado',
  published: 'Publicado',
}

export default async function MockupsPage() {
  const supabase = await createClient()

  const [{ data: mockups, error }, { data: products }] = await Promise.all([
    supabase
      ? supabase
          .from('garment_mockups')
          .select('*, base_products(name, slug)')
          .order('created_at', { ascending: false })
      : { data: [], error: null },
    supabase ? supabase.from('base_products').select('id, name') : { data: [] },
  ])

  const hasProducts = (products?.length || 0) > 0

  return (
    <div className="p-8 bg-industrial-light min-h-screen">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-heading font-black text-3xl uppercase tracking-tighter text-industrial-black">
            Mockups calibrables
          </h1>
          <p className="font-mono text-xs text-industrial-gray mt-2 uppercase tracking-widest">
            Sube, calibra y publica las imágenes reales que verá el cliente.
          </p>
        </div>
        <Link
          href="/admin/mockups/new"
          className={`inline-flex items-center gap-2 px-6 py-4 text-xs font-bold tracking-widest uppercase transition-colors duration-200 border ${
            hasProducts
              ? 'bg-industrial-black text-industrial-white hover:bg-industrial-gray border-industrial-gray'
              : 'bg-gray-200 text-gray-400 border-gray-200 pointer-events-none'
          }`}
        >
          + Nuevo mockup
        </Link>
      </div>

      {error ? (
        <div className="bg-white border border-red-200 p-8">
          <h2 className="font-heading font-black text-xl uppercase tracking-tighter text-red-700 mb-2">
            Falta aplicar la migración de mockups
          </h2>
          <p className="font-mono text-xs text-industrial-gray uppercase tracking-widest leading-relaxed">
            Ejecuta <span className="font-bold">supabase/migrations/20260625_create_garment_mockups.sql</span> en Supabase.
          </p>
        </div>
      ) : !mockups || mockups.length === 0 ? (
        <div className="bg-white border border-dashed border-industrial-gray/30 p-12 text-center">
          <h2 className="font-heading font-black text-xl uppercase tracking-tighter mb-2">
            Aún no hay mockups
          </h2>
          <p className="font-mono text-xs text-industrial-gray uppercase tracking-widest">
            Crea uno, calibra la superficie y publícalo cuando esté listo.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-industrial-gray/20 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-industrial-black text-industrial-white font-mono text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-normal">Mockup</th>
                <th className="px-6 py-4 font-normal">Prenda</th>
                <th className="px-6 py-4 font-normal">Vista</th>
                <th className="px-6 py-4 font-normal">Superficies</th>
                <th className="px-6 py-4 font-normal text-center">Estado</th>
                <th className="px-6 py-4 font-normal text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-industrial-gray/10">
              {mockups.map((mockup: any) => {
                const surfaceCount = mockup.surfaces && typeof mockup.surfaces === 'object'
                  ? Object.keys(mockup.surfaces).length
                  : 0

                return (
                  <tr key={mockup.id} className="hover:bg-industrial-light/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-20 bg-gray-100 border border-gray-200 overflow-hidden">
                          <img src={mockup.image_url} alt={mockup.name} className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <p className="font-bold text-industrial-black uppercase tracking-tight">{mockup.name}</p>
                          <p className="text-xs text-gray-400 font-mono mt-1">{mockup.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-industrial-gray uppercase tracking-widest">
                      {mockup.base_products?.name || 'Sin prenda'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs uppercase tracking-widest">
                      {mockup.view}{mockup.color_name ? ` / ${mockup.color_name}` : ''}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-industrial-gray">
                      {surfaceCount} zona{surfaceCount === 1 ? '' : 's'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-2 py-1 text-[10px] uppercase tracking-widest font-bold border ${
                        mockup.is_public
                          ? 'border-green-500 text-green-700 bg-green-50'
                          : surfaceCount > 0
                            ? 'border-industrial-warning text-industrial-black bg-industrial-warning/10'
                            : 'border-gray-300 text-gray-500 bg-gray-50'
                      }`}>
                        {STATUS_LABELS[mockup.status] || mockup.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/mockups/${mockup.id}`} className="text-industrial-black font-bold uppercase tracking-widest text-xs hover:underline">
                        Calibrar
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
