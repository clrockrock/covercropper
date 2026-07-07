import { useRef, useState } from 'react'
import { CoverCropper, type CoverCropperHandle, type CropperState } from '@covercropper/react'

const sample = new URL('./sample.svg', import.meta.url).href

export function App() {
  const cropper = useRef<CoverCropperHandle>(null)
  const [state, setState] = useState<CropperState | null>(null)
  const [preview, setPreview] = useState('')

  async function exportPreview() {
    setPreview(await cropper.current!.exportDataURL({ width: 1280, type: 'image/jpeg', quality: 0.9 }))
  }

  return (
    <main>
      <h1>CoverCropper React</h1>
      <CoverCropper ref={cropper} src={sample} aspectRatio={16 / 9} initialImageScale={1.2} onChange={(event) => setState(event.detail.state)} />
      <button onClick={exportPreview}>Export 1280px JPEG</button>
      {preview && <img src={preview} alt="Export preview" width={320} />}
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </main>
  )
}
