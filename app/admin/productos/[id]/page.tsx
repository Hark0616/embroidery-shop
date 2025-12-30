import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProduct, updateProduct } from '@/lib/actions/products'
import { getCategories } from '@/lib/actions/categories'
import ProductForm from '@/components/admin/ProductForm'

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params
  const [product, categories] = await Promise.all([
    getProduct(id),
    getCategories(),
  ])

  if (!product) {
    notFound()
  }

  const updateProductWithId = updateProduct.bind(null, id)

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-jungle-muted text-sm mb-2">
          <Link href="/admin/productos" className="hover:text-jungle-deep transition-colors">
            Productos
          </Link>
          <span>/</span>
          <span className="text-jungle-deep">Editar</span>
        </div>
        <h1 className="font-heading text-3xl text-jungle-deep">Editar Producto</h1>
      </div>

      {/* Formulario */}
      <div className="bg-white border border-mint-border rounded-sm p-6">
        <ProductForm 
          product={product}
          categories={categories} 
          action={updateProductWithId}
        />
      </div>
    </div>
  )
}

