import { cloneState } from '../state'
import type { CropperState, ExportOptions, ExportRenderPlan } from '../types'

export function getExportSize(state: CropperState, options: ExportOptions = {}): { width: number; height: number } {
  const pixelRatio = options.pixelRatio ?? 1
  const selectionRatio = state.selection.width / state.selection.height
  if (options.width && options.height) return { width: options.width, height: options.height }
  if (options.width) return { width: options.width, height: Math.round(options.width / selectionRatio) }
  if (options.height) return { width: Math.round(options.height * selectionRatio), height: options.height }
  return { width: Math.max(1, Math.round(state.selection.width * pixelRatio)), height: Math.max(1, Math.round(state.selection.height * pixelRatio)) }
}

export function getExportRenderPlan(state: CropperState, options: ExportOptions = {}): ExportRenderPlan {
  const size = getExportSize(state, options)
  return { ...size, scaleX: size.width / state.selection.width, scaleY: size.height / state.selection.height, selection: { ...state.selection }, imageTransform: { ...state.imageTransform }, image: { ...state.image } }
}

export function cloneStateForExport(state: CropperState): CropperState {
  return cloneState(state)
}
