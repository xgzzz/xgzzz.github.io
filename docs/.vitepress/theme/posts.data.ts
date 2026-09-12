import { createContentLoader } from 'vitepress'

/**
 * 构建时读取 docs/posts/ 下所有文章，供文章列表页使用。
 * 官方文档：https://vitepress.dev/zh/guide/data-loading
 */

export interface Post {
  title: string
  date: string
  url: string
}

/** YAML 会把 2026-09-12 解析成 Date，统一转回字符串 */
function toDateString(value: unknown): string {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value)
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
        date: toDateString(frontmatter.date),
        url
      }))
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
  }
})
