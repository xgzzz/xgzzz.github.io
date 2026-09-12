<script setup lang="ts">
import { onMounted, watch, nextTick } from 'vue'
import { useData } from 'vitepress'

/**
 * 代码块增强：语言标签 + 一键复制 + 长代码块折叠
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
    // 先清理本次会注入的元素。
    // 用清理代替「已处理」标记，保证 HMR 或重复执行时不会叠加出多个按钮。
    block
      .querySelectorAll('.code-lang, .code-copy, .code-toggle')
      .forEach((el) => el.remove())
    block.classList.remove('code-block--collapsed')

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

    // 一键复制
    // 若代码块里已经有别的按钮（某些浏览器扩展会注入复制按钮），就不再重复添加
    const hasOtherButton = Array.from(block.querySelectorAll('button')).some(
      (btn) => !btn.classList.contains('code-copy')
    )

    if (!hasOtherButton) {
      const copyBtn = document.createElement('button')
      copyBtn.className = 'code-copy'
      copyBtn.type = 'button'
      copyBtn.textContent = '复制'
      copyBtn.addEventListener('click', async () => {
        const code = block.querySelector('code')?.textContent ?? ''
        try {
          await navigator.clipboard.writeText(code)
        } catch {
          // 非 HTTPS 或旧浏览器下回退
          const textarea = document.createElement('textarea')
          textarea.value = code
          document.body.appendChild(textarea)
          textarea.select()
          document.execCommand('copy')
          textarea.remove()
        }
        copyBtn.textContent = '已复制'
        copyBtn.classList.add('copied')
        setTimeout(() => {
          copyBtn.textContent = '复制'
          copyBtn.classList.remove('copied')
        }, 1600)
      })
      block.appendChild(copyBtn)
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
