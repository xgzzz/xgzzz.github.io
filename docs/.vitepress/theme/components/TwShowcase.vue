<script setup lang="ts">
/**
 * Tailwind 用法示例 —— 后期新页面可以直接照着这个结构改。
 *
 * 要点：
 * 1. 根元素加 class="vp-tw"：清除浏览器默认样式（因为没启用 preflight）
 * 2. 颜色优先用 text-text1 / bg-bg-soft / border-border / text-brand，
 *    它们是 tailwind.css 里映射好的 VitePress 变量，自动跟随深浅色
 * 3. 需要自定义深浅色差异时，再用 dark: 前缀
 */
const features = [
  { tag: 'Layout', title: '响应式网格', desc: 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' },
  { tag: 'Theme', title: '主题变量', desc: 'text-text1 / bg-bg-soft / border-border' },
  { tag: 'Dark', title: '暗色变体', desc: 'dark: 前缀跟随站点开关，而非系统偏好' },
  { tag: 'Motion', title: '悬停动效', desc: 'transition hover:-translate-y-0.5 hover:shadow-lg' },
  { tag: 'Type', title: '排版工具', desc: 'text-sm font-medium leading-6 tracking-tight' },
  { tag: 'Space', title: '间距圆角', desc: 'p-5 gap-4 rounded-2xl max-w-5xl mx-auto' }
]

const snippet = `<!-- docs/demo.md -->
---
layout: page
title: 示例页
---

<TwShowcase />

<!-- 或者直接在 markdown 里写 HTML + Tailwind -->
<div class="vp-tw mx-auto max-w-5xl px-6 py-10">
  <h1 class="text-3xl font-bold tracking-tight text-text1">标题</h1>
  <p class="mt-3 text-[15px] leading-7 text-text2">描述文字</p>
</div>`
</script>

<template>
  <section class="vp-tw mx-auto max-w-5xl px-6 py-10">
    <!-- 页头 -->
    <header class="mb-10">
      <span
        class="inline-flex items-center rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand"
      >
        layout: page
      </span>
      <h1 class="mt-4 text-3xl font-bold tracking-tight text-text1">Tailwind 示例页</h1>
      <p class="mt-3 max-w-2xl text-[15px] leading-7 text-text2">
        这是自定义页面的模板。当前页面不在 <code class="rounded bg-bg-soft px-1.5 py-0.5 font-mono text-[13px] text-brand">.vp-doc</code>
        容器内，所以 Tailwind 的 class 不会被 VitePress 的文章样式干扰，可以自由布局。
      </p>
      <div class="mt-6 flex flex-wrap gap-3">
        <a
          href="/posts/"
          class="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          去读文章
        </a>
        <a
          href="/about"
          class="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text1 transition hover:border-brand hover:text-brand"
        >
          关于我
        </a>
      </div>
    </header>

    <!-- 卡片网格 -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <article
        v-for="f in features"
        :key="f.title"
        class="rounded-2xl border border-border bg-bg-soft p-5 transition hover:-translate-y-0.5 hover:border-brand hover:shadow-lg"
      >
        <span class="inline-flex rounded-lg bg-brand-soft px-2 py-1 text-xs font-medium text-brand">
          {{ f.tag }}
        </span>
        <h3 class="mt-3 text-base font-semibold text-text1">{{ f.title }}</h3>
        <p class="mt-1.5 font-mono text-[13px] leading-6 text-text2">{{ f.desc }}</p>
      </article>
    </div>

    <!-- 深浅色两种写法对比 -->
    <div class="mt-10 grid gap-4 md:grid-cols-2">
      <div class="rounded-2xl border border-border bg-bg-soft p-5">
        <h3 class="text-sm font-semibold text-text1">写法一：用映射变量（推荐）</h3>
        <p class="mt-2 text-sm leading-6 text-text2">
          text-text1 / text-text2 / bg-bg-soft / border-border 都指向 VitePress 变量，
          切换深浅色时自动变色，不用写 dark:。
        </p>
      </div>
      <div class="rounded-2xl border border-border bg-white p-5 dark:bg-neutral-900">
        <h3 class="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          写法二：dark: 变体
        </h3>
        <p class="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-400">
          需要 tailwind.css 里的 @variant dark (.dark &amp;)，
          否则只跟随系统偏好、不跟随站点开关。
        </p>
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="mt-10 rounded-2xl border border-border p-5">
      <h3 class="text-sm font-semibold text-text1">怎么用</h3>
      <p class="mt-2 text-sm leading-6 text-text2">
        Vue 组件写在 <code class="rounded bg-bg-soft px-1.5 py-0.5 font-mono text-[13px] text-brand">docs/.vitepress/theme/components/</code>，
        在 <code class="rounded bg-bg-soft px-1.5 py-0.5 font-mono text-[13px] text-brand">theme/index.ts</code> 全局注册后，markdown 里直接用标签即可。
      </p>
      <pre
        class="mt-4 overflow-x-auto rounded-xl border border-border bg-bg-soft p-4 text-[13px] leading-6 text-text2"
      ><code>{{ snippet }}</code></pre>
    </div>
  </section>
</template>
