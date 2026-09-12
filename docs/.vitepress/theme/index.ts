import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import About from './components/About.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('About', About)
  }
} satisfies Theme
