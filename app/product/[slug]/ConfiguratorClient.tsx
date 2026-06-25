'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Visualizer from '@/components/studio/Visualizer';
import type { CalibrationSurface, GarmentMockup } from '@/lib/types/database';
import { getPlacementsForProduct } from '@/lib/placements';
import { COLOR_MAP } from '@/lib/colors';

interface Product {
    id: string;
    name: string;
    slug: string;
    base_price: number;
    image_url: string;
    colors: string[];
    sizes: string[];
    placements?: unknown;
    garment_mockups?: GarmentMockup[];
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
    // Basic Customization State
    const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || 'M');
    const [selectedColor, setSelectedColor] = useState<string>(product.colors[0] || 'Negro');
    const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);

    // Mockup and Calibration logic matching Studio
    const productMockups = useMemo(() => {
        return (product.garment_mockups || []).filter(
            m => m.is_public && m.status === 'published'
        );
    }, [product.garment_mockups]);

    const visibleMockups = useMemo(() => {
        if (!selectedColor) return productMockups;
        const normalizedColor = selectedColor.toLowerCase();
        const exact = productMockups.filter(mockup => mockup.color_name?.toLowerCase() === normalizedColor);
        return exact.length > 0 ? exact : productMockups;
    }, [productMockups, selectedColor]);

    const [selectedMockupId, setSelectedMockupId] = useState<string>('');

    const selectedMockup = useMemo(() => {
        if (visibleMockups.length === 0) return null;
        return visibleMockups.find(mockup => mockup.id === selectedMockupId) || visibleMockups[0];
    }, [selectedMockupId, visibleMockups]);

    const calibratedSurfaces = useMemo(() => {
        if (
            selectedMockup?.surfaces &&
            typeof selectedMockup.surfaces === 'object' &&
            !Array.isArray(selectedMockup.surfaces) &&
            Object.keys(selectedMockup.surfaces).length > 0
        ) {
            return selectedMockup.surfaces as Record<string, CalibrationSurface>;
        }

        // Fallback: Find another mockup of the same view that has calibrated surfaces
        const fallbackMockup = productMockups.find(m =>
            m.view === selectedMockup?.view &&
            m.surfaces &&
            typeof m.surfaces === 'object' &&
            !Array.isArray(m.surfaces) &&
            Object.keys(m.surfaces).length > 0
        );

        if (fallbackMockup?.surfaces) {
            return fallbackMockup.surfaces as Record<string, CalibrationSurface>;
        }

        return null;
    }, [selectedMockup, productMockups]);

    const placements = useMemo(() => {
        const allCalibrated: Record<string, any> = {};
        
        productMockups.forEach(mockup => {
            if (
                mockup.surfaces &&
                typeof mockup.surfaces === 'object' &&
                !Array.isArray(mockup.surfaces)
            ) {
                const surfaces = mockup.surfaces as Record<string, CalibrationSurface>;
                Object.entries(surfaces).forEach(([key, surface]) => {
                    const stdPlacements = product.placements && Object.keys(product.placements).length > 0
                        ? (product.placements as Record<string, any>)
                        : getPlacementsForProduct(product.slug || '');
                        
                    const stdConfig = stdPlacements[key] || {};
                    
                    allCalibrated[key] = {
                        ...stdConfig,
                        ...surface,
                        view: surface.view || stdConfig.view || 'front',
                        label: surface.label || stdConfig.label || key,
                    };
                });
            }
        });
        
        if (Object.keys(allCalibrated).length > 0) {
            return allCalibrated;
        }

        if (product.placements && Object.keys(product.placements).length > 0) {
            return product.placements as Record<string, any>;
        }
        return getPlacementsForProduct(product.slug || '');
    }, [productMockups, product]);

    const [activePlacement, setActivePlacement] = useState<string>('default');

    // Keep active placement valid
    useEffect(() => {
        const keys = Object.keys(placements);
        if (keys.length > 0 && !keys.includes(activePlacement)) {
            setActivePlacement(keys[0]);
        }
    }, [activePlacement, placements]);

    // Automatically sync mockup selection with placement view and selected color
    useEffect(() => {
        const placementView = placements[activePlacement]?.view || 'front';
        const matchingMockup = visibleMockups.find(
            m => m.view === placementView
        ) || visibleMockups[0];
        
        if (matchingMockup) {
            setSelectedMockupId(matchingMockup.id);
        }
    }, [activePlacement, visibleMockups, placements]);

    // Derived Visualizer State
    const activePlacementConfig = placements[activePlacement];
    const displayX = activePlacementConfig?.x ?? 50;
    const displayY = activePlacementConfig?.y ?? 35;
    const displayScale = activePlacementConfig?.scale ?? 25;
    const isBackView = activePlacementConfig?.view === 'back';

    const colorImages = (product as any).color_images as Record<string, string> | undefined;
    const currentBaseImage = selectedMockup?.image_url || (
        (isBackView && (product as any).back_image_url)
            ? (product as any).back_image_url
            : (colorImages?.[selectedColor] || product.image_url)
    );
    // Find shadow map fallback from another mockup of the same view if the active mockup does not have one
    const fallbackShadowMap = useMemo(() => {
        if (!selectedMockup) return null;
        const match = productMockups.find(m => m.view === selectedMockup.view && m.shadow_map_url);
        return match?.shadow_map_url || null;
    }, [selectedMockup, productMockups]);

    const currentTextureMap = selectedMockup?.shadow_map_url || fallbackShadowMap || (product as any).texture_map_url;
    const activeCalibratedSurface = calibratedSurfaces?.[activePlacement] || null;

    const placementOptions = useMemo(() => Object.entries(placements).map(([key, config]) => ({
        id: key,
        name: (config as any).label || key,
        value: key
    })), [placements]);

    // Pricing
    const totalPrice = product.base_price + (selectedDesign?.price_modifier || 0);

    // WhatsApp Generator
    const generateWhatsAppLink = () => {
        const phone = '573013732290';
        const placementLabel = placements[activePlacement]?.label || 'Por defecto';
        const message = `Hola, quiero pedir:
    - Producto: ${product.name}
    - Talla: ${selectedSize}
    - Color: ${selectedColor}
    - Ubicación: ${placementLabel}
    - Diseño: ${selectedDesign ? selectedDesign.name : 'Sin Diseño'}
    
    Precio Total Estimado: $${totalPrice.toLocaleString()}
    
    Entiendo que el tiempo de espera es de: ${leadTime}`;

        return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-64px)]">

            {/* LEFT: Visualizer */}
            <div className="relative lg:col-span-7 h-[50vh] lg:h-auto bg-industrial-light flex items-center justify-center p-8 overflow-hidden">
                <div className="w-full max-w-md aspect-[4/5] shadow-2xl bg-white relative">
                    <Visualizer
                        productImage={currentBaseImage}
                        textureMapImage={currentTextureMap}
                        designImage={selectedDesign?.image_url}
                        productName={product.name}
                        designName={selectedDesign?.name}
                        positionX={displayX}
                        positionY={displayY}
                        designScale={displayScale}
                        rotation={activePlacementConfig?.rotateZ ?? 0}
                        rotateX={activePlacementConfig?.rotateX ?? 0}
                        rotateY={activePlacementConfig?.rotateY ?? 0}
                        isAdminMode={false}
                        calibratedSurface={activeCalibratedSurface}
                    />
                </div>
            </div>

            {/* RIGHT: Controls */}
            <div className="p-8 lg:p-16 lg:col-span-5 flex flex-col h-full bg-white overflow-y-auto">
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

                    {/* Placements */}
                    {placementOptions.length > 0 && (
                        <div className="mb-10">
                            <h3 className="font-bold text-xs uppercase tracking-widest mb-4 text-industrial-gray">Ubicación del Bordado</h3>
                            <div className="flex flex-wrap gap-2">
                                {placementOptions.map(opt => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setActivePlacement(opt.value)}
                                        className={`px-4 py-3 border text-sm font-bold uppercase transition-all
                                    ${activePlacement === opt.value
                                                ? 'border-industrial-black bg-industrial-black text-white'
                                                : 'border-gray-200 text-gray-500 hover:border-industrial-black'}`}
                                    >
                                        {opt.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

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

                    {/* Colors */}
                    <div className="mb-10">
                        <h3 className="font-bold text-xs uppercase tracking-widest mb-4 text-industrial-gray">Color Base</h3>
                        <div className="flex flex-wrap gap-2">
                            {product.colors.map(color => {
                                const hex = COLOR_MAP[color];
                                return (
                                    <button
                                        key={color}
                                        onClick={() => setSelectedColor(color)}
                                        className={`flex items-center gap-2 px-3 py-2 border text-xs font-mono uppercase tracking-widest transition-all
                                            ${selectedColor === color
                                                ? 'border-industrial-black bg-industrial-black text-white'
                                                : 'border-gray-200 text-gray-500 hover:border-industrial-black bg-white'}`}
                                        title={color}
                                    >
                                        {hex && (
                                            <span 
                                                className="w-3.5 h-3.5 rounded-full border border-gray-300 inline-block"
                                                style={{ backgroundColor: hex }}
                                            />
                                        )}
                                        {color}
                                    </button>
                                );
                            })}
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
