import Link from 'next/link'
import { createProduct } from '@/lib/actions/products'
import { getCategories } from '@/lib/actions/categories'
import ProductForm from '@/components/admin/ProductForm'

export default async function NuevoProductoPage() {
  const categories = await getCategories()

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-jungle-muted text-sm mb-2">
          <Link href="/admin/productos" className="hover:text-jungle-deep transition-colors">
            Productos
          </Link>
          <span>/</span>
          <span className="text-jungle-deep">Nuevo</span>
        </div>
        <h1 className="font-heading text-3xl text-jungle-deep">Nuevo Producto</h1>
      </div>

      {/* Formulario */}
      <div className="bg-white border border-mint-border rounded-sm p-6">
        <ProductForm 
          categories={categories} 
          action={createProduct}
        />
      </div>
    </div>
  )
}

