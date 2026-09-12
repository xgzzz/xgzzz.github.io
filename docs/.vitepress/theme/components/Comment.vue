<script setup lang="ts">
import { computed } from 'vue'
import Giscus from '@giscus/vue'
import { useData } from 'vitepress'
import { SITE } from '../../site.config'

const { isDark } = useData()

// repoId / categoryId 没填就不渲染，避免线上出现报错的空壳
const enabled = computed(
  () => Boolean(SITE.giscus.repo && SITE.giscus.repoId && SITE.giscus.categoryId)
)
</script>

<template>
  <div class="vp-tw mt-12 border-t border-border pt-8">
    <h2 class="mb-4 text-base font-semibold text-text1">评论</h2>

    <Giscus
      v-if="enabled"
      :repo="SITE.giscus.repo"
      :repo-id="SITE.giscus.repoId"
      :category="SITE.giscus.category"
      :category-id="SITE.giscus.categoryId"
      mapping="pathname"
      strict="0"
      reactions-enabled="1"
      emit-metadata="0"
      input-position="bottom"
      loading="lazy"
      :theme="isDark ? 'dark' : 'light'"
      :lang="SITE.giscus.lang"
    />

    <p
      v-else
      class="rounded-xl border border-dashed border-border p-4 text-sm leading-6 text-text2"
    >
      评论功能未启用：到 <code class="font-mono text-brand">site.config.ts</code> 填入
      giscus 的 <code class="font-mono text-brand">repoId</code> 与
      <code class="font-mono text-brand">categoryId</code> 即可，获取方式见该文件注释。
    </p>
  </div>
</template>
