# CoverCropper

CoverCropper 是一个轻量开源的 **cover-safe 图片裁剪组件**。用户移动、缩放、旋转、翻转、拖动或缩放单张图片时，组件会持续保证裁剪区域不露白。

> Beta：当前版本为 `0.1.0-beta.0`，`1.0` 前 API 仍可能调整。

- 唯一真实实现是 `<cover-cropper>` Web Component。
- `@covercropper/core` 是纯 TypeScript，不依赖 DOM 或框架。
- React、Vue、Angular 包只转发属性、事件和方法，不重复裁剪逻辑。
- 内置英文和简体中文 UI 文案。
- V1 使用中性的 Shadow DOM 内置样式，不开放样式定制 API、slot、公共 CSS 变量或 `::part` 契约。

## 安装

```bash
pnpm add @covercropper/element@beta
pnpm add @covercropper/react@beta      # 可选
pnpm add @covercropper/vue@beta        # 可选
pnpm add @covercropper/angular@beta    # 可选
```

## Web Component 快速开始

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

## React / Vue / Angular

React、Vue、Angular 包均使用同一个 Web Component，只转发属性、事件和方法。示例见英文 README。

## 交互模型

- 默认拖拽模式是 `image`：拖动背景图。
- `selection` 模式拖动裁剪框。
- 四个角 handle 可自由调整裁剪框宽高，导出比例跟随当前裁剪框。
- 鼠标滚轮按指针位置优先缩放背景图。
- 底部旋转滑条范围是 `-180` 到 `180` 度，并在 90 度倍数附近吸附。
- 内置重置、适配、向左/向右旋转、水平翻转、完成/导出。
- Playground 中的导出预览会跟随裁剪状态实时更新。
- 所有交互都通过 core 的 cover 约束，保证裁剪区域不露白。

## API 摘要

属性：`src`、`aspectRatio`、`initialImageScale`、`value`、`readonly`、`disabled`、`locale`、`messages`。

方法：`getState`、`setState`、`reset`、`fit`、`setDragMode`、`rotateTo`、`rotateLeft`、`rotateRight`、`flipHorizontal`、`exportBlob`、`exportDataURL`。

事件：`ready`、`change`、`interaction-start`、`interaction-end`、`export`、`error`。

## Canvas 导出与 CORS

远程图片导出需要服务端 CORS 头，并设置：

```html
<cover-cropper src="https://example.com/image.jpg" cross-origin="anonymous"></cover-cropper>
```

如果图片污染了 canvas，导出方法会 reject，组件会触发本地化 `error` 事件。

许可证：MIT。
