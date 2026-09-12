---
title: 从零搭建 VitePress 博客并自动部署
date: 2026-09-12
---

# 从零搭建 VitePress 博客并自动部署

把 BearCookie 这个博客从空目录搭到能自动上线的全过程记录一下。整套方案不需要服务器、不需要数据库、不花一分钱，写完文章 `git push` 就完事。

如果你也想搭一个，照着这篇做一遍基本就能跑起来。

## 一、最终效果

- 纯静态站点，秒开，无需服务器
- Markdown 写作，push 之后自动构建发布
- 站内全文搜索（本地索引，离线可用）
- 深浅色主题切换
- 自定义主题组件 + Tailwind CSS
- 文章列表与侧边栏自动生成，新增文章只需丢一个 `.md`
- Giscus 评论（基于 GitHub Discussions，免费无广告）
- SEO：sitemap、canonical、Open Graph 分享卡片
- 访问统计
- 源码同时托管 Gitee 与 GitHub

**技术栈**：VitePress 1.6 · Vue 3 · Vite 5 · TypeScript · Tailwind CSS v4 · Node.js 22 · GitHub Actions

## 二、环境准备

VitePress 1.x 要求 Node 18+，Tailwind v4 要求 Node 20+，直接上 Node 22 一劳永逸：

```bash
node -v   # v22.x
npm -v
```

## 三、初始化项目

```bash
mkdir bearCookie && cd bearCookie
npm init -y
npm i -D vitepress
```

然后改 `package.json`，加上三个脚本和 `"type": "module"`：

```json
{
  "name": "bearcookie-blog",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vitepress dev docs",
    "build": "vitepress build docs",
    "preview": "vitepress preview docs"
  },
  "devDependencies": {
    "vitepress": "^1.6.4"
  }
}
```

三个命令的分工：

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 本地开发，热更新 |
| `npm run build` | 生成静态站点到 `docs/.vitepress/dist` |
| `npm run preview` | 本地预览构建产物 |

## 四、目录结构

```
bearCookie/
├── package.json
├── .github/
│   └── workflows/deploy.yml     # 自动构建部署
└── docs/                        # 站点根目录
    ├── .vitepress/
    │   ├── config.mts           # 站点配置
    │   ├── theme/               # 自定义主题（可选）
    │   ├── cache/               # 开发缓存，gitignore
    │   └── dist/                # 构建产物，gitignore
    ├── index.md                 # 首页
    ├── about.md                 # 关于我
    └── posts/                   # 文章
        ├── index.md
        └── hello-world.md
```

核心约定：**`docs/` 就是站点根目录**，`docs/.vitepress/` 放配置和主题，其余 md 文件按目录映射成 URL。

`.gitignore` 记得忽略产物：

```
node_modules
docs/.vitepress/cache
docs/.vitepress/dist
```

## 五、站点配置

`docs/.vitepress/config.mts` 是唯一的配置文件。挑几个关键项说：

```ts
import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'BearCookie',
  description: '记录学习与思考',
  base: '/',
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: '文章', link: '/posts/' }
    ],
    sidebar: [
      {
        text: '文章',
        items: [
          { text: '全部文章', link: '/posts/' },
          { text: 'Hello World', link: '/posts/hello-world' }
        ]
      }
    ],
    outline: { level: [2, 3], label: '本页目录' },
    search: { provider: 'local' }
  }
})
```

- `base`：部署在域名根目录就写 `'/'`。**如果部署在项目页（如 `username.github.io/blog/`），这里必须写 `'/blog/'`**，否则所有资源路径都会 404
- `cleanUrls: true`：URL 不带 `.html` 后缀
- `lastUpdated: true`：显示最后更新时间，依赖 git 提交历史（部署时有个坑，后面说）
- `search.provider: 'local'`：本地索引搜索，不依赖任何第三方服务

导航、侧边栏、搜索、页脚这些都能汉化，配置项直接写中文即可。

## 六、首页

首页用 `layout: home`，靠 frontmatter 驱动，不用写 HTML：

```md
---
layout: home

hero:
  name: BearCookie
  text: 记录学习与思考
  tagline: VitePress + Gitee + GitHub Pages，零成本上线
  actions:
    - theme: brand
      text: 开始阅读
      link: /posts/

features:
  - title: 极速
    details: 构建产物是纯静态页面，秒开，不需要服务器和数据库。
  - title: Markdown 写作
    details: 文章就是 .md 文件，写完 push 一下，网站自动更新。
---
```

## 七、写文章

在 `docs/posts/` 下新建 md，顶部加上 frontmatter：

```md
---
title: 文章标题
date: 2026-09-12
---

# 文章标题

正文……
```

两个细节：

1. **文件名就是 URL**。`docs/posts/hello-world.md` 对应 `/posts/hello-world`
2. 文件名尽量用英文加连字符，中文路径在部分平台会有编码问题

新增文章后，`docs/posts/index.md` 的列表和 `config.mts` 的 `sidebar` 也要跟着更新。手工改两处容易忘，第十二节会把它改成自动生成。

## 八、自定义主题

默认主题够用，但想做「关于我」这类个性化页面就得自己写组件。新建 `docs/.vitepress/theme/index.ts`：

```ts
import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import About from './components/About.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('About', About)
  }
} satisfies Theme
```

之后在 md 里直接用标签：

```md
---
title: 关于我
---

<About />
```

::: warning 不要漏掉 extends
自定义主题**必须** `extends: DefaultTheme`。一旦创建 `theme/index.ts`，VitePress 就完全用你的主题，不继承的话默认主题的样式和组件会全部消失，页面变成裸 HTML。
:::

组件里能用完整的 Vue 语法，数据写在组件里、文案写在 md 里，这个划分比较好维护。

## 九、接入 Tailwind CSS

后期要写很多自定义页面的话，Tailwind 能省不少事。

```bash
npm i -D tailwindcss @tailwindcss/vite
```

在 `config.mts` 里挂上插件：

```ts
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  }
})
```

新建 `docs/.vitepress/theme/style/tailwind.css`，**注意不要照抄官方文档的简写**：

```css
/* 不要写 @import 'tailwindcss'; */
@import 'tailwindcss/theme.css';
@import 'tailwindcss/utilities.css';

@variant dark (.dark &);

@theme {
  --color-bg: var(--vp-c-bg);
  --color-bg-soft: var(--vp-c-bg-soft);
  --color-text1: var(--vp-c-text-1);
  --color-text2: var(--vp-c-text-2);
  --color-border: var(--vp-c-border);
  --color-brand: var(--vp-c-brand-1);
}
```

这里有两个坑，都是踩过才发现的：

### 坑一：preflight 会破坏文章排版

`@import 'tailwindcss'` 简写会额外注入 preflight（基于 modern-normalize 的基础重置），把标题、列表、图片的默认样式清零，导致 `.vp-doc` 下的文章排版出问题。

**解法**：只导入 `theme.css` + `utilities.css`，保留 VitePress 自己的设计系统。

### 坑二：CSS 级联层会让工具类失效

VitePress 默认主题的样式**完全没有使用 `@layer`**。而 CSS 的级联规则是「未分层样式 > 分层样式」，所以一旦按常规写法声明：

```css
@layer theme, base, components, utilities;
@import 'tailwindcss/utilities.css' layer(utilities);
```

你写的 class 就会被 `.vp-doc h2` 这类规则整片盖掉，**看起来完全没生效**。

**解法**：不声明层，并把 `tailwind.css` 放在默认主题之后引入：

```ts
import DefaultTheme from 'vitepress/theme'
import './style/tailwind.css'   // 必须在 DefaultTheme 之后
```

这样 Tailwind 是未分层样式且排在后头，能正常覆盖。

### 顺带：让 dark: 跟随站点开关

VitePress 靠 `<html class="dark">` 切换深色，而 Tailwind 的 `dark:` 默认跟随系统 `prefers-color-scheme`。加上这一行才能联动：

```css
@variant dark (.dark &);
```

另外我还把 VitePress 的颜色变量映射成了 Tailwind 颜色，之后直接写 `text-text1`、`bg-bg-soft`、`border-border` 就能自动适配深浅色，不用逐个补 `dark:` 变体。

## 十、自动部署

### 开启 GitHub Pages

仓库 **Settings → Pages → Source**，选 **GitHub Actions**（不要用「Deploy from a branch」，那是给纯静态分支用的）。

### 编写 workflow

`.github/workflows/deploy.yml`：

```yaml
name: 构建并部署 VitePress 到 GitHub Pages

on:
  push:
    branches: [master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: 拉取代码
        uses: actions/checkout@v4
        with:
          # lastUpdated 需要完整的 git 历史才能取到每篇文档的真实提交时间
          fetch-depth: 0

      - name: 安装 Node
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: 配置 Pages
        uses: actions/configure-pages@v5

      - name: 安装依赖
        run: |
          npm config set registry https://registry.npmjs.org
          npm config set replace-registry-host always
          npm ci

      - name: 构建站点
        run: npm run build

      - name: 上传构建产物
        uses: actions/upload-pages-artifact@v3
        with:
          path: docs/.vitepress/dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: 部署到 GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

几个必须注意的点：

- **`fetch-depth: 0`**：`checkout` 默认只拉最近一次提交，`lastUpdated` 会全部显示成同一个时间。拉全量历史才能拿到每篇文章真实的提交时间
- **`npm ci` 而非 `npm install`**：严格按 lock 文件安装，保证本地和 CI 环境一致。所以 lock 文件一定要提交
- **registry 切换**：如果 lock 里记录的是国内镜像地址（比如 npmmirror），GitHub 的构建机在美国，直接拉会非常慢甚至超时。那两行 `npm config set` 就是把它改回官方源
- **`path: docs/.vitepress/dist`**：必须是这个路径，写错会上传空产物
- **`workflow_dispatch`**：加上它，之后可以在 Actions 页面手动触发部署

## 十一、同步到 Gitee

GitHub 在国内访问不稳定，顺手把源码镜像到 Gitee。给 `origin` 配两个 push 地址即可一次推送两处：

```bash
git remote add origin https://gitee.com/你的用户名/仓库名.git
git remote set-url --add origin git@github.com:你的用户名/仓库名.git

git push origin master   # 一次推两个仓库
```

部署只走 GitHub Actions，Gitee 纯粹作为源码备份和国内访问入口。

## 踩坑记录

**1. 右侧目录（outline）不出现**

VitePress 的目录是运行时扫描 `.VPDoc` 下所有带 `id` 的标题。自定义组件里的区块如果是 `div` 就不会被收录，改成真标题并加 id 才行：

```html
<h2 id="skills" class="section-title">技能栈</h2>
```

同时确认 frontmatter 里没有 `aside: false`。

**2. 锚点跳转后标题被导航栏盖住**

组件内的标题没有 VitePress 默认的 `scroll-margin-top`，需要手动加：

```css
scroll-margin-top: calc(var(--vp-nav-height) + 24px);
```

**3. 定位元素遮挡内容**

做了个渐变 banner + 负 margin 上移头像的设计，结果头像被 banner 盖住了。原因是 banner 用了 `position: relative`，而**定位元素的绘制层级高于普通流元素**。给头像容器抬高层级即可：

```css
.avatar-wrap {
  position: relative;
  z-index: 1;
}
```

**4. 本地 build 报删除 dist 失败**

VitePress 构建前会清空输出目录，某些环境（比如开了安全删除策略的 IDE）会拦截这个操作。这是环境问题，CI 上不受影响。手动删掉 `dist` 再构建即可。

## 十二、进阶优化

跑起来之后，还有几件事能明显提升体验。下面是本站已经实装的做法，可以照着加。

### 12.1 自动生成侧边栏和文章列表

前面说过，新增文章要同时改列表和侧边栏两处，很容易忘。这里把它们都改成自动的。

**侧边栏**：`config.mts` 是跑在 Node 里的，可以直接读文件系统。新建 `docs/.vitepress/utils/posts.ts`：

```ts
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const postsDir = fileURLToPath(new URL('../../posts', import.meta.url))

/** 极简 frontmatter 解析，只取 key: value，够用且不用装依赖 */
function parseFrontmatter(raw: string): Record<string, string> {
  const matched = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!matched) return {}

  const result: Record<string, string> = {}
  for (const line of matched[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (kv) result[kv[1]] = kv[2].replace(/^['"]|['"]$/g, '').trim()
  }
  return result
}

export function createPostsSidebar() {
  const files = fs
    .readdirSync(postsDir)
    .filter((file) => file.endsWith('.md') && file !== 'index.md')

  const posts = files
    .map((file) => {
      const frontmatter = parseFrontmatter(fs.readFileSync(path.join(postsDir, file), 'utf-8'))
      const slug = file.replace(/\.md$/, '')
      return {
        text: frontmatter.title || slug,
        link: `/posts/${slug}`,
        date: frontmatter.date || ''
      }
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  return [
    {
      text: '文章',
      items: [
        { text: '全部文章', link: '/posts/' },
        ...posts.map(({ text, link }) => ({ text, link }))
      ]
    }
  ]
}
```

然后 `config.mts` 里一行搞定：

```ts
sidebar: [
  ...createPostsSidebar(),
  { text: '关于', items: [{ text: '关于我', link: '/about' }] }
]
```

只取 `title` 和 `date`，正则足够了，不必为此引入 `gray-matter`。

**文章列表**：用 VitePress 官方的 data loader，构建时读取全部文章。新建 `docs/.vitepress/theme/posts.data.ts`：

```ts
import { createContentLoader } from 'vitepress'

export interface Post {
  title: string
  date: string
  url: string
}

declare const data: Post[]
export { data }

export default createContentLoader('posts/*.md', {
  transform(raw): Post[] {
    return raw
      // posts/index.md 是列表页本身，排除掉
      .filter(({ url }) => url !== '/posts/')
      .map(({ url, frontmatter }) => ({
        title: frontmatter.title || url,
        // YAML 会把 2026-09-12 解析成 Date，统一转回字符串
        date:
          frontmatter.date instanceof Date
            ? frontmatter.date.toISOString().slice(0, 10)
            : String(frontmatter.date ?? ''),
        url
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }
})
```

::: tip 日期的坑
YAML 里写的 `2026-09-12` 会被解析成 `Date` 对象而不是字符串，直接排序或渲染会得到一长串 UTC 时间。转换时统一用 `toISOString().slice(0, 10)`，避免时区偏移导致差一天。
:::

列表组件 `PostList.vue`：

```vue
<script setup lang="ts">
import { data as posts } from '../posts.data'
</script>

<template>
  <div class="mt-2">
    <a
      v-for="post in posts"
      :key="post.url"
      :href="post.url"
      class="group flex items-baseline justify-between gap-4 border-b border-border py-3 hover:border-brand"
    >
      <span class="text-[15px] font-medium text-text1 group-hover:text-brand">
        {{ post.title }}
      </span>
      <span class="shrink-0 font-mono text-[13px] text-text3">{{ post.date }}</span>
    </a>
  </div>
</template>
```

`docs/posts/index.md` 里放一个 `<PostList />` 就行。

::: tip 为什么颜色类写在 span 上
外层的 `a` 会命中 `.vp-doc a` 的样式，颜色类直接写在 `a` 上会被盖掉（第九节讲过的特异性和级联层问题）。挪到内层 `span` 就没事了。
:::

这样一来，新增文章真的只剩「丢一个 .md 进去」这一步。

::: warning dev 模式下要重启一下
侧边栏是在 config 加载时扫描生成的，而 VitePress 只在 config 文件变化时才重新加载它。所以本地 `npm run dev` 时，新增 `.md` 之后**需要重启 dev server** 才能在侧边栏看到新文章。

文章列表走的是 data loader，支持热更新，不受影响；生产构建每次都会重新加载 config，也不受影响。
:::

### 12.2 评论系统：Giscus

基于 GitHub Discussions，免费、无广告、评论数据存在自己的仓库里。

```bash
npm i @giscus/vue
```

**启用三步**：

1. 仓库 Settings → Features 勾选 **Discussions**
2. 打开 https://giscus.app/zh-CN 填仓库名，页面会自动生成 `repoId` 和 `categoryId`（同时会引导你安装 giscus App 授权）
3. 把值填进配置

我习惯把这类配置集中放一个文件，改起来不用翻代码。新建 `docs/.vitepress/site.config.ts`：

```ts
export const SITE = {
  /** 站点正式地址，用于 sitemap / canonical / og:url，末尾不要带斜杠 */
  hostname: 'https://xgzzz.github.io',

  giscus: {
    repo: 'xgzzz/xgzzz.github.io',
    repoId: '',
    category: 'Announcements',
    categoryId: '',
    lang: 'zh-CN'
  },

  vercount: true
}
```

组件 `Comment.vue`：

```vue
<script setup lang="ts">
import Giscus from '@giscus/vue'
import { useData } from 'vitepress'
import { SITE } from '../../site.config'

const { isDark } = useData()
</script>

<template>
  <div class="vp-tw mt-12 border-t border-border pt-8">
    <h2 class="mb-4 text-base font-semibold text-text1">评论</h2>
    <Giscus
      :repo="SITE.giscus.repo"
      :repo-id="SITE.giscus.repoId"
      :category="SITE.giscus.category"
      :category-id="SITE.giscus.categoryId"
      mapping="pathname"
      input-position="bottom"
      loading="lazy"
      :theme="isDark ? 'dark' : 'light'"
      :lang="SITE.giscus.lang"
    />
  </div>
</template>
```

主题用 `isDark` 绑定，站点切深色时评论框跟着变。

最后挂到文章页。`theme/index.ts` 里用 `doc-after` 插槽：

```ts
import { h } from 'vue'
import PostFooter from './components/PostFooter.vue'

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'doc-after': () => h(PostFooter)
    })
  },
  enhanceApp({ app }) {
    app.component('PostList', PostList)
  }
}
```

`PostFooter.vue` 里判断路径，只在文章页显示（列表页和关于页不显示）：

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

const { page } = useData()

const isPost = computed(() => {
  const path = page.value.relativePath
  return path.startsWith('posts/') && path !== 'posts/index.md'
})
</script>

<template>
  <div v-if="isPost">
    <VisitorStats />
    <Comment />
  </div>
</template>
```

### 12.3 SEO

三件事：sitemap、canonical、Open Graph。

**sitemap**：VitePress 内置，配个 hostname 就行，构建后自动产出 `sitemap.xml`：

```ts
sitemap: {
  hostname: SITE.hostname
}
```

**canonical 与 og 标签**：用 `transformHead` 按页面动态注入：

```ts
transformHead({ page, pageData }) {
  let path = page.replace(/\.md$/, '')
  if (path === 'index') path = ''
  else if (path.endsWith('/index')) path = `${path.slice(0, -'/index'.length)}/`

  const url = `${SITE.hostname}/${path}`
  const title = pageData.frontmatter.title || pageData.title
  const description = pageData.frontmatter.description || pageData.description
  const image = `${SITE.hostname}/og-image.png`

  return [
    ['link', { rel: 'canonical', href: url }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: url }],
    ['meta', { property: 'og:title', content: title }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:image', content: image }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }]
  ]
}
```

路径那几行是为了把 `index.md` 还原成 `/`、`posts/index.md` 还原成 `/posts/`，跟 `cleanUrls` 的实际 URL 对上。

**og:image**：放一张 1200×630 的图到 `docs/public/og-image.png`。`docs/public/` 下的文件会原样复制到产物根目录。

::: tip og:image 的两个要求
社交平台不认 SVG，必须是 png 或 jpg；1200×630 是各平台通用的尺寸。
:::

### 12.4 访问统计

不蒜子是老牌方案，但偶尔不稳定。我用的是 Vercount，国内可访问，用法几乎一样：

```vue
<script setup lang="ts">
import { onMounted } from 'vue'

let injected = false

function injectScript() {
  if (injected || document.getElementById('vercount-script')) return
  injected = true

  const script = document.createElement('script')
  script.id = 'vercount-script'
  script.defer = true
  script.src = 'https://events.vercount.one/js'
  document.head.appendChild(script)
}

onMounted(injectScript)
</script>

<template>
  <div class="flex gap-5 text-[13px] text-text3">
    <span>总访问 <span id="vercount_value_site_pv">-</span></span>
    <span>访客 <span id="vercount_value_site_uv">-</span></span>
    <span>本页 <span id="vercount_value_page_pv">-</span></span>
  </div>
</template>
```

脚本用 `injected` 标记保证只注入一次，避免路由切换时重复加载。

::: warning SPA 下的计数
VitePress 是单页应用，站内跳转不会重新触发统计脚本，数字要刷新页面才更新。这是预期行为，不是坏了。
:::

---

整套方案最爽的地方在于：**写作和发布之间只剩下一次 `git push`**。剩下的时间，用来写东西就好。
