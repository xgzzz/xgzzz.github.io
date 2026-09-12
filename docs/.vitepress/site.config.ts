/**
 * 站点级配置 —— 改这一个文件即可，不必翻各处代码。
 */
export const SITE = {
  /** 站点正式访问地址，用于 sitemap / canonical / og:url。末尾不要带斜杠 */
  hostname: 'https://xgzzz.github.io',

  /** 作者名，显示在文末版权声明 */
  author: 'BearCookie',

  /**
   * Giscus 评论（基于 GitHub Discussions，免费无广告）
   *
   * 启用步骤：
   * 1. 仓库 Settings → Features 勾选 Discussions
   * 2. 打开 https://giscus.app/zh-CN 填写仓库，页面会自动生成 repoId / categoryId
   * 3. 把生成的值填到下面（repoId / categoryId 留空则评论不显示）
   */
  giscus: {
    repo: 'xgzzz/xgzzz.github.io',
    repoId: 'MDEwOlJlcG9zaXRvcnk5OTQ3NDM3OQ==',
    category: 'Announcements',
    categoryId: 'DIC_kwDOBe3by84DFbCV',
    lang: 'zh-CN'
  },

  /** 访问统计（Vercount），不需要就设为 false */
  vercount: true
}
