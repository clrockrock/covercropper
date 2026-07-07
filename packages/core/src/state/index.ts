import { containRect, largestFixedAspectRectInside, normalizeRotation, rectCenter, scaleRectFromCenter } from '../geometry'
import type { CropperOptions, CropperState } from '../types'

export function cloneState(state: CropperState): CropperState {
  return {
    image: { ...state.image },
    stage: { ...state.stage },
    imageTransform: { ...state.imageTransform },
    selection: { ...state.selection }
  }
}

export function normalizeState(state: CropperState): CropperState {
  const cloned = cloneState(state)
  cloned.image.naturalWidth = Math.max(1, Number(cloned.image.naturalWidth) || 1)
  cloned.image.naturalHeight = Math.max(1, Number(cloned.image.naturalHeight) || 1)
  cloned.stage.width = Math.max(1, Number(cloned.stage.width) || 1)
  cloned.stage.height = Math.max(1, Number(cloned.stage.height) || 1)
  cloned.imageTransform.x = Number.isFinite(cloned.imageTransform.x) ? cloned.imageTransform.x : cloned.stage.width / 2
  cloned.imageTransform.y = Number.isFinite(cloned.imageTransform.y) ? cloned.imageTransform.y : cloned.stage.height / 2
  cloned.imageTransform.scale = Math.max(0.000001, Number(cloned.imageTransform.scale) || 1)
  cloned.imageTransform.rotation = normalizeRotation(cloned.imageTransform.rotation)
  cloned.imageTransform.flipX = Boolean(cloned.imageTransform.flipX)
  cloned.imageTransform.flipY = Boolean(cloned.imageTransform.flipY)
  cloned.selection.aspectRatio = Math.max(0.000001, Number(cloned.selection.aspectRatio) || 1)
  cloned.selection.width = Math.max(1, Number(cloned.selection.width) || 1)
  cloned.selection.height = Math.max(1, Number(cloned.selection.height) || cloned.selection.width / cloned.selection.aspectRatio)
  cloned.selection.x = Number.isFinite(cloned.selection.x) ? cloned.selection.x : 0
  cloned.selection.y = Number.isFinite(cloned.selection.y) ? cloned.selection.y : 0
  return cloned
}

export function initializeCropperState(options: CropperOptions): CropperState {
  const { naturalWidth, naturalHeight, stageWidth, stageHeight, aspectRatio, initialImageScale = 1 } = options
  if (!Number.isFinite(naturalWidth) || !Number.isFinite(naturalHeight) || naturalWidth <= 0 || naturalHeight <= 0) throw new Error('Invalid image size')
  if (!Number.isFinite(stageWidth) || !Number.isFinite(stageHeight) || stageWidth <= 0 || stageHeight <= 0) throw new Error('Invalid stage size')
  if (!Number.isFinite(aspectRatio) || aspectRatio <= 0) throw new Error('Invalid aspect ratio')
  const baseRect = containRect({ width: naturalWidth, height: naturalHeight }, { width: stageWidth, height: stageHeight })
  const imageRect = scaleRectFromCenter(baseRect, Math.max(0.000001, initialImageScale))
  const selection = largestFixedAspectRectInside(aspectRatio, baseRect)
  const imageCenter = rectCenter(imageRect)
  return normalizeState({
    image: { naturalWidth, naturalHeight },
    stage: { width: stageWidth, height: stageHeight },
    imageTransform: { x: imageCenter.x, y: imageCenter.y, scale: imageRect.width / naturalWidth, rotation: 0, flipX: false, flipY: false },
    selection: { ...selection, aspectRatio }
  })
}

export function serializeState(state: CropperState): CropperState {
  return normalizeState(state)
}
