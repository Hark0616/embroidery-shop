import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

async function getStats() {
  const supabase = await createClient()
  
  if (!supabase) {
    return { totalProducts: 0, totalCategories: 0 }
  }

  const [productsResult, categoriesResult] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
  ])

  return {
    totalProducts: productsResult.count || 0,
    totalCategories: categoriesResult.count || 0,
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-jungle-deep">Dashboard</h1>
        <p className="text-jungle-muted text-sm mt-1">
          Bienvenida al panel de administración
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-sm border border-mint-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-jungle-muted text-xs tracking-wide uppercase">
                Productos
              </p>
              <p className="font-heading text-3xl text-jungle-deep mt-1">
                {stats.totalProducts}
              </p>
            </div>
            <div className="w-12 h-12 bg-mint rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-jungle-deep" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" 
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-sm border border-mint-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-jungle-muted text-xs tracking-wide uppercase">
                Categorías
              </p>
              <p className="font-heading text-3xl text-jungle-deep mt-1">
                {stats.totalCategories}
              </p>
            </div>
            <div className="w-12 h-12 bg-mint rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-jungle-deep" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" 
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-sm border border-mint-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-jungle-muted text-xs tracking-wide uppercase">
                Estado
              </p>
              <p className="font-heading text-lg text-green-600 mt-1">
                ● Activo
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-sm border border-mint-border">
        <h2 className="font-heading text-xl text-jungle-deep mb-4">
          Acciones rápidas
        </h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/admin/productos/nuevo"
            className="inline-flex items-center gap-2 px-5 py-3 bg-jungle-deep text-mint 
              text-xs tracking-[0.15em] uppercase hover:bg-jungle transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Producto
          </Link>
          
          <Link
            href="/admin/productos"
            className="inline-flex items-center gap-2 px-5 py-3 border border-jungle-deep text-jungle-deep 
              text-xs tracking-[0.15em] uppercase hover:bg-jungle-deep hover:text-mint transition-colors duration-200"
          >
            Ver Productos
          </Link>
          
          <Link
            href="/admin/categorias"
            className="inline-flex items-center gap-2 px-5 py-3 border border-jungle-deep text-jungle-deep 
              text-xs tracking-[0.15em] uppercase hover:bg-jungle-deep hover:text-mint transition-colors duration-200"
          >
            Gestionar Categorías
          </Link>
        </div>
      </div>
    </div>
  )
}

