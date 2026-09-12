<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { data as posts } from '../posts.data'
import { slugify } from '../../utils/slugify'

/** 文章标签，点击跳到 /tags/ 页对应位置 */

const { page } = useData()

const tags = computed(() => {
  const url = `/${page.value.relativePath.replace(/\.md$/, '')}`
  return posts.find((post) => post.url === url)?.tags ?? []
})
</script>

<template>
  <div v-if="tags.length" class="post-tags">
    <a
      v-for="tag in tags"
      :key="tag"
      class="post-tag"
      :href="`/tags/#${slugify(tag)}`"
    >
      # {{ tag }}
    </a>
  </div>
</template>
