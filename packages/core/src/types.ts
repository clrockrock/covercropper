export type LocaleCode = 'en' | 'zh-CN'
export type DragMode = 'image' | 'selection'
export type ResizeCorner = 'nw' | 'ne' | 'sw' | 'se'

export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Rect extends Point, Size {}

export interface CropperState {
  image: {
    naturalWidth: number
    naturalHeight: number
  }
  stage: Size
  imageTransform: {
    /** Image center x in stage coordinates. */
    x: number
    /** Image center y in stage coordinates. */
    y: number
    /** Rendered-pixel scale per natural image pixel. */
    scale: number
    /** Degrees, normalized to [-180, 180]. */
    rotation: number
    flipX: boolean
    flipY: boolean
  }
  selection: Rect & {
    aspectRatio: number
  }
}

export interface CropperOptions {
  naturalWidth: number
  naturalHeight: number
  stageWidth: number
  stageHeight: number
  aspectRatio: number
  initialImageScale?: number
  minSelectionWidth?: number
  minSelectionHeight?: number
  maxImageScale?: number
  rotationSnapStep?: number
  rotationSnapThreshold?: number
}

export interface ConstraintOptions {
  minSelectionWidth?: number
  minSelectionHeight?: number
  maxImageScale?: number
  rotationSnapStep?: number
  rotationSnapThreshold?: number
}

export interface RotationOptions extends ConstraintOptions {
  rotationBaseState?: CropperState
}

export interface ExportOptions {
  type?: string
  quality?: number
  width?: number
  height?: number
  pixelRatio?: number
}

export interface CropperMessages {
  toolbar: {
    moveImage: string
    dragSelection: string
    reset: string
    fit: string
    rotateLeft: string
    rotateRight: string
    flipHorizontal: string
    done: string
  }
  status: {
    rotation: string
    scale: string
    dragMode: string
    loading: string
  }
  aria: {
    stage: string
    selection: string
    resizeNorthWest: string
    resizeNorthEast: string
    resizeSouthWest: string
    resizeSouthEast: string
    rotationSlider: string
    exportPreview: string
  }
  errors: {
    invalidAspectRatio: string
    invalidImageSize: string
    imageLoadFailed: string
    exportFailed: string
    canvasUnsupported: string
    stateRequired: string
  }
}

export type CropperMessagesOverride = {
  [Group in keyof CropperMessages]?: Partial<CropperMessages[Group]>
}

export interface ExportRenderPlan {
  width: number
  height: number
  scaleX: number
  scaleY: number
  selection: Rect
  imageTransform: CropperState['imageTransform']
  image: CropperState['image']
}
