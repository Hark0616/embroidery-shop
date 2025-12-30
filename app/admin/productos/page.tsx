import Link from 'next/link'
import { getProducts } from '@/lib/actions/products'
import ProductTable from '@/components/admin/ProductTable'

export default async function ProductosPage() {
  const products = await getProducts()

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl text-jungle-deep">Productos</h1>
          <p className="text-jungle-muted text-sm mt-1">
            Gestiona los productos de tu catálogo
          </p>
        </div>
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
      </div>

      {/* Tabla de productos */}
      <ProductTable products={products} />
    </div>
  )
}

