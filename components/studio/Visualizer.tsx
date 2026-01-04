'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface VisualizerProps {
    productImage?: string | null;
    designImage?: string | null;
    isLoading?: boolean;
}

export default function Visualizer({ productImage, designImage, isLoading = false }: VisualizerProps) {
    return (
        <div className="relative w-full aspect-[4/5] bg-gray-100 rounded-sm overflow-hidden border border-industrial-gray/10 shadow-inner">
            {/* Background Grid - Aesthetic touch */}
            <div className="absolute inset-0 opacity-5"
                style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            />

            <AnimatePresence mode="wait">
                {isLoading ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center bg-gray-100 z-50"
                    >
                        <div className="w-8 h-8 border-2 border-industrial-black border-t-transparent rounded-full animate-spin" />
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {/* Base Product Layer */}
            <div className="absolute inset-0 z-10 flex items-center justify-center p-8">
                {productImage ? (
                    <Image
                        src={productImage}
                        alt="Base Product"
                        fill
                        className="object-contain"
                        priority
                    />
                ) : (
                    <div className="text-industrial-gray font-mono text-xs uppercase">Select a Product</div>
                )}
            </div>

            {/* Design Layer (Overlay) */}
            {designImage && productImage && (
                <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                    {/* 
                NOTE: Ideally we would use 'position' props to place this exactly where needed.
                For now, we center it and assume standard placement (chest/center).
                We use a fixed width relative to container to simulate a realistic print size.
            */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative w-[35%] aspect-square"
                    >
                        <Image
                            src={designImage}
                            alt="Design Overlay"
                            fill
                            className="object-contain drop-shadow-md mix-blend-multiply"
                        />
                    </motion.div>
                </div>
            )}

            {/* Overlay info */}
            <div className="absolute bottom-4 left-4 z-30 font-mono text-[10px] text-industrial-gray/60 uppercase tracking-widest pointer-events-none">
                Virtual Studio v1.0
            </div>
        </div>
    );
}
