'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface VisualizerProps {
    productImage?: string | null;
    designImage?: string | null;
    isLoading?: boolean;
    productName?: string;
    designName?: string;
}

export default function Visualizer({ productImage, designImage, isLoading = false, productName, designName }: VisualizerProps) {
    const [isZoomed, setIsZoomed] = useState(false);

    return (
        <div className="relative">
            {/* Main Visualizer */}
            <div
                className={`relative w-full aspect-[4/5] bg-gray-50 overflow-hidden border border-industrial-gray/10 transition-all duration-500 ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
                    }`}
                onClick={() => setIsZoomed(!isZoomed)}
            >
                {/* Background pattern */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
                        backgroundSize: '16px 16px',
                    }}
                />

                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center bg-gray-50 z-50"
                        >
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-2 border-industrial-black border-t-transparent rounded-full animate-spin" />
                                <span className="font-mono text-[10px] text-industrial-gray uppercase tracking-widest">
                                    Cargando...
                                </span>
                            </div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>

                {/* Base Product Layer */}
                <div className={`absolute inset-0 z-10 flex items-center justify-center transition-transform duration-500 ${isZoomed ? 'scale-150' : 'scale-100'}`}>
                    <AnimatePresence mode="wait">
                        {productImage ? (
                            <motion.div
                                key={productImage}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.4 }}
                                className="relative w-full h-full"
                            >
                                <Image
                                    src={productImage}
                                    alt={productName || 'Base Product'}
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="placeholder"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center gap-4 text-center px-8"
                            >
                                {/* Animated placeholder */}
                                <div className="relative w-24 h-28 border-2 border-dashed border-industrial-gray/20 flex items-center justify-center animate-float">
                                    <span className="text-3xl">👕</span>
                                </div>
                                <div>
                                    <p className="text-industrial-gray font-mono text-xs uppercase tracking-widest mb-1">
                                        Selecciona una prenda
                                    </p>
                                    <p className="text-industrial-gray/50 font-mono text-[10px]">
                                        Tu lienzo personalizable
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Design Layer (Overlay) with embroidery effect */}
                <AnimatePresence>
                    {designImage && productImage && (
                        <motion.div
                            key={designImage}
                            initial={{ opacity: 0, scale: 0.6, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className={`absolute inset-0 z-20 pointer-events-none flex items-center justify-center transition-transform duration-500 ${isZoomed ? 'scale-150' : 'scale-100'}`}
                        >
                            <div className="relative w-[35%] aspect-square embroidery-texture">
                                <Image
                                    src={designImage}
                                    alt={designName || 'Design Overlay'}
                                    fill
                                    className="object-contain"
                                    style={{
                                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15)) drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
                                    }}
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Corner decorations */}
                <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-industrial-gray/15 z-30 pointer-events-none" />
                <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-industrial-gray/15 z-30 pointer-events-none" />
                <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-industrial-gray/15 z-30 pointer-events-none" />
                <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-industrial-gray/15 z-30 pointer-events-none" />

                {/* Zoom indicator */}
                <div className="absolute top-4 right-4 z-30 pointer-events-none">
                    <span className="font-mono text-[9px] text-industrial-gray/40 uppercase tracking-widest">
                        {isZoomed ? '⊖ Zoom out' : '⊕ Zoom in'}
                    </span>
                </div>

                {/* Version tag */}
                <div className="absolute bottom-4 left-4 z-30 font-mono text-[9px] text-industrial-gray/30 uppercase tracking-widest pointer-events-none">
                    Studio v2.0
                </div>
            </div>

            {/* Status bar below visualizer */}
            <div className="flex items-center justify-between mt-3 px-1">
                <div className="flex items-center gap-4">
                    {productImage && (
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span className="font-mono text-[10px] text-industrial-gray uppercase tracking-widest">
                                {productName || 'Prenda'}
                            </span>
                        </div>
                    )}
                    {designImage && (
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-industrial-warning" />
                            <span className="font-mono text-[10px] text-industrial-gray uppercase tracking-widest">
                                {designName || 'Diseño'}
                            </span>
                        </div>
                    )}
                </div>
                {productImage && designImage && (
                    <span className="font-mono text-[10px] text-green-600 uppercase tracking-widest">
                        ✓ Preview listo
                    </span>
                )}
            </div>
        </div>
    );
}
