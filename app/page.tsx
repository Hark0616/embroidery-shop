import Link from 'next/link';
import Image from 'next/image';
import { createPublicClient } from '@/lib/supabase/server';
import MoodSelector from '@/components/MoodSelector';
import type { ReadyProduct } from '@/lib/types/database';
import { MOOD_DEFINITIONS } from '@/lib/moods/catalog';
import { getWhatsAppConfig } from '@/lib/actions/config';
import { buildWhatsAppContactUrl } from '@/lib/config/whatsapp';

export const revalidate = 60;

export default async function Home() {
    const supabase = createPublicClient();
    let recentDesigns: any[] = [];
    let recommendedProducts: ReadyProduct[] = [];
    const whatsapp = await getWhatsAppConfig();
    const contactHref = buildWhatsAppContactUrl(whatsapp.phone, whatsapp.message);

    if (supabase) {
        const [{ data }, { data: readyProducts }] = await Promise.all([
            supabase
                .from('embroidery_designs')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(6),
            supabase
                .from('ready_products')
                .select('*')
                .in('status', ['published', 'sold_out'])
                .order('is_featured', { ascending: false })
                .order('sort_order')
                .order('created_at', { ascending: false })
                .limit(6),
        ]);

        if (data) recentDesigns = data;
        if (readyProducts) recommendedProducts = readyProducts as ReadyProduct[];
    }

    return (
        <div className="flex flex-col">
            {/* ─── Hero Section ─── */}
            <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-industrial-black text-industrial-white">
                {/* Background gradient */}
                <div className="absolute inset-0 z-0">
                    <div className="w-full h-full bg-gradient-to-br from-industrial-gray via-industrial-black to-industrial-black" />
                    {/* Subtle dot grid */}
                    <div
                        className="absolute inset-0 opacity-[0.07]"
                        style={{
                            backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
                            backgroundSize: '30px 30px',
                        }}
                    />
                </div>

                {/* Decorative thread lines */}
                <div className="absolute top-20 left-10 w-px h-40 bg-gradient-to-b from-transparent via-industrial-warning/30 to-transparent" />
                <div className="absolute bottom-20 right-10 w-px h-60 bg-gradient-to-b from-transparent via-industrial-warning/20 to-transparent" />
                <div className="absolute top-1/3 right-1/4 w-40 h-px bg-gradient-to-r from-transparent via-industrial-warning/15 to-transparent" />

                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                    {/* Craft badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 border border-industrial-warning/30 text-industrial-warning">
                        <span className="w-1.5 h-1.5 bg-industrial-warning rounded-full animate-pulse" />
                        <span className="font-mono text-[10px] tracking-[0.3em] uppercase">Drops listos para pedir</span>
                    </div>

                    <h1 className="font-heading font-black text-5xl md:text-7xl lg:text-8xl tracking-tighter mb-6 uppercase leading-[0.9]">
                        Bordados listos{' '}
                        <br />
                        <span className="text-industrial-warning">para pedir</span>
                    </h1>

                    <p className="font-mono text-xs md:text-sm text-gray-500 mb-10 max-w-md mx-auto tracking-widest uppercase leading-relaxed">
                        Elige una prenda ya armada o personaliza la tuya desde nuestro catálogo de diseños.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/shop"
                            className="inline-flex items-center justify-center gap-2 bg-industrial-warning text-industrial-black font-bold text-sm px-8 py-4 uppercase tracking-widest hover:bg-white transition-colors duration-300"
                        >
                            <span>Ver drops listos</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        </Link>
                        <Link
                            href="/designs"
                            className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-bold text-sm px-8 py-4 uppercase tracking-widest hover:bg-white/10 transition-colors duration-300"
                        >
                            Crear uno personalizado
                        </Link>
                    </div>
                </div>

                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-industrial-light to-transparent" />
            </section>

            <section className="py-16 md:py-24 px-4 bg-white border-b border-industrial-gray/10">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
                        <div>
                            <p className="font-mono text-[10px] text-industrial-gray uppercase tracking-widest mb-3">
                                Listo para pedir
                            </p>
                            <h2 className="font-heading font-black text-3xl md:text-5xl uppercase tracking-tighter text-industrial-black">
                                Drops destacados
                            </h2>
                        </div>
                        <Link
                            href="/shop"
                            className="inline-flex items-center justify-center border border-industrial-black px-5 py-3 text-xs font-bold uppercase tracking-widest hover:bg-industrial-black hover:text-white transition-colors"
                        >
                            Ver todos los drops
                        </Link>
                    </div>

                    {recommendedProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {recommendedProducts.map(product => (
                                <Link
                                    key={product.id}
                                    href={`/shop/${product.slug}`}
                                    className="group"
                                >
                                    <div className="relative aspect-[4/5] bg-gray-100 overflow-hidden border border-industrial-gray/10">
                                        <Image
                                            src={product.hero_image_url}
                                            alt={product.name}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                        {product.status === 'sold_out' && (
                                            <span className="absolute top-3 right-3 bg-industrial-black text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1">
                                                Agotado
                                            </span>
                                        )}
                                    </div>
                                    <div className="py-4">
                                        <h3 className="font-bold text-lg uppercase tracking-tight group-hover:text-industrial-warning transition-colors">
                                            {product.name}
                                        </h3>
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="font-mono text-sm text-industrial-black">
                                                ${Number(product.price || 0).toLocaleString('es-CO')}
                                            </p>
                                            <span className="font-mono text-[10px] uppercase tracking-widest text-industrial-gray">
                                                Ver drop
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="border border-dashed border-industrial-gray/30 px-6 py-12 md:py-16 text-center">
                            <p className="font-mono text-xs uppercase tracking-widest text-industrial-gray max-w-xl mx-auto leading-relaxed">
                                Estamos preparando nuevos drops listos. Mientras tanto puedes pedir por WhatsApp o crear uno personalizado desde el catálogo.
                            </p>
                            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                                <Link
                                    href={contactHref}
                                    target="_blank"
                                    className="inline-flex w-full sm:w-auto items-center justify-center bg-industrial-black text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-industrial-warning hover:text-industrial-black transition-colors"
                                >
                                    Pedir por WhatsApp
                                </Link>
                                <Link
                                    href="/designs"
                                    className="inline-flex w-full sm:w-auto items-center justify-center border border-industrial-black px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-industrial-black hover:text-white transition-colors"
                                >
                                    Crear uno personalizado
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* ─── Mood Selector ─── */}
            <section id="moods" className="py-20 md:py-28 px-4 bg-industrial-light scroll-mt-16">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-12 md:mb-16">
                        <h2 className="font-heading font-black text-3xl md:text-5xl uppercase tracking-tighter text-industrial-black mb-3">
                            Personaliza por <span className="text-industrial-warning">estilo</span>
                        </h2>
                        <p className="font-mono text-xs md:text-sm text-industrial-gray uppercase tracking-widest max-w-lg">
                            Elige un estilo, selecciona un diseño del catálogo y luego llévalo al Studio para ponerlo en una prenda.
                        </p>
                    </div>

                    <MoodSelector moods={MOOD_DEFINITIONS} designs={recentDesigns} />
                </div>
            </section>

            {/* ─── How It Works ─── */}
            <section className="py-20 md:py-28 px-4 bg-white border-t border-industrial-gray/10">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="font-heading font-black text-3xl md:text-4xl uppercase tracking-tighter text-industrial-black mb-3">
                            Dos formas <span className="text-industrial-warning">de pedir</span>
                        </h2>
                        <p className="font-mono text-xs text-industrial-gray uppercase tracking-widest">
                            Compra listo o arma el tuyo
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                        {[
                            {
                                step: '01',
                                title: 'Comprar listo',
                                description: 'Ves el resultado final, eliges talla y color, y confirmas el pedido por WhatsApp.',
                                icon: '🎨',
                            },
                            {
                                step: '02',
                                title: 'Personaliza',
                                description: 'Entras al catálogo de diseños, escoges un estilo y lo llevas a una prenda base.',
                                icon: '⚙️',
                            },
                        ].map((item, i) => (
                            <div key={i} className="group text-center relative">
                                {/* Connection line */}
                                {i < 1 && (
                                    <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px border-t border-dashed border-industrial-gray/20" />
                                )}
                                <div className="text-4xl mb-6 transform group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300">
                                    {item.icon}
                                </div>
                                <div className="font-mono text-[10px] text-industrial-warning tracking-widest mb-2">
                                    PASO {item.step}
                                </div>
                                <h3 className="font-heading font-black text-xl uppercase tracking-tighter mb-3">
                                    {item.title}
                                </h3>
                                <p className="font-mono text-xs text-industrial-gray leading-relaxed max-w-[240px] mx-auto">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-16">
                        <Link
                            href="/shop"
                            className="inline-flex items-center gap-2 bg-industrial-black text-white font-bold text-sm px-10 py-4 uppercase tracking-widest hover:bg-industrial-warning hover:text-industrial-black transition-colors duration-300"
                        >
                            Ver Drops Listos
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
