import { useRef } from 'react'
import { CoverCropper, type CoverCropperHandle } from '@covercropper/react'

export function ReactExample() {
  const ref = useRef<CoverCropperHandle>(null)
  return <CoverCropper ref={ref} src="/cover.jpg" aspectRatio={16 / 9} onChange={(event) => console.log(event.detail.state)} />
}
