<script setup lang="ts">
import { computed } from 'vue'
import { data as posts } from '../posts.data'
import { slugify } from '../../utils/slugify'

/** 标签页：顶部标签云 + 每个标签下的文章列表 */

interface TagGroup {
  name: string
  slug: string
  count: number
  posts: typeof posts
}

const groups = computed<TagGroup[]>(() => {
  const map = new Map<string, typeof posts>()

  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      if (!map.has(tag)) map.set(tag, [])
      map.get(tag)!.push(post)
    })
  })

  return Array.from(map.entries())
    .map(([name, items]) => ({
      name,
      slug: slugify(name),
      count: items.length,
      posts: items
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
})
</script>

<template>
  <div>
    <p v-if="!groups.length" class="archive-summary">
      还没有标签，在文章的 frontmatter 里加 <code>tags: [xxx]</code> 即可。
    </p>

    <template v-else>
      <div class="post-tags">
        <a v-for="tag in groups" :key="tag.slug" class="post-tag" :href="`#${tag.slug}`">
          # {{ tag.name }} ({{ tag.count }})
        </a>
      </div>

      <div v-for="tag in groups" :key="tag.slug" class="tag-group">
        <h2 :id="tag.slug" class="archive-group-title"># {{ tag.name }}</h2>
        <a
          v-for="post in tag.posts"
          :key="post.url"
          :href="post.url"
          class="post-card archive-item"
        >
          <div class="post-card-title">{{ post.title }}</div>
          <div class="post-card-meta">{{ post.date }} · 约 {{ post.wordCount }} 字</div>
        </a>
      </div>
    </template>
  </div>
</template>
