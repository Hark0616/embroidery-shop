'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import EmbroideryFilters from './EmbroideryFilters';
import QuadWarpOverlay from './QuadWarpOverlay';
import type { CalibrationSurface } from '@/lib/types/database';

interface VisualizerProps {
    productImage?: string | null;
    textureMapImage?: string | null;
    designImage?: string | null;
    isLoading?: boolean;
    productName?: string;
    designName?: string;
    
    // Placement
    positionX?: number; // 0-100
    positionY?: number; // 0-100
    designScale?: number; // 0-100
    rotation?: number; // rotateZ
    rotateX?: number;
    rotateY?: number;
    
    // Admin Mode
    isAdminMode?: boolean;
    onAdminUpdate?: (x: number, y: number) => void;
    
    // Style
    threadFilter?: string;
    placementId?: string;
    calibratedSurface?: CalibrationSurface | null;
    allowFallbackPlacement?: boolean;
}

export default function Visualizer({ 
    productImage, 
    textureMapImage,
    designImage, 
    isLoading = false, 
    productName, 
    designName,
    positionX = 50,
    positionY = 35,
    designScale = 25,
    rotation = 0,
    rotateX = 0,
    rotateY = 0,
    isAdminMode = false,
    onAdminUpdate,
    threadFilter = 'none',
    placementId,
    calibratedSurface = null,
    allowFallbackPlacement = true
}: VisualizerProps) {
    const [isZoomed, setIsZoomed] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // If dragging in admin mode, calculate percentages
    const handleDragEnd = (event: any, info: any) => {
        if (!isAdminMode || !onAdminUpdate || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const rawX = ((info.point.x - rect.left) / rect.width) * 100;
        const rawY = ((info.point.y - rect.top) / rect.height) * 100;
        const newX = Math.max(0, Math.min(100, rawX));
        const newY = Math.max(0, Math.min(100, rawY));
        onAdminUpdate(Number(newX.toFixed(1)), Number(newY.toFixed(1)));
    };

    return (
        <div className="relative sticky top-24" style={{ perspective: '1000px' }}>
            <EmbroideryFilters />
            
            {/* Main Visualizer Container */}
            <div
                ref={containerRef}
                className={`relative w-full aspect-[4/5] bg-gray-50 overflow-hidden border border-industrial-gray/10 transition-all duration-500 ${
                    isAdminMode 
                        ? 'cursor-default' 
                        : isZoomed 
                            ? 'cursor-zoom-out' 
                            : 'cursor-zoom-in'
                }`}
                onClick={(e) => {
                    if (isAdminMode) return;
                    setIsZoomed(!isZoomed);
                }}
            >
                {/* Background pattern */}
                <div
                    className="absolute inset-0 opacity-[0.04] pointer-events-none"
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
                            className="absolute inset-0 flex items-center justify-center bg-gray-50 z-50 pointer-events-none"
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

                {/* THE 3-LAYER SANDWICH */}
                <div className={`absolute inset-0 z-10 flex items-center justify-center transition-transform duration-500 ${isZoomed ? 'scale-150' : 'scale-100'}`}>
                    
                    {/* LAYER 1: Base Product Image */}
                    <AnimatePresence mode="wait">
                        {productImage ? (
                            <motion.div
                                key={`base-${productImage}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4 }}
                                className="absolute inset-0 w-full h-full pointer-events-none"
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
                                className="flex flex-col items-center justify-center gap-4 text-center px-8 w-full h-full pointer-events-none"
                            >
                                <div className="relative w-24 h-28 border-2 border-dashed border-industrial-gray/20 flex items-center justify-center animate-float">
                                    <span className="text-3xl">👕</span>
                                </div>
                                <div>
                                    <p className="text-industrial-gray font-mono text-xs uppercase tracking-widest mb-1">
                                        Selecciona una prenda
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* LAYER 2: Embroidery Design Container */}
                    <div className="absolute inset-0 pointer-events-none" style={{ perspective: '1000px' }}>
                        <AnimatePresence>
                            {designImage && productImage && calibratedSurface ? (
                                <QuadWarpOverlay
                                    imageUrl={designImage}
                                    surface={calibratedSurface}
                                    opacity={calibratedSurface.opacity}
                                    blendMode={calibratedSurface.blendMode}
                                    filter={threadFilter === 'none' ? undefined : threadFilter}
                                />
                            ) : designImage && productImage && allowFallbackPlacement ? (
                                <motion.div
                                    key={isAdminMode ? `admin-${placementId || 'default'}` : designImage}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ 
                                        opacity: 1, 
                                        scale: 1,
                                        left: `${positionX}%`,
                                        top: `${positionY}%`,
                                        width: `${designScale}%`,
                                        rotateZ: rotation,
                                        rotateX: rotateX,
                                        rotateY: rotateY,
                                        x: '-50%',
                                        y: '-50%'
                                    }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 120 }}
                                    className={`absolute z-20 aspect-square ${isAdminMode ? 'cursor-move touch-none pointer-events-auto' : 'pointer-events-none'}`}
                                    drag={isAdminMode}
                                    dragConstraints={containerRef}
                                    dragElastic={0}
                                    dragMomentum={false}
                                    onDragEnd={handleDragEnd}
                                    style={{
                                        transformStyle: 'preserve-3d'
                                    }}
                                >
                                    <div 
                                        className="w-full h-full relative" 
                                        style={{ 
                                            filter: textureMapImage ? 'url(#embroidery-stitch)' : 'none',
                                            transformStyle: 'preserve-3d'
                                        }}
                                    >
                                        <Image
                                            src={designImage}
                                            alt={designName || 'Design Overlay'}
                                            fill
                                            className="object-contain"
                                            draggable={false}
                                            style={{
                                                filter: `${threadFilter} drop-shadow(0 2px 4px rgba(0,0,0,0.15)) drop-shadow(0 1px 2px rgba(0,0,0,0.1))`,
                                            }}
                                        />
                                    </div>
                                    {isAdminMode && (
                                        <div className="absolute inset-0 border border-dashed border-industrial-warning pointer-events-none">
                                            <div className="absolute -top-1 -left-1 w-2 h-2 bg-industrial-warning" />
                                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-industrial-warning" />
                                            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-industrial-warning" />
                                            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-industrial-warning" />
                                        </div>
                                    )}
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>

                    {/* LAYER 3: Shadow & Highlight Overlay (Multiply Blend Mode) */}
                    <AnimatePresence>
                        {productImage && textureMapImage && (
                            <motion.div
                                key={`shadow-${textureMapImage}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4 }}
                                className="absolute inset-0 w-full h-full pointer-events-none mix-blend-multiply opacity-80 z-30"
                            >
                                <Image
                                    src={textureMapImage}
                                    alt="Shadow Map"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* UI Overlays */}
                <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-industrial-gray/15 z-40 pointer-events-none" />
                <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-industrial-gray/15 z-40 pointer-events-none" />
                <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-industrial-gray/15 z-40 pointer-events-none" />
                <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-industrial-gray/15 z-40 pointer-events-none" />

                <div className="absolute top-4 right-4 z-40 pointer-events-none">
                    <span className="font-mono text-[9px] text-industrial-gray/40 uppercase tracking-widest bg-white/80 px-2 py-1 backdrop-blur">
                        {isZoomed ? '⊖ Zoom out' : '⊕ Zoom in'}
                    </span>
                </div>

                {isAdminMode && (
                    <div className="absolute top-4 left-4 z-40 pointer-events-none">
                        <span className="font-mono text-[9px] font-bold text-red-500 uppercase tracking-widest bg-white/90 px-2 py-1 backdrop-blur border border-red-500/20">
                            ⚙️ ADMIN CALIBRATION
                        </span>
                    </div>
                )}
            </div>

            {/* Status bar */}
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
                {productImage && designImage && !isAdminMode && (
                    <span className="font-mono text-[10px] text-green-600 uppercase tracking-widest">
                        ✓ Preview listo
                    </span>
                )}
            </div>
        </div>
    );
}
