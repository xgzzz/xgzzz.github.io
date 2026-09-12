<script setup lang="ts">
import { computed } from 'vue'
import { data as posts } from '../posts.data'

/** 归档页：按年月倒序分组 */

const groups = computed(() => {
  const map = new Map<string, typeof posts>()

  posts.forEach((post) => {
    const month = post.date.slice(0, 7) || '未标注日期'
    if (!map.has(month)) map.set(month, [])
    map.get(month)!.push(post)
  })

  return Array.from(map.entries())
    .map(([month, items]) => ({
      month,
      label: `${month.slice(0, 4)} 年 ${month.slice(5)} 月`,
      items
    }))
    .sort((a, b) => (a.month < b.month ? 1 : -1))
})

const total = computed(() => posts.length)
</script>

<template>
  <div>
    <p class="archive-summary">共 {{ total }} 篇文章</p>

    <div v-for="group in groups" :key="group.month">
      <h2 :id="group.month" class="archive-group-title">{{ group.label }}</h2>
      <a
        v-for="post in group.items"
        :key="post.url"
        :href="post.url"
        class="post-card archive-item"
      >
        <div class="post-card-title">{{ post.title }}</div>
        <div class="post-card-meta">
          {{ post.date }} · 约 {{ post.wordCount }} 字
          <template v-if="post.tags.length"> · {{ post.tags.join(' / ') }}</template>
        </div>
      </a>
    </div>
  </div>
</template>
