'use client'

import type { CSSProperties } from 'react'
import type { CalibrationSurface } from '@/lib/types/database'
import { normalizeSurface } from '@/lib/mesh-utils'
import MeshWarpOverlay from './MeshWarpOverlay'

interface QuadWarpOverlayProps {
  imageUrl: string
  surface: CalibrationSurface
  opacity?: number
  blendMode?: CSSProperties['mixBlendMode']
  filter?: string
  className?: string
}

/**
 * Wrapper that normalizes any CalibrationSurface (quad or mesh) and
 * delegates rendering to MeshWarpOverlay.
 */
export default function QuadWarpOverlay({
  imageUrl,
  surface,
  opacity,
  blendMode,
  filter,
  className,
}: QuadWarpOverlayProps) {
  const normalized = normalizeSurface(surface)

  return (
    <MeshWarpOverlay
      imageUrl={imageUrl}
      gridSize={normalized.gridSize}
      meshPoints={normalized.meshPoints}
      opacity={opacity ?? normalized.opacity ?? 0.94}
      blendMode={blendMode || normalized.blendMode || 'multiply'}
      filter={filter}
      className={className}
    />
  )
}
