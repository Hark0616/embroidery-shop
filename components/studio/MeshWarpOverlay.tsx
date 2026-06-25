'use client'

import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import type { CalibrationPoint } from '@/lib/types/database'

type Point = { x: number; y: number }

interface MeshWarpOverlayProps {
  imageUrl: string
  gridSize: number
  meshPoints: CalibrationPoint[]
  opacity?: number
  blendMode?: CSSProperties['mixBlendMode']
  filter?: string
  className?: string
}

function toCanvasPoint(point: Point, width: number, height: number): Point {
  return {
    x: (point.x / 100) * width,
    y: (point.y / 100) * height,
  }
}

function getAffineTransform(source: [Point, Point, Point], target: [Point, Point, Point]) {
  const [s0, s1, s2] = source
  const [t0, t1, t2] = target
  const denominator =
    s0.x * (s1.y - s2.y) +
    s1.x * (s2.y - s0.y) +
    s2.x * (s0.y - s1.y)

  if (Math.abs(denominator) < 1e-10) return null

  return {
    a: (t0.x * (s1.y - s2.y) + t1.x * (s2.y - s0.y) + t2.x * (s0.y - s1.y)) / denominator,
    b: (t0.y * (s1.y - s2.y) + t1.y * (s2.y - s0.y) + t2.y * (s0.y - s1.y)) / denominator,
    c: (t0.x * (s2.x - s1.x) + t1.x * (s0.x - s2.x) + t2.x * (s1.x - s0.x)) / denominator,
    d: (t0.y * (s2.x - s1.x) + t1.y * (s0.x - s2.x) + t2.y * (s1.x - s0.x)) / denominator,
    e:
      (t0.x * (s1.x * s2.y - s2.x * s1.y) +
        t1.x * (s2.x * s0.y - s0.x * s2.y) +
        t2.x * (s0.x * s1.y - s1.x * s0.y)) /
      denominator,
    f:
      (t0.y * (s1.x * s2.y - s2.x * s1.y) +
        t1.y * (s2.x * s0.y - s0.x * s2.y) +
        t2.y * (s0.x * s1.y - s1.x * s0.y)) /
      denominator,
  }
}

function drawTriangle(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  source: [Point, Point, Point],
  target: [Point, Point, Point],
) {
  const transform = getAffineTransform(source, target)
  if (!transform) return

  context.save()
  context.beginPath()
  context.moveTo(target[0].x, target[0].y)
  context.lineTo(target[1].x, target[1].y)
  context.lineTo(target[2].x, target[2].y)
  context.closePath()
  context.clip()
  context.transform(transform.a, transform.b, transform.c, transform.d, transform.e, transform.f)
  context.drawImage(image, 0, 0)
  context.restore()
}

export default function MeshWarpOverlay({
  imageUrl,
  gridSize,
  meshPoints,
  opacity = 0.94,
  blendMode = 'multiply',
  filter,
  className,
}: MeshWarpOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return
    if (!meshPoints || meshPoints.length !== gridSize * gridSize) return

    let cancelled = false

    const render = () => {
      const rect = parent.getBoundingClientRect()
      const pixelRatio = window.devicePixelRatio || 1
      const width = Math.max(Math.round(rect.width), 1)
      const height = Math.max(Math.round(rect.height), 1)

      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      const context = canvas.getContext('2d')
      if (!context) return

      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      context.clearRect(0, 0, width, height)

      const image = new window.Image()
      image.crossOrigin = 'anonymous'
      image.onload = () => {
        if (cancelled) return
        context.clearRect(0, 0, width, height)

        const imgW = image.naturalWidth
        const imgH = image.naturalHeight
        const cellsX = gridSize - 1
        const cellsY = gridSize - 1

        // For each cell in the grid, draw 2 triangles
        for (let row = 0; row < cellsY; row++) {
          for (let col = 0; col < cellsX; col++) {
            // Grid point indices
            const tlIdx = row * gridSize + col
            const trIdx = row * gridSize + col + 1
            const blIdx = (row + 1) * gridSize + col
            const brIdx = (row + 1) * gridSize + col + 1

            // Source points (from the design image)
            const srcTL: Point = { x: (col / cellsX) * imgW, y: (row / cellsY) * imgH }
            const srcTR: Point = { x: ((col + 1) / cellsX) * imgW, y: (row / cellsY) * imgH }
            const srcBL: Point = { x: (col / cellsX) * imgW, y: ((row + 1) / cellsY) * imgH }
            const srcBR: Point = { x: ((col + 1) / cellsX) * imgW, y: ((row + 1) / cellsY) * imgH }

            // Target points (where they land on the canvas, from mesh)
            const tgtTL = toCanvasPoint(meshPoints[tlIdx], width, height)
            const tgtTR = toCanvasPoint(meshPoints[trIdx], width, height)
            const tgtBL = toCanvasPoint(meshPoints[blIdx], width, height)
            const tgtBR = toCanvasPoint(meshPoints[brIdx], width, height)

            // Triangle 1: TL → TR → BR
            drawTriangle(
              context,
              image,
              [srcTL, srcTR, srcBR],
              [tgtTL, tgtTR, tgtBR],
            )

            // Triangle 2: TL → BR → BL
            drawTriangle(
              context,
              image,
              [srcTL, srcBR, srcBL],
              [tgtTL, tgtBR, tgtBL],
            )
          }
        }
      }
      image.src = imageUrl
    }

    render()

    const observer = new ResizeObserver(render)
    observer.observe(parent)

    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [imageUrl, gridSize, meshPoints])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity,
        mixBlendMode: blendMode,
        filter,
      }}
    />
  )
}
