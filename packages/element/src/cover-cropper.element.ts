import {
  dragImage,
  dragSelection,
  ensureImageCoversSelection,
  fitImageToSelection,
  flipHorizontal,
  getExportRenderPlan,
  getMessages,
  initializeCropperState,
  normalizeState,
  resizeSelectionFromCorner,
  rotateImageBy,
  rotateImageTo,
  serializeState,
  zoomImage,
  type CropperMessagesOverride,
  type CropperState,
  type DragMode,
  type ExportOptions,
  type LocaleCode,
  type Point,
  type ResizeCorner
} from '@covercropper/core'

import { styles } from './styles'

type Interaction =
  | { kind: 'image'; pointerId: number; last: Point }
  | { kind: 'selection'; pointerId: number; last: Point }
  | { kind: 'resize'; pointerId: number; corner: ResizeCorner }

export class CoverCropperElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['src', 'aspect-ratio', 'initial-image-scale', 'drag-mode', 'locale', 'readonly', 'disabled', 'cross-origin']
  }

  private readonly root: ShadowRoot
  private readonly imageElement: HTMLImageElement
  private readonly stageElement: HTMLDivElement
  private readonly selectionElement: HTMLDivElement
  private readonly toolbarElement: HTMLDivElement
  private readonly sliderElement: HTMLInputElement
  private readonly rotationValueElement: HTMLSpanElement
  private readonly statusElement: HTMLDivElement
  private readonly loadingElement: HTMLDivElement
  private readonly errorElement: HTMLDivElement

  private stateValue: CropperState | null = null
  private initialState: CropperState | null = null
  private sourceValue: string | Blob | File | null = null
  private objectUrl: string | null = null
  private imageReady = false
  private interaction: Interaction | null = null
  private animationTimer: number | null = null
  private resizeObserver: ResizeObserver | null = null
  private externalValue: CropperState | null = null
  private aspectRatioValue = 1
  private initialImageScaleValue = 1
  private localeValue: LocaleCode = 'en'
  private messagesValue: CropperMessagesOverride = {}
  private readonlyValue = false
  private disabledValue = false
  private crossOriginValue: '' | 'anonymous' | 'use-credentials' | null = null

  dragMode: DragMode = 'image'

  constructor() {
    super()
    this.root = this.attachShadow({ mode: 'open' })
    const sheet = document.createElement('style')
    sheet.textContent = styles
    const wrapper = document.createElement('div')
    wrapper.className = 'wrapper'
    this.stageElement = document.createElement('div')
    this.stageElement.className = 'stage'
    this.stageElement.tabIndex = 0
    this.imageElement = document.createElement('img')
    this.imageElement.className = 'image'
    this.imageElement.draggable = false
    this.selectionElement = document.createElement('div')
    this.selectionElement.className = 'selection'
    this.selectionElement.append(this.createHandle('nw'), this.createHandle('ne'), this.createHandle('sw'), this.createHandle('se'))
    this.loadingElement = document.createElement('div')
    this.loadingElement.className = 'loading'
    this.errorElement = document.createElement('div')
    this.errorElement.className = 'error'
    this.errorElement.hidden = true
    this.stageElement.append(this.imageElement, this.selectionElement, this.loadingElement, this.errorElement)
    this.toolbarElement = document.createElement('div')
    this.toolbarElement.className = 'toolbar'
    this.sliderElement = document.createElement('input')
    this.sliderElement.type = 'range'
    this.sliderElement.min = '-180'
    this.sliderElement.max = '180'
    this.sliderElement.step = '1'
    this.rotationValueElement = document.createElement('span')
    this.rotationValueElement.className = 'status'
    const sliderRow = document.createElement('label')
    sliderRow.className = 'sliderRow'
    sliderRow.append(document.createElement('span'), this.sliderElement, this.rotationValueElement)
    this.statusElement = document.createElement('div')
    this.statusElement.className = 'status'
    wrapper.append(this.stageElement, this.toolbarElement, sliderRow, this.statusElement)
    this.root.append(sheet, wrapper)
    this.imageElement.addEventListener('load', () => this.handleImageLoad())
    this.imageElement.addEventListener('error', () => this.fail(this.currentMessages().errors.imageLoadFailed))
    this.stageElement.addEventListener('pointerdown', (event) => this.handlePointerDown(event))
    this.stageElement.addEventListener('pointermove', (event) => this.handlePointerMove(event))
    this.stageElement.addEventListener('pointerup', (event) => this.handlePointerEnd(event))
    this.stageElement.addEventListener('pointercancel', (event) => this.handlePointerEnd(event))
    this.stageElement.addEventListener('wheel', (event) => this.handleWheel(event), { passive: false })
    this.sliderElement.addEventListener('input', () => this.rotateTo(Number(this.sliderElement.value), false))
  }

  get src(): string | Blob | File | null { return this.sourceValue }
  set src(value: string | Blob | File | null) {
    const next = value ?? null
    if (this.sourceValue === next) return
    this.sourceValue = next
    this.loadSource()
  }
  get value(): CropperState | null { return this.stateValue ? this.getState() : null }
  set value(state: CropperState | null) { this.externalValue = state ? normalizeState(state) : null; if (this.externalValue) this.setState(this.externalValue) }
  get aspectRatio(): number { return this.aspectRatioValue }
  set aspectRatio(value: number) { const next = Number.isFinite(value) && value > 0 ? value : this.aspectRatioValue; if (next !== this.aspectRatioValue) { this.aspectRatioValue = next; this.reinitialize() } }
  get initialImageScale(): number { return this.initialImageScaleValue }
  set initialImageScale(value: number) { const next = Number.isFinite(value) && value > 0 ? value : this.initialImageScaleValue; if (next !== this.initialImageScaleValue) { this.initialImageScaleValue = next; this.reinitialize() } }
  get locale(): LocaleCode { return this.localeValue }
  set locale(value: LocaleCode) { this.localeValue = value === 'zh-CN' ? 'zh-CN' : 'en'; this.render() }
  get messages(): CropperMessagesOverride { return this.messagesValue }
  set messages(value: CropperMessagesOverride) { this.messagesValue = value ?? {}; this.render() }
  get readonly(): boolean { return this.readonlyValue }
  set readonly(value: boolean) { this.readonlyValue = Boolean(value); this.render() }
  get disabled(): boolean { return this.disabledValue }
  set disabled(value: boolean) { this.disabledValue = Boolean(value); this.render() }
  get crossOrigin(): '' | 'anonymous' | 'use-credentials' | null { return this.crossOriginValue }
  set crossOrigin(value: '' | 'anonymous' | 'use-credentials' | null) { const next = value === 'anonymous' || value === 'use-credentials' ? value : null; if (next !== this.crossOriginValue) { this.crossOriginValue = next; if (this.sourceValue && this.isConnected) this.loadSource() } }

  connectedCallback(): void {
    this.syncAttributesToProperties()
    this.renderText()
    this.loadSource()
    this.resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => this.handleResize()) : null
    this.resizeObserver?.observe(this)
    this.render()
  }

  disconnectedCallback(): void { this.resizeObserver?.disconnect(); this.resizeObserver = null; this.clearAnimationTimer(); this.revokeObjectUrl() }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return
    switch (name) {
      case 'src': this.src = newValue; break
      case 'aspect-ratio': this.aspectRatio = this.parsePositiveNumber(newValue, this.aspectRatio); break
      case 'initial-image-scale': this.initialImageScale = this.parsePositiveNumber(newValue, this.initialImageScale); break
      case 'drag-mode': this.setDragMode(newValue === 'selection' ? 'selection' : 'image'); break
      case 'locale': this.locale = newValue === 'zh-CN' ? 'zh-CN' : 'en'; break
      case 'readonly': this.readonly = newValue !== null; break
      case 'disabled': this.disabled = newValue !== null; break
      case 'cross-origin': this.crossOrigin = newValue === 'anonymous' || newValue === 'use-credentials' ? newValue : null; break
    }
  }

  getState(): CropperState { if (!this.stateValue) throw new Error(this.currentMessages().errors.stateRequired); return serializeState(this.stateValue) }
  setState(state: CropperState): void { this.stateValue = ensureImageCoversSelection(normalizeState(state)); if (!this.initialState) this.initialState = this.getState(); this.render(); this.emitChange() }
  reset(): void { if (this.initialState) { this.animateNextRender(); this.stateValue = serializeState(this.initialState); this.render(); this.emitChange() } else this.reinitialize() }
  fit(): void { if (!this.stateValue) return; this.animateNextRender(); this.stateValue = fitImageToSelection(this.stateValue); this.render(); this.emitChange() }
  setDragMode(mode: DragMode): void { this.dragMode = mode; if (this.getAttribute('drag-mode') !== mode) this.setAttribute('drag-mode', mode); this.renderText() }
  rotateTo(angle: number, animate = true): void { if (!this.stateValue || this.isLocked()) return; if (animate) this.animateNextRender(); this.stateValue = rotateImageTo(this.stateValue, angle); this.render(); this.emitChange() }
  rotateLeft(): void { if (!this.stateValue || this.isLocked()) return; this.animateNextRender(); this.stateValue = rotateImageBy(this.stateValue, -90); this.render(); this.emitChange() }
  rotateRight(): void { if (!this.stateValue || this.isLocked()) return; this.animateNextRender(); this.stateValue = rotateImageBy(this.stateValue, 90); this.render(); this.emitChange() }
  flipHorizontal(): void { if (!this.stateValue || this.isLocked()) return; this.animateNextRender(); this.stateValue = flipHorizontal(this.stateValue); this.render(); this.emitChange() }

  async exportBlob(options: ExportOptions = {}): Promise<Blob> {
    const canvas = this.drawToCanvas(options)
    const type = options.type ?? 'image/png'
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((result) => result ? resolve(result) : reject(new Error(this.currentMessages().errors.exportFailed)), type, options.quality)).catch((error) => { this.fail(this.currentMessages().errors.exportFailed, error); throw error })
    this.dispatch('export', { blob, state: this.getState() })
    return blob
  }

  async exportDataURL(options: ExportOptions = {}): Promise<string> {
    try { const dataURL = this.drawToCanvas(options).toDataURL(options.type ?? 'image/png', options.quality); this.dispatch('export', { dataURL, state: this.getState() }); return dataURL }
    catch (error) { this.fail(this.currentMessages().errors.exportFailed, error); throw error }
  }

  private syncAttributesToProperties(): void {
    if (this.hasAttribute('src')) this.sourceValue = this.getAttribute('src')
    this.aspectRatioValue = this.parsePositiveNumber(this.getAttribute('aspect-ratio'), this.aspectRatioValue)
    this.initialImageScaleValue = this.parsePositiveNumber(this.getAttribute('initial-image-scale'), this.initialImageScaleValue)
    this.dragMode = this.getAttribute('drag-mode') === 'selection' ? 'selection' : 'image'
    this.localeValue = this.getAttribute('locale') === 'zh-CN' ? 'zh-CN' : 'en'
    this.readonlyValue = this.hasAttribute('readonly')
    this.disabledValue = this.hasAttribute('disabled')
    const crossOrigin = this.getAttribute('cross-origin')
    this.crossOriginValue = crossOrigin === 'anonymous' || crossOrigin === 'use-credentials' ? crossOrigin : null
  }

  private createHandle(corner: ResizeCorner): HTMLButtonElement { const handle = document.createElement('button'); handle.type = 'button'; handle.className = 'handle'; handle.dataset.corner = corner; return handle }
  private currentMessages() { return getMessages(this.locale, this.messages) }
  private clearAnimationTimer(): void { if (this.animationTimer !== null) { window.clearTimeout(this.animationTimer); this.animationTimer = null } }
  private animateNextRender(): void { this.clearAnimationTimer(); this.stageElement.classList.add('is-animating'); this.animationTimer = window.setTimeout(() => { this.stageElement.classList.remove('is-animating'); this.animationTimer = null }, 220) }

  private renderText(): void {
    const messages = this.currentMessages()
    this.loadingElement.textContent = messages.status.loading
    this.stageElement.setAttribute('aria-label', messages.aria.stage)
    this.selectionElement.setAttribute('aria-label', messages.aria.selection)
    const handleLabels: Record<ResizeCorner, string> = { nw: messages.aria.resizeNorthWest, ne: messages.aria.resizeNorthEast, sw: messages.aria.resizeSouthWest, se: messages.aria.resizeSouthEast }
    this.selectionElement.querySelectorAll<HTMLButtonElement>('.handle').forEach((handle) => handle.setAttribute('aria-label', handleLabels[handle.dataset.corner as ResizeCorner]))
    this.sliderElement.setAttribute('aria-label', messages.aria.rotationSlider)
    const sliderLabel = this.root.querySelector<HTMLSpanElement>('.sliderRow span')
    if (sliderLabel) sliderLabel.textContent = messages.status.rotation
    this.toolbarElement.replaceChildren(
      this.createToolbarButton(messages.toolbar.moveImage, () => this.setDragMode('image'), this.dragMode === 'image'),
      this.createToolbarButton(messages.toolbar.dragSelection, () => this.setDragMode('selection'), this.dragMode === 'selection'),
      this.createToolbarButton(messages.toolbar.reset, () => this.reset()),
      this.createToolbarButton(messages.toolbar.fit, () => this.fit()),
      this.createToolbarButton(messages.toolbar.rotateLeft, () => this.rotateLeft()),
      this.createToolbarButton(messages.toolbar.rotateRight, () => this.rotateRight()),
      this.createToolbarButton(messages.toolbar.flipHorizontal, () => this.flipHorizontal()),
      this.createToolbarButton(messages.toolbar.done, () => void this.exportBlob())
    )
    const dragModeLabel = this.dragMode === 'image' ? messages.toolbar.moveImage : messages.toolbar.dragSelection
    this.statusElement.textContent = `${messages.status.dragMode}: ${dragModeLabel}`
  }

  private createToolbarButton(label: string, onClick: () => void, pressed = false): HTMLButtonElement { const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.disabled = this.isLocked(); button.setAttribute('aria-pressed', String(pressed)); button.addEventListener('click', onClick); return button }

  private render(): void {
    const messages = this.currentMessages()
    this.stageElement.setAttribute('aria-disabled', String(this.isLocked()))
    this.renderText()
    if (!this.stateValue || !this.imageReady) { this.imageElement.hidden = true; this.selectionElement.hidden = true; this.loadingElement.hidden = !this.sourceValue; this.sliderElement.value = '0'; this.rotationValueElement.textContent = '0°'; return }
    const state = this.stateValue
    const imageWidth = state.image.naturalWidth * state.imageTransform.scale
    const imageHeight = state.image.naturalHeight * state.imageTransform.scale
    this.imageElement.hidden = false
    this.selectionElement.hidden = false
    this.loadingElement.hidden = true
    this.imageElement.style.width = `${imageWidth}px`
    this.imageElement.style.height = `${imageHeight}px`
    this.imageElement.style.left = `${state.imageTransform.x - imageWidth / 2}px`
    this.imageElement.style.top = `${state.imageTransform.y - imageHeight / 2}px`
    this.imageElement.style.transform = `rotate(${state.imageTransform.rotation}deg) scaleX(${state.imageTransform.flipX ? -1 : 1}) scaleY(${state.imageTransform.flipY ? -1 : 1})`
    this.selectionElement.style.left = `${state.selection.x}px`
    this.selectionElement.style.top = `${state.selection.y}px`
    this.selectionElement.style.width = `${state.selection.width}px`
    this.selectionElement.style.height = `${state.selection.height}px`
    this.sliderElement.value = String(Math.round(state.imageTransform.rotation))
    this.rotationValueElement.textContent = `${Math.round(state.imageTransform.rotation)}°`
    const dragModeLabel = this.dragMode === 'image' ? messages.toolbar.moveImage : messages.toolbar.dragSelection
    this.statusElement.textContent = `${messages.status.dragMode}: ${dragModeLabel} · ${messages.status.scale}: ${state.imageTransform.scale.toFixed(2)}`
  }

  private loadSource(): void {
    this.revokeObjectUrl(); this.imageReady = false; this.stateValue = null; this.initialState = null; this.errorElement.hidden = true
    if (!this.sourceValue) { this.imageElement.removeAttribute('src'); this.render(); return }
    if (this.crossOrigin) this.imageElement.crossOrigin = this.crossOrigin; else this.imageElement.removeAttribute('crossorigin')
    const src = typeof this.sourceValue === 'string' ? this.sourceValue : URL.createObjectURL(this.sourceValue)
    if (typeof this.sourceValue !== 'string') this.objectUrl = src
    this.imageElement.src = src
    this.render()
  }
  private revokeObjectUrl(): void { if (this.objectUrl) { URL.revokeObjectURL(this.objectUrl); this.objectUrl = null } }
  private handleImageLoad(): void { this.imageReady = true; this.reinitialize(); this.dispatch('ready', { state: this.getState() }) }
  private reinitialize(): void {
    if (!this.imageReady || !this.imageElement.naturalWidth || !this.imageElement.naturalHeight) return
    try {
      const stageSize = this.measureStage()
      this.stateValue = this.externalValue ? ensureImageCoversSelection({ ...this.externalValue, stage: stageSize }) : initializeCropperState({ naturalWidth: this.imageElement.naturalWidth, naturalHeight: this.imageElement.naturalHeight, stageWidth: stageSize.width, stageHeight: stageSize.height, aspectRatio: this.aspectRatio, initialImageScale: this.initialImageScale })
      this.initialState = this.getState(); this.render(); this.emitChange()
    } catch (error) { this.fail(this.currentMessages().errors.invalidAspectRatio, error) }
  }
  private handleResize(): void { if (!this.stateValue || !this.imageReady) return; const nextSize = this.measureStage(); if (Math.abs(nextSize.width - this.stateValue.stage.width) < 1 && Math.abs(nextSize.height - this.stateValue.stage.height) < 1) return; this.stateValue = ensureImageCoversSelection({ ...this.stateValue, stage: nextSize }); this.render(); this.emitChange() }
  private measureStage() { return { width: Math.max(1, Math.round(this.stageElement.clientWidth || this.clientWidth || 640)), height: Math.max(1, Math.round(this.stageElement.clientHeight || 420)) } }
  private handlePointerDown(event: PointerEvent): void { if (!this.stateValue || this.isLocked()) return; const corner = (event.target as HTMLElement).dataset?.corner as ResizeCorner | undefined; const point = this.eventPoint(event); this.interaction = corner ? { kind: 'resize', pointerId: event.pointerId, corner } : this.dragMode === 'selection' ? { kind: 'selection', pointerId: event.pointerId, last: point } : { kind: 'image', pointerId: event.pointerId, last: point }; this.stageElement.setPointerCapture(event.pointerId); this.dispatch('interaction-start', { state: this.getState() }); event.preventDefault() }
  private handlePointerMove(event: PointerEvent): void { if (!this.stateValue || !this.interaction || this.interaction.pointerId !== event.pointerId || this.isLocked()) return; const point = this.eventPoint(event); if (this.interaction.kind === 'image') { const delta = { x: point.x - this.interaction.last.x, y: point.y - this.interaction.last.y }; this.stateValue = dragImage(this.stateValue, delta); this.interaction.last = point } else if (this.interaction.kind === 'selection') { const delta = { x: point.x - this.interaction.last.x, y: point.y - this.interaction.last.y }; this.stateValue = dragSelection(this.stateValue, delta); this.interaction.last = point } else this.stateValue = resizeSelectionFromCorner(this.stateValue, this.interaction.corner, point); this.render(); this.emitChange(); event.preventDefault() }
  private handlePointerEnd(event: PointerEvent): void { if (!this.interaction || this.interaction.pointerId !== event.pointerId) return; this.interaction = null; if (this.stageElement.hasPointerCapture(event.pointerId)) this.stageElement.releasePointerCapture(event.pointerId); if (this.stateValue) this.dispatch('interaction-end', { state: this.getState() }) }
  private handleWheel(event: WheelEvent): void { if (!this.stateValue || this.isLocked()) return; event.preventDefault(); this.stateValue = zoomImage(this.stateValue, Math.exp(-event.deltaY * 0.001), this.eventPoint(event)); this.render(); this.emitChange() }
  private eventPoint(event: PointerEvent | WheelEvent): Point { const rect = this.stageElement.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top } }
  private drawToCanvas(options: ExportOptions): HTMLCanvasElement { if (!this.stateValue) throw new Error(this.currentMessages().errors.stateRequired); const plan = getExportRenderPlan(this.stateValue, options); const canvas = document.createElement('canvas'); canvas.width = plan.width; canvas.height = plan.height; const context = canvas.getContext('2d'); if (!context) throw new Error(this.currentMessages().errors.canvasUnsupported); context.save(); context.scale(plan.scaleX, plan.scaleY); context.translate(-plan.selection.x, -plan.selection.y); context.translate(plan.imageTransform.x, plan.imageTransform.y); context.rotate((plan.imageTransform.rotation * Math.PI) / 180); context.scale(plan.imageTransform.flipX ? -plan.imageTransform.scale : plan.imageTransform.scale, plan.imageTransform.flipY ? -plan.imageTransform.scale : plan.imageTransform.scale); context.drawImage(this.imageElement, -plan.image.naturalWidth / 2, -plan.image.naturalHeight / 2); context.restore(); return canvas }
  private parsePositiveNumber(value: string | null, fallback: number): number { const parsed = Number(value); return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback }
  private isLocked(): boolean { return this.disabled || this.readonly }
  private emitChange(): void { if (this.stateValue) this.dispatch('change', { state: this.getState() }) }
  private dispatch(type: string, detail: unknown): void { this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true })) }
  private fail(message: string, cause?: unknown): void { this.errorElement.textContent = message; this.errorElement.hidden = false; this.loadingElement.hidden = true; this.dispatch('error', { message, cause }) }
}

declare global { interface HTMLElementTagNameMap { 'cover-cropper': CoverCropperElement } }
