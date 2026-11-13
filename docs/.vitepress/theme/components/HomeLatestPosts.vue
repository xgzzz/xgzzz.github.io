<script setup lang="ts">
import { computed } from 'vue'
import { data as posts } from '../posts.data'

/**
 * 首页的「最新文章」。
 *
 * 复用列表页的 .post-card 与 .post-grid，首页和文章列表长得一致。
 * 只取最近 4 篇，避免首页过长；更多入口在右上角。
 */
const latest = computed(() => posts.slice(0, 4))
</script>

<template>
  <section class="home-latest">
    <div class="home-latest-head">
      <h2 class="home-latest-title">最新文章</h2>
      <a class="home-latest-more" href="/posts/">
        全部 {{ posts.length }} 篇 →
      </a>
    </div>

    <div class="post-grid">
      <a
        v-for="post in latest"
        :key="post.url"
        :href="post.url"
        class="post-card"
      >
        <div class="post-card-title">{{ post.title }}</div>
        <p v-if="post.excerpt" class="post-card-excerpt">{{ post.excerpt }}</p>
        <div class="post-card-meta">
          {{ post.date }} · 约 {{ post.readingTime }} 分钟
        </div>
      </a>
    </div>
  </section>
</template>

<style scoped>
.home-latest {
  margin-top: 44px;
}

.home-latest-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

/* 覆盖 .vp-doc h2 的默认上边框和间距 */
.home-latest .home-latest-title {
  margin: 0;
  padding: 0;
  border-top: none;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.5;
}

.home-latest-more {
  flex: none;
  font-size: 13px;
  color: var(--vp-c-text-3);
  text-decoration: none;
  transition: color var(--bc-ease);
}

.home-latest-more:hover {
  color: var(--vp-c-brand-1);
}
</style>
