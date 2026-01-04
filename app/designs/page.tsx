import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';

export const revalidate = 0;

export default async function DesignsPage() {
    const supabase = await createClient();
    let designs = [];

    if (supabase) {
        const { data, error } = await supabase
            .from('embroidery_designs')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (!error && data) {
            designs = data;
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <header className="mb-12">
                <h1 className="font-heading font-black text-4xl uppercase tracking-tighter mb-4">
                    Catálogo de <span className="text-industrial-warning">Diseños</span>
                </h1>
                <p className="font-mono text-sm text-industrial-gray max-w-2xl">
                    Explora nuestra biblioteca de bordados.
                    <br />
                    Elige uno para probarlo en nuestras prendas.
                </p>
            </header>

            {designs.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-industrial-gray/30">
                    <p className="font-mono text-lg text-industrial-gray">No hay diseños disponibles por el momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {designs.map((design) => (
                        <Link
                            key={design.id}
                            href={`/studio?design=${design.id}`}
                            className="group block border border-transparent hover:border-industrial-gray/20 p-4 transition-all duration-300 bg-white"
                        >
                            <div className="aspect-square relative bg-gray-50 mb-4 overflow-hidden rounded-sm">
                                {design.image_url ? (
                                    <Image
                                        src={design.image_url}
                                        alt={design.name}
                                        fill
                                        className="object-contain p-4 group-hover:scale-110 transition-transform duration-500 mix-blend-multiply"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300 font-mono text-xs">
                                        NO IMAGE
                                    </div>
                                )}
                            </div>

                            <div className="text-center">
                                <h3 className="font-bold text-sm uppercase tracking-tight group-hover:text-industrial-warning transition-colors">
                                    {design.name}
                                </h3>
                                <p className="font-mono text-[10px] text-industrial-gray mt-1 uppercase tracking-widest">
                                    {design.category}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
