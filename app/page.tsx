import Link from 'next/link';
import Image from 'next/image';
import { createPublicClient } from '@/lib/supabase/server';
import MoodSelector from '@/components/MoodSelector';
import type { ReadyProduct } from '@/lib/types/database';

export const revalidate = 60;

// Mood definitions - these map to category values in the DB
const MOODS = [
    {
        mood: 'rebelde',
        title: 'Rebelde',
        subtitle: 'Calaveras · Punk · Rock · Fire',
        icon: '🔥',
        gradient: 'bg-gradient-to-br from-red-600 via-orange-500 to-yellow-500',
        categories: ['rebelde', 'punk', 'rock', 'calaveras'],
    },
    {
        mood: 'delicado',
        title: 'Delicado',
        subtitle: 'Flores · Mariposas · Naturaleza',
        icon: '🌸',
        gradient: 'bg-gradient-to-br from-pink-400 via-rose-300 to-purple-300',
        categories: ['delicado', 'flores', 'naturaleza', 'botanico'],
    },
    {
        mood: 'geek',
        title: 'Geek',
        subtitle: 'Anime · Gaming · Pixel Art · Sci-Fi',
        icon: '🎮',
        gradient: 'bg-gradient-to-br from-violet-600 via-blue-500 to-cyan-400',
        categories: ['geek', 'anime', 'gaming', 'pixel'],
    },
    {
        mood: 'tierno',
        title: 'Tierno',
        subtitle: 'Animales · Kawaii · Cute · Cartoon',
        icon: '🐾',
        gradient: 'bg-gradient-to-br from-amber-300 via-yellow-200 to-orange-200',
        categories: ['tierno', 'kawaii', 'animales', 'cute'],
    },
    {
        mood: 'minimal',
        title: 'Minimal',
        subtitle: 'Líneas · Geométrico · Abstracto',
        icon: '◯',
        gradient: 'bg-gradient-to-br from-gray-800 via-gray-600 to-gray-400',
        categories: ['minimal', 'geometrico', 'abstracto', 'lineas'],
    },
    {
        mood: 'custom',
        title: 'Tu Diseño',
        subtitle: 'Trae tu imagen · Hazlo único',
        icon: '✨',
        gradient: 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500',
        categories: [],
    },
];

export default async function Home() {
    const supabase = createPublicClient();
    let recentDesigns: any[] = [];
    let recommendedProducts: ReadyProduct[] = [];

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
                        <span className="font-mono text-[10px] tracking-[0.3em] uppercase">Prendas bordadas listas para pedir</span>
                    </div>

                    <h1 className="font-heading font-black text-5xl md:text-7xl lg:text-8xl tracking-tighter mb-6 uppercase leading-[0.9]">
                        Bordados
                        <br />
                        <span className="text-industrial-warning">ya armados</span>
                        <br />
                        <span className="text-3xl md:text-4xl lg:text-5xl tracking-tight font-bold text-gray-500">para usar hoy</span>
                    </h1>

                    <p className="font-mono text-xs md:text-sm text-gray-500 mb-10 max-w-md mx-auto tracking-widest uppercase leading-relaxed">
                        Elige una prenda con diseño listo.
                        <br />
                        Confirma talla y color por WhatsApp.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/shop"
                            className="inline-flex items-center justify-center gap-2 bg-industrial-warning text-industrial-black font-bold text-sm px-8 py-4 uppercase tracking-widest hover:bg-white transition-colors duration-300"
                        >
                            <span>Ver tienda</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        </Link>
                        <Link
                            href="#moods"
                            className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-bold text-sm px-8 py-4 uppercase tracking-widest hover:bg-white/10 transition-colors duration-300"
                        >
                            Explorar estilos
                        </Link>
                    </div>
                </div>

                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-industrial-light to-transparent" />
            </section>

            {recommendedProducts.length > 0 && (
                <section className="py-16 md:py-24 px-4 bg-white border-b border-industrial-gray/10">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
                            <div>
                                <p className="font-mono text-[10px] text-industrial-gray uppercase tracking-widest mb-3">
                                    Listo para pedir
                                </p>
                                <h2 className="font-heading font-black text-3xl md:text-5xl uppercase tracking-tighter text-industrial-black">
                                    Recomendados
                                </h2>
                            </div>
                            <Link
                                href="/shop"
                                className="inline-flex items-center justify-center border border-industrial-black px-5 py-3 text-xs font-bold uppercase tracking-widest hover:bg-industrial-black hover:text-white transition-colors"
                            >
                                Ver tienda
                            </Link>
                        </div>

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
                                                Comprar
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ─── Mood Selector ─── */}
            <section id="moods" className="py-20 md:py-28 px-4 bg-industrial-light scroll-mt-16">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-12 md:mb-16">
                        <h2 className="font-heading font-black text-3xl md:text-5xl uppercase tracking-tighter text-industrial-black mb-3">
                            Compra por <span className="text-industrial-warning">estilo</span>
                        </h2>
                        <p className="font-mono text-xs md:text-sm text-industrial-gray uppercase tracking-widest max-w-lg">
                            Usa estas rutas para encontrar prendas armadas por mood, drop o campaña.
                        </p>
                    </div>

                    <MoodSelector moods={MOODS} designs={recentDesigns} />
                </div>
            </section>

            {/* ─── How It Works ─── */}
            <section className="py-20 md:py-28 px-4 bg-white border-t border-industrial-gray/10">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="font-heading font-black text-3xl md:text-4xl uppercase tracking-tighter text-industrial-black mb-3">
                            Cómo <span className="text-industrial-warning">Funciona</span>
                        </h2>
                        <p className="font-mono text-xs text-industrial-gray uppercase tracking-widest">
                            3 pasos simples · Menos dudas antes de comprar
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                        {[
                            {
                                step: '01',
                                title: 'Elige',
                                description: 'Selecciona una prenda armada con fotos finales y precio claro.',
                                icon: '🎨',
                            },
                            {
                                step: '02',
                                title: 'Confirma',
                                description: 'Escoge talla y color disponibles, luego confirma el pedido por WhatsApp.',
                                icon: '⚙️',
                            },
                            {
                                step: '03',
                                title: 'Recibe',
                                description: 'Lo producimos bajo pedido y coordinamos la entrega contigo.',
                                icon: '📦',
                            },
                        ].map((item, i) => (
                            <div key={i} className="group text-center relative">
                                {/* Connection line */}
                                {i < 2 && (
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
                            Ver Recomendados
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
