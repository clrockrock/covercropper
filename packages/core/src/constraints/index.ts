import { clamp, dot, getImageAxes, isSelectionCovered, normalizeRotation, projectPoints, rectCenter, rectCorners, rectFromCenter, rotatePoint, snapRotation } from '../geometry'
import { cloneState, normalizeState } from '../state'
import type { ConstraintOptions, CropperState, Point, Rect, ResizeCorner, RotationOptions } from '../types'

const DEFAULT_MIN_SELECTION_WIDTH = 48
const DEFAULT_MIN_SELECTION_HEIGHT = 48
const DEFAULT_MAX_IMAGE_SCALE = 10
const DEFAULT_ROTATION_SNAP_STEP = 90
const DEFAULT_ROTATION_SNAP_THRESHOLD = 3
const COVER_EPSILON = 1e-6

export function getMinScaleToCoverSelection(state: CropperState): number {
  const normalized = normalizeState(state)
  const points = rectCorners(normalized.selection)
  const { u, v } = getImageAxes(normalized.imageTransform.rotation)
  const uRange = projectPoints(points, u)
  const vRange = projectPoints(points, v)
  return Math.max(COVER_EPSILON, (uRange.max - uRange.min) / normalized.image.naturalWidth, (vRange.max - vRange.min) / normalized.image.naturalHeight)
}

function maxImageScaleFor(state: CropperState, options?: ConstraintOptions): number {
  return Math.max(options?.maxImageScale ?? DEFAULT_MAX_IMAGE_SCALE, getMinScaleToCoverSelection(state))
}

export function clampImageCenterToCoverSelection(state: CropperState): CropperState {
  const next = normalizeState(state)
  const points = rectCorners(next.selection)
  const { u, v } = getImageAxes(next.imageTransform.rotation)
  const uRange = projectPoints(points, u)
  const vRange = projectPoints(points, v)
  const halfWidth = (next.image.naturalWidth * next.imageTransform.scale) / 2
  const halfHeight = (next.image.naturalHeight * next.imageTransform.scale) / 2
  const currentU = dot({ x: next.imageTransform.x, y: next.imageTransform.y }, u)
  const currentV = dot({ x: next.imageTransform.x, y: next.imageTransform.y }, v)
  const clampedU = clamp(currentU, uRange.max - halfWidth, uRange.min + halfWidth)
  const clampedV = clamp(currentV, vRange.max - halfHeight, vRange.min + halfHeight)
  next.imageTransform.x = u.x * clampedU + v.x * clampedV
  next.imageTransform.y = u.y * clampedU + v.y * clampedV
  return next
}

export function ensureImageCoversSelection(state: CropperState, options?: ConstraintOptions): CropperState {
  const next = normalizeState(state)
  const minScale = getMinScaleToCoverSelection(next)
  const maxScale = Math.max(options?.maxImageScale ?? DEFAULT_MAX_IMAGE_SCALE, minScale)
  next.imageTransform.scale = clamp(next.imageTransform.scale, minScale, maxScale)
  return clampImageCenterToCoverSelection(next)
}

export function dragImage(state: CropperState, delta: Point, options?: ConstraintOptions): CropperState {
  const next = cloneState(state)
  next.imageTransform.x += delta.x
  next.imageTransform.y += delta.y
  return ensureImageCoversSelection(next, options)
}

function getSelectionCenterClampIntervals(state: CropperState, selection: Rect) {
  const { u, v } = getImageAxes(state.imageTransform.rotation)
  const imageCenter = { x: state.imageTransform.x, y: state.imageTransform.y }
  const imageCenterU = dot(imageCenter, u)
  const imageCenterV = dot(imageCenter, v)
  const halfImageWidth = (state.image.naturalWidth * state.imageTransform.scale) / 2
  const halfImageHeight = (state.image.naturalHeight * state.imageTransform.scale) / 2
  const center = rectCenter(selection)
  const offsets = rectCorners(selection).map((point) => ({ x: point.x - center.x, y: point.y - center.y }))
  const offsetU = projectPoints(offsets, u)
  const offsetV = projectPoints(offsets, v)
  return {
    u,
    v,
    minU: imageCenterU - halfImageWidth - offsetU.min,
    maxU: imageCenterU + halfImageWidth - offsetU.max,
    minV: imageCenterV - halfImageHeight - offsetV.min,
    maxV: imageCenterV + halfImageHeight - offsetV.max
  }
}

export function clampSelectionToImage(state: CropperState, selection: Rect): Rect {
  const normalized = ensureImageCoversSelection(state)
  const rect = { ...selection }
  const intervals = getSelectionCenterClampIntervals(normalized, rect)
  if (intervals.minU > intervals.maxU || intervals.minV > intervals.maxV) return normalized.selection
  const center = rectCenter(rect)
  const clampedU = clamp(dot(center, intervals.u), intervals.minU, intervals.maxU)
  const clampedV = clamp(dot(center, intervals.v), intervals.minV, intervals.maxV)
  return rectFromCenter({ x: intervals.u.x * clampedU + intervals.v.x * clampedV, y: intervals.u.y * clampedU + intervals.v.y * clampedV }, rect)
}

export function dragSelection(state: CropperState, delta: Point, options?: ConstraintOptions): CropperState {
  const next = ensureImageCoversSelection(state, options)
  const moved = { ...next.selection, x: next.selection.x + delta.x, y: next.selection.y + delta.y }
  next.selection = { ...clampSelectionToImage(next, moved), aspectRatio: next.selection.aspectRatio }
  return next
}

function getOppositeAnchor(selection: Rect, corner: ResizeCorner): Point {
  switch (corner) {
    case 'nw': return { x: selection.x + selection.width, y: selection.y + selection.height }
    case 'ne': return { x: selection.x, y: selection.y + selection.height }
    case 'sw': return { x: selection.x + selection.width, y: selection.y }
    case 'se': return { x: selection.x, y: selection.y }
  }
}

function rectFromAnchor(anchor: Point, corner: ResizeCorner, width: number, height: number): Rect {
  switch (corner) {
    case 'nw': return { x: anchor.x - width, y: anchor.y - height, width, height }
    case 'ne': return { x: anchor.x, y: anchor.y - height, width, height }
    case 'sw': return { x: anchor.x - width, y: anchor.y, width, height }
    case 'se': return { x: anchor.x, y: anchor.y, width, height }
  }
}

function dimensionsFromPointer(anchor: Point, pointer: Point, corner: ResizeCorner): { width: number; height: number } {
  const rawWidth = corner === 'nw' || corner === 'sw' ? anchor.x - pointer.x : pointer.x - anchor.x
  const rawHeight = corner === 'nw' || corner === 'ne' ? anchor.y - pointer.y : pointer.y - anchor.y
  return { width: Math.max(1, rawWidth), height: Math.max(1, rawHeight) }
}

function enforceMinSize(width: number, height: number, options?: ConstraintOptions): { width: number; height: number } {
  const minWidth = options?.minSelectionWidth ?? DEFAULT_MIN_SELECTION_WIDTH
  const minHeight = options?.minSelectionHeight ?? DEFAULT_MIN_SELECTION_HEIGHT
  return { width: Math.max(width, minWidth), height: Math.max(height, minHeight) }
}

export function resizeSelectionFromCorner(state: CropperState, corner: ResizeCorner, pointer: Point, options?: ConstraintOptions): CropperState {
  const next = ensureImageCoversSelection(state, options)
  const oldSelection = next.selection
  const anchor = getOppositeAnchor(oldSelection, corner)
  const raw = dimensionsFromPointer(anchor, pointer, corner)
  const dimensions = enforceMinSize(raw.width, raw.height, options)
  const target = rectFromAnchor(anchor, corner, dimensions.width, dimensions.height)
  const targetSelection = { ...target, aspectRatio: target.width / target.height }
  if (isSelectionCovered({ ...next, selection: targetSelection })) {
    next.selection = targetSelection
    return next
  }
  let low = 0
  let high = 1
  let best = oldSelection
  for (let index = 0; index < 36; index += 1) {
    const mid = (low + high) / 2
    const candidate = {
      x: oldSelection.x + (target.x - oldSelection.x) * mid,
      y: oldSelection.y + (target.y - oldSelection.y) * mid,
      width: oldSelection.width + (target.width - oldSelection.width) * mid,
      height: oldSelection.height + (target.height - oldSelection.height) * mid,
      aspectRatio: (oldSelection.width + (target.width - oldSelection.width) * mid) / (oldSelection.height + (target.height - oldSelection.height) * mid)
    }
    if (isSelectionCovered({ ...next, selection: candidate })) {
      best = candidate
      low = mid
    } else {
      high = mid
    }
  }
  next.selection = best
  return next
}

export function zoomImage(state: CropperState, scaleFactor: number, focalPoint?: Point, options?: ConstraintOptions): CropperState {
  const next = ensureImageCoversSelection(state, options)
  const focal = focalPoint ?? rectCenter(next.selection)
  const targetScale = clamp(next.imageTransform.scale * scaleFactor, getMinScaleToCoverSelection(next), maxImageScaleFor(next, options))
  const ratio = targetScale / next.imageTransform.scale
  next.imageTransform.x = focal.x + (next.imageTransform.x - focal.x) * ratio
  next.imageTransform.y = focal.y + (next.imageTransform.y - focal.y) * ratio
  next.imageTransform.scale = targetScale
  return ensureImageCoversSelection(next, options)
}

export function rotateImageTo(state: CropperState, rotation: number, options?: RotationOptions): CropperState {
  const current = ensureImageCoversSelection(state, options)
  const base = options?.rotationBaseState ? ensureImageCoversSelection({ ...options.rotationBaseState, image: current.image, stage: current.stage, selection: current.selection }, options) : current
  const next = cloneState(base)
  const targetRotation = snapRotation(rotation, options?.rotationSnapStep ?? DEFAULT_ROTATION_SNAP_STEP, options?.rotationSnapThreshold ?? DEFAULT_ROTATION_SNAP_THRESHOLD)
  const focal = rectCenter(current.selection)
  const delta = normalizeRotation(targetRotation - base.imageTransform.rotation)
  const rotatedFocalVector = rotatePoint({ x: focal.x, y: focal.y }, delta, { x: next.imageTransform.x, y: next.imageTransform.y })
  next.imageTransform.x += focal.x - rotatedFocalVector.x
  next.imageTransform.y += focal.y - rotatedFocalVector.y
  next.imageTransform.rotation = targetRotation
  return ensureImageCoversSelection(next, options)
}

export function rotateImageBy(state: CropperState, delta: number, options?: RotationOptions): CropperState {
  return rotateImageTo(state, state.imageTransform.rotation + delta, options)
}

export function flipHorizontal(state: CropperState): CropperState {
  const next = cloneState(state)
  next.imageTransform.flipX = !next.imageTransform.flipX
  return next
}

export function fitImageToSelection(state: CropperState, options?: ConstraintOptions): CropperState {
  const next = normalizeState(state)
  next.imageTransform.scale = getMinScaleToCoverSelection(next)
  next.imageTransform.x = rectCenter(next.selection).x
  next.imageTransform.y = rectCenter(next.selection).y
  return ensureImageCoversSelection(next, options)
}
