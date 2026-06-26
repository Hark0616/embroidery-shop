export type MockupLike = {
  status?: string | null
  is_public?: boolean | null
  surfaces?: unknown
}

export type ProductLike = {
  is_active?: boolean | null
}

export type GarmentReadiness = {
  label: 'Borrador' | 'Falta mockup' | 'Falta calibrar' | 'Listo para activar' | 'Activa en Studio'
  detail: string
  canActivate: boolean
  className: string
}

export function hasCalibratedSurface(surfaces: unknown) {
  if (!surfaces || typeof surfaces !== 'object' || Array.isArray(surfaces)) {
    return false
  }

  return Object.keys(surfaces).length > 0
}

export function isPublishedCalibratedMockup(mockup: MockupLike) {
  return mockup.status === 'published' && !!mockup.is_public && hasCalibratedSurface(mockup.surfaces)
}

export function canActivateGarment(mockups: MockupLike[]) {
  return mockups.some(isPublishedCalibratedMockup)
}

export function getGarmentReadiness(product: ProductLike, mockups: MockupLike[]): GarmentReadiness {
  const hasMockups = mockups.length > 0
  const calibratedCount = mockups.filter(mockup => hasCalibratedSurface(mockup.surfaces)).length
  const hasPublishedCalibrated = canActivateGarment(mockups)

  if (product.is_active && hasPublishedCalibrated) {
    return {
      label: 'Activa en Studio',
      detail: 'Visible para personalizar con mockup publicado.',
      canActivate: true,
      className: 'border-green-500 text-green-700 bg-green-50',
    }
  }

  if (!hasMockups) {
    return {
      label: 'Falta mockup',
      detail: 'Agrega al menos una foto de la prenda.',
      canActivate: false,
      className: 'border-red-300 text-red-700 bg-red-50',
    }
  }

  if (calibratedCount === 0) {
    return {
      label: 'Falta calibrar',
      detail: 'Calibra una zona bordable antes de publicar.',
      canActivate: false,
      className: 'border-red-300 text-red-700 bg-red-50',
    }
  }

  if (!hasPublishedCalibrated) {
    return {
      label: 'Falta calibrar',
      detail: 'Publica un mockup calibrado para usarlo en Studio.',
      canActivate: false,
      className: 'border-industrial-warning text-industrial-black bg-industrial-warning/10',
    }
  }

  return {
    label: product.is_active ? 'Activa en Studio' : 'Listo para activar',
    detail: product.is_active ? 'Visible para personalizar.' : 'Tiene mockup publicado. Ya puedes activar la prenda.',
    canActivate: true,
    className: product.is_active
      ? 'border-green-500 text-green-700 bg-green-50'
      : 'border-industrial-warning text-industrial-black bg-industrial-warning/10',
  }
}
