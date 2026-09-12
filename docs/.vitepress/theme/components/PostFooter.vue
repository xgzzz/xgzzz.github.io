<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import VisitorStats from './VisitorStats.vue'
import Comment from './Comment.vue'

/**
 * 挂在 doc-after 插槽，只在文章页显示（不含 /posts/ 列表页）。
 */
const { page } = useData()

const isPost = computed(() => {
  const path = page.value.relativePath
  return path.startsWith('posts/') && path !== 'posts/index.md'
})
</script>

<template>
  <div v-if="isPost">
    <VisitorStats />
    <Comment />
  </div>
</template>
