'use server'

import { createProduct } from '@/lib/actions/products'

export default async function NewProductPage() {
    return (
        <div className="p-8 bg-industrial-light min-h-screen">
            <div className="max-w-2xl mx-auto bg-white border border-industrial-gray/20 shadow-sm p-8">
                <h1 className="font-heading font-black text-2xl uppercase tracking-tighter text-industrial-black mb-8">
                    Nueva Prenda Base
                </h1>

                <form action={createProduct} className="space-y-6">
                    {/* Nombre */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                            Nombre del Producto
                        </label>
                        <input
                            name="name"
                            type="text"
                            required
                            className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
                            placeholder="Ej: HOODIE PREMIUM"
                        />
                    </div>

                    {/* Slug */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                            Slug (URL)
                        </label>
                        <input
                            name="slug"
                            type="text"
                            required
                            className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
                            placeholder="Ej: hoodie-premium"
                        />
                    </div>

                    {/* Precio Base */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                            Precio Base ($)
                        </label>
                        <input
                            name="base_price"
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
                            placeholder="0.00"
                        />
                    </div>

                    {/* Imagen */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                            Imagen del Producto
                        </label>
                        <input
                            name="image"
                            type="file"
                            accept="image/*"
                            required
                            className="w-full text-sm font-mono text-industrial-gray file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-industrial-black file:text-white hover:file:bg-industrial-gray"
                        />
                        <p className="text-[10px] text-gray-500 mt-2">Formatos: JPG, PNG, WEBP. Max 5MB.</p>
                    </div>

                    {/* Colores (Multi-select simplificado) */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                            Colores Disponibles
                        </label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" name="colors" value="Negro" defaultChecked />
                                <span className="text-sm font-mono">Negro</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" name="colors" value="Blanco" />
                                <span className="text-sm font-mono">Blanco</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" name="colors" value="Gris" />
                                <span className="text-sm font-mono">Gris</span>
                            </label>
                        </div>
                    </div>

                    {/* Tallas (Multi-select simplificado) */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                            Tallas Disponibles
                        </label>
                        <div className="flex gap-4 flex-wrap">
                            {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                                <label key={size} className="flex items-center gap-2">
                                    <input type="checkbox" name="sizes" value={size} defaultChecked={['M', 'L'].includes(size)} />
                                    <span className="text-sm font-mono">{size}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Stock Status */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                            Estado del Stock
                        </label>
                        <select
                            name="stock_status"
                            className="w-full bg-industrial-light border border-industrial-gray/30 p-3 text-sm font-mono focus:border-industrial-warning outline-none"
                        >
                            <option value="available">Disponible</option>
                            <option value="out_of_stock">Agotado</option>
                            <option value="pre_order">Pre-orden</option>
                        </select>
                    </div>

                    <div className="pt-6 flex gap-4">
                        <a
                            href="/admin/prendas"
                            className="px-6 py-3 border border-industrial-gray text-industrial-black text-xs font-bold uppercase tracking-widest hover:bg-gray-50 text-center"
                        >
                            Cancelar
                        </a>
                        <button
                            type="submit"
                            className="flex-1 px-6 py-3 bg-industrial-black text-white text-xs font-bold uppercase tracking-widest hover:bg-industrial-gray transition-colors"
                        >
                            Crear Producto
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
