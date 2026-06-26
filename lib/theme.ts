import { DESIGN_MOOD_CATEGORIES } from './moods/catalog'

export const MOOD_COLORS: Record<string, string> = {
    rebelde: '#ef4444',  // Red-500
    delicado: '#f472b6', // Pink-400
    geek: '#8b5cf6',     // Violet-500
    tierno: '#f59e0b',   // Amber-500
    minimal: '#4b5563',  // Gray-600
    default: '#EAB308',  // Yellow-500 (Brand default)
};

// Maps admin design categories to public moods.
export const CATEGORY_TO_MOOD: Record<string, string> = DESIGN_MOOD_CATEGORIES.reduce<Record<string, string>>((acc, item) => {
    acc[item.value] = item.mood
    return acc
}, {});

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
