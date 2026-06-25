import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { BaseProduct, GarmentMockup } from '@/lib/types/database';
import { updateProductPublication } from '@/lib/actions/products';

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

    if (product.is_active && publishedCount > 0) {
        return {
            label: 'Publicada',
            detail: 'La prenda ya puede venderse en la tienda.',
            className: 'border-green-500 text-green-700 bg-green-50',
        };
    }

    if (publishedCount > 0) {
        return {
            label: 'Lista para activar',
            detail: 'Ya tiene mockup publicado, falta activar la prenda.',
            className: 'border-industrial-warning text-industrial-black bg-industrial-warning/10',
        };
    }

    if (calibratedCount > 0) {
        return {
            label: 'En revision',
            detail: 'Tiene calibracion guardada, falta publicar un mockup.',
            className: 'border-blue-400 text-blue-700 bg-blue-50',
        };
    }

    if (mockups.length > 0) {
        return {
            label: 'Pendiente de calibrar',
            detail: 'Ya hay mockups, falta calibrar una zona bordable.',
            className: 'border-red-300 text-red-700 bg-red-50',
        };
    }

    return {
        label: 'Sin mockups',
        detail: 'Agrega mockups antes de publicar esta prenda.',
        className: 'border-gray-300 text-gray-500 bg-gray-50',
    };
}

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
                            {product.slug} / {product.product_type || 'sin tipo'}
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
                                disabled={!product.is_active && publishedCount === 0}
                                className="w-full border border-current px-3 py-2 text-[10px] font-bold uppercase tracking-widest disabled:opacity-40"
                            >
                                {product.is_active ? 'Desactivar prenda' : 'Activar prenda'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6">
                <aside className="space-y-6">
                    <section className="bg-white border border-industrial-gray/20 p-5">
                        <div className="aspect-[4/5] bg-gray-100 border border-industrial-gray/10 overflow-hidden mb-5">
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
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
