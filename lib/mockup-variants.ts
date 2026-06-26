import type { GarmentMockup, MockupVariant } from '@/lib/types/database'

function normalize(value?: string | null) {
  return (value || '').trim().toLowerCase()
}

export function getMockupVariants(mockup?: Pick<GarmentMockup, 'variants' | 'color_name' | 'image_url' | 'shadow_map_url'> | null): MockupVariant[] {
  if (!mockup) return []

  const rawVariants = Array.isArray(mockup.variants) ? mockup.variants : []
  const variants = rawVariants
    .map((variant) => {
      if (!variant || typeof variant !== 'object' || Array.isArray(variant)) return null
      const item = variant as Record<string, unknown>
      const imageUrl = typeof item.imageUrl === 'string' ? item.imageUrl : ''
      if (!imageUrl) return null

      return {
        id: typeof item.id === 'string' ? item.id : imageUrl,
        colorName: typeof item.colorName === 'string' ? item.colorName : null,
        imageUrl,
        shadowMapUrl: typeof item.shadowMapUrl === 'string' ? item.shadowMapUrl : null,
        isPrimary: item.isPrimary === true,
      } satisfies MockupVariant
    })
    .filter(Boolean) as MockupVariant[]

  if (variants.length > 0) return variants

  return [{
    id: mockup.color_name || 'default',
    colorName: mockup.color_name,
    imageUrl: mockup.image_url,
    shadowMapUrl: mockup.shadow_map_url,
    isPrimary: true,
  }]
}

export function getMockupVariantForColor(
  mockup?: Pick<GarmentMockup, 'variants' | 'color_name' | 'image_url' | 'shadow_map_url'> | null,
  colorName?: string | null,
) {
  const variants = getMockupVariants(mockup)
  if (variants.length === 0) return null

  const normalizedColor = normalize(colorName)
  if (normalizedColor) {
    const exact = variants.find(variant => normalize(variant.colorName) === normalizedColor)
    if (exact) return exact
  }

  return variants.find(variant => variant.isPrimary) || variants[0]
}

export function getMockupImageForColor(
  mockup?: Pick<GarmentMockup, 'variants' | 'color_name' | 'image_url' | 'shadow_map_url'> | null,
  colorName?: string | null,
) {
  return getMockupVariantForColor(mockup, colorName)?.imageUrl || mockup?.image_url || ''
}

export function getMockupShadowForColor(
  mockup?: Pick<GarmentMockup, 'variants' | 'color_name' | 'image_url' | 'shadow_map_url'> | null,
  colorName?: string | null,
) {
  return getMockupVariantForColor(mockup, colorName)?.shadowMapUrl || mockup?.shadow_map_url || null
}
