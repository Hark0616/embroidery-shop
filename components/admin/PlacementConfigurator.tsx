'use client';

import { useState } from 'react';
import Visualizer from '@/components/studio/Visualizer';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function PlacementConfigurator({ product }: { product: any }) {
    const router = useRouter();
    const supabase = createClient();
    
    // Parse existing placements or use empty object
    const [placements, setPlacements] = useState<Record<string, any>>(
        product.placements || {}
    );
    
    // UI state
    const [activePlacementId, setActivePlacementId] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);
    
    // Temp design for calibration
    const placeholderSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
            <rect width="100%" height="100%" fill="none" stroke="#FFC107" stroke-width="8" stroke-dasharray="20,20"/>
            <text x="50%" y="50%" font-family="monospace" font-size="48" font-weight="bold" fill="#FFC107" text-anchor="middle" dominant-baseline="middle">LOGO</text>
            <circle cx="0" cy="0" r="20" fill="#FFC107" />
            <circle cx="400" cy="0" r="20" fill="#FFC107" />
            <circle cx="0" cy="400" r="20" fill="#FFC107" />
            <circle cx="400" cy="400" r="20" fill="#FFC107" />
        </svg>
    `;
    const placeholderDesignUrl = "data:image/svg+xml;base64," + (typeof window !== 'undefined' ? window.btoa(placeholderSvg) : '');

    const handleAddZone = () => {
        const zoneId = prompt("Nombre ID de la zona (ej: 'pecho-centro', 'espalda', 'manga'):");
        if (!zoneId) return;
        
        const label = prompt("Etiqueta visible para el cliente (ej: 'Centro del Pecho'):") || zoneId;
        const view = confirm("¿Esta zona va en la ESPALDA? (Aceptar = Sí, Cancelar = Frente)") ? 'back' : 'front';
        
        setPlacements(prev => ({
            ...prev,
            [zoneId]: {
                id: zoneId,
                label: label,
                x: 50,
                y: 50,
                scale: 20,
                rotateZ: 0,
                rotateX: 0,
                rotateY: 0,
                view: view
            }
        }));
        setActivePlacementId(zoneId);
    };

    const handleDeleteZone = (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar esta zona?')) return;
        const newPlacements = { ...placements };
        delete newPlacements[id];
        setPlacements(newPlacements);
        if (activePlacementId === id) setActivePlacementId('');
    };

    const handleAdminUpdate = (x: number, y: number) => {
        if (!activePlacementId) return;
        setPlacements(prev => ({
            ...prev,
            [activePlacementId]: {
                ...prev[activePlacementId],
                x,
                y
            }
        }));
    };

    const handleScaleChange = (scale: number) => {
        if (!activePlacementId) return;
        setPlacements(prev => ({
            ...prev,
            [activePlacementId]: {
                ...prev[activePlacementId],
                scale
            }
        }));
    };

    const handleRotationChange = (type: 'rotateZ' | 'rotateX' | 'rotateY', value: number) => {
        if (!activePlacementId) return;
        setPlacements(prev => ({
            ...prev,
            [activePlacementId]: {
                ...prev[activePlacementId],
                [type]: value
            }
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('base_products')
                .update({ placements })
                .eq('id', product.id);
                
            if (error) throw error;
            alert('Zonas guardadas correctamente.');
            router.refresh();
        } catch (error) {
            console.error('Error saving placements:', error);
            alert('Error al guardar.');
        } finally {
            setIsSaving(false);
        }
    };

    const activeConfig = placements[activePlacementId];
    const isBackView = activeConfig?.view === 'back';
    const displayImage = isBackView && product.back_image_url 
        ? product.back_image_url 
        : product.image_url;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Visualizer Side */}
            <div className="bg-white p-4 border border-industrial-gray/20">
                <Visualizer
                    productImage={displayImage}
                    textureMapImage={product.texture_map_url}
                    designImage={activePlacementId ? placeholderDesignUrl : null}
                    productName={product.name}
                    designName="Logo de Prueba"
                    positionX={activeConfig?.x ?? 50}
                    positionY={activeConfig?.y ?? 50}
                    designScale={activeConfig?.scale ?? 20}
                    rotation={activeConfig?.rotateZ ?? 0}
                    rotateX={activeConfig?.rotateX ?? 0}
                    rotateY={activeConfig?.rotateY ?? 0}
                    isAdminMode={!!activePlacementId}
                    onAdminUpdate={handleAdminUpdate}
                />
            </div>
            
            {/* Controls Side */}
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-heading font-black text-xl uppercase tracking-tighter">Zonas de Bordado</h3>
                        <p className="font-mono text-xs text-industrial-gray">Calibra las mallas arrastrando el logo.</p>
                    </div>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-3 bg-industrial-warning font-bold uppercase tracking-widest text-xs hover:bg-industrial-black hover:text-white transition-colors"
                    >
                        {isSaving ? 'Guardando...' : 'Guardar Zonas'}
                    </button>
                </div>

                <div className="flex flex-col gap-2">
                    {Object.values(placements).map((zone: any) => (
                        <div 
                            key={zone.id}
                            className={`p-4 border cursor-pointer flex justify-between items-center transition-colors ${
                                activePlacementId === zone.id 
                                    ? 'border-industrial-black bg-gray-50' 
                                    : 'border-industrial-gray/20 hover:border-industrial-gray/50'
                            }`}
                            onClick={() => setActivePlacementId(zone.id)}
                        >
                            <div>
                                <p className="font-bold uppercase tracking-widest text-sm">{zone.label}</p>
                                <p className="font-mono text-[10px] text-industrial-gray">
                                    Vista: {zone.view === 'back' ? 'Espalda' : 'Frente'} | X: {zone.x}% | Y: {zone.y}% | Escala: {zone.scale}%
                                </p>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteZone(zone.id); }}
                                className="text-red-500 font-mono text-xs uppercase tracking-widest hover:underline"
                            >
                                Eliminar
                            </button>
                        </div>
                    ))}
                    
                    <button 
                        onClick={handleAddZone}
                        className="p-4 border-2 border-dashed border-industrial-gray/30 text-industrial-gray font-bold uppercase tracking-widest text-xs hover:border-industrial-black hover:text-industrial-black transition-colors"
                    >
                        + Agregar Nueva Zona
                    </button>
                </div>

                {activePlacementId && (
                    <div className="p-6 bg-gray-50 border border-industrial-gray/20">
                        <h4 className="font-bold uppercase tracking-widest text-sm mb-4">Ajuste Fino: {activeConfig.label}</h4>
                        <div className="flex flex-col gap-4">
                            <div>
                                <label className="font-mono text-xs text-industrial-gray block mb-2">Escala del Diseño ({activeConfig.scale}%)</label>
                                <input 
                                    type="range" 
                                    min="5" 
                                    max="80" 
                                    value={activeConfig.scale} 
                                    onChange={(e) => handleScaleChange(Number(e.target.value))}
                                    className="w-full accent-industrial-black"
                                />
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-industrial-gray/10">
                                <div>
                                    <label className="font-mono text-[10px] text-industrial-gray block mb-1">Inclinación Vertical (X)</label>
                                    <input 
                                        type="range" 
                                        min="-60" max="60" 
                                        value={activeConfig.rotateX || 0} 
                                        onChange={(e) => handleRotationChange('rotateX', Number(e.target.value))}
                                        className="w-full accent-industrial-black"
                                    />
                                    <div className="text-[10px] font-mono text-center text-gray-400">{activeConfig.rotateX || 0}°</div>
                                </div>
                                <div>
                                    <label className="font-mono text-[10px] text-industrial-gray block mb-1">Inclinación Lateral (Y)</label>
                                    <input 
                                        type="range" 
                                        min="-60" max="60" 
                                        value={activeConfig.rotateY || 0} 
                                        onChange={(e) => handleRotationChange('rotateY', Number(e.target.value))}
                                        className="w-full accent-industrial-black"
                                    />
                                    <div className="text-[10px] font-mono text-center text-gray-400">{activeConfig.rotateY || 0}°</div>
                                </div>
                                <div>
                                    <label className="font-mono text-[10px] text-industrial-gray block mb-1">Giro (Z)</label>
                                    <input 
                                        type="range" 
                                        min="-180" max="180" 
                                        value={activeConfig.rotateZ || 0} 
                                        onChange={(e) => handleRotationChange('rotateZ', Number(e.target.value))}
                                        className="w-full accent-industrial-black"
                                    />
                                    <div className="text-[10px] font-mono text-center text-gray-400">{activeConfig.rotateZ || 0}°</div>
                                </div>
                            </div>
                            <p className="font-mono text-[10px] text-industrial-gray mt-2">
                                * Arrastra el diseño directamente sobre la prenda en el visualizador para ajustar X y Y.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
