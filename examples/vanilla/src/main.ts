import '@covercropper/element'
import type { CoverCropperElement } from '@covercropper/element'

const sample = new URL('./sample.svg', import.meta.url)
const cropper = document.querySelector<CoverCropperElement>('#cropper')!
const preview = document.querySelector<HTMLImageElement>('#preview')!

cropper.src = sample.href
cropper.addEventListener('change', (event) => console.log('state', event.detail.state))
document.querySelector('#export')?.addEventListener('click', async () => {
  preview.src = await cropper.exportDataURL({ width: 1280, type: 'image/jpeg', quality: 0.9 })
})
