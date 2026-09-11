import { defineConfig } from 'vitepress'

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
    lineNumbers: true
  },
  themeConfig: {
    siteTitle: 'BearCookie',
    nav: [
      { text: '首页', link: '/' },
      { text: '文章', link: '/posts/' },
      { text: '关于', link: '/about' },
      { text: 'Gitee', link: 'https://gitee.com/xg-zhang' }
    ],
    sidebar: [
      {
        text: '文章',
        items: [
          { text: '全部文章', link: '/posts/' },
          { text: 'Hello World', link: '/posts/hello-world' },
          { text: '用 VitePress 写博客', link: '/posts/vitepress-blog' }
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
  }
})
