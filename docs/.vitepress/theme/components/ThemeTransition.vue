<script setup lang="ts">
import { watch } from 'vue'
import { useData } from 'vitepress'

/**
 * 深浅色切换时的过渡，避免瞬间白闪。
 * 只在切换的几百毫秒内给 html 挂上过渡类，平时不影响渲染性能。
 */

const { isDark } = useData()

watch(isDark, () => {
  const html = document.documentElement
  html.classList.add('theme-transition')
  window.setTimeout(() => {
    html.classList.remove('theme-transition')
  }, 320)
})
</script>

<template>
  <!-- 无渲染内容 -->
</template>
