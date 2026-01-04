'use client';

import { useState, useEffect, useMemo } from 'react';
import type { BaseProduct, EmbroideryDesign } from '@/lib/types/database';
import Visualizer from './Visualizer';
import OptionSelector from './OptionSelector';
import { buildWhatsAppMessage } from '@/lib/whatsapp';
import { useRouter, useSearchParams } from 'next/navigation';

interface VirtualStudioProps {
    products: BaseProduct[];
    designs: EmbroideryDesign[];
}

export default function VirtualStudio({ products, designs }: VirtualStudioProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // URL State Sync
    const initialProductSlug = searchParams.get('product');
    const initialDesignId = searchParams.get('design');

    const [selectedProduct, setSelectedProduct] = useState<BaseProduct | null>(
        products.find(p => p.slug === initialProductSlug) || products[0] || null
    );

    const [selectedDesign, setSelectedDesign] = useState<EmbroideryDesign | null>(
        designs.find(d => d.id === initialDesignId) || null
    );

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
    }, [selectedProduct, selectedColor, selectedSize]); // Fixed dependency array logic inside

    // Update URL when selections change (shallow routing)
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
        }
    };

    const handleDesignSelect = (id: string) => {
        const design = designs.find(d => d.id === id);
        if (design) {
            setSelectedDesign(design);
            updateUrl('design', id);
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

    // Memoize option lists
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
        colorHex: c // In a real app we'd map names to hex codes
    })) || [], [selectedProduct]);

    const sizeOptions = useMemo(() => selectedProduct?.sizes.map(s => ({
        id: s,
        name: s,
        value: s
    })) || [], [selectedProduct]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start min-h-[calc(100vh-64px)] p-4 md:p-8">

            {/* LEFT: Visualizer */}
            <div className="order-1 lg:order-1 lg:col-span-7 sticky top-24">
                <Visualizer
                    productImage={selectedProduct?.image_url}
                    designImage={selectedDesign?.image_url}
                />
            </div>

            {/* RIGHT: Controls */}
            <div className="order-2 lg:order-2 lg:col-span-5 flex flex-col gap-8 pb-20">

                {/* Header */}
                <div className="border-b border-industrial-gray/20 pb-4">
                    <h1 className="font-heading font-black text-3xl uppercase tracking-tighter mb-2">
                        Personalizador
                    </h1>
                    <p className="font-mono text-xs text-industrial-gray uppercase tracking-widest">
                        Diseña tu prenda única
                    </p>
                </div>

                {/* 1. Select Product */}
                <OptionSelector
                    label="1. Elige tu Base"
                    items={productOptions}
                    selectedId={selectedProduct?.slug || null}
                    onSelect={handleProductSelect}
                    type="grid"
                />

                {/* 2. Select Design */}
                <OptionSelector
                    label="2. Elige tu Diseño"
                    items={designOptions}
                    selectedId={selectedDesign?.id || null}
                    onSelect={handleDesignSelect}
                    type="grid"
                />

                {/* 3. Details (If product selected) */}
                {selectedProduct && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <OptionSelector
                            label="3. Color"
                            items={colorOptions}
                            selectedId={selectedColor}
                            onSelect={setSelectedColor}
                            type="swatch" // Using text list for now as hex mapping is missing, actually just using list for safety
                        />
                        <OptionSelector
                            label="4. Talla"
                            items={sizeOptions}
                            selectedId={selectedSize}
                            onSelect={setSelectedSize}
                            type="list"
                        />
                    </div>
                )}

                {/* Footer Actions */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-industrial-gray/10 lg:static lg:border-0 lg:p-0 lg:bg-transparent z-40">
                    <button
                        onClick={handleWhatsAppCheckout}
                        disabled={!handleValidation()}
                        className="w-full bg-industrial-warning hover:bg-industrial-black hover:text-white text-industrial-black font-bold h-14 uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <span className="text-xl">💬</span>
                        {handleValidation() ? 'Pedir por WhatsApp' : 'Completa tu selección'}
                    </button>
                    <p className="text-center text-[10px] text-gray-400 mt-2 font-mono uppercase">
                        Serás redirigido a WhatsApp para confirmar
                    </p>
                </div>
            </div>

        </div>
    );
}
