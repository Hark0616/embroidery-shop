import { getCategoriesWithParent } from '@/lib/actions/categories'
import CategoryForm from '@/components/admin/CategoryForm'

export default async function CategoriasPage() {
  const categories = await getCategoriesWithParent()

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl text-jungle-deep">Categorías</h1>
        <p className="text-jungle-muted text-sm mt-1">
          Organiza tus productos en categorías y subcategorías
        </p>
      </div>

      {/* Formulario y lista */}
      <CategoryForm categories={categories} />
    </div>
  )
}

