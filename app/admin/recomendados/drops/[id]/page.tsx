import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateDrop } from '@/lib/actions/ready-products'

export default async function EditDropPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  if (!supabase) notFound()

  const { data: drop } = await supabase
    .from('product_drops')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!drop) notFound()

  return (
    <div className="p-8 bg-industrial-light min-h-screen">
      <div className="max-w-2xl mx-auto bg-white border border-industrial-gray/20 shadow-sm p-8">
        <Link href="/admin/recomendados" className="font-mono text-xs text-industrial-gray uppercase tracking-widest hover:text-industrial-black">
          ← Volver a drops listos
        </Link>
        <h1 className="font-heading font-black text-2xl uppercase tracking-tighter text-industrial-black mt-4 mb-2">
          Editar drop
        </h1>
        <p className="font-mono text-xs text-industrial-gray uppercase tracking-widest mb-8">
          Agrupa productos listos para campañas, home y shop.
        </p>

        <form action={updateDrop} className="space-y-6">
          <input type="hidden" name="drop_id" value={drop.id} />

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
              Nombre del drop
            </label>
            <input
              name="name"
              type="text"
              required
              defaultValue={drop.name}
              className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
              Slug
            </label>
            <input
              name="slug"
              type="text"
              defaultValue={drop.slug}
              className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
              Descripción corta
            </label>
            <textarea
              name="description"
              rows={4}
              defaultValue={drop.description || ''}
              className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
              Cambiar imagen / banner
            </label>
            <input
              name="image"
              type="file"
              accept="image/*"
              className="w-full text-sm font-mono text-industrial-gray file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-industrial-black file:text-white hover:file:bg-industrial-gray"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                Estado
              </label>
              <select
                name="status"
                defaultValue={drop.status}
                className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
                <option value="hidden">Oculto</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                Orden
              </label>
              <input
                name="sort_order"
                type="number"
                defaultValue={drop.sort_order}
                className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
              />
            </div>
          </div>

          <div className="pt-6 flex gap-4">
            <Link
              href="/admin/recomendados"
              className="px-6 py-3 border border-industrial-gray text-industrial-black text-xs font-bold uppercase tracking-widest hover:bg-gray-50 text-center"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-industrial-black text-white text-xs font-bold uppercase tracking-widest hover:bg-industrial-gray transition-colors"
            >
              Guardar drop
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
