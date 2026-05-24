export interface PlacementOption {
    id: string;
    label: string;
    x: number;          // Coordenada X central (%)
    y: number;          // Coordenada Y central (%)
    scale: number;      // Ancho recomendado (%)
    view: 'front' | 'back';
}

export const PLACEMENT_MAP: Record<string, Record<string, PlacementOption>> = {
    // Camisetas y buzos (por defecto)
    default: {
        'pecho-centro': { id: 'pecho-centro', label: 'Centro Pecho', x: 50, y: 35, scale: 24, view: 'front' },
        'pecho-izquierdo': { id: 'pecho-izquierdo', label: 'Pecho Izquierdo (Logo)', x: 65, y: 32, scale: 12, view: 'front' }, // Adjusted X to 65 for left chest (from wearer's perspective, it's on the right side of the image usually, wait: right side of the image is left chest for the wearer. If x=0 is left of image, x=100 is right. Left chest on person is right side of image. Let's use x=65 for right side of image).
        'espalda-centro': { id: 'espalda-centro', label: 'Espalda Grande', x: 50, y: 42, scale: 36, view: 'back' },
    },
    // Gorras
    gorras: {
        'frente-centro': { id: 'frente-centro', label: 'Frente Centro', x: 50, y: 45, scale: 20, view: 'front' },
        'lateral-izquierdo': { id: 'lateral-izquierdo', label: 'Lateral Izquierdo', x: 65, y: 52, scale: 10, view: 'front' },
    },
    // Bolsos / Totebags
    bolsos: {
        'centro': { id: 'centro', label: 'Centro', x: 50, y: 50, scale: 32, view: 'front' },
    }
};

export function getPlacementsForProduct(slug: string): Record<string, PlacementOption> {
    const s = slug.toLowerCase();
    if (s.includes('gorra') || s.includes('cap')) return PLACEMENT_MAP.gorras;
    if (s.includes('bolso') || s.includes('tote')) return PLACEMENT_MAP.bolsos;
    return PLACEMENT_MAP.default;
}
