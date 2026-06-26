import type { CalibrationPoint, CalibrationSurface } from '@/lib/types/database'
import { createUniformGrid, getCornerIndices, normalizeSurface } from '@/lib/mesh-utils'
import type { DeformationProposal } from './types'

export type SurfaceValidationResult = {
  ok: boolean
  errors: string[]
  warnings: string[]
}

const ALLOWED_GRID_SIZES = new Set([3, 5, 7])

export function validateSurface(surface: CalibrationSurface): SurfaceValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!surface.id) errors.push('Surface id is required')
  if (!surface.label) warnings.push('Surface label is empty')
  if (surface.type !== 'mesh' && !surface.points) {
    errors.push('Surface type must be mesh or a legacy quad with points')
  }
  if (surface.type === 'mesh') {
    if (!surface.gridSize) errors.push('Mesh grid size is required')
    if (!Array.isArray(surface.meshPoints)) errors.push('Mesh points are required')
  }

  if (errors.length > 0) {
    return { ok: false, errors, warnings }
  }

  let normalized: ReturnType<typeof normalizeSurface>
  try {
    normalized = normalizeSurface(surface)
  } catch {
    return { ok: false, errors: ['Surface could not be normalized'], warnings }
  }

  const { gridSize, meshPoints } = normalized
  if (!ALLOWED_GRID_SIZES.has(gridSize)) {
    errors.push(`Unsupported grid size ${gridSize}`)
  }

  if (!Array.isArray(meshPoints) || meshPoints.length !== gridSize * gridSize) {
    errors.push(`Mesh must contain ${gridSize * gridSize} points`)
  }

  meshPoints.forEach((point, index) => {
    if (!isValidPoint(point)) {
      errors.push(`Point ${index} must be finite and inside 0..100`)
    }
  })

  if (errors.length === 0) {
    const geometryErrors = validateMeshGeometry(meshPoints, gridSize)
    errors.push(...geometryErrors)

    const deformationWarning = getDeformationWarning(meshPoints, gridSize)
    if (deformationWarning) warnings.push(deformationWarning)
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  }
}

export function validateSurfaceMap(surfaces: Record<string, CalibrationSurface>): SurfaceValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!surfaces || typeof surfaces !== 'object' || Array.isArray(surfaces)) {
    return { ok: false, errors: ['Surfaces must be an object'], warnings }
  }

  Object.entries(surfaces).forEach(([key, surface]) => {
    const result = validateSurface(surface)
    errors.push(...result.errors.map(error => `${key}: ${error}`))
    warnings.push(...result.warnings.map(warning => `${key}: ${warning}`))
  })

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  }
}

export function validateDeformationProposal(proposal: DeformationProposal): SurfaceValidationResult {
  const confidenceErrors: string[] = []
  if (!Number.isFinite(proposal.confidence) || proposal.confidence < 0 || proposal.confidence > 1) {
    confidenceErrors.push('Proposal confidence must be between 0 and 1')
  }

  const surfaceResult = validateSurface({
    id: proposal.id || 'proposal',
    label: proposal.label || 'Proposal',
    type: 'mesh',
    view: 'front',
    size: 'medium',
    gridSize: proposal.gridSize,
    meshPoints: proposal.meshPoints,
  })

  return {
    ok: surfaceResult.ok && confidenceErrors.length === 0,
    errors: [...confidenceErrors, ...surfaceResult.errors],
    warnings: [...surfaceResult.warnings, ...(proposal.warnings || [])],
  }
}

function isValidPoint(point: CalibrationPoint) {
  return (
    point &&
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    point.x >= 0 &&
    point.x <= 100 &&
    point.y >= 0 &&
    point.y <= 100
  )
}

function validateMeshGeometry(meshPoints: CalibrationPoint[], gridSize: number) {
  const errors: string[] = []

  for (let row = 0; row < gridSize - 1; row += 1) {
    for (let col = 0; col < gridSize - 1; col += 1) {
      const tl = meshPoints[row * gridSize + col]
      const tr = meshPoints[row * gridSize + col + 1]
      const bl = meshPoints[(row + 1) * gridSize + col]
      const br = meshPoints[(row + 1) * gridSize + col + 1]

      if (segmentsIntersect(tl, tr, br, bl) || segmentsIntersect(tr, br, bl, tl)) {
        errors.push(`Cell ${row},${col} has crossed edges`)
      }

      const area = Math.abs(polygonArea([tl, tr, br, bl]))
      if (area < 0.02) {
        errors.push(`Cell ${row},${col} is too small`)
      }
    }
  }

  return errors
}

function getDeformationWarning(meshPoints: CalibrationPoint[], gridSize: number) {
  const corners = getCornerIndices(gridSize)
  const uniform = createUniformGrid(
    meshPoints[corners[0]],
    meshPoints[corners[1]],
    meshPoints[corners[2]],
    meshPoints[corners[3]],
    gridSize,
  )

  const maxDelta = meshPoints.reduce((max, point, index) => {
    const reference = uniform[index]
    if (!reference) return max
    const distance = Math.hypot(point.x - reference.x, point.y - reference.y)
    return Math.max(max, distance)
  }, 0)

  return maxDelta > 22 ? 'Mesh deformation is strong; review in preview before publishing' : ''
}

function polygonArea(points: CalibrationPoint[]) {
  return points.reduce((total, point, index) => {
    const next = points[(index + 1) % points.length]
    return total + point.x * next.y - next.x * point.y
  }, 0) / 2
}

function segmentsIntersect(a: CalibrationPoint, b: CalibrationPoint, c: CalibrationPoint, d: CalibrationPoint) {
  const o1 = orientation(a, b, c)
  const o2 = orientation(a, b, d)
  const o3 = orientation(c, d, a)
  const o4 = orientation(c, d, b)
  return o1 * o2 < 0 && o3 * o4 < 0
}

function orientation(a: CalibrationPoint, b: CalibrationPoint, c: CalibrationPoint) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
}
