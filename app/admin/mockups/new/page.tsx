import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createMockup } from '@/lib/actions/mockups'

export default async function NewMockupPage({
  searchParams,
}: {
  searchParams?: { product_id?: string }
}) {
  const supabase = await createClient()
  const selectedProductId = searchParams?.product_id || ''
  const { data: products } = await supabase
    ?.from('base_products')
    .select('id, name, slug, colors')
    .eq('is_active', true)
    .order('created_at', { ascending: false }) || { data: [] }

  return (
    <div className="p-8 bg-industrial-light min-h-screen">
      <div className="max-w-2xl mx-auto bg-white border border-industrial-gray/20 shadow-sm p-8">
        <div className="mb-8">
          <Link href="/admin/mockups" className="font-mono text-xs text-industrial-gray uppercase tracking-widest hover:text-industrial-black">
            ← Volver a mockups
          </Link>
          <h1 className="font-heading font-black text-2xl uppercase tracking-tighter text-industrial-black mt-4">
            Nuevo mockup calibrable
          </h1>
          <p className="font-mono text-xs text-industrial-gray mt-2 uppercase tracking-widest">
            Quedará privado hasta que calibres y publiques sus superficies.
          </p>
        </div>

        <form action={createMockup} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
              Prenda base
            </label>
            <select
              name="product_id"
              required
              defaultValue={selectedProductId}
              className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
            >
              <option value="">Seleccionar...</option>
              {products?.map((product: any) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
              Nombre del mockup
            </label>
            <input
              name="name"
              type="text"
              required
              className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
              placeholder="Ej: Hoodie negro frente"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
              Slug
            </label>
            <input
              name="slug"
              type="text"
              className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
              placeholder="hoodie-negro-frente"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                Vista
              </label>
              <select
                name="view"
                className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
              >
                <option value="front">Frente</option>
                <option value="back">Espalda</option>
                <option value="side">Lateral</option>
                <option value="detail">Detalle</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                Color / variante
              </label>
              <input
                name="color_name"
                type="text"
                className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
                placeholder="Negro, Blanco, Beige..."
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
              Imagen del mockup
            </label>
            <input
              name="image"
              type="file"
              accept="image/*"
              required
              className="w-full text-sm font-mono text-industrial-gray file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-industrial-black file:text-white hover:file:bg-industrial-gray"
            />
            <p className="text-[10px] text-gray-500 mt-2">Recomendado: 1600x2000px, mismo encuadre para variantes.</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
              Mapa de sombras / pliegues opcional
            </label>
            <input
              name="shadow_map"
              type="file"
              accept="image/*"
              className="w-full text-sm font-mono text-industrial-gray file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-industrial-black file:text-white hover:file:bg-industrial-gray"
            />
            <p className="text-[10px] text-gray-500 mt-2">Sirve para integrar mejor el bordado con luces y pliegues.</p>
          </div>

          <div className="pt-6 flex gap-4">
            <Link
              href="/admin/mockups"
              className="px-6 py-3 border border-industrial-gray text-industrial-black text-xs font-bold uppercase tracking-widest hover:bg-gray-50 text-center"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-industrial-black text-white text-xs font-bold uppercase tracking-widest hover:bg-industrial-gray transition-colors"
            >
              Crear y calibrar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
