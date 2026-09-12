<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'

/** 顶部阅读进度条 */

const progress = ref(0)

function update() {
  const doc = document.documentElement
  const total = doc.scrollHeight - doc.clientHeight
  progress.value = total > 0 ? Math.min(1, doc.scrollTop / total) : 0
}

onMounted(() => {
  update()
  window.addEventListener('scroll', update, { passive: true })
  window.addEventListener('resize', update)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', update)
  window.removeEventListener('resize', update)
})
</script>

<template>
  <div
    class="reading-progress"
    :style="{ transform: `scaleX(${progress})` }"
    aria-hidden="true"
  />
</template>
