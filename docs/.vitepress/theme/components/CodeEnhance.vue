<script setup lang="ts">
import { onMounted, watch, nextTick } from 'vue'
import { useData } from 'vitepress'

/**
 * 代码块增强：语言标签 + 长代码块折叠
 *
 * 注：不再注入复制按钮，避免与浏览器扩展自带的复制功能重复。
 *
 * 文章正文是 markdown 渲染出来的，没法直接在 md 里写组件，
 * 所以这里在挂载后操作 DOM。路由切换后 DOM 会重建，需要重新处理。
 */

const { page } = useData()

/** 超过这个行数才折叠 */
const COLLAPSE_LINES = 24

function enhance() {
  const blocks = document.querySelectorAll<HTMLElement>(
    '.vp-doc div[class*="language-"]'
  )

  blocks.forEach((block) => {
    if (block.dataset.enhanced) return
    block.dataset.enhanced = 'true'

    // 语言标签
    const langClass = Array.from(block.classList).find((c) =>
      c.startsWith('language-')
    )
    if (langClass) {
      const label = document.createElement('span')
      label.className = 'code-lang'
      label.textContent = langClass.replace('language-', '')
      block.appendChild(label)
    }

    // 长代码块折叠
    const pre = block.querySelector('pre')
    const lines = pre?.textContent?.split('\n').length ?? 0
    if (lines > COLLAPSE_LINES) {
      block.classList.add('code-block--collapsed')
      const toggle = document.createElement('button')
      toggle.className = 'code-toggle'
      toggle.type = 'button'
      toggle.textContent = '展开全部'
      toggle.addEventListener('click', () => {
        const collapsed = block.classList.toggle('code-block--collapsed')
        toggle.textContent = collapsed ? '展开全部' : '收起'
        if (!collapsed) {
          block.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      })
      block.appendChild(toggle)
    }
  })
}

onMounted(() => nextTick(enhance))
watch(() => page.value.relativePath, () => nextTick(enhance))
</script>

<template>
  <!-- 纯 DOM 增强，无模板内容 -->
</template>
