<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useData } from 'vitepress'
import mediumZoom from 'medium-zoom'

/**
 * 图片灯箱：点击文章里的图片可放大查看
 */

const { page } = useData()

let zoom: ReturnType<typeof mediumZoom> | null = null

function detach() {
  zoom?.detach()
  zoom = null
}

function setup() {
  detach()
  const images = document.querySelectorAll<HTMLImageElement>('.vp-doc img')
  if (images.length) {
    zoom = mediumZoom(images, { margin: 24 })
  }
}

onMounted(() => nextTick(setup))
watch(() => page.value.relativePath, () => nextTick(setup))
onBeforeUnmount(detach)
</script>

<template>
  <!-- 纯 DOM 增强，无模板内容 -->
</template>
