import test from 'node:test'
import assert from 'node:assert/strict'
import { getObjectContainRect, containerPercentToImagePixel, imagePixelToContainerPercent } from '../lib/deformation/coordinates'
import { validateDeformationProposal, validateSurface, validateSurfaceMap } from '../lib/deformation/surface-validation'
import { normalizeWorkerOutput } from '../lib/deformation/runpod'
import {
  assertValidImportedProposals,
  buildCalibrationTransferPackage,
  extractDeformationProposalsFromImport,
} from '../lib/deformation/transfer'
import { createMeshSurface, createUniformGrid } from '../lib/mesh-utils'

test('object-contain conversion maps centered image pixels back to container percent', () => {
  const rect = getObjectContainRect(800, 1000, 1600, 1000)
  assert.deepEqual(rect, { x: 0, y: 250, width: 800, height: 500 })

  const pixel = containerPercentToImagePixel({ x: 50, y: 50 }, 800, 1000, 1600, 1000)
  assert.equal(pixel.x, 800)
  assert.equal(pixel.y, 500)

  const percent = imagePixelToContainerPercent(pixel, 800, 1000, 1600, 1000)
  assert.equal(percent.x, 50)
  assert.equal(percent.y, 50)
})

test('validates complete mesh surfaces and rejects placeholder calibration data', () => {
  const valid = createMeshSurface('pecho', 'Pecho', 'front', 'medium', 5)
  assert.equal(validateSurface(valid).ok, true)
  assert.equal(validateSurfaceMap({ pecho: valid }).ok, true)

  assert.equal(validateSurface({ id: 'pecho' } as any).ok, false)
})

test('rejects crossed mesh cells', () => {
  const meshPoints = createUniformGrid(
    { x: 40, y: 30 },
    { x: 60, y: 30 },
    { x: 40, y: 50 },
    { x: 60, y: 50 },
    3,
  )
  meshPoints[1] = { x: 60, y: 50 }
  meshPoints[4] = { x: 60, y: 30 }

  const result = validateSurface({
    id: 'bad',
    label: 'Bad',
    type: 'mesh',
    view: 'front',
    size: 'medium',
    gridSize: 3,
    meshPoints,
  })

  assert.equal(result.ok, false)
  assert.match(result.errors.join(' '), /crossed/)
})

test('normalizes and validates worker deformation proposals', () => {
  const surface = createMeshSurface('pecho', 'Pecho', 'front', 'medium', 5)
  const output = normalizeWorkerOutput({
    proposals: [
      {
        id: 'pecho-balanced',
        label: 'Balanceada',
        intensity: 'balanced',
        gridSize: 5,
        meshPoints: surface.meshPoints!,
        confidence: 0.82,
        warnings: [],
        source: 'runpod-depth-normal-v1',
      },
    ],
  })

  assert.equal(output.proposals.length, 1)
  assert.equal(validateDeformationProposal(output.proposals[0]).ok, true)
})

test('builds a Colab transfer package with image, corners, and object-contain metadata', () => {
  const surface = createMeshSurface('espalda-centro', 'Espalda centro', 'back', 'large', 7)
  const pkg = buildCalibrationTransferPackage({
    mockup: {
      id: 'mockup-1',
      name: 'Hoodie espalda',
      view: 'back',
      imageUrl: 'https://example.com/mockup.png',
      variantId: 'negro',
      variantColorName: 'Negro',
    },
    product: {
      name: 'Hoodie',
      slug: 'hoodie',
      productType: 'hoodie',
    },
    surface,
  })

  assert.equal(pkg.kind, 'texere-calibration-package')
  assert.equal(pkg.mockup.imageUrl, 'https://example.com/mockup.png')
  assert.equal(pkg.surface.gridSize, 7)
  assert.equal(pkg.corners.topLeft.x, surface.meshPoints![0].x)
  assert.deepEqual(pkg.coordinateSpace, {
    type: 'container-percent',
    aspectRatio: 0.8,
    objectFit: 'contain',
  })
})

test('imports Colab results with multiple proposals without losing validation', () => {
  const surface = createMeshSurface('pecho-centro', 'Pecho centro', 'front', 'medium', 5)
  const result = {
    kind: 'texere-calibration-result',
    version: 1,
    sourcePackageId: 'pkg-1',
    generatedAt: '2026-06-28T00:00:00.000Z',
    proposals: [
      {
        id: 'pecho-sutil',
        label: 'Sutil',
        intensity: 'subtle',
        gridSize: 5,
        meshPoints: surface.meshPoints,
        confidence: 0.8,
        warnings: [],
        source: 'colab-depth-v1',
      },
      {
        id: 'pecho-balanceada',
        label: 'Balanceada',
        intensity: 'balanced',
        gridSize: 5,
        meshPoints: surface.meshPoints,
        confidence: 0.86,
        warnings: [],
        source: 'colab-depth-v1',
      },
    ],
  }

  const proposals = extractDeformationProposalsFromImport(result)
  assert.equal(proposals.length, 2)
  assert.equal(proposals[1].label, 'Balanceada')
  assert.doesNotThrow(() => assertValidImportedProposals(proposals))
})

test('imports a single exported surface as one deformation proposal', () => {
  const surface = createMeshSurface('manga', 'Manga', 'side', 'small', 5)
  const proposals = extractDeformationProposalsFromImport(surface)

  assert.equal(proposals.length, 1)
  assert.equal(proposals[0].meshPoints.length, 25)
  assert.doesNotThrow(() => assertValidImportedProposals(proposals))
})
