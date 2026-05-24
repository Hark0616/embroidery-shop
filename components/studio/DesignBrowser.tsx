'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { EmbroideryDesign } from '@/lib/types/database';

// Mood → Categories mapping (must match homepage)
const MOOD_MAP: Record<string, string[]> = {
    rebelde: ['rebelde', 'punk', 'rock', 'calaveras'],
    delicado: ['delicado', 'flores', 'naturaleza', 'botanico'],
    geek: ['geek', 'anime', 'gaming', 'pixel'],
    tierno: ['tierno', 'kawaii', 'animales', 'cute'],
    minimal: ['minimal', 'geometrico', 'abstracto', 'lineas'],
};

const MOOD_LABELS: Record<string, { label: string; icon: string }> = {
    rebelde: { label: 'Rebelde', icon: '🔥' },
    delicado: { label: 'Delicado', icon: '🌸' },
    geek: { label: 'Geek', icon: '🎮' },
    tierno: { label: 'Tierno', icon: '🐾' },
    minimal: { label: 'Minimal', icon: '◯' },
};

interface DesignBrowserProps {
    designs: EmbroideryDesign[];
    categories: string[];
}

export default function DesignBrowser({ designs, categories }: DesignBrowserProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const productContext = searchParams.get('product');
    const moodParam = searchParams.get('mood');

    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('All');
    const [activeMood, setActiveMood] = useState<string | null>(moodParam);
    const [hoveredDesign, setHoveredDesign] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync mood from URL
    useEffect(() => {
        if (moodParam && MOOD_MAP[moodParam]) {
            setActiveMood(moodParam);
        }
    }, [moodParam]);

    const filteredDesigns = useMemo(() => {
        return designs.filter(d => {
            const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());

            // Mood filter
            if (activeMood && MOOD_MAP[activeMood]) {
                const moodCategories = MOOD_MAP[activeMood];
                const matchesMood = moodCategories.some(cat =>
                    d.category?.toLowerCase().includes(cat.toLowerCase())
                );
                return matchesSearch && matchesMood;
            }

            // Category filter
            const matchesCategory = activeCategory === 'All' || d.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [designs, search, activeCategory, activeMood]);

    const handleDesignClick = (designId: string) => {
        if (productContext) {
            router.push(`/studio?product=${productContext}&design=${designId}`);
        } else {
            router.push(`/studio?design=${designId}`);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setMousePos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            });
        }
    };

    const clearMood = () => {
        setActiveMood(null);
        const params = new URLSearchParams(searchParams.toString());
        params.delete('mood');
        const newUrl = params.toString() ? `/designs?${params.toString()}` : '/designs';
        router.replace(newUrl, { scroll: false });
    };

    // Check if design is "new" (created within last 7 days)
    const isNew = (createdAt: string) => {
        const diff = Date.now() - new Date(createdAt).getTime();
        return diff < 7 * 24 * 60 * 60 * 1000;
    };

    return (
        <div ref={containerRef} onMouseMove={handleMouseMove}>
            {/* Active Mood Banner */}
            <AnimatePresence>
                {activeMood && MOOD_LABELS[activeMood] && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 overflow-hidden"
                    >
                        <div className="flex items-center justify-between bg-industrial-black text-white p-4">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{MOOD_LABELS[activeMood].icon}</span>
                                <div>
                                    <p className="font-heading font-bold text-sm uppercase tracking-widest">
                                        Mood: {MOOD_LABELS[activeMood].label}
                                    </p>
                                    <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">
                                        {filteredDesigns.length} diseños encontrados
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={clearMood}
                                className="text-xs font-mono text-gray-400 hover:text-industrial-warning transition-colors uppercase tracking-widest flex items-center gap-1"
                            >
                                <span>✕</span> Ver todos
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search and Filter Controls */}
            <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-md py-4 border-b border-industrial-gray/10 mb-8">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    {/* Search */}
                    <div className="relative w-full md:w-96">
                        <input
                            type="text"
                            placeholder="Buscar diseño (ej. Anime, Calavera...)"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-industrial-gray/20 focus:outline-none focus:border-industrial-black text-xs tracking-widest font-mono bg-white transition-colors"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black text-xs"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Categories (only show if no mood active) */}
                    {!activeMood && (
                        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                            <button
                                onClick={() => setActiveCategory('All')}
                                className={`px-4 py-1.5 text-[10px] uppercase font-bold tracking-widest border whitespace-nowrap transition-all duration-300
                                    ${activeCategory === 'All'
                                        ? 'bg-industrial-black text-white border-industrial-black'
                                        : 'bg-white text-industrial-gray border-industrial-gray/20 hover:border-industrial-black'}`}
                            >
                                Todos ({designs.length})
                            </button>
                            {categories.map(cat => {
                                const count = designs.filter(d => d.category === cat).length;
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`px-4 py-1.5 text-[10px] uppercase font-bold tracking-widest border whitespace-nowrap transition-all duration-300
                                            ${activeCategory === cat
                                                ? 'bg-industrial-black text-white border-industrial-black'
                                                : 'bg-white text-industrial-gray border-industrial-gray/20 hover:border-industrial-black'}`}
                                    >
                                        {cat} ({count})
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Mood chips (if mood active, show as removable chip) */}
                    {activeMood && (
                        <div className="flex gap-2">
                            {Object.entries(MOOD_LABELS).map(([key, { label, icon }]) => (
                                <button
                                    key={key}
                                    onClick={() => {
                                        setActiveMood(key);
                                        router.replace(`/designs?mood=${key}`, { scroll: false });
                                    }}
                                    className={`px-4 py-1.5 text-[10px] uppercase font-bold tracking-widest border whitespace-nowrap transition-all duration-300
                                        ${activeMood === key
                                            ? 'bg-industrial-black text-white border-industrial-black'
                                            : 'bg-white text-industrial-gray border-industrial-gray/20 hover:border-industrial-black'}`}
                                >
                                    {icon} {label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Results counter */}
            <div className="mb-6 flex items-center justify-between">
                <p className="font-mono text-[10px] text-industrial-gray uppercase tracking-widest">
                    {filteredDesigns.length} diseño{filteredDesigns.length !== 1 ? 's' : ''}
                    {search && ` · "${search}"`}
                </p>
                {productContext && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-industrial-warning/10 border border-industrial-warning/30">
                        <span className="text-[10px] font-mono text-industrial-black uppercase tracking-widest">
                            🎯 Seleccionando para tu prenda
                        </span>
                    </div>
                )}
            </div>

            {/* Masonry Grid */}
            {filteredDesigns.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-industrial-gray/20">
                    <div className="text-4xl mb-4">🧵</div>
                    <p className="text-industrial-gray font-mono text-sm mb-2">No se encontraron diseños</p>
                    <p className="text-industrial-gray/60 font-mono text-xs">
                        {search ? 'Intenta con otra búsqueda' : 'Pronto agregaremos más diseños'}
                    </p>
                    {(search || activeMood) && (
                        <button
                            onClick={() => { setSearch(''); clearMood(); setActiveCategory('All'); }}
                            className="mt-4 text-xs font-bold uppercase tracking-widest text-industrial-warning hover:text-industrial-black transition-colors"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
            ) : (
                <div className="masonry-grid">
                    {filteredDesigns.map((design, index) => (
                        <motion.div
                            key={design.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.4) }}
                            className="masonry-item"
                        >
                            <div
                                onClick={() => handleDesignClick(design.id)}
                                onMouseEnter={() => setHoveredDesign(design.id)}
                                onMouseLeave={() => setHoveredDesign(null)}
                                className="group cursor-pointer bg-white border border-transparent hover:border-industrial-gray/20 transition-all duration-300 hover:shadow-xl overflow-hidden"
                            >
                                {/* Image container with varying aspect ratios for masonry effect */}
                                <div
                                    className="relative overflow-hidden bg-gray-50"
                                    style={{
                                        aspectRatio: index % 5 === 0 ? '3/4' : index % 3 === 0 ? '1/1' : '4/5',
                                    }}
                                >
                                    {design.image_url ? (
                                        <Image
                                            src={design.image_url}
                                            alt={design.name}
                                            fill
                                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                            className="object-contain p-6 group-hover:scale-110 transition-transform duration-700 mix-blend-multiply"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300 font-mono text-xs">
                                            NO IMAGE
                                        </div>
                                    )}

                                    {/* Badges */}
                                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                                        {isNew(design.created_at) && (
                                            <span className="badge-shine bg-industrial-warning text-industrial-black text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest">
                                                Nuevo
                                            </span>
                                        )}
                                    </div>

                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-industrial-black/0 group-hover:bg-industrial-black/5 transition-colors duration-300" />

                                    {/* Action button on hover */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                        <div className="bg-industrial-black text-white px-5 py-2.5 text-xs font-bold uppercase tracking-widest transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300 shadow-lg">
                                            {productContext ? '✓ Seleccionar' : '→ Personalizar'}
                                        </div>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-4">
                                    <h3 className="font-bold text-sm uppercase tracking-tight group-hover:text-industrial-warning transition-colors duration-300 leading-tight">
                                        {design.name}
                                    </h3>
                                    <div className="flex items-center justify-between mt-2">
                                        <p className="font-mono text-[10px] text-industrial-gray uppercase tracking-widest">
                                            {design.category}
                                        </p>
                                        {design.dimensions && (
                                            <p className="font-mono text-[10px] text-industrial-gray/50 uppercase">
                                                {design.dimensions}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
