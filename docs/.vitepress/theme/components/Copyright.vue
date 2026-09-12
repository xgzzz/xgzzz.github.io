<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { SITE } from '../../site.config'

/** 文末版权声明，许可协议可在下面按需修改 */

const { page } = useData()

const url = computed(() => {
  const path = page.value.relativePath.replace(/\.md$/, '')
  return path === 'index' ? `${SITE.hostname}/` : `${SITE.hostname}/${path}`
})
</script>

<template>
  <div class="post-copyright">
    <div>
      <strong>作者</strong>：{{ SITE.author }}
    </div>
    <div>
      <strong>本文链接</strong>：<a :href="url">{{ url }}</a>
    </div>
    <div>
      <strong>版权声明</strong>：转载请注明作者及出处，商业用途请联系作者。
    </div>
  </div>
</template>
