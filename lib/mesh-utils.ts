import type { CalibrationPoint, CalibrationSurface, QuadPoints } from '@/lib/types/database'

// ─── Grid creation ───────────────────────────────────────────────

/**
 * Creates a uniform mesh grid by bilinear-interpolating between 4 corners.
 * Points are returned in row-major order: [row0col0, row0col1, ..., row1col0, ...]
 */
export function createUniformGrid(
  topLeft: CalibrationPoint,
  topRight: CalibrationPoint,
  bottomLeft: CalibrationPoint,
  bottomRight: CalibrationPoint,
  gridSize: number,
): CalibrationPoint[] {
  const points: CalibrationPoint[] = []

  for (let row = 0; row < gridSize; row++) {
    const t = row / (gridSize - 1) // vertical interpolation factor

    // Interpolate left and right edges at this row
    const leftX = topLeft.x + t * (bottomLeft.x - topLeft.x)
    const leftY = topLeft.y + t * (bottomLeft.y - topLeft.y)
    const rightX = topRight.x + t * (bottomRight.x - topRight.x)
    const rightY = topRight.y + t * (bottomRight.y - topRight.y)

    for (let col = 0; col < gridSize; col++) {
      const s = col / (gridSize - 1) // horizontal interpolation factor
      points.push({
        x: round(leftX + s * (rightX - leftX)),
        y: round(leftY + s * (rightY - leftY)),
      })
    }
  }

  return points
}

/**
 * Converts a legacy quad (4-corner) surface to a mesh surface.
 */
export function quadToMesh(points: QuadPoints, gridSize: number): CalibrationPoint[] {
  return createUniformGrid(
    points.topLeft,
    points.topRight,
    points.bottomLeft,
    points.bottomRight,
    gridSize,
  )
}

/**
 * Creates a default mesh surface for a new zone.
 */
export function createMeshSurface(
  id: string,
  label: string,
  view: CalibrationSurface['view'],
  size: CalibrationSurface['size'] = 'medium',
  gridSize: number = 5,
): CalibrationSurface {
  const meshPoints = createUniformGrid(
    { x: 36, y: 30 },
    { x: 64, y: 30 },
    { x: 36, y: 55 },
    { x: 64, y: 55 },
    gridSize,
  )

  return {
    id,
    label,
    type: 'mesh',
    view,
    size,
    gridSize,
    meshPoints,
    pinnedPoints: [],
    opacity: 0.94,
    shadowOpacity: 0.7,
    blendMode: 'multiply',
  }
}

// ─── Grid manipulation ───────────────────────────────────────────

/**
 * Returns the (row, col) for a flat index in a grid.
 */
export function indexToRowCol(index: number, gridSize: number): [number, number] {
  return [Math.floor(index / gridSize), index % gridSize]
}

/**
 * Returns the flat index for a (row, col) position.
 */
export function rowColToIndex(row: number, col: number, gridSize: number): number {
  return row * gridSize + col
}

/**
 * Returns what kind of handle a point is based on its position in the grid.
 */
export function getPointRole(
  index: number,
  gridSize: number,
): 'corner' | 'edge' | 'interior' {
  const [row, col] = indexToRowCol(index, gridSize)
  const lastIdx = gridSize - 1

  const isCornerRow = row === 0 || row === lastIdx
  const isCornerCol = col === 0 || col === lastIdx

  if (isCornerRow && isCornerCol) return 'corner'
  if (isCornerRow || isCornerCol) return 'edge'
  return 'interior'
}

/**
 * Returns the 4 corner indices of the grid.
 */
export function getCornerIndices(gridSize: number): [number, number, number, number] {
  const last = gridSize - 1
  return [
    0,                            // top-left
    last,                         // top-right
    last * gridSize,              // bottom-left
    last * gridSize + last,       // bottom-right
  ]
}

/**
 * Re-interpolates all non-pinned points from the 4 corners.
 * Pinned points (manually moved by user) are preserved.
 */
export function reinterpolateFromCorners(
  meshPoints: CalibrationPoint[],
  pinnedPoints: number[],
  gridSize: number,
): CalibrationPoint[] {
  const [tlIdx, trIdx, blIdx, brIdx] = getCornerIndices(gridSize)
  const topLeft = meshPoints[tlIdx]
  const topRight = meshPoints[trIdx]
  const bottomLeft = meshPoints[blIdx]
  const bottomRight = meshPoints[brIdx]

  const interpolated = createUniformGrid(topLeft, topRight, bottomLeft, bottomRight, gridSize)
  const pinnedSet = new Set(pinnedPoints)

  // Always keep corners and pinned points from the current mesh
  return interpolated.map((point, i) => {
    if (pinnedSet.has(i)) return meshPoints[i]
    // Corners are always from the current mesh
    if (i === tlIdx || i === trIdx || i === blIdx || i === brIdx) return meshPoints[i]
    return point
  })
}

/**
 * Normalizes a surface to mesh format. Handles legacy quad surfaces.
 */
export function normalizeSurface(
  surface: CalibrationSurface,
  defaultGridSize: number = 5,
): CalibrationSurface & { type: 'mesh'; gridSize: number; meshPoints: CalibrationPoint[] } {
  if (
    surface.type === 'mesh' &&
    surface.gridSize &&
    surface.meshPoints &&
    surface.meshPoints.length === surface.gridSize * surface.gridSize
  ) {
    return {
      ...surface,
      shadowOpacity: surface.shadowOpacity ?? 0.7,
    } as CalibrationSurface & {
      type: 'mesh'
      gridSize: number
      meshPoints: CalibrationPoint[]
    }
  }

  // Legacy quad → convert
  if (surface.points) {
    const gridSize = surface.gridSize || defaultGridSize
    const meshPoints = quadToMesh(surface.points, gridSize)

    return {
      ...surface,
      type: 'mesh',
      gridSize,
      meshPoints,
      pinnedPoints: surface.pinnedPoints || [],
      shadowOpacity: surface.shadowOpacity ?? 0.7,
    }
  }

  // Fallback — create default grid
  const gridSize = surface.gridSize || defaultGridSize
  const meshPoints = createUniformGrid(
    { x: 36, y: 30 },
    { x: 64, y: 30 },
    { x: 36, y: 55 },
    { x: 64, y: 55 },
    gridSize,
  )

  return {
    ...surface,
    type: 'mesh',
    gridSize,
    meshPoints,
    pinnedPoints: [],
    shadowOpacity: surface.shadowOpacity ?? 0.7,
  }
}

// ─── Helpers ─────────────────────────────────────────────────────

function round(n: number): number {
  return Math.round(n * 10) / 10
}
