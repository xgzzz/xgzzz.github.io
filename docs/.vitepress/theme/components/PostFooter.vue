<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import CodeEnhance from './CodeEnhance.vue'
import ImageZoom from './ImageZoom.vue'
import PostTags from './PostTags.vue'
import RelatedPosts from './RelatedPosts.vue'
import Copyright from './Copyright.vue'
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
    <!-- 代码块增强与图片灯箱：纯 DOM 操作，不渲染可见内容 -->
    <CodeEnhance />
    <ImageZoom />

    <VisitorStats />
    <PostTags />
    <Copyright />
    <RelatedPosts />
    <Comment />
  </div>
</template>
