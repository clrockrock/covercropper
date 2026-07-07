<script setup lang="ts">
import { ref } from 'vue'
import { CoverCropper, type CoverCropperElement, type CropperState } from '@covercropper/vue'

const sample = new URL('./sample.svg', import.meta.url).href
const cropper = ref<InstanceType<typeof CoverCropper> & CoverCropperElement>()
const state = ref<CropperState | null>(null)
const preview = ref('')

async function exportPreview() {
  preview.value = await cropper.value!.exportDataURL({ width: 1280, type: 'image/jpeg', quality: 0.9 })
}
</script>

<template>
  <main>
    <h1>CoverCropper Vue</h1>
    <CoverCropper ref="cropper" :src="sample" :aspect-ratio="16 / 9" :initial-image-scale="1.2" @update:model-value="state = $event" />
    <button @click="exportPreview">Export 1280px JPEG</button>
    <img v-if="preview" :src="preview" alt="Export preview" width="320" />
    <pre>{{ JSON.stringify(state, null, 2) }}</pre>
  </main>
</template>
