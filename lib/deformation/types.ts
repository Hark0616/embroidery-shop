import type { CalibrationPoint, CalibrationSurface } from '@/lib/types/database'

export const ASSISTED_DEFORMATION_SOURCE = 'runpod-depth-normal-v1'
export const SUPPORTED_DEFORMATION_GRID_SIZES = [3, 5, 7] as const

export type DeformationGridSize = (typeof SUPPORTED_DEFORMATION_GRID_SIZES)[number]

export type DeformationIntensity = 'subtle' | 'balanced' | 'marked'

export type DeformationProposal = {
  id: string
  label: string
  intensity: DeformationIntensity
  gridSize: DeformationGridSize
  meshPoints: CalibrationPoint[]
  confidence: number
  warnings: string[]
  source: string
  workerVersion?: string
  debugPreviewUrl?: string | null
}

export type DeformationJobInput = {
  imageUrl: string
  surfaceId: string
  gridSize: DeformationGridSize
  corners: {
    topLeft: CalibrationPoint
    topRight: CalibrationPoint
    bottomLeft: CalibrationPoint
    bottomRight: CalibrationPoint
  }
  coordinateSpace: {
    type: 'container-percent'
    aspectRatio: number
    objectFit: 'contain'
  }
  garmentType?: string | null
  view?: CalibrationSurface['view']
  variantId?: string | null
}

export type DeformationJobOutput = {
  proposals: DeformationProposal[]
}

export type DeformationJobStatus =
  | 'IN_QUEUE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'TIMED_OUT'

