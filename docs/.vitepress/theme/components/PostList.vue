<script setup lang="ts">
import { data as posts } from '../posts.data'

/**
 * 文章列表由 posts.data.ts 在构建时自动生成，
 * 新增文章只要往 docs/posts/ 里丢 .md，这里和侧边栏都会自动更新。
 *
 * 颜色类写在内层 span 上：外层的 a 会命中 .vp-doc a 的样式，
 * 直接写在 a 上会被覆盖。
 */
</script>

<template>
  <div class="mt-2">
    <a
      v-for="post in posts"
      :key="post.url"
      :href="post.url"
      class="group flex items-baseline justify-between gap-4 border-b border-border py-3 transition last:border-b-0 hover:border-brand"
    >
      <span class="text-[15px] font-medium text-text1 transition group-hover:text-brand">
        {{ post.title }}
      </span>
      <span class="shrink-0 font-mono text-[13px] text-text3">{{ post.date }}</span>
    </a>
  </div>
</template>
