<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { data as posts } from '../posts.data'

/** 文章标题上方的元信息：日期 · 字数 · 阅读时长 */

const { page } = useData()

const current = computed(() => {
  const url = `/${page.value.relativePath.replace(/\.md$/, '')}`
  return posts.find((post) => post.url === url)
})
</script>

<template>
  <div v-if="current" class="article-meta">
    <span>{{ current.date }}</span>
    <span>约 {{ current.wordCount }} 字</span>
    <span>阅读约 {{ current.readingTime }} 分钟</span>
  </div>
</template>
