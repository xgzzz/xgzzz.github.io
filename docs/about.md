---
title: 关于我
---

<About />

## 这个站点

用 [VitePress](https://vitepress.dev) 搭建，源码托管在GitHub，构建产物发布到 GitHub Pages。

- 文章写在 `docs/posts/` 下，一个 Markdown 就是一篇
- 推送到 `master` 后，GitHub Actions 自动构建并发布
- 站内搜索用的是本地索引，不依赖任何第三方服务

::: tip 想改这块内容？
页面顶部名片的信息（头像、简介、技能、历程）都在
`docs/.vitepress/theme/components/About.vue` 顶部的 `profile` 对象里；
下面这些文字直接在 `docs/about.md` 里改就行。
:::
