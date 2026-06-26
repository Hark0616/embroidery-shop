export type MoodKey = 'rebelde' | 'delicado' | 'geek' | 'tierno' | 'minimal'

export type MoodCategory = {
  value: string
  label: string
  mood: MoodKey
}

export type MoodDefinition = {
  mood: MoodKey | 'custom'
  title: string
  subtitle: string
  icon: string
  gradient: string
  categories: string[]
}

export const MOOD_DEFINITIONS: MoodDefinition[] = [
  {
    mood: 'rebelde',
    title: 'Rebelde',
    subtitle: 'Calaveras · Punk · Rock · Fire',
    icon: '🔥',
    gradient: 'bg-gradient-to-br from-red-600 via-orange-500 to-yellow-500',
    categories: ['rebelde', 'punk', 'rock', 'calaveras'],
  },
  {
    mood: 'delicado',
    title: 'Delicado',
    subtitle: 'Flores · Mariposas · Naturaleza',
    icon: '🌸',
    gradient: 'bg-gradient-to-br from-pink-400 via-rose-300 to-purple-300',
    categories: ['delicado', 'flores', 'naturaleza', 'botanico'],
  },
  {
    mood: 'geek',
    title: 'Geek',
    subtitle: 'Anime · Gaming · Pixel Art · Sci-Fi',
    icon: '🎮',
    gradient: 'bg-gradient-to-br from-violet-600 via-blue-500 to-cyan-400',
    categories: ['geek', 'anime', 'gaming', 'pixel'],
  },
  {
    mood: 'tierno',
    title: 'Tierno',
    subtitle: 'Animales · Kawaii · Cute · Cartoon',
    icon: '🐾',
    gradient: 'bg-gradient-to-br from-amber-300 via-yellow-200 to-orange-200',
    categories: ['tierno', 'kawaii', 'animales', 'cute'],
  },
  {
    mood: 'minimal',
    title: 'Minimal',
    subtitle: 'Lineas · Geometrico · Abstracto',
    icon: '◯',
    gradient: 'bg-gradient-to-br from-gray-800 via-gray-600 to-gray-400',
    categories: ['minimal', 'geometrico', 'abstracto', 'lineas'],
  },
  {
    mood: 'custom',
    title: 'Tu Diseño',
    subtitle: 'Trae tu imagen · Hazlo unico',
    icon: '✨',
    gradient: 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500',
    categories: [],
  },
]

export const DESIGN_MOOD_CATEGORIES: MoodCategory[] = [
  { mood: 'rebelde', value: 'rebelde', label: 'Rebelde' },
  { mood: 'rebelde', value: 'punk', label: 'Punk' },
  { mood: 'rebelde', value: 'rock', label: 'Rock' },
  { mood: 'rebelde', value: 'calaveras', label: 'Calaveras' },
  { mood: 'delicado', value: 'delicado', label: 'Delicado' },
  { mood: 'delicado', value: 'flores', label: 'Flores' },
  { mood: 'delicado', value: 'naturaleza', label: 'Naturaleza' },
  { mood: 'delicado', value: 'botanico', label: 'Botanico' },
  { mood: 'geek', value: 'geek', label: 'Geek' },
  { mood: 'geek', value: 'anime', label: 'Anime' },
  { mood: 'geek', value: 'gaming', label: 'Gaming' },
  { mood: 'geek', value: 'pixel', label: 'Pixel art' },
  { mood: 'tierno', value: 'tierno', label: 'Tierno' },
  { mood: 'tierno', value: 'kawaii', label: 'Kawaii' },
  { mood: 'tierno', value: 'animales', label: 'Animales' },
  { mood: 'tierno', value: 'cute', label: 'Cute' },
  { mood: 'minimal', value: 'minimal', label: 'Minimal' },
  { mood: 'minimal', value: 'geometrico', label: 'Geometrico' },
  { mood: 'minimal', value: 'abstracto', label: 'Abstracto' },
  { mood: 'minimal', value: 'lineas', label: 'Lineas' },
]

export const MOOD_CATEGORY_MAP = MOOD_DEFINITIONS.reduce<Record<string, string[]>>((acc, item) => {
  if (item.mood !== 'custom') acc[item.mood] = item.categories
  return acc
}, {})

export const MOOD_LABELS = MOOD_DEFINITIONS.reduce<Record<string, { label: string; icon: string }>>((acc, item) => {
  if (item.mood !== 'custom') {
    acc[item.mood] = { label: item.title, icon: item.icon }
  }
  return acc
}, {})

export function normalizeMoodCategory(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase()
}

export function isMoodCategoryCompatible(category: string | null | undefined) {
  const normalized = normalizeMoodCategory(category)
  return DESIGN_MOOD_CATEGORIES.some(item => item.value === normalized)
}

export function getMoodForCategory(category: string | null | undefined): MoodKey | null {
  const normalized = normalizeMoodCategory(category)
  return DESIGN_MOOD_CATEGORIES.find(item => item.value === normalized)?.mood || null
}
