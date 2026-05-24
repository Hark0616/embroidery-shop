'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import type { BaseProduct, EmbroideryDesign } from '@/lib/types/database';
import Visualizer from './Visualizer';
import OptionSelector from './OptionSelector';
import { buildWhatsAppMessage } from '@/lib/whatsapp';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { applyMoodTheme } from '@/lib/theme';
import { getPlacementsForProduct } from '@/lib/placements';

interface VirtualStudioProps {
    products: BaseProduct[];
    designs: EmbroideryDesign[];
}

type StudioStep = 'product' | 'design' | 'details' | 'checkout';

const THREAD_COLORS = [
    { id: 'original', name: 'Original', css: 'none' },
    { id: 'oro', name: 'Oro Metálico', css: 'sepia(1) hue-rotate(5deg) saturate(3) brightness(1.1) contrast(1.2)' },
    { id: 'plata', name: 'Plata Metálico', css: 'grayscale(1) brightness(1.5) contrast(1.1)' },
    { id: 'blanco', name: 'Blanco', css: 'grayscale(1) brightness(2)' },
    { id: 'negro', name: 'Negro', css: 'grayscale(1) brightness(0)' },
];

export default function VirtualStudio({ products, designs }: VirtualStudioProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // URL State Sync
    const initialProductSlug = searchParams.get('product');
    const initialDesignId = searchParams.get('design');
    const isCustomMode = searchParams.get('custom') === 'true';

    const [selectedProduct, setSelectedProduct] = useState<BaseProduct | null>(
        products.find(p => p.slug === initialProductSlug) || null
    );

    const [selectedDesign, setSelectedDesign] = useState<EmbroideryDesign | null>(
        designs.find(d => d.id === initialDesignId) || null
    );

    const [activeStep, setActiveStep] = useState<StudioStep>(() => {
        if (initialProductSlug && initialDesignId) return 'details';
        if (initialProductSlug) return 'design';
        if (initialDesignId) return 'product';
        return 'product';
    });

    const [selectedColor, setSelectedColor] = useState<string>('');
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [selectedThread, setSelectedThread] = useState<string>('original');
    
    // Placement State
    const [activePlacement, setActivePlacement] = useState<string>('default');

    const [showDesignGallery, setShowDesignGallery] = useState(false);
    const [designSearch, setDesignSearch] = useState('');
    const [isCustomUpload, setIsCustomUpload] = useState(isCustomMode);
    const [customDesignName, setCustomDesignName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [customPreviewUrl, setCustomPreviewUrl] = useState<string | null>(null);

    const placements = useMemo(() => {
        if (selectedProduct?.placements && Object.keys(selectedProduct.placements).length > 0) {
            return selectedProduct.placements as Record<string, any>;
        }
        return getPlacementsForProduct(selectedProduct?.slug || '');
    }, [selectedProduct]);

    // Reset color/size/placement when product changes
    useEffect(() => {
        if (selectedProduct) {
            if (!selectedProduct.colors.includes(selectedColor)) {
                setSelectedColor(selectedProduct.colors[0] || '');
            }
            if (!selectedProduct.sizes.includes(selectedSize)) {
                setSelectedSize(selectedProduct.sizes[0] || '');
            }
            const firstPlacementKey = Object.keys(placements)[0];
            if (firstPlacementKey) {
                setActivePlacement(firstPlacementKey);
            }
        }
    }, [selectedProduct, selectedColor, selectedSize, placements]);

    // Sync theme accent color
    useEffect(() => {
        if (isCustomUpload) {
            applyMoodTheme('tierno');
        } else if (selectedDesign) {
            applyMoodTheme(selectedDesign.category);
        } else {
            const urlMood = searchParams.get('mood');
            applyMoodTheme(urlMood || null);
        }
    }, [selectedDesign, isCustomUpload, searchParams]);

    const updateUrl = (key: 'product' | 'design', value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set(key, value);
        params.delete('custom');
        router.replace(`/studio?${params.toString()}`, { scroll: false });
    };

    const handleProductSelect = (slug: string) => {
        const product = products.find(p => p.slug === slug);
        if (product) {
            setSelectedProduct(product);
            updateUrl('product', slug);
            setActiveStep('design');
        }
    };

    const handleDesignSelect = (id: string) => {
        const design = designs.find(d => d.id === id);
        if (design) {
            setSelectedDesign(design);
            setIsCustomUpload(false);
            setCustomPreviewUrl(null);
            updateUrl('design', id);
            setActiveStep('details');
            setShowDesignGallery(false);
        }
    };

    const handleCustomFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setCustomPreviewUrl(url);
            setCustomDesignName(file.name.replace(/\.[^/.]+$/, ''));
            setIsCustomUpload(true);
            setSelectedDesign(null);
            setActiveStep('details');
        }
    };

    const handleValidation = () => {
        if (!selectedProduct) return false;
        if (!selectedDesign && !isCustomUpload) return false;
        if (!selectedColor) return false;
        if (!selectedSize) return false;
        return true;
    };

    const estimatedTotal = useMemo(() => {
        if (!selectedProduct) return 0;
        // Mock embroidery cost calculation (could be based on placement scale or design category)
        const embroideryCost = isCustomUpload ? 25000 : 15000;
        return selectedProduct.base_price + embroideryCost;
    }, [selectedProduct, isCustomUpload]);

    const handleWhatsAppCheckout = () => {
        if (!selectedProduct) return;

        const designName = isCustomUpload
            ? `Diseño personalizado: ${customDesignName || 'Imagen adjunta'}`
            : selectedDesign?.name || '';
            
        const placementLabel = placements[activePlacement]?.label || 'Por defecto';
        const threadLabel = THREAD_COLORS.find(t => t.id === selectedThread)?.name || 'Original';

        const customMessage = `👕 PRENDA: ${selectedProduct.name}
🎨 DISEÑO: ${designName}
📍 ZONA: ${placementLabel}
📏 TALLA: ${selectedSize}
🎨 COLOR TELA: ${selectedColor}
🧵 HILO: ${threadLabel}
💰 TOTAL ESTIMADO: $${estimatedTotal.toLocaleString('es-CO')}

Hola, quiero ordenar este bordado personalizado.`;

        const encodedMessage = encodeURIComponent(customMessage);
        // Replace 573000000000 with actual business number
        const whatsappUrl = `https://wa.me/573000000000?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
    };

    // Derived Visualizer State
    const activePlacementConfig = placements[activePlacement];
    const displayX = activePlacementConfig?.x ?? 50;
    const displayY = activePlacementConfig?.y ?? 35;
    const displayScale = activePlacementConfig?.scale ?? 25;
    const isBackView = activePlacementConfig?.view === 'back';

    const colorImages = selectedProduct?.color_images as Record<string, string> | undefined;
    const currentBaseImage = (isBackView && selectedProduct?.back_image_url)
        ? selectedProduct.back_image_url
        : (colorImages?.[selectedColor] || selectedProduct?.image_url);

    // Memoize options
    const productOptions = useMemo(() => products.map(p => ({
        id: p.id,
        name: p.name,
        value: p.slug,
        image_url: p.image_url
    })), [products]);

    const filteredDesigns = useMemo(() => {
        if (!designSearch) return designs;
        return designs.filter(d =>
            d.name.toLowerCase().includes(designSearch.toLowerCase()) ||
            d.category?.toLowerCase().includes(designSearch.toLowerCase())
        );
    }, [designs, designSearch]);

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

    const placementOptions = useMemo(() => Object.entries(placements).map(([key, config]) => ({
        id: key,
        name: config.label,
        value: key
    })), [placements]);

    const threadOptions = THREAD_COLORS.map(t => ({
        id: t.id,
        name: t.name,
        value: t.id
    }));

    const isComplete = handleValidation();

    const renderStepHeader = (step: StudioStep, label: string, isCompleted: boolean, stepNum: string) => (
        <motion.div
            layout
            onClick={() => setActiveStep(step)}
            className={`flex items-center justify-between p-4 border cursor-pointer transition-all duration-300 ${activeStep === step
                ? 'border-industrial-black bg-industrial-black text-white'
                : isCompleted
                    ? 'border-industrial-gray/20 bg-white hover:border-industrial-black'
                    : 'border-industrial-gray/10 bg-gray-50 text-industrial-gray'
                }`}
        >
            <div className="flex items-center gap-3">
                <span className={`w-6 h-6 flex items-center justify-center text-[10px] font-bold border ${isCompleted && activeStep !== step
                    ? 'bg-industrial-warning text-industrial-black border-industrial-warning'
                    : activeStep === step
                        ? 'border-white/30 text-white'
                        : 'border-industrial-gray/20 text-industrial-gray'
                    }`}>
                    {isCompleted && activeStep !== step ? '✓' : stepNum}
                </span>
                <span className="font-heading font-bold uppercase tracking-widest text-xs">
                    {label}
                </span>
            </div>
            {isCompleted && activeStep !== step && (
                <span className="text-industrial-warning text-[10px] font-mono uppercase tracking-widest">
                    Cambiar
                </span>
            )}
        </motion.div>
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start min-h-[calc(100vh-64px)] p-4 md:p-8">

            {/* LEFT: Visualizer */}
            <div className="order-1 lg:order-1 lg:col-span-7 h-[100vh] lg:h-auto">
                <Visualizer
                    productImage={currentBaseImage}
                    textureMapImage={selectedProduct?.texture_map_url}
                    designImage={isCustomUpload ? customPreviewUrl : selectedDesign?.image_url}
                    productName={selectedProduct?.name}
                    designName={isCustomUpload ? customDesignName : selectedDesign?.name}
                    positionX={displayX}
                    positionY={displayY}
                    designScale={displayScale}
                    rotation={activePlacementConfig?.rotateZ ?? 0}
                    rotateX={activePlacementConfig?.rotateX ?? 0}
                    rotateY={activePlacementConfig?.rotateY ?? 0}
                    isAdminMode={false}
                    threadFilter={THREAD_COLORS.find(t => t.id === selectedThread)?.css || 'none'}
                />
            </div>

            {/* RIGHT: Controls */}
            <div className="order-2 lg:order-2 lg:col-span-5 flex flex-col gap-3 pb-24 lg:pb-8">

                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-4">
                        <a href="/" className="font-mono text-[10px] text-industrial-gray uppercase tracking-widest hover:text-industrial-black transition-colors">
                            Inicio
                        </a>
                        <span className="text-industrial-gray/30">→</span>
                        <span className="font-mono text-[10px] text-industrial-black uppercase tracking-widest font-bold">
                            Studio
                        </span>
                    </div>
                    <h1 className="font-heading font-black text-2xl md:text-3xl uppercase tracking-tighter mb-1">
                        Personalizador
                    </h1>
                    <p className="font-mono text-[10px] text-industrial-gray uppercase tracking-widest">
                        Diseña tu prenda única paso a paso
                    </p>
                </div>

                {/* Build Card Dynamic Summary */}
                <AnimatePresence>
                    {(selectedProduct || selectedDesign || isCustomUpload) && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border border-industrial-gray/10 bg-gray-50 p-4 mb-2 overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                            <div>
                                <p className="font-mono text-[10px] text-industrial-gray uppercase tracking-widest mb-3">
                                    🧾 Tu pedido
                                </p>
                                <div className="flex items-center gap-3 flex-wrap">
                                    {selectedProduct && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="flex items-center gap-2 bg-white border border-industrial-gray/10 px-3 py-1.5"
                                        >
                                            <span className="text-xs">👕</span>
                                            <span className="font-bold text-[10px] uppercase tracking-tight">{selectedProduct.name}</span>
                                        </motion.div>
                                    )}
                                    {(selectedDesign || isCustomUpload) && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="flex items-center gap-2 bg-white border border-industrial-gray/10 px-3 py-1.5"
                                        >
                                            <span className="text-xs">🎨</span>
                                            <span className="font-bold text-[10px] uppercase tracking-tight">
                                                {isCustomUpload ? (customDesignName || 'Tu diseño') : selectedDesign?.name}
                                            </span>
                                        </motion.div>
                                    )}
                                    {selectedColor && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="flex items-center gap-2 bg-white border border-industrial-gray/10 px-3 py-1.5"
                                        >
                                            <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: selectedColor }} />
                                            <span className="font-bold text-[10px] uppercase tracking-tight">{selectedColor}</span>
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Dynamic Pricing */}
                            {selectedProduct && (
                                <div className="text-left md:text-right md:border-l md:border-industrial-gray/20 md:pl-4">
                                    <p className="font-mono text-[10px] text-industrial-gray uppercase tracking-widest mb-1">
                                        Total Estimado
                                    </p>
                                    <p className="font-heading font-black text-xl text-industrial-black">
                                        ${estimatedTotal.toLocaleString('es-CO')}
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* STEP 1: PRODUCT */}
                <div>
                    {activeStep === 'product' ? (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            {/* Garment Carousel */}
                            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-4 border-b border-industrial-gray/10">
                                {products.map((p) => (
                                    <button
                                        key={p.slug}
                                        onClick={() => handleProductSelect(p.slug)}
                                        className={`flex-shrink-0 w-20 h-24 relative rounded-md border flex flex-col items-center justify-center p-2 transition-all ${
                                            selectedProduct?.slug === p.slug 
                                                ? 'border-industrial-black bg-industrial-black text-white' 
                                                : 'border-industrial-gray/20 bg-gray-50 hover:bg-white text-industrial-gray hover:border-industrial-black/50'
                                        }`}
                                    >
                                        <div className="relative w-10 h-10 mb-1 opacity-70">
                                            {p.image_url ? (
                                                <Image src={p.image_url} alt={p.name} fill className="object-contain" />
                                            ) : (
                                                <span className="text-xl">👕</span>
                                            )}
                                        </div>
                                        <span className="font-bold text-[9px] uppercase tracking-tighter text-center leading-tight">
                                            {p.name.split(' ')[0]}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        renderStepHeader('product', `Base: ${selectedProduct?.name || 'Seleccionar'}`, !!selectedProduct, '1')
                    )}
                </div>

                {/* STEP 2: DESIGN */}
                {(selectedProduct || activeStep === 'design') && (
                    <div>
                        {activeStep === 'design' ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                                className="space-y-4"
                            >
                                <h3 className="font-heading font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                                    2. Elige tu Diseño
                                </h3>

                                {/* Custom upload option */}
                                <div
                                    className={`border-2 border-dashed p-6 text-center cursor-pointer transition-all duration-300 ${isCustomUpload
                                        ? 'border-industrial-warning bg-industrial-warning/5'
                                        : 'border-industrial-gray/20 hover:border-industrial-gray/40'
                                        }`}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleCustomFileChange}
                                        className="hidden"
                                    />
                                    {customPreviewUrl ? (
                                        <div className="flex items-center justify-center gap-4">
                                            <div className="relative w-16 h-16 bg-gray-100 overflow-hidden">
                                                <img src={customPreviewUrl} alt="Custom" className="w-full h-full object-contain p-1" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-xs uppercase tracking-tight">{customDesignName}</p>
                                                <p className="font-mono text-[10px] text-industrial-gray">Tu diseño personalizado</p>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveStep('details');
                                                    }}
                                                    className="mt-1 text-[10px] font-bold text-industrial-warning uppercase tracking-widest"
                                                >
                                                    Continuar →
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-3xl mb-2">✨</div>
                                            <p className="font-bold text-xs uppercase tracking-widest mb-1">Sube tu diseño</p>
                                            <p className="font-mono text-[10px] text-industrial-gray">
                                                JPG, PNG o SVG · Resolución recomendada: 1000x1000px
                                            </p>
                                        </>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-px bg-industrial-gray/10" />
                                    <span className="font-mono text-[10px] text-industrial-gray uppercase tracking-widest">o elige de la librería</span>
                                    <div className="flex-1 h-px bg-industrial-gray/10" />
                                </div>

                                <div>
                                    <div className="relative mb-4">
                                        <input
                                            type="text"
                                            placeholder="Buscar diseño..."
                                            value={designSearch}
                                            onChange={(e) => setDesignSearch(e.target.value)}
                                            className="w-full pl-8 pr-4 py-2 border border-industrial-gray/20 text-xs font-mono focus:outline-none focus:border-industrial-black"
                                        />
                                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto scrollbar-hide">
                                        {filteredDesigns.slice(0, 12).map((design) => (
                                            <button
                                                key={design.id}
                                                onClick={() => handleDesignSelect(design.id)}
                                                className={`group relative aspect-square bg-gray-50 border overflow-hidden transition-all duration-200 ${selectedDesign?.id === design.id
                                                    ? 'border-industrial-black ring-2 ring-industrial-warning'
                                                    : 'border-industrial-gray/10 hover:border-industrial-gray/30'
                                                    }`}
                                            >
                                                {design.image_url ? (
                                                    <Image
                                                        src={design.image_url}
                                                        alt={design.name}
                                                        fill
                                                        sizes="120px"
                                                        className="object-contain p-2 group-hover:scale-110 transition-transform mix-blend-multiply"
                                                    />
                                                ) : (
                                                    <span className="text-[10px] text-gray-300 font-mono">N/A</span>
                                                )}
                                                {selectedDesign?.id === design.id && (
                                                    <div className="absolute top-1 right-1 w-4 h-4 bg-industrial-warning flex items-center justify-center">
                                                        <span className="text-[8px] font-bold">✓</span>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => router.push(`/designs?product=${selectedProduct?.slug || ''}`)}
                                        className="mt-3 w-full text-center py-2.5 border border-industrial-gray/20 font-bold text-[10px] uppercase tracking-widest hover:bg-industrial-black hover:text-white hover:border-industrial-black transition-all duration-300"
                                    >
                                        Ver librería completa ({designs.length} diseños) →
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            renderStepHeader(
                                'design',
                                `Diseño: ${isCustomUpload ? (customDesignName || 'Tu diseño') : selectedDesign?.name || 'Seleccionar'}`,
                                !!(selectedDesign || isCustomUpload),
                                '2'
                            )
                        )}
                    </div>
                )}

                {/* STEP 3: DETAILS */}
                {((selectedDesign || isCustomUpload) && selectedProduct || activeStep === 'details') && (
                    <div>
                        {activeStep === 'details' ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3 }}
                                className="border p-5 border-industrial-gray/20 space-y-6 bg-white shadow-xl relative z-20"
                            >
                                <h3 className="font-heading font-bold text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-6 h-6 flex items-center justify-center text-[10px] font-bold border border-industrial-black bg-industrial-black text-white">
                                        3
                                    </span>
                                    Personaliza Detalles
                                </h3>
                                
                                <OptionSelector
                                    label="Ubicación del Bordado"
                                    items={placementOptions}
                                    selectedId={activePlacement}
                                    onSelect={(id) => {
                                        setActivePlacement(id);
                                    }}
                                    type="list"
                                />

                                <OptionSelector
                                    label="Color de la Prenda"
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
                                
                                <OptionSelector
                                    label="Estilo de Hilo"
                                    items={threadOptions}
                                    selectedId={selectedThread}
                                    onSelect={setSelectedThread}
                                    type="list"
                                />
                            </motion.div>
                        ) : (
                            renderStepHeader('details', `Detalles: ${placements[activePlacement]?.label} / ${selectedColor}`, handleValidation(), '3')
                        )}
                    </div>
                )}

                {/* Footer Actions */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-industrial-gray/10 lg:static lg:border-0 lg:p-0 lg:bg-transparent z-40 mt-4">
                    <button
                        onClick={handleWhatsAppCheckout}
                        disabled={!isComplete}
                        className={`w-full font-bold h-14 uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 ${isComplete
                            ? 'bg-industrial-warning hover:bg-industrial-black hover:text-white text-industrial-black animate-pulse-glow shadow-xl hover:-translate-y-1'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        <span className="text-xl">💬</span>
                        <span className="text-sm">
                            {isComplete ? 'Enviar Ficha a Producción' : 'Completa tu selección'}
                        </span>
                    </button>
                    {isComplete && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center font-mono text-[10px] text-industrial-gray mt-2 uppercase tracking-widest"
                        >
                            Se abrirá WhatsApp con la Ficha Técnica estructurada
                        </motion.p>
                    )}
                </div>
            </div>
        </div>
    );
}
