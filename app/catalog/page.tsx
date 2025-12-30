import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';

export const revalidate = 0; // Ensure fresh data on every request (or use a short revalidate time)

export default async function CatalogPage() {
    const supabase = await createClient();
    let products = [];

    if (supabase) {
        const { data, error } = await supabase
            .from('base_products')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            products = data;
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <header className="mb-12">
                <h1 className="font-heading font-black text-4xl uppercase tracking-tighter mb-4">
                    Catálogo / <span className="text-industrial-warning">Base</span>
                </h1>
                <p className="font-mono text-sm text-industrial-gray max-w-2xl">
                    Selecciona tu prenda base. El lienzo para tu diseño.
                    <br />
                    (Todas las prendas son personalizables en el siguiente paso).
                </p>
            </header>

            {products.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-industrial-gray/30">
                    <p className="font-mono text-lg text-industrial-gray">No hay productos disponibles por el momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {products.map((product) => (
                        <Link
                            key={product.id}
                            href={`/product/${product.slug}`}
                            className="group block border border-transparent hover:border-industrial-gray/20 p-4 transition-all duration-300 bg-white"
                        >
                            <div className="aspect-[4/5] relative bg-gray-100 mb-4 overflow-hidden">
                                {product.image_url ? (
                                    <Image
                                        src={product.image_url}
                                        alt={product.name}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300 font-mono text-xs">
                                        NO IMAGE
                                    </div>
                                )}
                                {product.stock_status !== 'available' && (
                                    <div className="absolute top-2 right-2 bg-industrial-black text-industrial-white text-[10px] font-bold px-2 py-1 uppercase tracking-widest">
                                        {product.stock_status === 'out_of_stock' ? 'Agotado' : 'Pre-Order'}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg uppercase tracking-tight group-hover:text-industrial-warning transition-colors">
                                        {product.name}
                                    </h3>
                                    <p className="font-mono text-xs text-industrial-gray mt-1">
                                        Desde ${product.base_price}
                                    </p>
                                </div>
                                <div className="w-8 h-8 rounded-full border border-industrial-black flex items-center justify-center group-hover:bg-industrial-black group-hover:text-industrial-white transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
