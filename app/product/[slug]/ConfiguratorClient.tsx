'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Product {
    id: string;
    name: string;
    base_price: number;
    image_url: string;
    colors: string[];
    sizes: string[];
}

interface Design {
    id: string;
    name: string;
    price_modifier: number;
    image_url: string;
    category: string;
    dimensions: string;
}

interface ConfiguratorProps {
    product: Product;
    designs: Design[];
    leadTime: string;
}

export default function ConfiguratorClient({ product, designs, leadTime }: ConfiguratorProps) {
    // State
    const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || 'M');
    const [selectedColor, setSelectedColor] = useState<string>(product.colors[0] || 'Negro');
    const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);

    // Derived State
    const totalPrice = product.base_price + (selectedDesign?.price_modifier || 0);

    // WhatsApp Generator
    const generateWhatsAppLink = () => {
        const phone = '573013732290';
        const message = `Hola, quiero pedir:
    - Producto: ${product.name}
    - Talla: ${selectedSize}
    - Color: ${selectedColor}
    - Diseño: ${selectedDesign ? selectedDesign.name : 'Sin Diseño'}
    
    Precio Total Estimado: $${totalPrice.toLocaleString()}
    
    Entiendo que el tiempo de espera es de: ${leadTime}`;

        return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-64px)]">

            {/* LEFT: Visualizer */}
            <div className="relative h-[50vh] lg:h-auto bg-industrial-light flex items-center justify-center p-8 overflow-hidden">
                <div className="relative w-full max-w-md aspect-[4/5] shadow-2xl bg-white">

                    {/* Layer 1: Base Product */}
                    <div className="absolute inset-0 z-10">
                        <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>

                    {/* Layer 2: Embroidery Overlay */}
                    {selectedDesign && (
                        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none mix-blend-multiply opacity-95">
                            {/* Dynamic sizing/positioning could be added here later */}
                            <div className="relative w-[35%] aspect-square transform -translate-y-12">
                                <Image
                                    src={selectedDesign.image_url}
                                    alt={selectedDesign.name}
                                    fill
                                    className="object-contain filter drop-shadow-sm"
                                />
                            </div>
                        </div>
                    )}

                    {/* Watermark / Label */}
                    <div className="absolute bottom-4 left-4 z-30 font-mono text-xs text-industrial-gray/50 uppercase">
                        Texere.Art Visualizer v1.0
                    </div>
                </div>
            </div>

            {/* RIGHT: Controls */}
            <div className="p-8 lg:p-16 flex flex-col h-full bg-white overflow-y-auto">
                <div className="mb-auto">
                    <Link href="/catalog" className="text-xs font-bold uppercase tracking-widest text-industrial-gray hover:text-industrial-black mb-6 block">
                        ← Volver al Catálogo
                    </Link>

                    <h1 className="font-heading font-black text-4xl lg:text-5xl uppercase tracking-tighter mb-2">
                        {product.name}
                    </h1>
                    <p className="font-mono text-xl text-industrial-black mb-12">
                        ${totalPrice.toLocaleString()} <span className="text-sm text-gray-400">COP</span>
                    </p>

                    {/* Sizes */}
                    <div className="mb-10">
                        <h3 className="font-bold text-xs uppercase tracking-widest mb-4 text-industrial-gray">Selecciona Talla</h3>
                        <div className="flex flex-wrap gap-2">
                            {product.sizes.map(size => (
                                <button
                                    key={size}
                                    onClick={() => setSelectedSize(size)}
                                    className={`w-12 h-12 flex items-center justify-center border text-sm font-bold transition-all
                                ${selectedSize === size
                                            ? 'border-industrial-black bg-industrial-black text-white'
                                            : 'border-gray-200 text-gray-500 hover:border-industrial-black'}`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Colors (Simulated text for now as we have color names) */}
                    <div className="mb-10">
                        <h3 className="font-bold text-xs uppercase tracking-widest mb-4 text-industrial-gray">Color Base</h3>
                        <div className="flex flex-wrap gap-2">
                            {product.colors.map(color => (
                                <button
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={`px-4 py-2 border text-sm font-bold uppercase transition-all
                                ${selectedColor === color
                                            ? 'border-industrial-black bg-industrial-black text-white'
                                            : 'border-gray-200 text-gray-500 hover:border-industrial-black'}`}
                                >
                                    {color}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Designs */}
                    <div className="mb-12">
                        <h3 className="font-bold text-xs uppercase tracking-widest mb-4 text-industrial-gray">
                            Selecciona Diseño {selectedDesign && <span className="text-industrial-black normal-case">- {selectedDesign.name} (+${selectedDesign.price_modifier})</span>}
                        </h3>

                        {designs.length === 0 ? (
                            <p className="text-sm text-gray-400 font-mono">No hay diseños disponibles.</p>
                        ) : (
                            <div className="grid grid-cols-4 gap-4">
                                <button
                                    onClick={() => setSelectedDesign(null)}
                                    className={`aspect-square border flex flex-col items-center justify-center p-2 transition-all
                                ${selectedDesign === null ? 'border-industrial-black ring-1 ring-industrial-black' : 'border-gray-200 hover:border-industrial-gray'}`}
                                >
                                    <span className="text-2xl mb-1">✕</span>
                                    <span className="text-[10px] font-bold uppercase text-center leading-none">Sin Diseño</span>
                                </button>

                                {designs.map(design => (
                                    <button
                                        key={design.id}
                                        onClick={() => setSelectedDesign(design)}
                                        className={`aspect-square border relative p-2 transition-all overflow-hidden
                                    ${selectedDesign?.id === design.id ? 'border-industrial-warning ring-2 ring-industrial-warning' : 'border-gray-200 hover:border-industrial-gray'}`}
                                    >
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={design.image_url}
                                                alt={design.name}
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Bar */}
                <div className="pt-8 border-t border-gray-100">
                    <div className="bg-industrial-warning/10 p-4 mb-6 rounded-sm border border-industrial-warning/20">
                        <p className="text-xs text-industrial-black/80 font-mono text-center uppercase">
                            ⚠ Tiempo de producción: {leadTime}
                        </p>
                    </div>

                    <a
                        href={generateWhatsAppLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full block bg-industrial-black text-industrial-warning font-black text-center py-5 uppercase tracking-widest text-lg hover:bg-gray-900 transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                        Comprar por WhatsApp — ${totalPrice.toLocaleString()}
                    </a>
                    <p className="text-center text-[10px] text-gray-400 mt-4 uppercase tracking-wider">
                        Serás redirigido a WhatsApp para confirmar los detalles.
                    </p>
                </div>
            </div>
        </div>
    );
}
