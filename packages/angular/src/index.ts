import '@covercropper/element'
import type { CoverCropperElement, CropperMessagesOverride, CropperState, DragMode, ExportOptions, LocaleCode } from '@covercropper/element'
import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core'

@Component({
  selector: 'cover-cropper-angular',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: '<cover-cropper #cropper></cover-cropper>'
})
export class CoverCropperComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() src: string | Blob | File | null = null
  @Input() aspectRatio = 1
  @Input() initialImageScale = 1
  @Input() value: CropperState | null = null
  @Input() dragMode: DragMode = 'image'
  @Input() locale: LocaleCode = 'en'
  @Input() messages: CropperMessagesOverride = {}
  @Input() readonly = false
  @Input() disabled = false
  @Input() crossOrigin: '' | 'anonymous' | 'use-credentials' | null = null

  @Output() readonly ready = new EventEmitter<CustomEvent>()
  @Output() readonly change = new EventEmitter<CustomEvent<{ state: CropperState }>>()
  @Output() readonly interactionStart = new EventEmitter<CustomEvent>()
  @Output() readonly interactionEnd = new EventEmitter<CustomEvent>()
  @Output() readonly export = new EventEmitter<CustomEvent>()
  @Output() readonly error = new EventEmitter<CustomEvent>()
  @Output() readonly valueChange = new EventEmitter<CropperState>()

  @ViewChild('cropper', { static: true }) private cropperRef!: ElementRef<CoverCropperElement>

  private readonly eventBindings: Array<[string, EventListener]> = [
    ['ready', (event) => this.ready.emit(event as CustomEvent)],
    ['change', (event) => { const custom = event as CustomEvent<{ state: CropperState }>; this.valueChange.emit(custom.detail.state); this.change.emit(custom) }],
    ['interaction-start', (event) => this.interactionStart.emit(event as CustomEvent)],
    ['interaction-end', (event) => this.interactionEnd.emit(event as CustomEvent)],
    ['export', (event) => this.export.emit(event as CustomEvent)],
    ['error', (event) => this.error.emit(event as CustomEvent)]
  ]

  ngAfterViewInit(): void { const element = this.element; for (const [name, listener] of this.eventBindings) element.addEventListener(name, listener); this.syncInputs() }
  ngOnChanges(_changes: SimpleChanges): void { if (this.cropperRef) this.syncInputs() }
  ngOnDestroy(): void { const element = this.element; for (const [name, listener] of this.eventBindings) element.removeEventListener(name, listener) }

  getState(): CropperState { return this.element.getState() }
  setState(state: CropperState): void { this.element.setState(state) }
  reset(): void { this.element.reset() }
  fit(): void { this.element.fit() }
  setDragMode(mode: DragMode): void { this.element.setDragMode(mode) }
  rotateTo(angle: number): void { this.element.rotateTo(angle) }
  rotateLeft(): void { this.element.rotateLeft() }
  rotateRight(): void { this.element.rotateRight() }
  flipHorizontal(): void { this.element.flipHorizontal() }
  exportBlob(options?: ExportOptions): Promise<Blob> { return this.element.exportBlob(options) }
  exportDataURL(options?: ExportOptions): Promise<string> { return this.element.exportDataURL(options) }

  private get element(): CoverCropperElement { return this.cropperRef.nativeElement }
  private syncInputs(): void {
    const element = this.element
    element.crossOrigin = this.crossOrigin
    element.src = this.src
    element.aspectRatio = this.aspectRatio
    element.initialImageScale = this.initialImageScale
    element.setDragMode(this.dragMode)
    element.locale = this.locale
    element.messages = this.messages
    element.readonly = this.readonly
    element.disabled = this.disabled
    if (this.value) element.value = this.value
  }
}

export type { CoverCropperElement, CropperMessagesOverride, CropperState, DragMode, ExportOptions, LocaleCode }
