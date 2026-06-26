'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) setIsMobileMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMobileMenuOpen]);

    const navLinks = [
        { href: '/shop', label: 'Tienda' },
    ];

    return (
        <>
            <nav className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled
                ? 'bg-white/90 backdrop-blur-lg border-b border-industrial-gray/10 shadow-sm'
                : 'bg-industrial-light/50 backdrop-blur-md border-b border-industrial-gray/10'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className={`flex justify-between items-center transition-all duration-300 ${isScrolled ? 'h-14' : 'h-16'
                        }`}>
                        {/* Logo */}
                        <Link href="/" className="flex-shrink-0 flex items-center gap-2 group" onClick={() => setIsMobileMenuOpen(false)}>
                            <span className={`font-heading font-black tracking-tighter text-industrial-black group-hover:text-industrial-gray transition-all duration-300 ${isScrolled ? 'text-xl' : 'text-2xl'
                                }`}>
                                TEXERE<span className="text-industrial-warning">.</span>ART
                            </span>
                        </Link>

                        {/* Desktop Links */}
                        <div className="hidden md:flex items-center gap-8">
                            {navLinks.map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="font-heading text-xs font-bold uppercase tracking-widest text-industrial-black hover:text-industrial-warning transition-colors relative group"
                                >
                                    {link.label}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-industrial-warning transition-all duration-300 group-hover:w-full" />
                                </Link>
                            ))}
                            <Link
                                href="https://wa.me/573013732290"
                                target="_blank"
                                className="bg-industrial-black text-industrial-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-industrial-warning hover:text-industrial-black transition-colors duration-300"
                            >
                                💬 Contacto
                            </Link>
                        </div>

                        {/* Mobile Hamburger */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden relative w-8 h-8 flex flex-col items-center justify-center gap-1.5"
                            aria-label="Toggle menu"
                        >
                            <span className={`block w-5 h-0.5 bg-industrial-black transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-[4px]' : ''
                                }`} />
                            <span className={`block w-5 h-0.5 bg-industrial-black transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''
                                }`} />
                            <span className={`block w-5 h-0.5 bg-industrial-black transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-[4px]' : ''
                                }`} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 md:hidden"
                    >
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-industrial-black/50 backdrop-blur-sm"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />

                        {/* Menu Panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="absolute top-0 right-0 w-[80%] max-w-sm h-full bg-white shadow-2xl"
                        >
                            {/* Close area */}
                            <div className="h-16 flex items-center justify-end px-6">
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-industrial-gray hover:text-industrial-black transition-colors font-mono text-xs uppercase tracking-widest"
                                >
                                    Cerrar ✕
                                </button>
                            </div>

                            {/* Links */}
                            <div className="px-6 py-4 flex flex-col gap-2">
                                {navLinks.map((link, i) => (
                                    <motion.div
                                        key={link.href}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                    >
                                        <Link
                                            href={link.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="block py-4 border-b border-industrial-gray/10 font-heading font-bold text-lg uppercase tracking-widest text-industrial-black hover:text-industrial-warning transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </motion.div>
                                ))}

                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="mt-6"
                                >
                                    <Link
                                        href="https://wa.me/573013732290"
                                        target="_blank"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="block w-full text-center bg-industrial-black text-white py-4 font-bold uppercase tracking-widest text-sm hover:bg-industrial-warning hover:text-industrial-black transition-colors duration-300"
                                    >
                                        💬 Contacto por WhatsApp
                                    </Link>
                                </motion.div>
                            </div>

                            {/* Bottom branding */}
                            <div className="absolute bottom-8 left-6 right-6">
                                <p className="font-mono text-[10px] text-industrial-gray/40 uppercase tracking-widest">
                                    TEXERE.ART · Bordados Personalizados
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
