export type StudioStep = 'product' | 'design' | 'details' | 'checkout'

type InitialStudioStepInput = {
  hasProduct: boolean
  hasDesign: boolean
  isCustomMode: boolean
  hasCustomFile?: boolean
}

type ProductSelectStepInput = {
  hasDesign: boolean
  isCustomUpload: boolean
  hasCustomFile: boolean
}

export function getInitialStudioStep({
  hasProduct,
  hasDesign,
  isCustomMode,
  hasCustomFile = false,
}: InitialStudioStepInput): StudioStep {
  if (hasProduct && (hasDesign || (isCustomMode && hasCustomFile))) return 'details'
  if (hasProduct) return 'design'
  if (hasDesign || isCustomMode) return 'product'
  return 'product'
}

export function getStepAfterProductSelect({
  hasDesign,
  isCustomUpload,
  hasCustomFile,
}: ProductSelectStepInput): StudioStep {
  return hasDesign || (isCustomUpload && hasCustomFile) ? 'details' : 'design'
}

export function shouldPreserveCustomMode({
  isCustomUpload,
  hasDesign,
}: {
  isCustomUpload: boolean
  hasDesign: boolean
}) {
  return isCustomUpload && !hasDesign
}
