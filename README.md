# CoverCropper

CoverCropper is a lightweight open-source **cover-safe image cropper**. It lets users move, zoom, rotate, flip, drag, and resize one image while the crop selection always remains covered.

> Beta: `0.1.0-beta.0`. APIs may change before `1.0`.

- One true implementation: `<cover-cropper>` Web Component.
- `@covercropper/core` is pure TypeScript with no DOM or framework dependency.
- React, Vue, and Angular wrappers only forward props, events, and methods.
- Built-in English and Simplified Chinese UI copy.
- V1 ships neutral Shadow DOM styles and intentionally exposes no style customization API, slots, public CSS variables, or `::part` contract.

## Playground

Try it online: https://clrockrock.github.io/covercropper/

## Packages

```txt
@covercropper/core
@covercropper/element
@covercropper/react
@covercropper/vue
@covercropper/angular
```

## Install

```bash
pnpm add @covercropper/element@beta
pnpm add @covercropper/react@beta      # optional
pnpm add @covercropper/vue@beta        # optional
pnpm add @covercropper/angular@beta    # optional
```

## Web Component quick start

```ts
import '@covercropper/element'
```

```html
<cover-cropper src="/image.jpg" aspect-ratio="1.7777778" initial-image-scale="1.4"></cover-cropper>
<script type="module">
  const cropper = document.querySelector('cover-cropper')
  cropper.addEventListener('change', (event) => console.log(event.detail.state))
  const blob = await cropper.exportBlob({ width: 1280, type: 'image/jpeg', quality: 0.92 })
</script>
```

## React

```tsx
import { CoverCropper, type CoverCropperHandle } from '@covercropper/react'
import { useRef } from 'react'

export function Demo() {
  const ref = useRef<CoverCropperHandle>(null)
  return <CoverCropper ref={ref} src="/image.jpg" aspectRatio={16 / 9} onChange={(event) => console.log(event.detail.state)} />
}
```

## Vue

```vue
<script setup lang="ts">
import { CoverCropper } from '@covercropper/vue'
</script>

<template>
  <CoverCropper src="/image.jpg" :aspect-ratio="16 / 9" @change="event => console.log(event.detail.state)" />
</template>
```

## Angular

```ts
import { Component } from '@angular/core'
import { CoverCropperComponent } from '@covercropper/angular'

@Component({
  standalone: true,
  imports: [CoverCropperComponent],
  template: `<cover-cropper-angular src="/image.jpg" [aspectRatio]="16 / 9" (change)="onChange($event)" />`
})
export class DemoComponent {
  onChange(event: CustomEvent) {
    console.log(event.detail.state)
  }
}
```

## Interaction model

- Default drag mode is `image`: pointer drag moves the background image.
- `selection` drag mode moves the crop selection.
- Four corner handles freely resize the crop selection width and height; the export ratio follows the current selection.
- Mouse wheel zooms the image around the pointer when possible.
- The bottom rotation slider spans `-180` to `180` degrees and snaps near 90-degree multiples.
- Reset, fit, rotate left/right, flip horizontal, and done/export are built in.
- Playground export preview updates in real time while users edit the crop.
- All interactions call core cover constraints so the crop selection remains covered.

## API summary

```ts
src: string | File | Blob
aspectRatio: number
initialImageScale?: number
value?: CropperState
readonly?: boolean
disabled?: boolean
locale?: 'en' | 'zh-CN'
messages?: CropperMessagesOverride
```

```ts
getState(): CropperState
setState(state: CropperState): void
reset(): void
fit(): void
setDragMode(mode: 'image' | 'selection'): void
rotateTo(angle: number, animate?: boolean): void
rotateLeft(): void
rotateRight(): void
flipHorizontal(): void
exportBlob(options?: ExportOptions): Promise<Blob>
exportDataURL(options?: ExportOptions): Promise<string>
```

Events: `ready`, `change`, `interaction-start`, `interaction-end`, `export`, `error`.

## Canvas export and CORS

Remote image export requires CORS headers and `cross-origin="anonymous"`:

```html
<cover-cropper src="https://example.com/image.jpg" cross-origin="anonymous"></cover-cropper>
```

If the image taints the canvas, export methods reject and the component emits a localized `error` event.

## Development

```bash
pnpm install
pnpm build
pnpm test
pnpm --filter @covercropper/playground dev
```

License: MIT.
