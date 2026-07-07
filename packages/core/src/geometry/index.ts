import type { CropperState, Point, Rect, Size } from '../types'

const EPSILON = 1e-9

export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI
}

export function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value)
}

export function clamp(value: number, min: number, max: number): number {
  if (min > max) return (min + max) / 2
  return Math.min(max, Math.max(min, value))
}

export function normalizeRotation(rotation: number): number {
  if (!Number.isFinite(rotation)) return 0
  let normalized = rotation % 360
  if (normalized > 180) normalized -= 360
  if (normalized < -180) normalized += 360
  return Object.is(normalized, -0) ? 0 : normalized
}

export function snapRotation(rotation: number, step = 90, threshold = 3): number {
  const normalized = normalizeRotation(rotation)
  const target = Math.round(normalized / step) * step
  const snapped = normalizeRotation(target)
  const distance = Math.abs(normalizeRotation(normalized - snapped))
  return distance <= threshold ? snapped : normalized
}

export function rectCenter(rect: Rect): Point {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
}

export function rectFromCenter(center: Point, size: Size): Rect {
  return { x: center.x - size.width / 2, y: center.y - size.height / 2, width: size.width, height: size.height }
}

export function scaleRectFromCenter(rect: Rect, scale: number): Rect {
  return rectFromCenter(rectCenter(rect), { width: rect.width * scale, height: rect.height * scale })
}

export function rectCorners(rect: Rect): Point[] {
  return [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height }
  ]
}

export function containRect(image: Size, stage: Size): Rect {
  if (image.width <= 0 || image.height <= 0 || stage.width <= 0 || stage.height <= 0) {
    throw new Error('Invalid size')
  }
  const scale = Math.min(stage.width / image.width, stage.height / image.height)
  const width = image.width * scale
  const height = image.height * scale
  return { x: (stage.width - width) / 2, y: (stage.height - height) / 2, width, height }
}

export function largestFixedAspectRectInside(aspectRatio: number, container: Rect): Rect {
  if (!Number.isFinite(aspectRatio) || aspectRatio <= 0) throw new Error('Invalid aspect ratio')
  const containerRatio = container.width / container.height
  let width: number
  let height: number
  if (containerRatio > aspectRatio) {
    height = container.height
    width = height * aspectRatio
  } else {
    width = container.width
    height = width / aspectRatio
  }
  return { x: container.x + (container.width - width) / 2, y: container.y + (container.height - height) / 2, width, height }
}

export function rotatePoint(point: Point, angleDegrees: number, origin: Point = { x: 0, y: 0 }): Point {
  const radians = toRadians(angleDegrees)
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const dx = point.x - origin.x
  const dy = point.y - origin.y
  return { x: origin.x + dx * cos - dy * sin, y: origin.y + dx * sin + dy * cos }
}

export function dot(a: Point, b: Point): number {
  return a.x * b.x + a.y * b.y
}

export function getImageAxes(rotation: number): { u: Point; v: Point } {
  const radians = toRadians(rotation)
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  return { u: { x: cos, y: sin }, v: { x: -sin, y: cos } }
}

export function projectPoints(points: Point[], axis: Point): { min: number; max: number } {
  let min = Infinity
  let max = -Infinity
  for (const point of points) {
    const value = dot(point, axis)
    min = Math.min(min, value)
    max = Math.max(max, value)
  }
  return { min, max }
}

export function transformedImagePolygon(state: CropperState): Point[] {
  const { naturalWidth, naturalHeight } = state.image
  const { x, y, scale, rotation } = state.imageTransform
  const halfWidth = (naturalWidth * scale) / 2
  const halfHeight = (naturalHeight * scale) / 2
  return [
    { x: x - halfWidth, y: y - halfHeight },
    { x: x + halfWidth, y: y - halfHeight },
    { x: x + halfWidth, y: y + halfHeight },
    { x: x - halfWidth, y: y + halfHeight }
  ].map((corner) => rotatePoint(corner, rotation, { x, y }))
}

function isPointOnSegment(point: Point, a: Point, b: Point): boolean {
  const cross = (point.y - a.y) * (b.x - a.x) - (point.x - a.x) * (b.y - a.y)
  if (Math.abs(cross) > 1e-7) return false
  const dotProduct = (point.x - a.x) * (b.x - a.x) + (point.y - a.y) * (b.y - a.y)
  if (dotProduct < -EPSILON) return false
  const squaredLength = (b.x - a.x) ** 2 + (b.y - a.y) ** 2
  return dotProduct <= squaredLength + EPSILON
}

export function pointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false
  for (let index = 0; index < polygon.length; index += 1) {
    if (isPointOnSegment(point, polygon[index], polygon[(index + 1) % polygon.length])) return true
  }
  let inside = false
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const current = polygon[index]
    const last = polygon[previous]
    const intersects = current.y > point.y !== last.y > point.y && point.x < ((last.x - current.x) * (point.y - current.y)) / (last.y - current.y) + current.x
    if (intersects) inside = !inside
  }
  return inside
}

export function rectCoveredByPolygon(rect: Rect, polygon: Point[]): boolean {
  return rectCorners(rect).every((corner) => pointInPolygon(corner, polygon))
}

export function isSelectionCovered(state: CropperState): boolean {
  return rectCoveredByPolygon(state.selection, transformedImagePolygon(state))
}

export function rectArea(rect: Rect): number {
  return Math.max(0, rect.width) * Math.max(0, rect.height)
}
