'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Visualizer from '@/components/studio/Visualizer';
import type { CalibrationSurface, GarmentMockup } from '@/lib/types/database';
import { COLOR_MAP } from '@/lib/colors';
import { getMockupImageForColor, getMockupShadowForColor } from '@/lib/mockup-variants';

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

interface SwitchProduct {
    id: string;
    name: string;
    slug: string;
    image_url: string;
    base_price: number;
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
    products: SwitchProduct[];
    designs: Design[];
    leadTime: string;
}

interface GalleryItem {
    type: 'mockup';
    imageUrl: string;
    mockup: GarmentMockup;
    hasCalibratedPlacement: boolean;
}

function hasCalibratedSurfaces(mockup: GarmentMockup) {
    return !!(
        mockup.surfaces &&
        typeof mockup.surfaces === 'object' &&
        !Array.isArray(mockup.surfaces) &&
        Object.keys(mockup.surfaces).length > 0
    );
}

export default function ConfiguratorClient({ product, products, designs, leadTime }: ConfiguratorProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const initialDesignId = searchParams?.get('design');

    // Basic Customization State
    const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || 'M');
    const [selectedColor, setSelectedColor] = useState<string>(product.colors[0] || 'Negro');
    const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);

    // Sync design from URL search param if present
    useEffect(() => {
        if (initialDesignId) {
            const found = designs.find(d => d.id === initialDesignId);
            if (found) {
                setSelectedDesign(found);
            }
        }
    }, [initialDesignId, designs]);

    // Mockup and Calibration logic deriving placements only from calibrated mockups
    const productMockups = useMemo(() => {
        return (product.garment_mockups || []).filter(
            m => m.is_public && m.status === 'published' && hasCalibratedSurfaces(m)
        );
    }, [product.garment_mockups]);

    const visibleMockups = useMemo(() => {
        return productMockups;
    }, [productMockups]);

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
                    allCalibrated[key] = {
                        ...surface,
                        view: surface.view || 'front',
                        label: surface.label || key,
                    };
                });
            }
        });
        
        return allCalibrated;
    }, [productMockups]);

    const [activePlacement, setActivePlacement] = useState<string>('default');

    // Keep active placement valid
    useEffect(() => {
        const keys = Object.keys(placements);
        if (keys.length > 0 && !keys.includes(activePlacement)) {
            setActivePlacement(keys[0]);
        }
    }, [activePlacement, placements]);

    // Gallery items are only calibrated, published mockups. The product cover is not a sellable preview.
    const galleryItems = useMemo(() => {
        const items: GalleryItem[] = [];

        visibleMockups.forEach(mockup => {
            let surfaces: Record<string, CalibrationSurface> = {};
            if (
                mockup.surfaces &&
                typeof mockup.surfaces === 'object' &&
                !Array.isArray(mockup.surfaces)
            ) {
                surfaces = mockup.surfaces as Record<string, CalibrationSurface>;
            }
            const hasActivePlacement = activePlacement && surfaces[activePlacement];
            items.push({
                type: 'mockup',
                imageUrl: getMockupImageForColor(mockup, selectedColor),
                mockup,
                hasCalibratedPlacement: !!hasActivePlacement,
            });
        });
        
        // Sort items so mockups calibrated for the active placement appear first.
        items.sort((a, b) => {
            return (b.hasCalibratedPlacement ? 1 : 0) - (a.hasCalibratedPlacement ? 1 : 0);
        });
        
        return items;
    }, [visibleMockups, activePlacement, selectedColor]);

    const [selectedGalleryIndex, setSelectedGalleryIndex] = useState<number>(0);

    // Keep gallery index in bounds
    useEffect(() => {
        if (selectedGalleryIndex >= galleryItems.length) {
            setSelectedGalleryIndex(0);
        }
    }, [galleryItems, selectedGalleryIndex]);

    // Automatically select the first mockup that has the active placement calibrated when placement changes
    useEffect(() => {
        const firstCalibratedIdx = galleryItems.findIndex(
            item => item.type === 'mockup' && item.hasCalibratedPlacement
        );
        if (firstCalibratedIdx !== -1) {
            setSelectedGalleryIndex(firstCalibratedIdx);
        } else if (galleryItems.length > 0) {
            setSelectedGalleryIndex(0);
        }
    }, [activePlacement, galleryItems]);

    const activeItem = galleryItems[selectedGalleryIndex] || galleryItems[0] || null;
    const currentMockup = activeItem?.mockup || null;

    const activeCalibratedSurface = useMemo(() => {
        if (!currentMockup) return null;
        
        let surfaces: Record<string, CalibrationSurface> = {};
        if (
            currentMockup.surfaces &&
            typeof currentMockup.surfaces === 'object' &&
            !Array.isArray(currentMockup.surfaces)
        ) {
            surfaces = currentMockup.surfaces as Record<string, CalibrationSurface>;
        }
        
        if (surfaces[activePlacement]) {
            return surfaces[activePlacement];
        }
        
        return null;
    }, [currentMockup, activePlacement]);

    const placementOptions = useMemo(() => Object.entries(placements).map(([key, config]) => ({
        id: key,
        name: (config as any).label || key,
        value: key
    })), [placements]);

    // Rendering design logic
    const shouldRenderDesign = useMemo(() => {
        return !!currentMockup && !!activeCalibratedSurface;
    }, [currentMockup, activeCalibratedSurface]);

    const designImageToRender = shouldRenderDesign ? selectedDesign?.image_url : undefined;

    const canCheckout = !!currentMockup && !!activeCalibratedSurface;

    // Fallback coordinates are kept only for legacy admin props; public rendering requires calibration.
    const displayX = 50;
    const displayY = 35;
    const displayScale = 25;
    const rotation = 0;
    const rotateX = 0;
    const rotateY = 0;

    const currentTextureMap = getMockupShadowForColor(currentMockup, selectedColor) || undefined;

    // Pricing
    const totalPrice = product.base_price + (selectedDesign?.price_modifier || 0);

    // WhatsApp Link
    const generateWhatsAppLink = () => {
        if (!canCheckout) return '#';
        const phone = '573013732290';
        const placementLabel = placements[activePlacement]?.label || activePlacement;
        const message = `Hola, quiero pedir:
- Producto: ${product.name}
- Talla: ${selectedSize}
- Color: ${selectedColor}
- Ubicación: ${placementLabel}
- Diseño: ${selectedDesign ? selectedDesign.name : 'Sin Diseño'}

Precio Total Estimado: $${totalPrice.toLocaleString()} COP

Entiendo que el tiempo de espera es de: ${leadTime}`;

        return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    };

    const handleGarmentChange = (slug: string) => {
        const params = new URLSearchParams();
        if (selectedDesign) {
            params.set('design', selectedDesign.id);
        }
        router.push(`/product/${slug}?${params.toString()}`);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto px-4 py-8 md:px-8 md:py-12 min-h-[calc(100vh-64px)]">
            {/* LEFT COLUMN: Gallery & Preview */}
            <div className="lg:col-span-7 flex flex-col md:flex-row gap-4">
                {/* Thumbnails strip */}
                {galleryItems.length > 1 && (
                    <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:w-20 w-full shrink-0 pb-2 md:pb-0 scrollbar-none max-h-[600px]">
                        {galleryItems.map((item, index) => {
                            const isActive = index === selectedGalleryIndex;
                            return (
                                <button
                                    key={index}
                                    onClick={() => setSelectedGalleryIndex(index)}
                                    className={`relative flex-shrink-0 w-16 h-20 md:w-20 md:h-24 bg-white border-2 rounded-lg overflow-hidden transition-all duration-200 hover:scale-[1.03]
                                    ${isActive 
                                        ? 'border-industrial-black ring-1 ring-industrial-black' 
                                        : 'border-gray-200 hover:border-gray-400'}`}
                                >
                                    <div className="relative w-full h-full bg-gray-50">
                                        <Image
                                            src={item.imageUrl}
                                            alt={`Vista ${index + 1}`}
                                            fill
                                            sizes="80px"
                                            className="object-contain p-1"
                                        />
                                    </div>
                                    {item.hasCalibratedPlacement && (
                                        <span className="absolute top-1 right-1 text-[10px] text-industrial-black bg-industrial-warning rounded-full w-4 h-4 flex items-center justify-center font-bold shadow" title="Ubicación calibrada disponible">
                                            ✦
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
                
                {/* Main preview */}
                <div className="flex-1 aspect-[4/5] bg-industrial-light border border-gray-100 rounded-xl overflow-hidden shadow-sm relative flex items-center justify-center p-4">
                    <div className="w-full h-full relative">
                        <Visualizer
                            productImage={activeItem?.imageUrl}
                            textureMapImage={currentTextureMap}
                            designImage={designImageToRender}
                            productName={product.name}
                            designName={selectedDesign?.name}
                            positionX={displayX}
                            positionY={displayY}
                            designScale={displayScale}
                            rotation={rotation}
                            rotateX={rotateX}
                            rotateY={rotateY}
                            isAdminMode={false}
                            calibratedSurface={activeCalibratedSurface}
                            allowFallbackPlacement={false}
                        />
                    </div>
                    {!canCheckout && (
                        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm border border-gray-200/50 p-2.5 rounded-lg text-center shadow-lg transition-all duration-300">
                            <p className="text-[11px] font-medium text-gray-600">
                                Esta prenda aun no tiene un mockup calibrado publicado para venderse en linea.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN: Controls */}
            <div className="lg:col-span-5 flex flex-col h-full bg-white">
                <div className="mb-auto">
                    <Link href="/catalog" className="text-xs font-bold uppercase tracking-widest text-industrial-gray hover:text-industrial-black mb-6 block">
                        ← Volver al Catálogo
                    </Link>

                    <h1 className="font-heading font-black text-3xl lg:text-4xl uppercase tracking-tighter mb-2">
                        {product.name}
                    </h1>
                    <p className="font-mono text-2xl text-industrial-black mb-8">
                        ${totalPrice.toLocaleString()} <span className="text-sm text-gray-400">COP</span>
                    </p>

                    {/* 1. Selector de Diseño */}
                    <div className="mb-10">
                        <h3 className="font-bold text-xs uppercase tracking-widest mb-4 text-industrial-gray flex items-center justify-between">
                            <span>1. Diseño Seleccionado</span>
                            {selectedDesign && (
                                <span className="text-industrial-black normal-case font-mono">
                                    {selectedDesign.name} (+${selectedDesign.price_modifier.toLocaleString()} COP)
                                </span>
                            )}
                        </h3>
                        {designs.length === 0 ? (
                            <p className="text-sm text-gray-400 font-mono">No hay diseños disponibles.</p>
                        ) : (
                            <div className="grid grid-cols-4 gap-2 max-h-[220px] overflow-y-auto pr-1">
                                <button
                                    onClick={() => setSelectedDesign(null)}
                                    className={`aspect-square border flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200
                                    ${selectedDesign === null 
                                        ? 'border-industrial-black bg-industrial-black text-white' 
                                        : 'border-gray-200 hover:border-industrial-black text-gray-500 bg-white'}`}
                                >
                                    <span className="text-xl mb-1">✕</span>
                                    <span className="text-[10px] font-bold uppercase text-center leading-none">Sin Diseño</span>
                                </button>

                                {designs.map(design => (
                                    <button
                                        key={design.id}
                                        onClick={() => setSelectedDesign(design)}
                                        className={`aspect-square border relative p-1 rounded-lg transition-all duration-200 overflow-hidden bg-white
                                        ${selectedDesign?.id === design.id 
                                            ? 'border-industrial-warning ring-2 ring-industrial-warning bg-industrial-warning/5' 
                                            : 'border-gray-200 hover:border-industrial-gray'}`}
                                        title={design.name}
                                    >
                                        <div className="relative w-full h-full">
                                            <Image
                                                src={design.image_url}
                                                alt={design.name}
                                                fill
                                                sizes="80px"
                                                className="object-contain p-1"
                                            />
                                        </div>
                                        {selectedDesign?.id === design.id && (
                                            <div className="absolute top-1 right-1 w-4 h-4 bg-industrial-warning rounded-full flex items-center justify-center shadow-sm">
                                                <span className="text-[9px] font-bold text-industrial-black">✓</span>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 2. Tipo de Prenda */}
                    {products.length > 1 && (
                        <div className="mb-10">
                            <h3 className="font-bold text-xs uppercase tracking-widest mb-4 text-industrial-gray">
                                2. Tipo de Prenda
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {products.map(p => {
                                    const isCurrent = p.slug === product.slug;
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => handleGarmentChange(p.slug)}
                                            className={`flex items-center gap-3 px-4 py-3 border rounded-lg text-sm font-bold uppercase transition-all duration-200
                                            ${isCurrent
                                                ? 'border-industrial-black bg-industrial-black text-white shadow-md'
                                                : 'border-gray-200 text-gray-500 hover:border-industrial-black bg-white hover:text-industrial-black'}`}
                                        >
                                            <div className="relative w-6 h-6 shrink-0 opacity-85">
                                                {p.image_url ? (
                                                    <Image
                                                        src={p.image_url}
                                                        alt={p.name}
                                                        fill
                                                        sizes="24px"
                                                        className={`object-contain ${isCurrent ? 'brightness-0 invert' : ''}`}
                                                    />
                                                ) : (
                                                    <span className="text-sm">👕</span>
                                                )}
                                            </div>
                                            <span>{p.name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 3. Color Base */}
                    <div className="mb-10">
                        <h3 className="font-bold text-xs uppercase tracking-widest mb-4 text-industrial-gray">
                            3. Color Base: <span className="text-industrial-black normal-case font-bold">{selectedColor}</span>
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {product.colors.map(color => {
                                const hex = COLOR_MAP[color];
                                const isSelected = selectedColor === color;
                                return (
                                    <button
                                        key={color}
                                        onClick={() => setSelectedColor(color)}
                                        className={`group relative flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-300
                                            ${isSelected
                                                ? 'border-industrial-black ring-2 ring-industrial-black/20 scale-105'
                                                : 'border-gray-200 hover:border-industrial-black hover:scale-105 bg-white'}`}
                                        title={color}
                                    >
                                        {hex ? (
                                            <span 
                                                className="w-8 h-8 rounded-full border border-gray-150 shadow-inner inline-block"
                                                style={{ backgroundColor: hex }}
                                            />
                                        ) : (
                                            <span className="text-[10px] font-mono leading-none">{color.slice(0, 2)}</span>
                                        )}
                                        {isSelected && (
                                            <span className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 bg-industrial-black text-white text-[8px] font-bold px-1 rounded-sm uppercase tracking-tighter shadow-sm">
                                                ok
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 4. Ubicación del Bordado */}
                    {placementOptions.length > 0 && (
                        <div className="mb-10">
                            <h3 className="font-bold text-xs uppercase tracking-widest mb-4 text-industrial-gray">
                                4. Ubicación del Bordado
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {placementOptions.map(opt => {
                                    const isSelected = activePlacement === opt.value;
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => setActivePlacement(opt.value)}
                                            className={`px-4 py-2.5 border rounded-lg text-sm font-bold uppercase transition-all duration-200
                                            ${isSelected
                                                ? 'border-industrial-black bg-industrial-black text-white shadow-md'
                                                : 'border-gray-200 text-gray-500 hover:border-industrial-black bg-white hover:text-industrial-black'}`}
                                        >
                                            {opt.name}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {placementOptions.length === 0 && (
                        <div className="mb-10 rounded-lg border border-industrial-warning/30 bg-industrial-warning/10 p-4">
                            <p className="text-xs font-black uppercase tracking-widest text-industrial-black">
                                Falta mockup calibrado
                            </p>
                            <p className="mt-2 text-[11px] font-mono uppercase tracking-wider text-industrial-gray">
                                Publica al menos un mockup calibrado para activar la compra de esta prenda.
                            </p>
                        </div>
                    )}

                    {/* 5. Selecciona Talla */}
                    <div className="mb-10">
                        <h3 className="font-bold text-xs uppercase tracking-widest mb-4 text-industrial-gray">
                            5. Selecciona Talla
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {product.sizes.map(size => {
                                const isSelected = selectedSize === size;
                                return (
                                    <button
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        className={`w-12 h-12 flex items-center justify-center border rounded-lg text-sm font-bold transition-all duration-200
                                        ${isSelected
                                            ? 'border-industrial-black bg-industrial-black text-white shadow-md'
                                            : 'border-gray-200 text-gray-500 hover:border-industrial-black bg-white hover:text-industrial-black'}`}
                                    >
                                        {size}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="pt-6 border-t border-gray-100">
                    <div className="bg-industrial-warning/10 p-4 mb-6 rounded-lg border border-industrial-warning/20">
                        <p className="text-xs text-industrial-black/80 font-mono text-center uppercase tracking-wider">
                            ⚠ Tiempo de producción: {leadTime}
                        </p>
                    </div>

                    <a
                        href={generateWhatsAppLink()}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => {
                            if (!canCheckout) {
                                event.preventDefault();
                            }
                        }}
                        aria-disabled={!canCheckout}
                        className={`w-full block font-black text-center py-5 rounded-lg uppercase tracking-widest text-base transition-all shadow-lg ${
                            canCheckout
                                ? 'bg-industrial-black text-industrial-warning hover:bg-gray-900 hover:scale-[1.01] active:scale-[0.99]'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        {canCheckout ? `Comprar por WhatsApp — $${totalPrice.toLocaleString()}` : 'Falta mockup calibrado'}
                    </a>
                    <p className="text-center text-[10px] text-gray-400 mt-4 uppercase tracking-wider">
                        {canCheckout
                            ? 'Serás redirigido a WhatsApp para confirmar los detalles del pedido.'
                            : 'Esta prenda debe calibrarse y publicarse antes de recibir pedidos.'}
                    </p>
                </div>
            </div>
        </div>
    );
}
