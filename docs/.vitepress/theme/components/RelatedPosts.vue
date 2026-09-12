<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { data as posts } from '../posts.data'

/** 文末相关文章：优先按共同标签排序，没有标签时退化为最新文章 */

const { page } = useData()

const related = computed(() => {
  const url = `/${page.value.relativePath.replace(/\.md$/, '')}`
  const current = posts.find((post) => post.url === url)
  if (!current) return []

  const others = posts.filter((post) => post.url !== url)

  const scored = others
    .map((post) => ({
      post,
      score: post.tags.filter((tag) => current.tags.includes(tag)).length
    }))
    .filter((item) => item.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score || (a.post.date < b.post.date ? 1 : -1)
    )
    .slice(0, 3)

  if (scored.length) return scored.map((item) => item.post)

  // 没有共同标签，就推荐最新的几篇
  return [...others]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 3)
})
</script>

<template>
  <div v-if="related.length" class="related-posts">
    <h2 id="related" class="section-heading">相关文章</h2>
    <div class="post-card-grid">
      <a v-for="post in related" :key="post.url" :href="post.url" class="post-card">
        <div class="post-card-title">{{ post.title }}</div>
        <div class="post-card-meta">
          {{ post.date }}
          <template v-if="post.tags.length"> · {{ post.tags.join(' / ') }}</template>
        </div>
      </a>
    </div>
  </div>
</template>
