import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

const source = readFileSync(join(process.cwd(), 'packages/react/src/index.tsx'), 'utf8')

const cropLogicSymbols = [
  'dragImage',
  'dragSelection',
  'resizeSelectionFromCorner',
  'zoomImage',
  'rotateImageTo',
  'initializeCropperState',
  'getExportRenderPlan',
  'drawToCanvas'
]

describe('@covercropper/react wrapper forwarding contract', () => {
  it('uses the Web Component as the single implementation and does not duplicate crop logic', () => {
    expect(source).toContain("import '@covercropper/element'")
    expect(source).not.toContain("from '@covercropper/core'")
    for (const symbol of cropLogicSymbols) expect(source).not.toContain(symbol)
    expect(source).toContain("React.createElement('cover-cropper'")
  })

  it('forwards props, events and imperative methods to the element', () => {
    for (const assignment of ['element.src', 'element.aspectRatio', 'element.initialImageScale', 'element.crossOrigin', 'element.readonly', 'element.disabled', 'element.value']) {
      expect(source).toContain(assignment)
    }
    for (const call of ['element.setDragMode(dragMode)', 'element.locale = locale', 'element.messages = messages']) {
      expect(source).toContain(call)
    }
    for (const eventName of ['ready', 'change', 'interaction-start', 'interaction-end', 'export', 'error']) {
      expect(source).toContain(`['${eventName}'`)
    }
    for (const method of ['getState', 'setState', 'reset', 'fit', 'setDragMode', 'rotateTo', 'rotateLeft', 'rotateRight', 'flipHorizontal', 'exportBlob', 'exportDataURL']) {
      expect(source).toContain(`${method}:`)
    }
  })
})
