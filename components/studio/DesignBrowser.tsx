'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { EmbroideryDesign } from '@/lib/types/database';

interface DesignBrowserProps {
    designs: EmbroideryDesign[];
    categories: string[];
}

export default function DesignBrowser({ designs, categories }: DesignBrowserProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const productContext = searchParams.get('product');

    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('All');

    const filteredDesigns = useMemo(() => {
        return designs.filter(d => {
            const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = activeCategory === 'All' || d.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [designs, search, activeCategory]);

    const handleDesignClick = (designId: string) => {
        if (productContext) {
            // If we came from studio (context exists), go back to studio with selection
            router.push(`/studio?product=${productContext}&design=${designId}`);
        } else {
            // If browsing freely, go to studio with just this design
            router.push(`/studio?design=${designId}`);
        }
    };

    return (
        <div>
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
                            className="w-full pl-10 pr-4 py-2 border border-industrial-gray/30 rounded-sm focus:outline-none focus:border-industrial-black uppercase text-xs tracking-widest"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    </div>

                    {/* Categories */}
                    <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                        <button
                            onClick={() => setActiveCategory('All')}
                            className={`px-4 py-1 text-[10px] uppercase font-bold tracking-widest border rounded-full whitespace-nowrap transition-colors
                        ${activeCategory === 'All'
                                    ? 'bg-industrial-black text-white border-industrial-black'
                                    : 'bg-white text-industrial-gray border-industrial-gray/30 hover:border-industrial-black'}`}
                        >
                            Todos
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-1 text-[10px] uppercase font-bold tracking-widest border rounded-full whitespace-nowrap transition-colors
                            ${activeCategory === cat
                                        ? 'bg-industrial-black text-white border-industrial-black'
                                        : 'bg-white text-industrial-gray border-industrial-gray/30 hover:border-industrial-black'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid */}
            {filteredDesigns.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-industrial-gray font-mono">No se encontraron diseños con esos filtros.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredDesigns.map((design) => (
                        <div
                            key={design.id}
                            onClick={() => handleDesignClick(design.id)}
                            className="group cursor-pointer border border-transparent hover:border-industrial-gray/20 p-4 transition-all duration-300 bg-white hover:shadow-lg"
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

                                {/* Action Overlay */}
                                <div className="absolute inset-0 bg-industrial-black/0 group-hover:bg-industrial-black/10 transition-colors flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 bg-white text-industrial-black px-4 py-2 text-xs font-bold uppercase tracking-widest transform translate-y-4 group-hover:translate-y-0 transition-all shadow-sm">
                                        {productContext ? 'Seleccionar' : 'Personalizar'}
                                    </div>
                                </div>
                            </div>

                            <div className="text-center">
                                <h3 className="font-bold text-sm uppercase tracking-tight group-hover:text-industrial-warning transition-colors">
                                    {design.name}
                                </h3>
                                <p className="font-mono text-[10px] text-industrial-gray mt-1 uppercase tracking-widest">
                                    {design.category}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
