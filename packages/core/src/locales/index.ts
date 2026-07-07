import type { CropperMessages, CropperMessagesOverride, LocaleCode } from '../types'

export const en: CropperMessages = {
  toolbar: { moveImage: 'Move image', dragSelection: 'Drag selection', reset: 'Reset', fit: 'Fit', rotateLeft: 'Rotate left', rotateRight: 'Rotate right', flipHorizontal: 'Flip horizontal', done: 'Done' },
  status: { rotation: 'Rotation', scale: 'Scale', dragMode: 'Drag mode', loading: 'Loading image' },
  aria: { stage: 'Image crop stage', selection: 'Crop selection', resizeNorthWest: 'Resize from top left', resizeNorthEast: 'Resize from top right', resizeSouthWest: 'Resize from bottom left', resizeSouthEast: 'Resize from bottom right', rotationSlider: 'Image rotation', exportPreview: 'Export preview' },
  errors: { invalidAspectRatio: 'Aspect ratio must be a positive number.', invalidImageSize: 'Image size is invalid.', imageLoadFailed: 'Image failed to load.', exportFailed: 'Export failed. Check image CORS settings when using remote images.', canvasUnsupported: 'Canvas export is not supported in this environment.', stateRequired: 'Cropper state is not ready.' }
}

export const zhCN: CropperMessages = {
  toolbar: { moveImage: '移动图片', dragSelection: '拖动裁剪框', reset: '重置', fit: '适配', rotateLeft: '向左旋转', rotateRight: '向右旋转', flipHorizontal: '水平翻转', done: '完成' },
  status: { rotation: '旋转', scale: '缩放', dragMode: '拖拽模式', loading: '正在加载图片' },
  aria: { stage: '图片裁剪区域', selection: '裁剪框', resizeNorthWest: '从左上角调整大小', resizeNorthEast: '从右上角调整大小', resizeSouthWest: '从左下角调整大小', resizeSouthEast: '从右下角调整大小', rotationSlider: '图片旋转', exportPreview: '导出预览' },
  errors: { invalidAspectRatio: '裁剪比例必须是正数。', invalidImageSize: '图片尺寸无效。', imageLoadFailed: '图片加载失败。', exportFailed: '导出失败。使用远程图片时请检查 CORS 设置。', canvasUnsupported: '当前环境不支持 Canvas 导出。', stateRequired: '裁剪状态尚未准备好。' }
}

export const locales: Record<LocaleCode, CropperMessages> = { en, 'zh-CN': zhCN }

function mergeMessageGroup<T extends Record<string, string>>(base: T, override?: Partial<T>): T {
  return { ...base, ...(override ?? {}) }
}

export function getMessages(locale: LocaleCode = 'en', override: CropperMessagesOverride = {}): CropperMessages {
  const base = locales[locale] ?? en
  return { toolbar: mergeMessageGroup(base.toolbar, override.toolbar), status: mergeMessageGroup(base.status, override.status), aria: mergeMessageGroup(base.aria, override.aria), errors: mergeMessageGroup(base.errors, override.errors) }
}
