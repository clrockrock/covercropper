import { Component, ViewChild } from '@angular/core'
import { CoverCropperComponent } from '@covercropper/angular'

@Component({
  standalone: true,
  imports: [CoverCropperComponent],
  template: '<cover-cropper-angular #cropper src="/cover.jpg" [aspectRatio]="16 / 9" (change)="onChange($event)" />'
})
export class AngularExample {
  @ViewChild('cropper') cropper?: CoverCropperComponent
  onChange(event: CustomEvent) {
    console.log(event.detail.state)
  }
}
