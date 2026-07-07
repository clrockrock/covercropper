import '@covercropper/element'
import type { CoverCropperElement, CropperMessagesOverride, CropperState, DragMode, ExportOptions, LocaleCode } from '@covercropper/element'
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

export interface CoverCropperHandle {
  getState(): CropperState
  setState(state: CropperState): void
  reset(): void
  fit(): void
  setDragMode(mode: DragMode): void
  rotateTo(angle: number): void
  rotateLeft(): void
  rotateRight(): void
  flipHorizontal(): void
  exportBlob(options?: ExportOptions): Promise<Blob>
  exportDataURL(options?: ExportOptions): Promise<string>
}

export interface CoverCropperProps extends Omit<React.HTMLAttributes<HTMLElement>, 'onChange' | 'onError'> {
  src?: string | Blob | File | null
  aspectRatio?: number
  initialImageScale?: number
  value?: CropperState | null
  dragMode?: DragMode
  locale?: LocaleCode
  messages?: CropperMessagesOverride
  readonly?: boolean
  disabled?: boolean
  crossOrigin?: '' | 'anonymous' | 'use-credentials' | null
  onReady?: (event: CustomEvent) => void
  onChange?: (event: CustomEvent<{ state: CropperState }>) => void
  onInteractionStart?: (event: CustomEvent) => void
  onInteractionEnd?: (event: CustomEvent) => void
  onExport?: (event: CustomEvent) => void
  onError?: (event: CustomEvent) => void
}

export const CoverCropper = forwardRef<CoverCropperHandle, CoverCropperProps>(function CoverCropper(props, ref) {
  const { src, aspectRatio, initialImageScale, value, dragMode, locale, messages, readonly, disabled, crossOrigin, onReady, onChange, onInteractionStart, onInteractionEnd, onExport, onError, ...rest } = props
  const elementRef = useRef<CoverCropperElement | null>(null)
  useImperativeHandle(ref, () => ({
    getState: () => elementRef.current!.getState(),
    setState: (state) => elementRef.current!.setState(state),
    reset: () => elementRef.current!.reset(),
    fit: () => elementRef.current!.fit(),
    setDragMode: (mode) => elementRef.current!.setDragMode(mode),
    rotateTo: (angle) => elementRef.current!.rotateTo(angle),
    rotateLeft: () => elementRef.current!.rotateLeft(),
    rotateRight: () => elementRef.current!.rotateRight(),
    flipHorizontal: () => elementRef.current!.flipHorizontal(),
    exportBlob: (options) => elementRef.current!.exportBlob(options),
    exportDataURL: (options) => elementRef.current!.exportDataURL(options)
  }))
  useEffect(() => {
    const element = elementRef.current
    if (!element) return
    element.crossOrigin = crossOrigin ?? null
    element.src = src ?? null
    if (typeof aspectRatio === 'number') element.aspectRatio = aspectRatio
    if (typeof initialImageScale === 'number') element.initialImageScale = initialImageScale
    if (dragMode) element.setDragMode(dragMode)
    if (locale) element.locale = locale
    if (messages) element.messages = messages
    element.readonly = Boolean(readonly)
    element.disabled = Boolean(disabled)
    if (value) element.value = value
  }, [src, aspectRatio, initialImageScale, value, dragMode, locale, messages, readonly, disabled, crossOrigin])
  useEffect(() => {
    const element = elementRef.current
    if (!element) return
    const listeners: Array<[string, EventListener | undefined]> = [['ready', onReady as EventListener | undefined], ['change', onChange as EventListener | undefined], ['interaction-start', onInteractionStart as EventListener | undefined], ['interaction-end', onInteractionEnd as EventListener | undefined], ['export', onExport as EventListener | undefined], ['error', onError as EventListener | undefined]]
    for (const [name, listener] of listeners) if (listener) element.addEventListener(name, listener)
    return () => { for (const [name, listener] of listeners) if (listener) element.removeEventListener(name, listener) }
  }, [onReady, onChange, onInteractionStart, onInteractionEnd, onExport, onError])
  return React.createElement('cover-cropper', { ...rest, ref: elementRef })
})
