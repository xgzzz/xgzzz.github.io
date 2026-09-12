import { pinyin } from 'pinyin-pro'

/**
 * 把中文标题转成拼音 slug，用于 URL 锚点。
 *
 * 默认行为下中文标题的锚点是一串 %E4%B8%AD... ，分享出去很难看。
 * 只在构建时执行（markdown-it-anchor / 组件内生成 id），不进客户端产物。
 */
export function slugify(text: string): string {
  // nonZh: 'consecutive' 让连续的非中文（如 VitePress）保持完整，不会被拆成单个字母
  const converted = pinyin(text, {
    toneType: 'none',
    nonZh: 'consecutive'
  }).toLowerCase()

  return (
    converted.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ||
    text.replace(/\s+/g, '-').toLowerCase()
  )
}
