import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import About from './components/About.vue'
import TwShowcase from './components/TwShowcase.vue'
import PostList from './components/PostList.vue'
import PostFooter from './components/PostFooter.vue'
// 必须在 DefaultTheme 之后引入，Tailwind 才能覆盖默认主题样式
import './style/tailwind.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      // 文章页底部：访问统计 + Giscus 评论
      'doc-after': () => h(PostFooter)
    })
  },
  enhanceApp({ app }) {
    app.component('About', About)
    app.component('TwShowcase', TwShowcase)
    app.component('PostList', PostList)
  }
} satisfies Theme
