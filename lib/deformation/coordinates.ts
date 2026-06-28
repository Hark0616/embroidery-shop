import type { CalibrationPoint } from '@/lib/types/database'

export type Rect = {
  x: number
  y: number
  width: number
  height: number
}

export function getObjectContainRect(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
): Rect {
  if (containerWidth <= 0 || containerHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) {
    throw new Error('All dimensions must be positive')
  }

  const containerRatio = containerWidth / containerHeight
  const imageRatio = imageWidth / imageHeight

  if (imageRatio > containerRatio) {
    const width = containerWidth
    const height = width / imageRatio
    return {
      x: 0,
      y: (containerHeight - height) / 2,
      width,
      height,
    }
  }

  const height = containerHeight
  const width = height * imageRatio
  return {
    x: (containerWidth - width) / 2,
    y: 0,
    width,
    height,
  }
}

export function containerPercentToImagePixel(
  point: CalibrationPoint,
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
): CalibrationPoint {
  const rect = getObjectContainRect(containerWidth, containerHeight, imageWidth, imageHeight)
  const containerX = (point.x / 100) * containerWidth
  const containerY = (point.y / 100) * containerHeight

  return {
    x: ((containerX - rect.x) / rect.width) * imageWidth,
    y: ((containerY - rect.y) / rect.height) * imageHeight,
  }
}

export function imagePixelToContainerPercent(
  point: CalibrationPoint,
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number,
): CalibrationPoint {
  const rect = getObjectContainRect(containerWidth, containerHeight, imageWidth, imageHeight)
  const containerX = rect.x + (point.x / imageWidth) * rect.width
  const containerY = rect.y + (point.y / imageHeight) * rect.height

  return {
    x: (containerX / containerWidth) * 100,
    y: (containerY / containerHeight) * 100,
  }
}

