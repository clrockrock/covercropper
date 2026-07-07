import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CoverCropperElement, defineCoverCropperElement } from './index'
import type { CropperState, ResizeCorner } from '@covercropper/core'

class TestResizeObserver {
  observe(): void {}
  disconnect(): void {}
}

const baseState: CropperState = {
  image: { naturalWidth: 1000, naturalHeight: 500 },
  stage: { width: 640, height: 420 },
  imageTransform: { x: 320, y: 210, scale: 1, rotation: 0, flipX: false, flipY: false },
  selection: { x: 220, y: 110, width: 200, height: 200, aspectRatio: 1 }
}

const resizableState: CropperState = {
  image: { naturalWidth: 1000, naturalHeight: 1000 },
  stage: { width: 640, height: 420 },
  imageTransform: { x: 320, y: 210, scale: 1, rotation: 0, flipX: false, flipY: false },
  selection: { x: 220, y: 110, width: 200, height: 200, aspectRatio: 1 }
}

const rotationSliderState: CropperState = {
  image: { naturalWidth: 1000, naturalHeight: 500 },
  stage: { width: 640, height: 420 },
  imageTransform: { x: 320, y: 210, scale: 0.4, rotation: 0, flipX: false, flipY: false },
  selection: { x: 220, y: 110, width: 200, height: 200, aspectRatio: 1 }
}

function stubPointerCapture(): void {
  HTMLElement.prototype.setPointerCapture ??= function setPointerCapture(): void {}
  HTMLElement.prototype.releasePointerCapture ??= function releasePointerCapture(): void {}
  HTMLElement.prototype.hasPointerCapture ??= function hasPointerCapture(): boolean { return true }
}

function getStage(element: CoverCropperElement): HTMLDivElement {
  return element.shadowRoot!.querySelector<HTMLDivElement>('.stage')!
}

function getImage(element: CoverCropperElement): HTMLImageElement {
  return element.shadowRoot!.querySelector<HTMLImageElement>('img')!
}

function stubStageGeometry(stage: HTMLDivElement): void {
  Object.defineProperties(stage, {
    clientWidth: { configurable: true, value: 640 },
    clientHeight: { configurable: true, value: 420 }
  })
  stage.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 640,
    bottom: 420,
    width: 640,
    height: 420,
    toJSON: () => ({})
  })
}

function dispatchImageLoad(element: CoverCropperElement, naturalWidth = 1000, naturalHeight = 500): void {
  const image = getImage(element)
  Object.defineProperties(image, {
    naturalWidth: { configurable: true, value: naturalWidth },
    naturalHeight: { configurable: true, value: naturalHeight }
  })
  image.dispatchEvent(new Event('load'))
}

function pointer(type: string, x: number, y: number, pointerId = 1): PointerEvent {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y }) as PointerEvent
  Object.defineProperty(event, 'pointerId', { value: pointerId })
  return event
}

function createReadyCropper(src = 'cover.jpg', state = baseState): CoverCropperElement {
  const element = document.createElement('cover-cropper') as CoverCropperElement
  element.src = src
  document.body.append(element)
  stubStageGeometry(getStage(element))
  element.value = state
  dispatchImageLoad(element, state.image.naturalWidth, state.image.naturalHeight)
  return element
}

function resizePointer(selection: CropperState['selection'], corner: ResizeCorner): { x: number; y: number } {
  switch (corner) {
    case 'nw': return { x: selection.x - 80, y: selection.y - 20 }
    case 'ne': return { x: selection.x + selection.width + 80, y: selection.y - 20 }
    case 'sw': return { x: selection.x - 80, y: selection.y + selection.height + 20 }
    case 'se': return { x: selection.x + selection.width + 80, y: selection.y + selection.height + 20 }
  }
}

function installCanvasMock(options: { dataURL?: string; blob?: Blob | null; throwOnDataURL?: Error } = {}) {
  const originalCreateElement = document.createElement.bind(document)
  const context = {
    save: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    drawImage: vi.fn(),
    restore: vi.fn()
  }
  const canvases: HTMLCanvasElement[] = []
  vi.spyOn(document, 'createElement').mockImplementation(((tagName: string, elementOptions?: ElementCreationOptions) => {
    const element = originalCreateElement(tagName, elementOptions)
    if (tagName.toLowerCase() === 'canvas') {
      const canvas = element as HTMLCanvasElement
      Object.defineProperties(canvas, {
        getContext: { configurable: true, value: vi.fn(() => context) },
        toBlob: { configurable: true, value: vi.fn((callback: BlobCallback, type?: string, quality?: unknown) => callback(options.blob === undefined ? new Blob(['export'], { type: type ?? 'image/png' }) : options.blob)) },
        toDataURL: {
          configurable: true,
          value: vi.fn((type?: string, quality?: unknown) => {
            if (options.throwOnDataURL) throw options.throwOnDataURL
            return options.dataURL ?? `data:${type ?? 'image/png'};base64,covercropper`
          })
        }
      })
      canvases.push(canvas)
    }
    return element
  }) as typeof document.createElement)
  return { canvases, context }
}

beforeEach(() => {
  defineCoverCropperElement()
  document.body.innerHTML = ''
  vi.stubGlobal('ResizeObserver', TestResizeObserver)
  stubPointerCapture()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('@covercropper/element browser interactions', () => {
  it('initializes from an image and emits ready/change events', () => {
    const element = document.createElement('cover-cropper') as CoverCropperElement
    const ready = vi.fn()
    const change = vi.fn()
    element.addEventListener('ready', ready)
    element.addEventListener('change', change)
    element.src = 'cover.jpg'
    document.body.append(element)
    stubStageGeometry(getStage(element))

    dispatchImageLoad(element)

    expect(ready).toHaveBeenCalledTimes(1)
    expect(change).toHaveBeenCalled()
    expect(element.getState()).toMatchObject({
      image: { naturalWidth: 1000, naturalHeight: 500 },
      stage: { width: 640, height: 420 },
      selection: { aspectRatio: 1 }
    })
  })

  it('emits localized error details when the image fails to load', () => {
    const element = document.createElement('cover-cropper') as CoverCropperElement
    const error = vi.fn()
    element.addEventListener('error', error)
    element.src = 'missing.jpg'
    document.body.append(element)

    getImage(element).dispatchEvent(new Event('error'))

    expect(error).toHaveBeenCalledTimes(1)
    expect((error.mock.calls[0][0] as CustomEvent).detail.message).toBe('Image failed to load.')
  })

  it('keeps hidden loading and error overlays from blocking the crop selection', () => {
    const element = createReadyCropper()
    const styleText = element.shadowRoot!.querySelector('style')!.textContent ?? ''
    const loading = element.shadowRoot!.querySelector<HTMLDivElement>('.loading')!
    const error = element.shadowRoot!.querySelector<HTMLDivElement>('.error')!

    expect(loading.hidden).toBe(true)
    expect(error.hidden).toBe(true)
    expect(styleText).toContain('.loading[hidden], .error[hidden] { display: none; }')
    expect(styleText).toContain('pointer-events: none')
  })

  it('does not reload or clear state when the same src is assigned again', () => {
    const element = createReadyCropper('stable.jpg')
    const before = element.getState()

    element.src = 'stable.jpg'

    expect(element.getState()).toEqual(before)
  })

  it('drags the image in the default drag mode and emits interaction events', () => {
    const element = createReadyCropper()
    const stage = getStage(element)
    const start = element.getState()
    const interactionStart = vi.fn()
    const interactionEnd = vi.fn()
    const change = vi.fn()
    element.addEventListener('interaction-start', interactionStart)
    element.addEventListener('interaction-end', interactionEnd)
    element.addEventListener('change', change)

    stage.dispatchEvent(pointer('pointerdown', 320, 210))
    stage.dispatchEvent(pointer('pointermove', 360, 210))
    stage.dispatchEvent(pointer('pointerup', 360, 210))

    expect(element.getState().imageTransform.x).toBeGreaterThan(start.imageTransform.x)
    expect(interactionStart).toHaveBeenCalledTimes(1)
    expect(interactionEnd).toHaveBeenCalledTimes(1)
    expect(change).toHaveBeenCalled()
  })

  it('drags the selection when drag mode is selection', () => {
    const element = createReadyCropper()
    const stage = getStage(element)
    element.setDragMode('selection')
    const start = element.getState()

    stage.dispatchEvent(pointer('pointerdown', 260, 150))
    stage.dispatchEvent(pointer('pointermove', 300, 150))
    stage.dispatchEvent(pointer('pointerup', 300, 150))

    expect(element.getState().selection.x).toBeGreaterThan(start.selection.x)
  })

  it('resizes width and height freely from all four corners', () => {
    const corners: ResizeCorner[] = ['nw', 'ne', 'sw', 'se']

    for (const corner of corners) {
      const element = createReadyCropper('cover.jpg', resizableState)
      const stage = getStage(element)
      const before = element.getState()
      const handle = element.shadowRoot!.querySelector<HTMLButtonElement>(`.handle[data-corner="${corner}"]`)!
      const target = resizePointer(before.selection, corner)

      handle.dispatchEvent(pointer('pointerdown', before.selection.x, before.selection.y))
      stage.dispatchEvent(pointer('pointermove', target.x, target.y))
      stage.dispatchEvent(pointer('pointerup', target.x, target.y))

      const resized = element.getState().selection
      expect(resized.width).toBeGreaterThan(before.selection.width)
      expect(resized.height).toBeGreaterThan(before.selection.height)
      expect(resized.width / resized.height).not.toBeCloseTo(before.selection.width / before.selection.height)
      expect(resized.aspectRatio).toBeCloseTo(resized.width / resized.height)
      element.remove()
    }
  })

  it('zooms around the wheel pointer', () => {
    const element = createReadyCropper()
    const stage = getStage(element)
    const before = element.getState()

    stage.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, clientX: 320, clientY: 210, deltaY: -120 }))

    expect(element.getState().imageTransform.scale).toBeGreaterThan(before.imageTransform.scale)
  })

  it('snaps the rotation slider near right angles', () => {
    const element = createReadyCropper()
    const slider = element.shadowRoot!.querySelector<HTMLInputElement>('input[type="range"]')!

    slider.value = '89'
    slider.dispatchEvent(new Event('input', { bubbles: true }))

    expect(element.getState().imageTransform.rotation).toBe(90)
  })

  it('uses the pre-rotation baseline while dragging the rotation slider', () => {
    const element = createReadyCropper('cover.jpg', rotationSliderState)
    const slider = element.shadowRoot!.querySelector<HTMLInputElement>('input[type="range"]')!
    const baseline = element.getState()

    slider.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    slider.value = '44'
    slider.dispatchEvent(new Event('input', { bubbles: true }))
    const enlarged = element.getState()
    slider.value = '0'
    slider.dispatchEvent(new Event('input', { bubbles: true }))
    const restored = element.getState()
    slider.dispatchEvent(new Event('change', { bubbles: true }))

    expect(enlarged.imageTransform.scale).toBeGreaterThan(baseline.imageTransform.scale)
    expect(restored.imageTransform.rotation).toBe(0)
    expect(restored.imageTransform.scale).toBeCloseTo(baseline.imageTransform.scale)
  })

  it('rotates left/right, flips, fits and resets through public methods', () => {
    const element = createReadyCropper()
    const initial = element.getState()

    element.rotateLeft()
    expect(element.getState().imageTransform.rotation).toBe(-90)
    element.rotateRight()
    expect(element.getState().imageTransform.rotation).toBe(0)
    element.rotateRight()
    expect(element.getState().imageTransform.rotation).toBe(90)
    element.flipHorizontal()
    expect(element.getState().imageTransform.flipX).toBe(true)
    element.fit()
    expect(element.getState().imageTransform.scale).toBeLessThanOrEqual(1)
    element.reset()
    expect(element.getState()).toEqual(initial)
  })

  it('uses a short transition class for button-like programmatic transforms', () => {
    vi.useFakeTimers()
    const element = createReadyCropper()
    const stage = getStage(element)

    element.rotateRight()

    expect(stage.classList.contains('is-animating')).toBe(true)
    vi.advanceTimersByTime(220)
    expect(stage.classList.contains('is-animating')).toBe(false)
    vi.useRealTimers()
  })
})

describe('@covercropper/element export behavior', () => {
  it('exports a Blob with requested canvas dimensions, type and quality', async () => {
    const element = createReadyCropper()
    const exported = vi.fn()
    element.addEventListener('export', exported)
    const { canvases, context } = installCanvasMock()

    const blob = await element.exportBlob({ width: 320, type: 'image/jpeg', quality: 0.82 })

    expect(blob.type).toBe('image/jpeg')
    expect(canvases[0].width).toBe(320)
    expect(canvases[0].height).toBe(320)
    expect(canvases[0].toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.82)
    expect(context.drawImage).toHaveBeenCalledWith(getImage(element), -500, -250)
    expect((exported.mock.calls[0][0] as CustomEvent).detail.blob).toBe(blob)
  })

  it('exports a DataURL with explicit width/height options', async () => {
    const element = createReadyCropper()
    const { canvases } = installCanvasMock({ dataURL: 'data:image/webp;base64,ok' })

    const dataURL = await element.exportDataURL({ width: 400, height: 300, type: 'image/webp', quality: 0.7 })

    expect(dataURL).toBe('data:image/webp;base64,ok')
    expect(canvases[0].width).toBe(400)
    expect(canvases[0].height).toBe(300)
    expect(canvases[0].toDataURL).toHaveBeenCalledWith('image/webp', 0.7)
  })

  it('rejects and emits error when canvas export fails, such as a CORS-tainted image', async () => {
    const element = document.createElement('cover-cropper') as CoverCropperElement
    element.crossOrigin = 'anonymous'
    element.src = 'https://cdn.example.test/cover.jpg'
    document.body.append(element)
    stubStageGeometry(getStage(element))
    element.value = baseState
    dispatchImageLoad(element)
    const error = vi.fn()
    element.addEventListener('error', error)
    installCanvasMock({ throwOnDataURL: new DOMException('Tainted canvases may not be exported', 'SecurityError') })

    await expect(element.exportDataURL()).rejects.toThrow('Tainted canvases may not be exported')

    expect(error).toHaveBeenCalledTimes(1)
    expect((error.mock.calls[0][0] as CustomEvent).detail.message).toBe('Export failed. Check image CORS settings when using remote images.')
  })

  it('rejects and emits error when toBlob returns null', async () => {
    const element = createReadyCropper()
    const error = vi.fn()
    element.addEventListener('error', error)
    installCanvasMock({ blob: null })

    await expect(element.exportBlob()).rejects.toThrow('Export failed. Check image CORS settings when using remote images.')

    expect(error).toHaveBeenCalledTimes(1)
  })
})
