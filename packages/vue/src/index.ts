import '@covercropper/element'
import type { CoverCropperElement, CropperMessagesOverride, CropperState, DragMode, ExportOptions, LocaleCode } from '@covercropper/element'
import { defineComponent, h, onBeforeUnmount, onMounted, ref, watch } from 'vue'

export const CoverCropper = defineComponent({
  name: 'CoverCropper',
  props: { src: [String, Blob, File], aspectRatio: Number, initialImageScale: Number, modelValue: Object, dragMode: String, locale: String, messages: Object, readonly: Boolean, disabled: Boolean, crossOrigin: String },
  emits: ['ready', 'change', 'interaction-start', 'interaction-end', 'export', 'error', 'update:modelValue'],
  setup(props, { emit, expose, attrs }) {
    const elementRef = ref<CoverCropperElement | null>(null)
    const sync = () => {
      const element = elementRef.value
      if (!element) return
      element.crossOrigin = props.crossOrigin === 'anonymous' || props.crossOrigin === 'use-credentials' ? props.crossOrigin : null
      element.src = (props.src as string | Blob | File | undefined) ?? null
      if (typeof props.aspectRatio === 'number') element.aspectRatio = props.aspectRatio
      if (typeof props.initialImageScale === 'number') element.initialImageScale = props.initialImageScale
      if (props.dragMode === 'image' || props.dragMode === 'selection') element.setDragMode(props.dragMode as DragMode)
      if (props.locale === 'en' || props.locale === 'zh-CN') element.locale = props.locale as LocaleCode
      if (props.messages) element.messages = props.messages as CropperMessagesOverride
      element.readonly = props.readonly
      element.disabled = props.disabled
      if (props.modelValue) element.value = props.modelValue as CropperState
    }
    const listeners: Array<[string, EventListener]> = [['ready', (event) => emit('ready', event)], ['change', (event) => { const custom = event as CustomEvent<{ state: CropperState }>; emit('update:modelValue', custom.detail.state); emit('change', event) }], ['interaction-start', (event) => emit('interaction-start', event)], ['interaction-end', (event) => emit('interaction-end', event)], ['export', (event) => emit('export', event)], ['error', (event) => emit('error', event)]]
    onMounted(() => { sync(); const element = elementRef.value; if (element) for (const [name, listener] of listeners) element.addEventListener(name, listener) })
    onBeforeUnmount(() => { const element = elementRef.value; if (element) for (const [name, listener] of listeners) element.removeEventListener(name, listener) })
    watch(() => ({ ...props }), sync, { deep: true })
    expose({ getState: () => elementRef.value!.getState(), setState: (state: CropperState) => elementRef.value!.setState(state), reset: () => elementRef.value!.reset(), fit: () => elementRef.value!.fit(), setDragMode: (mode: DragMode) => elementRef.value!.setDragMode(mode), rotateTo: (angle: number) => elementRef.value!.rotateTo(angle), rotateLeft: () => elementRef.value!.rotateLeft(), rotateRight: () => elementRef.value!.rotateRight(), flipHorizontal: () => elementRef.value!.flipHorizontal(), exportBlob: (options?: ExportOptions) => elementRef.value!.exportBlob(options), exportDataURL: (options?: ExportOptions) => elementRef.value!.exportDataURL(options) })
    return () => h('cover-cropper', { ...attrs, ref: elementRef })
  }
})
export type { CoverCropperElement, CropperMessagesOverride, CropperState, DragMode, ExportOptions, LocaleCode }
export default CoverCropper
