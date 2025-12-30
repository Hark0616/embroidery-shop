import { createClient } from '@/lib/supabase/server'

export default async function PrendasPage() {
  const supabase = await createClient()
  const { data: products } = await supabase
    ?.from('base_products')
    .select('*')
    .order('created_at', { ascending: false }) || { data: [] }

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

      {/* Tabla de Prendas */}
      <div className="bg-white border border-industrial-gray/20 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-industrial-black text-industrial-white font-mono text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 font-normal">Imagen</th>
              <th className="px-6 py-4 font-normal">Producto</th>
              <th className="px-6 py-4 font-normal">Precio Base</th>
              <th className="px-6 py-4 font-normal">Variantes</th>
              <th className="px-6 py-4 font-normal text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-industrial-gray/10">
            {products?.map((product: any) => (
              <tr key={product.id} className="hover:bg-industrial-light/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="w-16 h-16 bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
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
                <td className="px-6 py-4 text-center">
                  <span className={`inline-block px-2 py-1 text-[10px] uppercase tracking-widest font-bold border ${product.stock_status === 'available'
                      ? 'border-green-500 text-green-700 bg-green-50'
                      : 'border-red-500 text-red-700 bg-red-50'
                    }`}>
                    {product.stock_status}
                  </span>
                </td>
              </tr>
            ))}
            {(!products || products.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-mono text-xs uppercase">
                  No hay prendas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

