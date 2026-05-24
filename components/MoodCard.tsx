'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export interface MoodCardProps {
    mood: string;
    title: string;
    subtitle: string;
    icon: string;
    gradient: string;
    href: string;
    previewImages?: string[];
    index: number;
}

export default function MoodCard({
    mood,
    title,
    subtitle,
    icon,
    gradient,
    href,
    previewImages = [],
    index,
}: MoodCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setTilt({ x: y * -12, y: x * 12 });
    };

    const handleMouseLeave = () => {
        setTilt({ x: 0, y: 0 });
        setIsHovered(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
            <Link href={href} className="block">
                <div
                    ref={cardRef}
                    onMouseMove={handleMouseMove}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={handleMouseLeave}
                    className="relative overflow-hidden cursor-pointer group"
                    style={{ perspective: '800px' }}
                >
                    <div
                        className="relative p-8 md:p-10 border border-industrial-gray/10 transition-all duration-500 ease-out"
                        style={{
                            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(0)`,
                            transformStyle: 'preserve-3d',
                        }}
                    >
                        {/* Animated gradient background */}
                        <div
                            className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${gradient} animate-gradient`}
                        />

                        {/* Base background */}
                        <div className="absolute inset-0 bg-white group-hover:bg-transparent transition-colors duration-500" />

                        {/* Content */}
                        <div className="relative z-10">
                            {/* Icon */}
                            <div className="text-4xl md:text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-500">
                                {icon}
                            </div>

                            {/* Title */}
                            <h3 className="font-heading font-black text-xl md:text-2xl uppercase tracking-tighter mb-2 group-hover:text-white transition-colors duration-500">
                                {title}
                            </h3>

                            {/* Subtitle */}
                            <p className="font-mono text-[10px] md:text-xs text-industrial-gray group-hover:text-white/70 uppercase tracking-widest transition-colors duration-500 mb-6">
                                {subtitle}
                            </p>

                            {/* Preview thumbnails on hover */}
                            <div className={`flex gap-2 transition-all duration-500 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                {previewImages.length > 0 ? (
                                    previewImages.slice(0, 3).map((img, i) => (
                                        <div
                                            key={i}
                                            className="w-10 h-10 md:w-12 md:h-12 bg-white/20 backdrop-blur-sm border border-white/30 overflow-hidden"
                                            style={{ animationDelay: `${i * 0.1}s` }}
                                        >
                                            <img src={img} alt="" className="w-full h-full object-contain p-1 mix-blend-multiply" />
                                        </div>
                                    ))
                                ) : (
                                    /* Placeholder shimmer boxes */
                                    [0, 1, 2].map(i => (
                                        <div
                                            key={i}
                                            className="w-10 h-10 md:w-12 md:h-12 bg-white/10 border border-white/20 animate-shimmer"
                                        />
                                    ))
                                )}
                            </div>

                            {/* Arrow indicator */}
                            <div className="absolute top-8 right-8 w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </div>
                        </div>

                        {/* Hover border glow */}
                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/20 transition-colors duration-500 pointer-events-none" />
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
