import '@covercropper/element'
import type { CoverCropperElement, DragMode, LocaleCode } from '@covercropper/element'
import './styles.css'

const sampleSvg = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900" viewBox="0 0 1400 900"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#2563eb"/><stop offset="1" stop-color="#f97316"/></linearGradient></defs><rect width="1400" height="900" fill="url(#g)"/><circle cx="360" cy="420" r="210" fill="rgba(255,255,255,.32)"/><rect x="760" y="210" width="410" height="430" rx="42" fill="rgba(15,23,42,.28)"/><text x="700" y="485" text-anchor="middle" font-size="86" font-family="Arial" fill="white">CoverCropper</text></svg>`)

const copy = {
  en: {
    title: 'CoverCropper Playground',
    intro: 'Try upload, initial aspect ratio, initial scale, drag mode, locale, rotation, export and state serialization.',
    imageUrl: 'Image URL',
    upload: 'Upload image',
    aspect: 'Initial aspect ratio',
    initialScale: 'Initial image scale',
    dragMode: 'Drag mode',
    modeImage: 'Move image',
    modeSelection: 'Drag selection',
    locale: 'Locale',
    export: 'Refresh preview',
    reset: 'Reset',
    fit: 'Fit',
    rotateLeft: 'Rotate left',
    rotateRight: 'Rotate right',
    flip: 'Flip horizontal',
    preview: 'Live export preview',
    state: 'State JSON'
  },
  'zh-CN': {
    title: 'CoverCropper 演示场',
    intro: '尝试上传、初始裁剪比例、初始缩放、拖拽模式、语言、旋转、导出与状态序列化。',
    imageUrl: '图片 URL',
    upload: '上传图片',
    aspect: '初始裁剪比例',
    initialScale: '初始图片缩放',
    dragMode: '拖拽模式',
    modeImage: '移动图片',
    modeSelection: '拖动裁剪框',
    locale: '语言',
    export: '刷新预览',
    reset: '重置',
    fit: '适配',
    rotateLeft: '向左旋转',
    rotateRight: '向右旋转',
    flip: '水平翻转',
    preview: '实时导出预览',
    state: '状态 JSON'
  }
}

const app = document.querySelector<HTMLDivElement>('#app')!
app.innerHTML = `
  <h1 data-i18n="title"></h1>
  <p data-i18n="intro"></p>
  <div class="layout">
    <section><cover-cropper></cover-cropper></section>
    <aside class="panel">
      <label><span data-i18n="imageUrl"></span><input id="url" /></label>
      <label><span data-i18n="upload"></span><input id="file" type="file" accept="image/*" /></label>
      <label><span data-i18n="aspect"></span><select id="aspect"><option value="1.7777777778">16:9</option><option value="1.3333333333">4:3</option><option value="1">1:1</option><option value="0.75">3:4</option><option value="0.5625">9:16</option></select></label>
      <label><span data-i18n="initialScale"></span><input id="scale" type="number" min="1" max="5" step="0.1" value="1.4" /></label>
      <label><span data-i18n="dragMode"></span><select id="mode"><option value="image" data-i18n="modeImage">Move image</option><option value="selection" data-i18n="modeSelection">Drag selection</option></select></label>
      <label><span data-i18n="locale"></span><select id="locale"><option value="en">English</option><option value="zh-CN">中文</option></select></label>
      <div class="actions"><button id="reset" data-i18n="reset"></button><button id="fit" data-i18n="fit"></button><button id="left" data-i18n="rotateLeft"></button><button id="right" data-i18n="rotateRight"></button><button id="flip" data-i18n="flip"></button><button id="export" data-i18n="export"></button></div>
      <div class="previewBlock"><span data-i18n="preview"></span><img id="preview" class="preview" alt="" /></div>
      <label><span data-i18n="state"></span><textarea id="state" readonly></textarea></label>
    </aside>
  </div>
`

const cropper = document.querySelector<CoverCropperElement>('cover-cropper')!
const urlInput = document.querySelector<HTMLInputElement>('#url')!
const fileInput = document.querySelector<HTMLInputElement>('#file')!
const aspectSelect = document.querySelector<HTMLSelectElement>('#aspect')!
const scaleInput = document.querySelector<HTMLInputElement>('#scale')!
const modeSelect = document.querySelector<HTMLSelectElement>('#mode')!
const localeSelect = document.querySelector<HTMLSelectElement>('#locale')!
const preview = document.querySelector<HTMLImageElement>('#preview')!
const stateText = document.querySelector<HTMLTextAreaElement>('#state')!

let previewFrame = 0
let previewVersion = 0

urlInput.value = `data:image/svg+xml;charset=utf-8,${sampleSvg}`
cropper.src = urlInput.value
cropper.aspectRatio = Number(aspectSelect.value)
cropper.initialImageScale = Number(scaleInput.value)

function updateCopy(locale: LocaleCode): void {
  const table = copy[locale]
  document.documentElement.lang = locale
  preview.alt = table.preview
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n as keyof typeof table
    node.textContent = table[key]
  })
}

function syncState(): void {
  const state = cropper.value
  stateText.value = state ? JSON.stringify(state, null, 2) : ''
}

function clearPreview(): void {
  previewVersion += 1
  if (previewFrame) window.cancelAnimationFrame(previewFrame)
  previewFrame = 0
  preview.removeAttribute('src')
}

async function renderPreview(): Promise<void> {
  const version = previewVersion + 1
  previewVersion = version
  previewFrame = 0
  if (!cropper.value) {
    preview.removeAttribute('src')
    return
  }
  try {
    const dataURL = await cropper.exportDataURL({ width: 512 })
    if (version === previewVersion) preview.src = dataURL
  } catch {
    if (version === previewVersion) preview.removeAttribute('src')
  }
}

function schedulePreview(): void {
  if (previewFrame) window.cancelAnimationFrame(previewFrame)
  previewFrame = window.requestAnimationFrame(() => { void renderPreview() })
}

function syncPreviewAndState(): void {
  syncState()
  schedulePreview()
}

urlInput.addEventListener('change', () => { clearPreview(); stateText.value = ''; cropper.src = urlInput.value })
fileInput.addEventListener('change', () => { const file = fileInput.files?.[0]; if (file) { clearPreview(); stateText.value = ''; cropper.src = file } })
aspectSelect.addEventListener('change', () => { cropper.aspectRatio = Number(aspectSelect.value) })
scaleInput.addEventListener('change', () => { cropper.initialImageScale = Number(scaleInput.value) })
modeSelect.addEventListener('change', () => cropper.setDragMode(modeSelect.value as DragMode))
localeSelect.addEventListener('change', () => { const locale = localeSelect.value as LocaleCode; cropper.locale = locale; updateCopy(locale) })
document.querySelector('#reset')?.addEventListener('click', () => cropper.reset())
document.querySelector('#fit')?.addEventListener('click', () => cropper.fit())
document.querySelector('#left')?.addEventListener('click', () => cropper.rotateLeft())
document.querySelector('#right')?.addEventListener('click', () => cropper.rotateRight())
document.querySelector('#flip')?.addEventListener('click', () => cropper.flipHorizontal())
document.querySelector('#export')?.addEventListener('click', () => { void renderPreview() })
cropper.addEventListener('ready', syncPreviewAndState)
cropper.addEventListener('change', syncPreviewAndState)
updateCopy('en')
