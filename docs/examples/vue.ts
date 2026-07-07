import { CoverCropper } from '@covercropper/vue'

export default {
  components: { CoverCropper },
  template: '<CoverCropper src="/cover.jpg" :aspect-ratio="16 / 9" @change="onChange" />',
  methods: {
    onChange(event: CustomEvent) {
      console.log(event.detail.state)
    }
  }
}
