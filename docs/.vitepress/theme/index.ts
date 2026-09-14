import { h } from 'vue'
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import About from './components/About.vue'
import DakaBoard from './components/DakaBoard.vue'
import TwShowcase from './components/TwShowcase.vue'
import JianpuEditor from './components/JianpuEditor.vue'
import PostList from './components/PostList.vue'
import PostFooter from './components/PostFooter.vue'
import ArticleMeta from './components/ArticleMeta.vue'
import Archive from './components/Archive.vue'
import TagList from './components/TagList.vue'
import ReadingProgress from './components/ReadingProgress.vue'
import ThemeTransition from './components/ThemeTransition.vue'
import HomeAnimation from './components/HomeAnimation.vue'
import ScrollReveal from './components/ScrollReveal.vue'
// 必须在 DefaultTheme 之后引入，Tailwind 才能覆盖默认主题样式
import './style/tailwind.css'
// 文章页增强样式，依赖上面的加载顺序
import './style/doc.css'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      // 全站顶部阅读进度条 + 深浅色切换过渡
      // + 首页开场动画（只作用于首页英雄区）
      // + 列表 / 卡片的滚动揭示（各页面按需命中，与上面选择器不重叠）
      'layout-top': () => [
        h(ReadingProgress),
        h(ThemeTransition),
        h(HomeAnimation),
        h(ScrollReveal)
      ],
      // 文章标题上方：日期 / 字数 / 阅读时长
      'doc-before': () => h(ArticleMeta),
      // 文章页底部：统计、标签、版权、相关文章、评论
      'doc-after': () => h(PostFooter)
    })
  },
  enhanceApp({ app }) {
    app.component('About', About)
    app.component('DakaBoard', DakaBoard)
    app.component('TwShowcase', TwShowcase)
    app.component('JianpuEditor', JianpuEditor)
    app.component('PostList', PostList)
    app.component('Archive', Archive)
    app.component('TagList', TagList)
  }
} satisfies Theme
