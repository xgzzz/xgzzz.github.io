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
    ['meta', { name: 'theme-color', content: '#3451b2' }]
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
      { text: 'Gitee', link: 'https://gitee.com/xg-zhang' },
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
      message: '基于 VitePress 构建 · 源码托管于 Gitee / GitHub',
      copyright: 'Copyright © 2026-present xg-zhang'
    }
  },
  vite: {
    plugins: [tailwindcss()]
  }
})
