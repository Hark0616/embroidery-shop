'use server'

import { createProduct } from '@/lib/actions/products'
import { COLOR_DATABASE } from '@/lib/colors'

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

                    <input type="hidden" name="product_type" value="apparel" />

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

                    {/* Colores y Tallas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                                Colores disponibles
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-industrial-light border border-industrial-gray/20 p-3 max-h-48 overflow-y-auto">
                                {COLOR_DATABASE.map((color) => {
                                    const isChecked = ['Negro', 'Blanco', 'Gris'].includes(color.name);
                                    return (
                                        <label key={color.name} className="flex items-center gap-2 cursor-pointer select-none hover:bg-gray-150/40 p-1 rounded transition-colors">
                                            <input
                                                type="checkbox"
                                                name="colors"
                                                value={color.name}
                                                defaultChecked={isChecked}
                                                className="w-3.5 h-3.5 rounded text-industrial-warning focus:ring-industrial-warning accent-industrial-black"
                                            />
                                            <span 
                                                className="w-3.5 h-3.5 rounded-full border border-gray-300 inline-block flex-shrink-0"
                                                style={{ backgroundColor: color.hex }}
                                            />
                                            <span className="text-[10px] font-mono uppercase tracking-tight text-industrial-black">{color.name}</span>
                                        </label>
                                    );
                                })}
                            </div>
                            <p className="text-[9px] text-gray-500 mt-1">Selecciona los colores que estarán activos en la tienda.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-industrial-gray mb-2">
                                Tallas disponibles
                            </label>
                            <div className="grid grid-cols-2 gap-2 bg-industrial-light border border-industrial-gray/20 p-3">
                                {['S', 'M', 'L', 'XL', 'XXL'].map((size) => {
                                    const isChecked = ['M', 'L'].includes(size);
                                    return (
                                        <label key={size} className="flex items-center gap-2 cursor-pointer select-none hover:bg-gray-150/40 p-1 rounded transition-colors">
                                            <input
                                                type="checkbox"
                                                name="sizes"
                                                value={size}
                                                defaultChecked={isChecked}
                                                className="w-3.5 h-3.5 rounded text-industrial-warning focus:ring-industrial-warning accent-industrial-black"
                                            />
                                            <span className="text-[10px] font-mono uppercase tracking-tight text-industrial-black">{size}</span>
                                        </label>
                                    );
                                })}
                            </div>
                            <p className="text-[9px] text-gray-500 mt-1">Selecciona las tallas activas para esta prenda.</p>
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
            <script dangerouslySetInnerHTML={{ __html: `
                document.querySelector('form').addEventListener('submit', function(e) {
                    const colors = document.querySelectorAll('input[name="colors"]:checked');
                    const sizes = document.querySelectorAll('input[name="sizes"]:checked');
                    if (colors.length === 0) {
                        alert('Debes seleccionar al menos un color para el producto.');
                        e.preventDefault();
                        return false;
                    }
                    if (sizes.length === 0) {
                        alert('Debes seleccionar al menos una talla para el producto.');
                        e.preventDefault();
                        return false;
                    }
                });
            ` }} />
        </div>
    )
}
