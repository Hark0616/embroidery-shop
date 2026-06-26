import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateDesign } from '@/lib/actions/designs'
import { DESIGN_MOOD_CATEGORIES, MOOD_LABELS } from '@/lib/moods/catalog'

export default async function EditDesignPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  if (!supabase) notFound()

  const { data: design } = await supabase
    .from('embroidery_designs')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!design) notFound()

  return (
    <div className="p-8 bg-industrial-light min-h-screen">
      <div className="max-w-2xl mx-auto bg-white border border-industrial-gray/20 shadow-sm p-8">
        <Link href="/admin/disenos" className="font-mono text-xs text-industrial-gray uppercase tracking-widest hover:text-industrial-black">
          ← Volver a diseños
        </Link>
        <h1 className="font-heading font-black text-2xl uppercase tracking-tighter text-industrial-black mt-4 mb-2">
          Editar diseño
        </h1>
        <p className="font-mono text-xs text-industrial-gray uppercase tracking-widest mb-8">
          Controla cómo aparece en /designs y en el Studio.
        </p>

        <form action={updateDesign} className="space-y-6">
          <input type="hidden" name="design_id" value={design.id} />

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
              Nombre del diseño
            </label>
            <input
              name="name"
              type="text"
              required
              defaultValue={design.name}
              className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
              Categoría / mood público
            </label>
            <select
              name="category"
              required
              defaultValue={String(design.category || '').toLowerCase()}
              className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
            >
              {Object.entries(MOOD_LABELS).map(([mood, { label }]) => (
                <optgroup key={mood} label={label}>
                  {DESIGN_MOOD_CATEGORIES
                    .filter(category => category.mood === mood)
                    .map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
              Precio adicional ($)
            </label>
            <input
              name="price_modifier"
              type="number"
              required
              min="0"
              step="0.01"
              defaultValue={design.price_modifier}
              className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
              Dimensiones
            </label>
            <input
              name="dimensions"
              type="text"
              required
              defaultValue={design.dimensions}
              className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
              Cambiar imagen del diseño
            </label>
            <input
              name="image"
              type="file"
              accept="image/*"
              className="w-full text-sm font-mono text-industrial-gray file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-industrial-black file:text-white hover:file:bg-industrial-gray"
            />
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              name="is_active"
              id="is_active"
              defaultChecked={design.is_active}
              className="w-4 h-4 text-industrial-black focus:ring-industrial-warning border-gray-300 rounded"
            />
            <span className="text-xs font-bold uppercase tracking-widest text-industrial-black">
              Diseño activo (visible en catálogo)
            </span>
          </label>

          <div className="pt-6 flex gap-4">
            <Link
              href="/admin/disenos"
              className="px-6 py-3 border border-industrial-gray text-industrial-black text-xs font-bold uppercase tracking-widest hover:bg-gray-50 text-center"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-industrial-black text-white text-xs font-bold uppercase tracking-widest hover:bg-industrial-gray transition-colors"
            >
              Guardar diseño
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
