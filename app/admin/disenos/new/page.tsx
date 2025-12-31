'use server'

import { createDesign } from '@/lib/actions/designs'

export default async function NewDesignPage() {
    return (
        <div className="p-8 bg-industrial-light min-h-screen">
            <div className="max-w-2xl mx-auto bg-white border border-industrial-gray/20 shadow-sm p-8">
                <h1 className="font-heading font-black text-2xl uppercase tracking-tighter text-industrial-black mb-8">
                    Nuevo Diseño de Bordado
                </h1>

                <form action={createDesign} className="space-y-6">
                    {/* Nombre */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                            Nombre del Diseño
                        </label>
                        <input
                            name="name"
                            type="text"
                            required
                            className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
                            placeholder="Ej: DRAGON BACKPIECE"
                        />
                    </div>

                    {/* Categoría */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                            Categoría
                        </label>
                        <select
                            name="category"
                            required
                            className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
                        >
                            <option value="">Seleccionar...</option>
                            <option value="Anime">Anime</option>
                            <option value="Cyberpunk">Cyberpunk</option>
                            <option value="Minimalist">Minimalist</option>
                            <option value="Typography">Typography</option>
                            <option value="Abstract">Abstract</option>
                        </select>
                    </div>

                    {/* Precio Extra */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                            Precio Adicional ($)
                        </label>
                        <input
                            name="price_modifier"
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
                            placeholder="0.00"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">Costo extra agregado a la prenda base.</p>
                    </div>

                    {/* Dimensiones */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                            Dimensiones (Aprox)
                        </label>
                        <input
                            name="dimensions"
                            type="text"
                            required
                            className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
                            placeholder="Ej: 25cm x 30cm"
                        />
                    </div>

                    {/* Imagen */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                            Imagen del Diseño
                        </label>
                        <input
                            name="image"
                            type="file"
                            accept="image/*"
                            required
                            className="w-full text-sm font-mono text-industrial-gray file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-industrial-black file:text-white hover:file:bg-industrial-gray"
                        />
                    </div>

                    {/* Activo */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            name="is_active"
                            id="is_active"
                            defaultChecked
                            className="w-4 h-4 text-industrial-black focus:ring-industrial-warning border-gray-300 rounded"
                        />
                        <label htmlFor="is_active" className="text-xs font-bold uppercase tracking-widest text-industrial-black">
                            Diseño Activo (Visible en catálogo)
                        </label>
                    </div>

                    <div className="pt-6 flex gap-4">
                        <a
                            href="/admin/disenos"
                            className="px-6 py-3 border border-industrial-gray text-industrial-black text-xs font-bold uppercase tracking-widest hover:bg-gray-50 text-center"
                        >
                            Cancelar
                        </a>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-industrial-black text-white text-xs font-bold uppercase tracking-widest hover:bg-industrial-gray transition-colors"
                        >
                            Crear Diseño
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
