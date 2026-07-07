import { describe, expect, it } from 'vitest'

import {
  clampSelectionToImage,
  containRect,
  dragImage,
  dragSelection,
  ensureImageCoversSelection,
  fitImageToSelection,
  flipHorizontal,
  getExportRenderPlan,
  getExportSize,
  getMessages,
  getMinScaleToCoverSelection,
  initializeCropperState,
  isSelectionCovered,
  largestFixedAspectRectInside,
  pointInPolygon,
  resizeSelectionFromCorner,
  rotateImageTo,
  serializeState,
  snapRotation,
  transformedImagePolygon,
  zoomImage
} from './index'
import type { CropperState, ResizeCorner } from './index'

function createState(): CropperState {
  return initializeCropperState({ naturalWidth: 1000, naturalHeight: 500, stageWidth: 500, stageHeight: 500, aspectRatio: 1, initialImageScale: 1 })
}

function createResizableState(): CropperState {
  return {
    image: { naturalWidth: 1000, naturalHeight: 1000 },
    stage: { width: 500, height: 500 },
    imageTransform: { x: 250, y: 250, scale: 0.5, rotation: 0, flipX: false, flipY: false },
    selection: { x: 150, y: 150, width: 200, height: 200, aspectRatio: 1 }
  }
}

function resizePointer(selection: CropperState['selection'], corner: ResizeCorner): { x: number; y: number } {
  switch (corner) {
    case 'nw': return { x: selection.x - 80, y: selection.y - 30 }
    case 'ne': return { x: selection.x + selection.width + 80, y: selection.y - 30 }
    case 'sw': return { x: selection.x - 80, y: selection.y + selection.height + 30 }
    case 'se': return { x: selection.x + selection.width + 80, y: selection.y + selection.height + 30 }
  }
}

describe('@covercropper/core geometry', () => {
  it('calculates contain image rect', () => {
    expect(containRect({ width: 1000, height: 500 }, { width: 500, height: 500 })).toEqual({ x: 0, y: 125, width: 500, height: 250 })
  })

  it('calculates largest fixed-aspect rect inside a container', () => {
    expect(largestFixedAspectRectInside(1, { x: 0, y: 125, width: 500, height: 250 })).toEqual({ x: 125, y: 125, width: 250, height: 250 })
  })

  it('snaps rotation to 90-degree multiples', () => {
    expect(snapRotation(89)).toBe(90)
    expect(snapRotation(-178)).toBe(-180)
    expect(snapRotation(44)).toBe(44)
  })

  it('checks transformed image polygon coverage', () => {
    const state = createState()
    const polygon = transformedImagePolygon(state)
    expect(pointInPolygon({ x: 250, y: 250 }, polygon)).toBe(true)
    expect(isSelectionCovered(state)).toBe(true)
  })
})

describe('@covercropper/core state and serialization', () => {
  it('initializes from natural size, stage size, aspect ratio and initial scale', () => {
    const state = createState()
    expect(state.imageTransform.scale).toBe(0.5)
    expect(state.imageTransform.x).toBe(250)
    expect(state.imageTransform.y).toBe(250)
    expect(state.selection).toMatchObject({ x: 125, y: 125, width: 250, height: 250, aspectRatio: 1 })
  })

  it('keeps the initial selection visible when initial image scale enlarges the background', () => {
    const state = initializeCropperState({ naturalWidth: 1400, naturalHeight: 900, stageWidth: 774, stageHeight: 420, aspectRatio: 16 / 9, initialImageScale: 1.4 })

    expect(state.imageTransform.scale).toBeGreaterThan(420 / 900)
    expect(state.selection.x).toBeGreaterThanOrEqual(0)
    expect(state.selection.y).toBeGreaterThanOrEqual(0)
    expect(state.selection.x + state.selection.width).toBeLessThanOrEqual(state.stage.width)
    expect(state.selection.y + state.selection.height).toBeLessThanOrEqual(state.stage.height)
    expect(isSelectionCovered(state)).toBe(true)
  })

  it('serializes state as a cloned normalized object', () => {
    const state = createState()
    const serialized = serializeState(state)
    expect(serialized).toEqual(state)
    expect(serialized).not.toBe(state)
    serialized.imageTransform.x = 999
    expect(state.imageTransform.x).toBe(250)
  })
})

describe('@covercropper/core cover-safe constraints', () => {
  it('clamps image drag so the selection never exposes blank space', () => {
    const moved = dragImage(createState(), { x: 1000, y: 1000 })
    expect(moved.imageTransform.x).toBeCloseTo(375)
    expect(moved.imageTransform.y).toBeCloseTo(250)
    expect(isSelectionCovered(moved)).toBe(true)
  })

  it('clamps selection drag to transformed image coverage', () => {
    const moved = dragSelection(createState(), { x: -1000, y: -1000 })
    expect(moved.selection.x).toBeCloseTo(0)
    expect(moved.selection.y).toBeCloseTo(125)
    expect(isSelectionCovered(moved)).toBe(true)
  })

  it('clamps selection movement under rotated coverage', () => {
    const rotated = rotateImageTo(createState(), 45)
    const movedRect = clampSelectionToImage(rotated, { ...rotated.selection, x: rotated.selection.x + 1000, y: rotated.selection.y + 1000 })
    expect(isSelectionCovered({ ...rotated, selection: { ...movedRect, aspectRatio: 1 } })).toBe(true)
  })

  it('resizes width and height freely from each corner while preserving coverage', () => {
    const corners: ResizeCorner[] = ['nw', 'ne', 'sw', 'se']
    for (const corner of corners) {
      const before = createResizableState()
      const resized = resizeSelectionFromCorner(before, corner, resizePointer(before.selection, corner))
      expect(resized.selection.width).toBeGreaterThan(before.selection.width)
      expect(resized.selection.height).toBeGreaterThan(before.selection.height)
      expect(resized.selection.width / resized.selection.height).not.toBeCloseTo(before.selection.width / before.selection.height)
      expect(resized.selection.aspectRatio).toBeCloseTo(resized.selection.width / resized.selection.height)
      expect(isSelectionCovered(resized)).toBe(true)
    }
  })

  it('prevents wheel zoom from going below dynamic min-cover scale', () => {
    const state = createState()
    const zoomed = zoomImage(state, 0.01, { x: 250, y: 250 })
    expect(zoomed.imageTransform.scale).toBeCloseTo(getMinScaleToCoverSelection(state))
    expect(isSelectionCovered(zoomed)).toBe(true)
  })

  it('snaps rotation and auto-corrects coverage', () => {
    const rotated = rotateImageTo(createState(), 44)
    expect(rotated.imageTransform.rotation).toBe(44)
    expect(rotated.imageTransform.scale).toBeGreaterThan(0.5)
    expect(isSelectionCovered(rotated)).toBe(true)
    const snapped = rotateImageTo(createState(), 91)
    expect(snapped.imageTransform.rotation).toBe(90)
    expect(isSelectionCovered(snapped)).toBe(true)
  })

  it('shrinks back to the rotation baseline scale during continuous rotation', () => {
    const baseline = createState()
    const enlarged = rotateImageTo(baseline, 44, { rotationBaseState: baseline })
    const restored = rotateImageTo(enlarged, 0, { rotationBaseState: baseline })

    expect(enlarged.imageTransform.scale).toBeGreaterThan(baseline.imageTransform.scale)
    expect(restored.imageTransform.rotation).toBe(0)
    expect(restored.imageTransform.scale).toBeCloseTo(baseline.imageTransform.scale)
    expect(isSelectionCovered(restored)).toBe(true)
  })

  it('fits image to the current selection and keeps cover safe', () => {
    const fitted = fitImageToSelection(zoomImage(createState(), 2))
    expect(fitted.imageTransform.scale).toBeCloseTo(getMinScaleToCoverSelection(fitted))
    expect(isSelectionCovered(fitted)).toBe(true)
  })

  it('flips horizontally without changing coverage', () => {
    const flipped = flipHorizontal(createState())
    expect(flipped.imageTransform.flipX).toBe(true)
    expect(isSelectionCovered(flipped)).toBe(true)
  })

  it('raises scale when rotation would otherwise uncover the crop area', () => {
    const state = createState()
    const corrected = ensureImageCoversSelection({ ...state, imageTransform: { ...state.imageTransform, rotation: 45, scale: 0.1 } })
    expect(corrected.imageTransform.scale).toBeGreaterThan(0.5)
    expect(isSelectionCovered(corrected)).toBe(true)
  })
})

describe('@covercropper/core export and locales', () => {
  it('calculates export dimensions and render plan', () => {
    const state = createState()
    expect(getExportSize(state, { pixelRatio: 2 })).toEqual({ width: 500, height: 500 })
    expect(getExportSize(state, { width: 1000 })).toEqual({ width: 1000, height: 1000 })
    const plan = getExportRenderPlan(state, { width: 1000 })
    expect(plan.scaleX).toBe(4)
    expect(plan.scaleY).toBe(4)
  })

  it('looks up English and Chinese locale messages and applies overrides', () => {
    expect(getMessages('en').toolbar.reset).toBe('Reset')
    expect(getMessages('zh-CN').toolbar.reset).toBe('重置')
    expect(getMessages('en', { toolbar: { reset: 'Start over' } }).toolbar.reset).toBe('Start over')
  })
})
