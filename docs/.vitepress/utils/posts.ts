import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * 扫描 docs/posts/ 下的 Markdown，自动生成侧边栏。
 * 新增文章后不用再手动改 config.mts。
 *
 * 注意：扫描发生在 config 加载时。dev 模式下新增 .md 后，
 * 需要重启 dev server 才能在侧边栏看到它（文章列表不受影响，它走
 * data loader，支持热更新）。生产构建每次都重新加载 config，无此问题。
 */

const postsDir = fileURLToPath(new URL('../../posts', import.meta.url))

/**
 * 极简 frontmatter 解析，只取 key: value 形式，够用且不用额外装依赖。
 */
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

export interface PostItem {
  text: string
  link: string
  date: string
}

/** 读取全部文章（不含 index.md），按日期倒序 */
export function getPosts(): PostItem[] {
  const files = fs
    .readdirSync(postsDir)
    .filter((file) => file.endsWith('.md') && file !== 'index.md')

  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(postsDir, file), 'utf-8')
    const frontmatter = parseFrontmatter(raw)
    const slug = file.replace(/\.md$/, '')

    return {
      text: frontmatter.title || slug,
      link: `/posts/${slug}`,
      date: frontmatter.date || ''
    }
  })

  return posts.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return a.text.localeCompare(b.text)
  })
}

/** 生成「文章」分组的侧边栏 */
export function createPostsSidebar() {
  return [
    {
      text: '文章',
      items: [
        { text: '全部文章', link: '/posts/' },
        ...getPosts().map(({ text, link }) => ({ text, link }))
      ]
    }
  ]
}
