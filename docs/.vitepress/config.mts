import { defineConfig } from 'vitepress'
import tailwindcss from '@tailwindcss/vite'
import footnote from 'markdown-it-footnote'
import { createPostsSidebar } from './utils/posts'
import { slugify } from './utils/slugify'
import { SITE } from './site.config'

// 部署在根路径（如 https://xxx.edgeone.dev/）时保持 base: '/'
// 部署在子路径（如 https://example.com/blog/）时改成 '/blog/'
export default defineConfig({
  lang: 'zh-CN',
  title: 'BearCookie',
  description: '记录学习与思考',
  base: '/',
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#3451b2' }],
    // GSAP 动画由 HomeAnimation.vue / ScrollReveal.vue 在客户端接管。
    // 首屏 HTML 里这些内容是全亮的，等 JS 到位再重播会「闪一下」，
    // 所以在首次绘制前先挂上隐藏类把它们藏住（样式见 theme/style/doc.css）：
    //   .home-anim   → 首页英雄区和 feature 卡片
    //   .reveal-anim → 列表行、卡片、标签、关于页卡片
    // 组件把动画起始值写进行内样式后，会在同一帧摘掉对应的类。
    // 3s 定时器是兜底：万一 GSAP 没加载成功，也不会让内容一直空着。
    // prefers-reduced-motion 下直接不藏。
    // 类名必须和 theme/utils/animation.ts 里的 PENDING_*_CLASS 保持一致。
    [
      'script',
      {},
      `(function(){try{if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;var d=document.documentElement,c=['home-anim','reveal-anim'];for(var i=0;i<c.length;i++)d.classList.add(c[i]);setTimeout(function(){for(var i=0;i<c.length;i++)d.classList.remove(c[i])},3000)}catch(e){}})()`
    ]
  ],
  markdown: {
    lineNumbers: true,
    // 中文标题锚点转拼音，避免 URL 里出现一串 %E4%B8%AD...
    anchor: { slugify },
    // 图片原生懒加载
    image: { lazyLoading: true },
    config: (md) => {
      md.use(footnote)
    }
  },
  // 生成 sitemap.xml
  sitemap: {
    hostname: SITE.hostname
  },
  // canonical 链接 + Open Graph / Twitter Card，供爬虫和社交分享使用
  transformHead({ page, pageData }) {
    let path = page.replace(/\.md$/, '')
    if (path === 'index') path = ''
    else if (path.endsWith('/index')) path = `${path.slice(0, -'/index'.length)}/`

    const url = `${SITE.hostname}/${path}`
    const title = pageData.frontmatter.title || pageData.title
    const description = pageData.frontmatter.description || pageData.description
    const image = `${SITE.hostname}/og-image.jpg`

    return [
      ['link', { rel: 'canonical', href: url }],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:site_name', content: 'BearCookie' }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { property: 'og:image', content: image }],
      ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: description }],
      ['meta', { name: 'twitter:image', content: image }]
    ]
  },
  themeConfig: {
    siteTitle: 'BearCookie',
    nav: [
      { text: '首页', link: '/' },
      { text: '文章', link: '/posts/' },
      { text: '关于', link: '/about' },
      // Tailwind 示例页，照着写完新页面后可以把这一项和 docs/demo.md 一起删掉
      { text: '示例', link: '/demo' },
      { text: '在线小工具', link: '/tools' },
      { text: 'GitHub', link: 'https://github.com/xgzzz' }
    ],
    // 扫描 docs/posts/ 自动生成，新增文章无需改这里
    sidebar: [
      ...createPostsSidebar(),
      {
        text: '整理',
        items: [
          { text: '归档', link: '/archive' },
          { text: '标签', link: '/tags' }
        ]
      },
      {
        text: '关于',
        items: [{ text: '关于我', link: '/about' }]
      }
    ],
    outline: {
      level: [2, 3],
      label: '本页目录'
    },
    docFooter: {
      prev: '上一篇',
      next: '下一篇'
    },
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    sidebarMenuLabel: '目录',
    returnToTopLabel: '回到顶部',
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文章',
            buttonAriaLabel: '搜索文章'
          },
          modal: {
            noResultsText: '没有找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭'
            }
          }
        }
      }
    },
    footer: {
      message: '基于 VitePress 构建 · 源码托管于GitHub',
      copyright: 'Copyright © 2026-present xg-zhang'
    }
  },
  vite: {
    plugins: [tailwindcss()]
  }
})
