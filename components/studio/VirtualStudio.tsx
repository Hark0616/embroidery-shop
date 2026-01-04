'use client';

import { useState, useEffect, useMemo } from 'react';
import type { BaseProduct, EmbroideryDesign } from '@/lib/types/database';
import Visualizer from './Visualizer';
import OptionSelector from './OptionSelector';
import { buildWhatsAppMessage } from '@/lib/whatsapp';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface VirtualStudioProps {
    products: BaseProduct[];
    designs: EmbroideryDesign[];
}

type StudioStep = 'product' | 'design' | 'details' | 'checkout';

export default function VirtualStudio({ products, designs }: VirtualStudioProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // URL State Sync
    const initialProductSlug = searchParams.get('product');
    const initialDesignId = searchParams.get('design');

    const [selectedProduct, setSelectedProduct] = useState<BaseProduct | null>(
        products.find(p => p.slug === initialProductSlug) || null
    );

    const [selectedDesign, setSelectedDesign] = useState<EmbroideryDesign | null>(
        designs.find(d => d.id === initialDesignId) || null
    );

    // Simple step logic: defaults to product, but if product exists -> design. 
    // If both exist -> details.
    const [activeStep, setActiveStep] = useState<StudioStep>(() => {
        if (initialProductSlug && initialDesignId) return 'details';
        if (initialProductSlug) return 'design';
        if (initialDesignId) return 'product';
        return 'product';
    });

    const [selectedColor, setSelectedColor] = useState<string>('');
    const [selectedSize, setSelectedSize] = useState<string>('');

    // Reset color/size when product changes if they are invalid
    useEffect(() => {
        if (selectedProduct) {
            if (!selectedProduct.colors.includes(selectedColor)) {
                setSelectedColor(selectedProduct.colors[0] || '');
            }
            if (!selectedProduct.sizes.includes(selectedSize)) {
                setSelectedSize(selectedProduct.sizes[0] || '');
            }
        }
    }, [selectedProduct, selectedColor, selectedSize]);

    // Update URL function
    const updateUrl = (key: 'product' | 'design', value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set(key, value);
        router.replace(`/studio?${params.toString()}`, { scroll: false });
    };

    const handleProductSelect = (slug: string) => {
        const product = products.find(p => p.slug === slug);
        if (product) {
            setSelectedProduct(product);
            updateUrl('product', slug);
            setActiveStep('design'); // Auto-advance
        }
    };

    const handleDesignSelect = (id: string) => {
        const design = designs.find(d => d.id === id);
        if (design) {
            setSelectedDesign(design);
            updateUrl('design', id);
            setActiveStep('details'); // Auto-advance
        }
    };

    const handleValidation = () => {
        if (!selectedProduct) return false;
        if (!selectedDesign) return false;
        if (!selectedColor) return false;
        if (!selectedSize) return false;
        return true;
    }

    const handleWhatsAppCheckout = () => {
        if (!selectedProduct || !selectedDesign) return;

        const url = buildWhatsAppMessage({
            productName: selectedProduct.name,
            designName: selectedDesign.name,
            color: selectedColor,
            size: selectedSize
        }, typeof window !== 'undefined' ? window.location.href : '');

        window.open(url, '_blank');
    };

    // Memoize options
    const productOptions = useMemo(() => products.map(p => ({
        id: p.id,
        name: p.name,
        value: p.slug,
        image_url: p.image_url
    })), [products]);

    const designOptions = useMemo(() => designs.map(d => ({
        id: d.id,
        name: d.name,
        value: d.id,
        image_url: d.image_url
    })), [designs]);

    const colorOptions = useMemo(() => selectedProduct?.colors.map(c => ({
        id: c,
        name: c,
        value: c,
        colorHex: c
    })) || [], [selectedProduct]);

    const sizeOptions = useMemo(() => selectedProduct?.sizes.map(s => ({
        id: s,
        name: s,
        value: s
    })) || [], [selectedProduct]);

    // Helper render for step header
    const renderStepHeader = (step: StudioStep, label: string, isCompleted: boolean) => (
        <div
            onClick={() => setActiveStep(step)}
            className={`flex items-center justify-between p-4 border rounded-sm cursor-pointer transition-all mb-4 ${activeStep === step
                ? 'border-industrial-black bg-industrial-black text-white'
                : 'border-industrial-gray/20 bg-white hover:border-industrial-gray'
                }`}
        >
            <span className="font-heading font-bold uppercase tracking-widest text-sm">
                {label}
            </span>
            {isCompleted && activeStep !== step && (
                <span className="text-industrial-warning text-xs font-mono">
                    ✓ CAMBIAR
                </span>
            )}
            {activeStep === step && (
                <span className="text-xs font-mono opacity-50">
                    EDITANDO
                </span>
            )}
        </div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start min-h-[calc(100vh-64px)] p-4 md:p-8">

            {/* LEFT: Visualizer */}
            <div className="order-1 lg:order-1 lg:col-span-7 sticky top-24">
                <Visualizer
                    productImage={selectedProduct?.image_url}
                    designImage={selectedDesign?.image_url}
                />
            </div>

            {/* RIGHT: Controls - Progressive Stepper */}
            <div className="order-2 lg:order-2 lg:col-span-5 flex flex-col gap-2 pb-20">

                {/* Header */}
                <div className="mb-4">
                    <h1 className="font-heading font-black text-3xl uppercase tracking-tighter mb-2">
                        Personalizador
                    </h1>
                    <p className="font-mono text-xs text-industrial-gray uppercase tracking-widest">
                        Diseña tu prenda única
                    </p>
                </div>

                {/* STEP 1: PRODUCT */}
                {activeStep === 'product' ? (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                        <OptionSelector
                            label="1. Elige tu Base"
                            items={productOptions}
                            selectedId={selectedProduct?.slug || null}
                            onSelect={handleProductSelect}
                            type="grid"
                        />
                    </div>
                ) : (
                    renderStepHeader('product', `1. Base: ${selectedProduct?.name || 'Seleccionar'}`, !!selectedProduct)
                )}

                {/* STEP 2: DESIGN */}
                {/* Only show if product selected or this is active step */}
                {(selectedProduct || activeStep === 'design') && (
                    activeStep === 'design' ? (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Featured subset (optional, or just the link) */}
                            <div className="bg-gray-50 border border-industrial-gray/10 p-6 text-center rounded-sm">
                                <p className="font-mono text-xs text-industrial-gray mb-4 uppercase tracking-widest">
                                    +500 Diseños Disponibles
                                </p>
                                <button
                                    onClick={() => router.push(`/designs?product=${selectedProduct?.slug || ''}`)}
                                    className="inline-flex items-center gap-2 bg-industrial-black text-white px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-industrial-warning hover:text-industrial-black transition-colors"
                                >
                                    <span>🔍</span> Explorar Librería Completa
                                </button>
                            </div>

                            {/* Show selected design mini-card if one is picked */}
                            {selectedDesign && (
                                <div className="mt-4 border border-industrial-black bg-white p-3 flex items-center gap-4">
                                    <div className="relative w-12 h-12 bg-gray-100 shrink-0">
                                        {selectedDesign.image_url && <img src={selectedDesign.image_url} alt={selectedDesign.name} className="object-contain p-1 w-full h-full" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-xs uppercase">{selectedDesign.name}</p>
                                        <p className="text-[10px] text-gray-400 font-mono">Seleccionado</p>
                                    </div>
                                    <button
                                        onClick={() => router.push(`/designs?product=${selectedProduct?.slug || ''}`)}
                                        className="ml-auto text-[10px] underline text-industrial-gray hover:text-black"
                                    >
                                        Cambiar
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        renderStepHeader('design', `2. Diseño: ${selectedDesign?.name || 'Seleccionar'}`, !!selectedDesign)
                    )
                )}

                {/* STEP 3: DETAILS */}
                {(selectedDesign && selectedProduct || activeStep === 'details') && (
                    activeStep === 'details' ? (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300 border p-4 rounded-sm border-industrial-gray/20">
                            <h3 className="font-heading font-bold text-sm uppercase tracking-widest mb-4">
                                3. Personaliza Detalles
                            </h3>
                            <OptionSelector
                                label="Color"
                                items={colorOptions}
                                selectedId={selectedColor}
                                onSelect={setSelectedColor}
                                type="swatch"
                            />
                            <OptionSelector
                                label="Talla"
                                items={sizeOptions}
                                selectedId={selectedSize}
                                onSelect={setSelectedSize}
                                type="list"
                            />
                        </div>
                    ) : (
                        renderStepHeader('details', `3. Detalles: ${selectedColor} / ${selectedSize}`, handleValidation())
                    )
                )}

                {/* Footer Actions */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-industrial-gray/10 lg:static lg:border-0 lg:p-0 lg:bg-transparent z-40 mt-auto">
                    <button
                        onClick={handleWhatsAppCheckout}
                        disabled={!handleValidation()}
                        className="w-full bg-industrial-warning hover:bg-industrial-black hover:text-white text-industrial-black font-bold h-14 uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <span className="text-xl">💬</span>
                        {handleValidation() ? 'Pedir por WhatsApp' : 'Completa tu selección'}
                    </button>
                </div>
            </div>

        </div>
    );
}
