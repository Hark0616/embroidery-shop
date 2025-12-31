import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

async function getStats() {
  const supabase = await createClient()

  if (!supabase) {
    return { totalProducts: 0, totalDesigns: 0 }
  }

  const [productsResult, designsResult] = await Promise.all([
    supabase.from('base_products').select('*', { count: 'exact', head: true }),
    supabase.from('embroidery_designs').select('*', { count: 'exact', head: true }),
  ])

  return {
    totalProducts: productsResult.count || 0,
    totalDesigns: designsResult.count || 0,
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  return (
    <div className="min-h-screen bg-industrial-light text-industrial-black p-8">
      {/* Header */}
      <div className="mb-8 border-b border-industrial-gray/10 pb-4">
        <h1 className="font-heading font-black text-3xl uppercase tracking-tighter">Dashboard</h1>
        <p className="font-mono text-xs text-industrial-gray uppercase tracking-widest mt-1">
          Panel de Control - Modo Operador
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="bg-white p-6 border border-industrial-gray/10 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 font-black text-6xl group-hover:opacity-20 transition-opacity select-none">
            01
          </div>
          <div>
            <p className="font-mono text-xs text-industrial-gray uppercase tracking-widest">
              Productos Base
            </p>
            <p className="font-heading font-black text-5xl mt-2 tracking-tighter">
              {stats.totalProducts}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 border border-industrial-gray/10 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 font-black text-6xl group-hover:opacity-20 transition-opacity select-none">
            02
          </div>
          <div>
            <p className="font-mono text-xs text-industrial-gray uppercase tracking-widest">
              Diseños Bordado
            </p>
            <p className="font-heading font-black text-5xl mt-2 tracking-tighter">
              {stats.totalDesigns}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions - Using external links to Supabase for now as lean solution */}
      <div className="bg-industrial-black text-industrial-white p-8">
        <h2 className="font-heading font-bold text-xl uppercase tracking-tight mb-6 flex items-center gap-2">
          <span className="text-industrial-warning">⚠</span> Acciones de Inventario
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-industrial-gray/30 p-4 bg-white/5">
            <h3 className="font-bold uppercase tracking-wider text-sm mb-2 text-industrial-warning">Gestión de Catálogo</h3>
            <p className="text-xs text-gray-400 mb-4 h-10">
              Sube nuevos hoodies, camisetas o diseños directamente en la base de datos.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/admin/prendas/new"
                className="inline-block w-full text-center bg-white text-industrial-black px-4 py-3 font-bold text-xs uppercase tracking-widest hover:bg-industrial-warning transition-colors"
              >
                + Nueva Prenda
              </Link>
              <Link
                href="/admin/disenos/new"
                className="inline-block w-full text-center border border-white text-white px-4 py-3 font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-industrial-black transition-colors"
              >
                + Nuevo Diseño
              </Link>
            </div>
          </div>

          <div className="border border-industrial-gray/30 p-4 bg-white/5">
            <h3 className="font-bold uppercase tracking-wider text-sm mb-2 text-industrial-warning">Tiempos de Entrega</h3>
            <p className="text-xs text-gray-400 mb-4 h-10">
              Modifica el mensaje global de "Tiempo de Espera" (15 días, 30 días, etc.)
            </p>
            <Link
              href="/admin/config"
              className="inline-block w-full text-center border border-white text-white px-4 py-3 font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-industrial-black transition-colors"
            >
              Editar Config Global
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

