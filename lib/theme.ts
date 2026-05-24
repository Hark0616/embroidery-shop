export const MOOD_COLORS: Record<string, string> = {
    rebelde: '#ef4444',  // Red-500
    delicado: '#f472b6', // Pink-400
    geek: '#8b5cf6',     // Violet-500
    tierno: '#f59e0b',   // Amber-500
    minimal: '#4b5563',  // Gray-600
    default: '#EAB308',  // Yellow-500 (Brand default)
};

// Maps categories to moods
export const CATEGORY_TO_MOOD: Record<string, string> = {
    // Rebelde
    rebelde: 'rebelde',
    punk: 'rebelde',
    rock: 'rebelde',
    calaveras: 'rebelde',
    calavera: 'rebelde',
    moto: 'rebelde',
    motorcycle: 'rebelde',
    metal: 'rebelde',
    fuego: 'rebelde',
    fire: 'rebelde',
    
    // Delicado
    delicado: 'delicado',
    flores: 'delicado',
    flor: 'delicado',
    naturaleza: 'delicado',
    botanico: 'delicado',
    botanica: 'delicado',
    mariposas: 'delicado',
    mariposa: 'delicado',
    love: 'delicado',
    amor: 'delicado',
    
    // Geek
    geek: 'geek',
    anime: 'geek',
    gaming: 'geek',
    pixel: 'geek',
    tech: 'geek',
    scifi: 'geek',
    juegos: 'geek',
    consolas: 'geek',
    
    // Tierno
    tierno: 'tierno',
    kawaii: 'tierno',
    animales: 'tierno',
    animal: 'tierno',
    cute: 'tierno',
    cartoon: 'tierno',
    dibujos: 'tierno',
    bebe: 'tierno',
    
    // Minimal
    minimal: 'minimal',
    geometrico: 'minimal',
    abstracto: 'minimal',
    lineas: 'minimal',
    linea: 'minimal',
};

export function getMoodFromCategory(category: string | null | undefined): string {
    if (!category) return 'default';
    const normalized = category.toLowerCase().trim();
    return CATEGORY_TO_MOOD[normalized] || 'default';
}

export function applyMoodTheme(moodOrCategory: string | null | undefined) {
    if (typeof window === 'undefined') return;
    
    let mood = 'default';
    if (moodOrCategory) {
        const normalized = moodOrCategory.toLowerCase().trim();
        if (MOOD_COLORS[normalized]) {
            mood = normalized;
        } else {
            mood = getMoodFromCategory(normalized);
        }
    }
    
    const color = MOOD_COLORS[mood] || MOOD_COLORS.default;
    document.documentElement.style.setProperty('--theme-accent', color);
}
