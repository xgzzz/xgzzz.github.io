import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import About from './components/About.vue'
import TwShowcase from './components/TwShowcase.vue'
// 必须在 DefaultTheme 之后引入，Tailwind 才能覆盖默认主题样式
import './style/tailwind.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('About', About)
    app.component('TwShowcase', TwShowcase)
  }
} satisfies Theme
