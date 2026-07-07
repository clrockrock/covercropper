# CoverCropper API / 接口

## State / 状态

```ts
interface CropperState {
  image: { naturalWidth: number; naturalHeight: number }
  stage: { width: number; height: number }
  imageTransform: { x: number; y: number; scale: number; rotation: number; flipX: boolean; flipY: boolean }
  selection: { x: number; y: number; width: number; height: number; aspectRatio: number }
}
```

`imageTransform.x/y` is the rendered image center in stage coordinates. `scale` is rendered pixels per natural image pixel. The selection is axis-aligned; the configured aspect ratio is used for initialization, then corner handles may freely resize width and height.

`imageTransform.x/y` 表示图片在舞台坐标中的中心点。`scale` 表示每个图片自然像素对应的渲染像素。裁剪框为轴对齐矩形；配置的比例用于初始化，之后四角 handle 可以自由调整宽高。

## Export options / 导出选项

```ts
interface ExportOptions {
  type?: string
  quality?: number
  width?: number
  height?: number
  pixelRatio?: number
}
```

If no width or height is provided, export size defaults to selection size multiplied by `pixelRatio`.

如果没有传入 `width` 或 `height`，默认导出尺寸为当前裁剪框尺寸乘以 `pixelRatio`。

## Locale override / 文案覆盖

```ts
messages?: {
  toolbar?: Partial<CropperMessages['toolbar']>
  status?: Partial<CropperMessages['status']>
  aria?: Partial<CropperMessages['aria']>
  errors?: Partial<CropperMessages['errors']>
}
```

Use `locale="en"` or `locale="zh-CN"`. Overrides are merged with the selected built-in locale.

使用 `locale="en"` 或 `locale="zh-CN"`。覆盖文案会与对应内置语言表合并。
