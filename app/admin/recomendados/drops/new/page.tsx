'use server'

import { createDrop } from '@/lib/actions/ready-products'

export default async function NewDropPage() {
  return (
    <div className="p-8 bg-industrial-light min-h-screen">
      <div className="max-w-2xl mx-auto bg-white border border-industrial-gray/20 shadow-sm p-8">
        <h1 className="font-heading font-black text-2xl uppercase tracking-tighter text-industrial-black mb-2">
          Nuevo Drop
        </h1>
        <p className="font-mono text-xs text-industrial-gray uppercase tracking-widest mb-8">
          Categoria comercial para prendas armadas y anuncios.
        </p>

        <form action={createDrop} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
              Nombre del drop
            </label>
            <input
              name="name"
              type="text"
              required
              className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
              placeholder="Ej: Shonen energy"
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
              placeholder="shonen-energy"
            />
            <p className="text-[10px] text-gray-500 mt-1">Puedes dejarlo vacio para generarlo desde el nombre.</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
              Descripcion corta
            </label>
            <textarea
              name="description"
              rows={4}
              className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
              placeholder="Coleccion de prendas bordadas inspiradas en energia anime."
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
              Imagen / banner
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
                defaultValue="draft"
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
                defaultValue="0"
                className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
              />
            </div>
          </div>

          <div className="pt-6 flex gap-4">
            <a
              href="/admin/recomendados"
              className="px-6 py-3 border border-industrial-gray text-industrial-black text-xs font-bold uppercase tracking-widest hover:bg-gray-50 text-center"
            >
              Cancelar
            </a>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-industrial-black text-white text-xs font-bold uppercase tracking-widest hover:bg-industrial-gray transition-colors"
            >
              Crear Drop
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
