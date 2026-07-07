export { CoverCropperElement } from './cover-cropper.element'
export type { CropperState, CropperMessages, CropperMessagesOverride, DragMode, ExportOptions, LocaleCode } from '@covercropper/core'

import { CoverCropperElement } from './cover-cropper.element'

export function defineCoverCropperElement(): void {
  if (!customElements.get('cover-cropper')) customElements.define('cover-cropper', CoverCropperElement)
}

if (typeof customElements !== 'undefined') defineCoverCropperElement()
