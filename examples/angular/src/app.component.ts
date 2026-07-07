import { Component, ViewChild } from '@angular/core'
import { CommonModule } from '@angular/common'
import { CoverCropperComponent, type CropperState } from '@covercropper/angular'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, CoverCropperComponent],
  template: `
    <main>
      <h1>CoverCropper Angular</h1>
      <cover-cropper-angular #cropper [src]="sample" [aspectRatio]="16 / 9" [initialImageScale]="1.2" (valueChange)="state = $event" />
      <button type="button" (click)="exportPreview()">Export 1280px JPEG</button>
      <img *ngIf="preview" [src]="preview" alt="Export preview" width="320" />
      <pre>{{ state | json }}</pre>
    </main>
  `
})
export class AppComponent {
  @ViewChild('cropper') cropper?: CoverCropperComponent
  readonly sample = new URL('./sample.svg', import.meta.url).href
  state: CropperState | null = null
  preview = ''

  async exportPreview(): Promise<void> {
    this.preview = await this.cropper!.exportDataURL({ width: 1280, type: 'image/jpeg', quality: 0.9 })
  }
}
