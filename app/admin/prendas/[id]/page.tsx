import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { BaseProduct, GarmentMockup } from '@/lib/types/database';
import { updateProductPublication, deleteProductAction, updateProductDetails } from '@/lib/actions/products';
import { deleteMockupAction } from '@/lib/actions/mockups';
import DeleteButton from '@/components/admin/DeleteButton';
import { COLOR_DATABASE } from '@/lib/colors';

function getSurfaceCount(mockup: GarmentMockup) {
    if (!mockup.surfaces || typeof mockup.surfaces !== 'object' || Array.isArray(mockup.surfaces)) {
        return 0;
    }

    return Object.keys(mockup.surfaces).length;
}

function getMockupStatus(mockup: GarmentMockup) {
    const surfaceCount = getSurfaceCount(mockup);

    if (mockup.is_public && mockup.status === 'published') {
        return {
            label: 'Publicado',
            className: 'border-green-500 text-green-700 bg-green-50',
        };
    }

    if (surfaceCount > 0) {
        return {
            label: 'Calibrado privado',
            className: 'border-industrial-warning text-industrial-black bg-industrial-warning/10',
        };
    }

    return {
        label: 'Pendiente',
        className: 'border-red-300 text-red-700 bg-red-50',
    };
}

function getProductReadiness(product: BaseProduct, mockups: GarmentMockup[]) {
    const calibratedCount = mockups.filter(mockup => getSurfaceCount(mockup) > 0).length;
    const publishedCount = mockups.filter(mockup => mockup.is_public && mockup.status === 'published').length;

    if (product.is_active) {
        return {
            label: 'Publicada',
            detail: 'La prenda está activa en la tienda.',
            className: 'border-green-500 text-green-700 bg-green-50',
        };
    }

    if (publishedCount > 0) {
        return {
            label: 'Listo para activar',
            detail: 'Tiene mockups listos. Falta activar la prenda.',
            className: 'border-industrial-warning text-industrial-black bg-industrial-warning/10',
        };
    }

    return {
        label: 'Borrador',
        detail: 'Falta activar la prenda para mostrarla en tienda.',
        className: 'border-gray-300 text-gray-500 bg-gray-50',
    };
}

const PRODUCT_TYPE_LABELS: Record<string, string> = {
    camiseta: 'Camiseta',
    hoodie: 'Hoodie',
    gorra: 'Gorra',
    blusa: 'Blusa',
    tote: 'Tote / Bolso',
    apparel: 'Ropa / General',
    otro: 'Otro',
};

export default async function EditPrendaPage({ params }: { params: { id: string } }) {
    const supabase = await createClient();
    
    if (!supabase) {
        notFound();
    }

    const [{ data: product }, { data: mockups }] = await Promise.all([
        supabase
            .from('base_products')
            .select('*')
            .eq('id', params.id)
            .single(),
        supabase
            .from('garment_mockups')
            .select('*')
            .eq('product_id', params.id)
            .order('sort_order')
            .order('created_at', { ascending: false }),
    ]);

    if (!product) {
        notFound();
    }

    const productMockups = (mockups || []) as GarmentMockup[];
    const readiness = getProductReadiness(product as BaseProduct, productMockups);
    const calibratedCount = productMockups.filter(mockup => getSurfaceCount(mockup) > 0).length;
    const publishedCount = productMockups.filter(mockup => mockup.is_public && mockup.status === 'published').length;
    const firstMockup = productMockups.find(m => m.is_public && m.status === 'published') || productMockups[0];
    const displayImage = firstMockup?.image_url || product.image_url;

    return (
        <div className="p-8 bg-industrial-light min-h-screen">
            <div className="mb-10">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <Link href="/admin/prendas" className="font-mono text-xs text-industrial-gray uppercase tracking-widest hover:text-industrial-black">
                        ← Volver a Prendas
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/studio?product=${product.slug}`}
                            className="px-4 py-3 border border-industrial-gray/30 text-industrial-black text-[10px] font-bold uppercase tracking-widest hover:bg-white"
                        >
                            Probar en Studio
                        </Link>
                        <Link
                            href={`/admin/prendas/${product.id}/mockups/new`}
                            className="px-5 py-3 bg-industrial-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-industrial-gray"
                        >
                            Agregar mockup
                        </Link>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                    <div>
                        <p className="font-mono text-xs text-industrial-gray uppercase tracking-widest mb-2">
                            Gestion de prenda
                        </p>
                        <h1 className="font-heading font-black text-4xl uppercase tracking-tighter text-industrial-black">
                            {product.name}
                        </h1>
                        <p className="font-mono text-xs text-industrial-gray mt-2 uppercase tracking-widest">
                            {product.slug} / {PRODUCT_TYPE_LABELS[product.product_type || ''] || product.product_type || 'sin tipo'}
                        </p>
                    </div>
                    <div className={`border px-4 py-3 ${readiness.className}`}>
                        <p className="font-bold text-xs uppercase tracking-widest">{readiness.label}</p>
                        <p className="font-mono text-[10px] uppercase tracking-widest mt-1">{readiness.detail}</p>
                        <form action={updateProductPublication} className="mt-3">
                            <input type="hidden" name="product_id" value={product.id} />
                            <input type="hidden" name="intent" value={product.is_active ? 'deactivate' : 'activate'} />
                            <button
                                type="submit"
                                className="w-full border border-current px-3 py-2 text-[10px] font-bold uppercase tracking-widest"
                            >
                                {product.is_active ? 'Desactivar prenda' : 'Activar prenda'}
                            </button>
                        </form>
                        <div className="mt-2">
                            <DeleteButton
                                action={deleteProductAction}
                                payload={{ product_id: product.id }}
                                confirmMessage="¿Estás seguro de que deseas eliminar esta prenda base y todos sus mockups permanentemente?"
                                label="Eliminar Prenda"
                                className="w-full border border-red-500 hover:bg-red-500 hover:text-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-red-500 transition-colors"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6">
                <aside className="space-y-6">
                    <section className="bg-white border border-industrial-gray/20 p-5">
                        <div className="aspect-[4/5] max-w-[240px] mx-auto bg-gray-100 border border-industrial-gray/10 overflow-hidden mb-5">
                            {displayImage ? (
                                <img src={displayImage} alt={product.name} className="w-full h-full object-contain" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 font-mono text-xs">
                                    SIN IMAGEN
                                </div>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="font-mono text-[10px] uppercase tracking-widest text-industrial-gray">Precio base</p>
                                <p className="font-heading font-black text-2xl tracking-tighter">
                                    ${product.base_price?.toLocaleString()}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="border border-industrial-gray/10 p-3">
                                    <p className="font-mono text-[10px] uppercase tracking-widest text-industrial-gray">Stock</p>
                                    <p className="font-bold text-xs uppercase tracking-widest mt-1">{product.stock_status}</p>
                                </div>
                                <div className="border border-industrial-gray/10 p-3">
                                    <p className="font-mono text-[10px] uppercase tracking-widest text-industrial-gray">Web</p>
                                    <p className="font-bold text-xs uppercase tracking-widest mt-1">{product.is_active ? 'Activa' : 'Borrador'}</p>
                                </div>
                            </div>
                            <div>
                                <p className="font-mono text-[10px] uppercase tracking-widest text-industrial-gray mb-2">Colores</p>
                                <div className="flex flex-wrap gap-2">
                                    {product.colors?.map((color: string) => (
                                        <span key={color} className="border border-industrial-gray/10 px-2 py-1 text-[10px] font-mono uppercase tracking-widest">
                                            {color}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="font-mono text-[10px] uppercase tracking-widest text-industrial-gray mb-2">Tallas</p>
                                <div className="flex flex-wrap gap-2">
                                    {product.sizes?.map((size: string) => (
                                        <span key={size} className="border border-industrial-gray/10 px-2 py-1 text-[10px] font-mono uppercase tracking-widest">
                                            {size}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                </aside>

                <main className="space-y-6">
                    <section className="bg-white border border-industrial-gray/20 p-6">
                        <h2 className="font-heading font-black text-xl uppercase tracking-tighter text-industrial-black mb-4">
                            Editar Detalles de la Prenda
                        </h2>
                        <form action={updateProductDetails} className="space-y-4">
                            <input type="hidden" name="product_id" value={product.id} />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-industrial-gray mb-1">
                                        Nombre del Producto
                                    </label>
                                    <input
                                        name="name"
                                        type="text"
                                        required
                                        defaultValue={product.name}
                                        className="w-full bg-industrial-light border border-industrial-gray/30 p-2.5 text-sm font-mono outline-none focus:border-industrial-warning"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-industrial-gray mb-1">
                                        Slug (URL)
                                    </label>
                                    <input
                                        name="slug"
                                        type="text"
                                        required
                                        defaultValue={product.slug}
                                        className="w-full bg-industrial-light border border-industrial-gray/30 p-2.5 text-sm font-mono outline-none focus:border-industrial-warning"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-industrial-gray mb-1">
                                        Precio Base ($)
                                    </label>
                                    <input
                                        name="base_price"
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        defaultValue={product.base_price}
                                        className="w-full bg-industrial-light border border-industrial-gray/30 p-2.5 text-sm font-mono outline-none focus:border-industrial-warning"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-industrial-gray mb-1">
                                        Tipo de Prenda
                                    </label>
                                    <select
                                        name="product_type"
                                        defaultValue={product.product_type || 'camiseta'}
                                        className="w-full bg-industrial-light border border-industrial-gray/30 p-2.5 text-sm font-mono outline-none focus:border-industrial-warning"
                                    >
                                        <option value="camiseta">Camiseta</option>
                                        <option value="hoodie">Hoodie</option>
                                        <option value="gorra">Gorra</option>
                                        <option value="blusa">Blusa</option>
                                        <option value="tote">Tote / Bolso</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-industrial-gray mb-1">
                                        Estado de Stock
                                    </label>
                                    <select
                                        name="stock_status"
                                        defaultValue={product.stock_status || 'available'}
                                        className="w-full bg-industrial-light border border-industrial-gray/30 p-2.5 text-sm font-mono outline-none focus:border-industrial-warning"
                                    >
                                        <option value="available">Disponible</option>
                                        <option value="out_of_stock">Agotado</option>
                                        <option value="pre_order">Pre-orden</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-industrial-gray mb-2">
                                        Colores disponibles
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-industrial-light border border-industrial-gray/20 p-3 max-h-48 overflow-y-auto">
                                        {COLOR_DATABASE.map((color) => {
                                            const isChecked = product.colors?.includes(color.name);
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
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-industrial-gray mb-2">
                                        Tallas disponibles
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 bg-industrial-light border border-industrial-gray/20 p-3">
                                        {['S', 'M', 'L', 'XL', 'XXL'].map((size) => {
                                            const isChecked = product.sizes?.includes(size);
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

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    className="px-5 py-3 bg-industrial-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-industrial-warning hover:text-industrial-black transition-colors"
                                >
                                    Guardar Detalles
                                </button>
                            </div>
                        </form>
                    </section>

                    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white border border-industrial-gray/20 p-5">
                            <p className="font-mono text-[10px] uppercase tracking-widest text-industrial-gray">Mockups</p>
                            <p className="font-heading font-black text-4xl tracking-tighter mt-2">{productMockups.length}</p>
                        </div>
                        <div className="bg-white border border-industrial-gray/20 p-5">
                            <p className="font-mono text-[10px] uppercase tracking-widest text-industrial-gray">Calibrados</p>
                            <p className="font-heading font-black text-4xl tracking-tighter mt-2">{calibratedCount}</p>
                        </div>
                        <div className="bg-white border border-industrial-gray/20 p-5">
                            <p className="font-mono text-[10px] uppercase tracking-widest text-industrial-gray">Publicados</p>
                            <p className="font-heading font-black text-4xl tracking-tighter mt-2">{publishedCount}</p>
                        </div>
                    </section>

                    <section className="bg-white border border-industrial-gray/20 p-6">
                        <div className="flex items-center justify-between gap-4 mb-6">
                            <div>
                                <h2 className="font-heading font-black text-2xl uppercase tracking-tighter text-industrial-black">
                                    Mockups de la prenda
                                </h2>
                                <p className="font-mono text-xs text-industrial-gray uppercase tracking-widest mt-1">
                                    Sube vistas reales y calibra las zonas bordables antes de publicar.
                                </p>
                            </div>
                            <Link
                                href={`/admin/prendas/${product.id}/mockups/new`}
                                className="px-5 py-3 bg-industrial-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-industrial-gray"
                            >
                                Agregar mockup
                            </Link>
                        </div>

                        {productMockups.length === 0 ? (
                            <div className="border border-dashed border-industrial-gray/30 p-10 text-center">
                                <h3 className="font-heading font-black text-xl uppercase tracking-tighter mb-2">
                                    Esta prenda aun no tiene mockups
                                </h3>
                                <p className="font-mono text-xs text-industrial-gray uppercase tracking-widest mb-6">
                                    Agrega una foto frontal, espalda o variante de color para empezar a calibrar.
                                </p>
                                <Link
                                    href={`/admin/prendas/${product.id}/mockups/new`}
                                    className="inline-flex px-6 py-4 bg-industrial-black text-white text-xs font-bold uppercase tracking-widest hover:bg-industrial-gray"
                                >
                                    Agregar primer mockup
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                                {productMockups.map((mockup) => {
                                    const status = getMockupStatus(mockup);
                                    const surfaceCount = getSurfaceCount(mockup);

                                    return (
                                        <article key={mockup.id} className="border border-industrial-gray/20 bg-white overflow-hidden">
                                            <div className="aspect-[4/5] bg-gray-100 border-b border-industrial-gray/10">
                                                <img src={mockup.image_url} alt={mockup.name} className="w-full h-full object-contain" />
                                            </div>
                                            <div className="p-4">
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <div>
                                                        <h3 className="font-bold text-sm uppercase tracking-tight">{mockup.name}</h3>
                                                        <p className="font-mono text-[10px] text-industrial-gray uppercase tracking-widest mt-1">
                                                            {mockup.view}{mockup.color_name ? ` / ${mockup.color_name}` : ''}
                                                        </p>
                                                    </div>
                                                    <span className={`inline-block px-2 py-1 text-[9px] uppercase tracking-widest font-bold border whitespace-nowrap ${status.className}`}>
                                                        {status.label}
                                                    </span>
                                                </div>
                                                <p className="font-mono text-[10px] text-industrial-gray uppercase tracking-widest mb-4">
                                                    {surfaceCount} zona{surfaceCount === 1 ? '' : 's'} calibrada{surfaceCount === 1 ? '' : 's'}
                                                </p>
                                                <div className="flex items-center justify-between gap-3">
                                                    <Link href={`/admin/mockups/${mockup.id}`} className="text-industrial-black font-bold uppercase tracking-widest text-xs hover:underline">
                                                        Calibrar
                                                    </Link>
                                                    <Link href={`/studio?product=${product.slug}`} className="text-industrial-gray font-bold uppercase tracking-widest text-xs hover:text-industrial-black hover:underline">
                                                        Vista previa
                                                    </Link>
                                                </div>
                                                <div className="mt-4 pt-3 border-t border-industrial-gray/10 flex justify-end">
                                                    <DeleteButton
                                                        action={deleteMockupAction}
                                                        payload={{ mockup_id: mockup.id, product_id: product.id }}
                                                        confirmMessage="¿Estás seguro de que deseas eliminar este mockup permanentemente?"
                                                        label="Eliminar mockup"
                                                        className="text-red-500 text-[10px] font-bold text-right uppercase tracking-widest hover:underline"
                                                    />
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </main>
            </div>
        </div>
    );
}
