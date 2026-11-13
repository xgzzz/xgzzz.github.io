<script setup lang="ts">
import { data as posts } from '../posts.data'

/**
 * 全部文章列表。
 *
 * 与归档、标签页共用同一套 .post-card 视觉和 .post-grid 网格，
 * 避免同样内容的列表在不同页面长得不一样。
 *
 * 数据由 posts.data.ts 在构建时生成，新增文章无需改这里。
 */
</script>

<template>
  <p class="bc-stats">
    <span>共 <b>{{ posts.length }}</b> 篇</span>
    <template v-if="posts.length">
      <span class="bc-sep">/</span>
      <span>最近更新 <b>{{ posts[0].date }}</b></span>
    </template>
  </p>

  <div class="post-grid">
    <a
      v-for="post in posts"
      :key="post.url"
      :href="post.url"
      class="post-card post-list-item"
    >
      <div class="post-card-title">{{ post.title }}</div>

      <p v-if="post.excerpt" class="post-card-excerpt">{{ post.excerpt }}</p>

      <div class="post-card-meta">
        {{ post.date }} · 约 {{ post.readingTime }} 分钟<template
          v-if="post.tags.length"
        >
          · {{ post.tags.slice(0, 3).join(' / ') }}</template
        >
      </div>
    </a>
  </div>
</template>
