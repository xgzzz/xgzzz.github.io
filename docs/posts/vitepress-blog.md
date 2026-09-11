---
title: 用 VitePress 写博客
date: 2026-09-11
---

# 用 VitePress 写博客

VitePress 本来是给文档站用的，但它做博客同样舒服：Markdown 直写、默认主题好看、构建产物是纯静态 HTML。

## 目录结构

```
bearCookie/
├── package.json
└── docs/
    ├── .vitepress/config.mts   # 站点配置
    ├── index.md                # 首页（layout: home）
    ├── about.md
    └── posts/                  # 所有文章
        └── hello-world.md
```

## 三条命令

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 本地开发，热更新 |
| `npm run build` | 生成静态站点到 `docs/.vitepress/dist` |
| `npm run preview` | 本地预览构建结果 |

## 发布流程

推送到 Gitee → EdgeOne Makers 拉取代码 → 执行 `npm run build` → 发布 `docs/.vitepress/dist`。
