export const styles = `
:host { display: block; box-sizing: border-box; min-width: 280px; color: #172033; font: 14px/1.4 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
*, *::before, *::after { box-sizing: border-box; }
.wrapper { display: grid; gap: 10px; width: 100%; border: 1px solid #d8dee8; border-radius: 12px; padding: 12px; background: #fff; }
.stage { position: relative; overflow: hidden; width: 100%; height: 420px; min-height: 260px; touch-action: none; user-select: none; border-radius: 10px; background: linear-gradient(45deg, #eef1f5 25%, transparent 25%), linear-gradient(-45deg, #eef1f5 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #eef1f5 75%), linear-gradient(-45deg, transparent 75%, #eef1f5 75%); background-color: #f8fafc; background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0; cursor: grab; }
.stage:active { cursor: grabbing; }
.stage[aria-disabled='true'] { opacity: 0.64; }
.image { position: absolute; max-width: none; max-height: none; pointer-events: none; user-select: none; transform-origin: 50% 50%; will-change: transform, left, top, width, height; }
.stage.is-animating .image, .stage.is-animating .selection { transition: left 180ms ease, top 180ms ease, width 180ms ease, height 180ms ease, transform 180ms ease; }
.selection { position: absolute; border: 2px solid #2563eb; outline: 1px solid rgb(255 255 255 / 0.95); outline-offset: -4px; box-shadow: 0 0 0 9999px rgb(15 23 42 / 0.54), 0 0 0 1px rgb(15 23 42 / 0.9), inset 0 0 0 1px rgb(255 255 255 / 0.95); cursor: move; touch-action: none; }
.selection::before, .selection::after { content: ''; position: absolute; inset: 33.333% 0 33.333% 0; border-top: 1px solid rgb(255 255 255 / 0.86); border-bottom: 1px solid rgb(255 255 255 / 0.86); filter: drop-shadow(0 0 1px rgb(15 23 42 / 0.9)); pointer-events: none; }
.selection::after { inset: 0 33.333% 0 33.333%; border: 0; border-left: 1px solid rgb(255 255 255 / 0.86); border-right: 1px solid rgb(255 255 255 / 0.86); }
.handle { position: absolute; width: 24px; height: 24px; border: 3px solid #fff; background: #2563eb; border-radius: 999px; box-shadow: 0 2px 8px rgb(15 23 42 / 0.45), 0 0 0 1px rgb(15 23 42 / 0.28); z-index: 2; }
.handle[data-corner='nw'] { left: -12px; top: -12px; cursor: nwse-resize; }
.handle[data-corner='ne'] { right: -12px; top: -12px; cursor: nesw-resize; }
.handle[data-corner='sw'] { left: -12px; bottom: -12px; cursor: nesw-resize; }
.handle[data-corner='se'] { right: -12px; bottom: -12px; cursor: nwse-resize; }
.toolbar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.toolbar button { border: 1px solid #cfd8e3; border-radius: 999px; background: #fff; color: #172033; padding: 7px 11px; font: inherit; cursor: pointer; }
.toolbar button:hover:not(:disabled), .toolbar button[aria-pressed='true'] { border-color: #2563eb; background: #eff6ff; color: #1d4ed8; }
.toolbar button:disabled, input:disabled { cursor: not-allowed; opacity: 0.55; }
.sliderRow { display: grid; grid-template-columns: auto minmax(120px, 1fr) auto; gap: 10px; align-items: center; }
.sliderRow input { width: 100%; }
.status { color: #475569; font-size: 12px; }
.loading, .error { position: absolute; inset: 0; z-index: 3; display: grid; place-items: center; padding: 16px; text-align: center; color: #475569; background: rgb(248 250 252 / 0.78); pointer-events: none; }
.loading[hidden], .error[hidden] { display: none; }
.error { color: #b91c1c; }
`
