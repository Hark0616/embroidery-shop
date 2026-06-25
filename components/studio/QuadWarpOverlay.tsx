'use client'

import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import type { CalibrationSurface } from '@/lib/types/database'

type Point = { x: number; y: number }

interface QuadWarpOverlayProps {
  imageUrl: string
  surface: CalibrationSurface
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

export default function QuadWarpOverlay({
  imageUrl,
  surface,
  opacity,
  blendMode,
  filter,
  className,
}: QuadWarpOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return

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

        const sourceTopLeft = { x: 0, y: 0 }
        const sourceTopRight = { x: image.naturalWidth, y: 0 }
        const sourceBottomRight = { x: image.naturalWidth, y: image.naturalHeight }
        const sourceBottomLeft = { x: 0, y: image.naturalHeight }

        const targetTopLeft = toCanvasPoint(surface.points.topLeft, width, height)
        const targetTopRight = toCanvasPoint(surface.points.topRight, width, height)
        const targetBottomRight = toCanvasPoint(surface.points.bottomRight, width, height)
        const targetBottomLeft = toCanvasPoint(surface.points.bottomLeft, width, height)

        drawTriangle(
          context,
          image,
          [sourceTopLeft, sourceTopRight, sourceBottomRight],
          [targetTopLeft, targetTopRight, targetBottomRight],
        )
        drawTriangle(
          context,
          image,
          [sourceTopLeft, sourceBottomRight, sourceBottomLeft],
          [targetTopLeft, targetBottomRight, targetBottomLeft],
        )
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
  }, [imageUrl, surface])

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
        opacity: opacity ?? surface.opacity ?? 0.94,
        mixBlendMode: blendMode || surface.blendMode || 'multiply',
        filter,
      }}
    />
  )
}
