import type { CalibrationPoint, CalibrationSurface } from '@/lib/types/database'
import { getCornerIndices, normalizeSurface } from '@/lib/mesh-utils'
import type {
  CalibrationTransferPackage,
  CalibrationTransferResult,
  DeformationGridSize,
  DeformationIntensity,
  DeformationProposal,
} from './types'
import { validateDeformationProposal, validateSurface } from './surface-validation'

export type BuildCalibrationPackageInput = {
  mockup: {
    id: string
    name: string
    view: CalibrationSurface['view']
    imageUrl: string
    variantId?: string | null
    variantColorName?: string | null
  }
  product?: {
    name?: string | null
    slug?: string | null
    productType?: string | null
  }
  surface: CalibrationSurface
}

export function buildCalibrationTransferPackage(input: BuildCalibrationPackageInput): CalibrationTransferPackage {
  const surface = normalizeSurface(input.surface)
  const gridSize = normalizeGridSize(surface.gridSize)
  const corners = getSurfaceCorners(surface)

  return {
    kind: 'texere-calibration-package',
    version: 1,
    exportId: `${input.mockup.id}-${surface.id}-${Date.now()}`,
    generatedAt: new Date().toISOString(),
    mockup: input.mockup,
    product: input.product,
    surface: {
      ...surface,
      type: 'mesh',
      gridSize,
      meshPoints: surface.meshPoints,
    },
    corners,
    coordinateSpace: {
      type: 'container-percent',
      aspectRatio: 0.8,
      objectFit: 'contain',
    },
    recommendedOutput: {
      gridSize,
      proposals: ['subtle', 'balanced', 'marked'],
    },
  }
}

export function extractDeformationProposalsFromImport(value: unknown): DeformationProposal[] {
  const raw = value as Partial<CalibrationTransferResult> & Partial<DeformationProposal> & {
    proposals?: unknown
    meshPoints?: unknown
    surface?: unknown
  }

  if (Array.isArray(raw.proposals)) {
    return raw.proposals.map((proposal, index) => normalizeImportedProposal(proposal, index))
  }

  if (raw.surface && typeof raw.surface === 'object') {
    return [surfaceToProposal(raw.surface as CalibrationSurface, 0, 'Importada')]
  }

  if (Array.isArray(raw.meshPoints)) {
    return [normalizeImportedProposal(raw, 0)]
  }

  return [surfaceToProposal(value as CalibrationSurface, 0, 'Importada')]
}

export function assertValidImportedProposals(proposals: DeformationProposal[]) {
  if (proposals.length === 0) {
    throw new Error('No deformation proposals found')
  }

  proposals.forEach((proposal, index) => {
    const validation = validateDeformationProposal(proposal)
    if (!validation.ok) {
      throw new Error(`Proposal ${index + 1}: ${validation.errors.join('; ')}`)
    }
  })
}

export function getSurfaceCorners(surface: CalibrationSurface) {
  const normalized = normalizeSurface(surface)
  const corners = getCornerIndices(normalized.gridSize)
  return {
    topLeft: normalized.meshPoints[corners[0]],
    topRight: normalized.meshPoints[corners[1]],
    bottomLeft: normalized.meshPoints[corners[2]],
    bottomRight: normalized.meshPoints[corners[3]],
  }
}

function normalizeImportedProposal(value: unknown, index: number): DeformationProposal {
  const proposal = value as Partial<DeformationProposal> & {
    meshPoints?: CalibrationPoint[]
    gridSize?: number
  }

  return {
    id: String(proposal.id || `imported-${index + 1}`),
    label: String(proposal.label || `Importada ${index + 1}`),
    intensity: normalizeIntensity(proposal.intensity),
    gridSize: normalizeGridSize(proposal.gridSize),
    meshPoints: Array.isArray(proposal.meshPoints) ? proposal.meshPoints : [],
    confidence: normalizeConfidence(proposal.confidence),
    warnings: Array.isArray(proposal.warnings) ? proposal.warnings.map(String) : [],
    source: String(proposal.source || 'colab-import'),
    workerVersion: proposal.workerVersion ? String(proposal.workerVersion) : undefined,
    debugPreviewUrl: proposal.debugPreviewUrl ? String(proposal.debugPreviewUrl) : null,
  }
}

function surfaceToProposal(surface: CalibrationSurface, index: number, label: string): DeformationProposal {
  const validation = validateSurface(surface)
  if (!validation.ok) {
    throw new Error(validation.errors.join('; '))
  }

  const normalized = normalizeSurface(surface)
  return {
    id: `${normalized.id || 'surface'}-${index + 1}`,
    label,
    intensity: 'balanced',
    gridSize: normalizeGridSize(normalized.gridSize),
    meshPoints: normalized.meshPoints,
    confidence: normalizeConfidence(normalized.assistConfidence ?? 0.7),
    warnings: normalized.assistWarnings || [],
    source: normalized.assistSource || 'surface-import',
    workerVersion: normalized.assistVersion,
    debugPreviewUrl: null,
  }
}

function normalizeGridSize(value: unknown): DeformationGridSize {
  return value === 7 ? 7 : value === 3 ? 3 : 5
}

function normalizeIntensity(value: unknown): DeformationIntensity {
  return value === 'subtle' || value === 'marked' ? value : 'balanced'
}

function normalizeConfidence(value: unknown) {
  const confidence = Number(value)
  if (!Number.isFinite(confidence)) return 0.7
  return Math.max(0, Math.min(1, confidence))
}

