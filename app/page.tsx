import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import MoodSelector from '@/components/MoodSelector';

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
    const supabase = await createClient();
    let recentDesigns: any[] = [];

    if (supabase) {
        const { data } = await supabase
            .from('embroidery_designs')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(6);

        if (data) recentDesigns = data;
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
                        <span className="font-mono text-[10px] tracking-[0.3em] uppercase">Bordados Personalizados</span>
                    </div>

                    <h1 className="font-heading font-black text-5xl md:text-7xl lg:text-8xl tracking-tighter mb-6 uppercase leading-[0.9]">
                        ¿Qué quieres
                        <br />
                        <span className="text-industrial-warning">expresar</span>
                        <br />
                        <span className="text-3xl md:text-4xl lg:text-5xl tracking-tight font-bold text-gray-500">hoy?</span>
                    </h1>

                    <p className="font-mono text-xs md:text-sm text-gray-500 mb-10 max-w-md mx-auto tracking-widest uppercase leading-relaxed">
                        Elige un estilo. Personaliza tu prenda.
                        <br />
                        Lo bordamos a mano para ti.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="#moods"
                            className="inline-flex items-center justify-center gap-2 bg-industrial-warning text-industrial-black font-bold text-sm px-8 py-4 uppercase tracking-widest hover:bg-white transition-colors duration-300"
                        >
                            <span>Explorar Estilos</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        </Link>
                        <Link
                            href="/studio"
                            className="inline-flex items-center justify-center gap-2 border border-white/30 text-white font-bold text-sm px-8 py-4 uppercase tracking-widest hover:bg-white/10 transition-colors duration-300"
                        >
                            Ir al Studio
                        </Link>
                    </div>
                </div>

                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-industrial-light to-transparent" />
            </section>

            {/* ─── Mood Selector ─── */}
            <section id="moods" className="py-20 md:py-28 px-4 bg-industrial-light scroll-mt-16">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-12 md:mb-16">
                        <h2 className="font-heading font-black text-3xl md:text-5xl uppercase tracking-tighter text-industrial-black mb-3">
                            Elige tu <span className="text-industrial-warning">Vibe</span>
                        </h2>
                        <p className="font-mono text-xs md:text-sm text-industrial-gray uppercase tracking-widest max-w-lg">
                            Selecciona el estilo que más te representa. Cada uno tiene una colección de diseños curados para ti.
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
                            3 pasos simples · Tu prenda única en días
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                        {[
                            {
                                step: '01',
                                title: 'Elige',
                                description: 'Selecciona un diseño de nuestra biblioteca o sube el tuyo propio.',
                                icon: '🎨',
                            },
                            {
                                step: '02',
                                title: 'Personaliza',
                                description: 'Elige prenda, color, talla y ubicación del bordado en nuestro Studio.',
                                icon: '⚙️',
                            },
                            {
                                step: '03',
                                title: 'Recibe',
                                description: 'Lo bordamos artesanalmente y te lo enviamos. Cada pieza es única.',
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
                            href="/studio"
                            className="inline-flex items-center gap-2 bg-industrial-black text-white font-bold text-sm px-10 py-4 uppercase tracking-widest hover:bg-industrial-warning hover:text-industrial-black transition-colors duration-300"
                        >
                            Empezar a Crear
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
