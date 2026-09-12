<script setup lang="ts">
import { onMounted } from 'vue'
import { SITE } from '../../site.config'

/**
 * 访问统计（Vercount，免费、国内可访问，兼容不蒜子的用法）
 * 文档：https://vercount.one
 *
 * 注意：脚本只在首次挂载时注入一次。VitePress 是 SPA，
 * 站内跳转不会重新计数，刷新页面才会更新，这是预期行为。
 */

let injected = false

function injectScript() {
  if (injected || document.getElementById('vercount-script')) return
  injected = true

  const script = document.createElement('script')
  script.id = 'vercount-script'
  script.defer = true
  script.src = 'https://events.vercount.one/js'
  document.head.appendChild(script)
}

onMounted(injectScript)
</script>

<template>
  <div
    v-if="SITE.vercount"
    class="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-text3"
  >
    <span>总访问 <span id="vercount_value_site_pv">-</span></span>
    <span>访客 <span id="vercount_value_site_uv">-</span></span>
    <span>本页 <span id="vercount_value_page_pv">-</span></span>
  </div>
</template>
