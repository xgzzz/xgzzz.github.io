import { createContentLoader } from 'vitepress'

/**
 * 构建时读取 docs/posts/ 下所有文章，供列表页、归档页、标签页、元信息使用。
 * 官方文档：https://vitepress.dev/zh/guide/data-loading
 */

export interface Post {
  title: string
  date: string
  url: string
  tags: string[]
  excerpt: string
  wordCount: number
  readingTime: number
}

/** YAML 会把 2026-09-12 解析成 Date，统一转回字符串 */
function toDateString(value: unknown): string {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value)
}

/** 粗略剥离 Markdown 标记，只为了统计字数 */
function stripMarkdown(src: string): string {
  return src
    .replace(/^---[\s\S]*?---/, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~|]/g, ' ')
}

/** 中文按字算，英文按词算 */
function countWords(text: string): number {
  const chinese = text.match(/[\u4e00-\u9fa5]/g)?.length ?? 0
  const words = text.match(/[a-zA-Z0-9]+/g)?.length ?? 0
  return chinese + words
}

declare const data: Post[]
export { data }

export default createContentLoader('posts/*.md', {
  includeSrc: true,
  transform(raw): Post[] {
    return raw
      // posts/index.md 是列表页本身，排除掉
      .filter(({ url }) => url !== '/posts/')
      .map(({ url, frontmatter, src }) => {
        const text = src ? stripMarkdown(src) : ''
        const wordCount = countWords(text)

        return {
          title: frontmatter.title || url,
          date: toDateString(frontmatter.date),
          url,
          tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
          excerpt: frontmatter.description || text.trim().slice(0, 110),
          wordCount,
          // 中文阅读速度按 350 字/分钟估算
          readingTime: Math.max(1, Math.round(wordCount / 350))
        }
      })
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  }
})
