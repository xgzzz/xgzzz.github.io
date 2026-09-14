<script setup lang="ts">
/**
 * ┌──────────────────────────────────────────────┐
 * │  改这一个 profile 对象，就能更新「关于我」页面  │
 * └──────────────────────────────────────────────┘
 */
const profile = {
  name: 'BearCookie',
  initials: 'BC',
  // 头像图片地址；留空则显示上面的首字母。
  // 例：'/avatar.png'（放在 docs/public/ 下）或 'https://github.com/xgzzz.png'
  avatar: '',
  slogan: '记录学习与思考',
  bio: '一名正在成长中的开发者。这里记录我踩过的坑、学到的东西，以及偶尔冒出来的一些想法。写得慢，但会一直写下去。',
  meta: [
    { icon: 'pin', text: '中国', link: '' },
    { icon: 'mail', text: 'xgzhang0626@gmail.com', link: 'mailto:xgzhang0626@gmail.com' }
  ],
  links: [
    { icon: 'github', label: 'GitHub', url: 'https://github.com/xgzzz' },
    { icon: 'globe', label: 'Gitee', url: 'https://gitee.com/xg-zhang' },
    { icon: 'mail', label: '邮箱', url: 'mailto:xgzhang0626@gmail.com' }
  ],
  // 本站实际使用的技术栈
  skills: [
    { title: '站点', items: ['VitePress', 'Vue 3', 'Vite'] },
    { title: '语言', items: ['TypeScript', 'Markdown', 'CSS'] },
    { title: '样式', items: ['Tailwind CSS v4'] },
    { title: '工程', items: ['Node.js', 'Git', 'GitHub Actions'] }
  ],
  timeline: [
    { time: '2026', title: '搭起 BearCookie 博客', desc: 'VitePress + GitHub Actions + Pages，零成本上线。' },
    { time: '202x', title: '开始码农之路', desc: '都学一点都做一点。' }
  ]
}

const icons: Record<string, string> = {
  github:
    '<path stroke="none" fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>',
  globe:
    '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18"/>',
  mail: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="m2.5 7.5 9.5 6 9.5-6"/>',
  pin: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>'
}

function icon(key: string) {
  return icons[key] || icons.globe
}
</script>

<template>
  <div class="about">
    <!-- 个人名片 -->
    <div class="card hero">
      <div class="banner" />

      <div class="avatar-wrap">
        <div class="avatar">
          <img v-if="profile.avatar" :src="profile.avatar" :alt="profile.name" />
          <span v-else>{{ profile.initials }}</span>
        </div>
      </div>

      <div class="name">{{ profile.name }}</div>
      <div class="slogan">{{ profile.slogan }}</div>
      <div class="bio">{{ profile.bio }}</div>

      <div class="meta">
        <template v-for="(m, i) in profile.meta" :key="i">
          <a v-if="m.link" class="meta-item" :href="m.link">
            <svg class="icon" viewBox="0 0 24 24" v-html="icon(m.icon)" />
            <span>{{ m.text }}</span>
          </a>
          <span v-else class="meta-item">
            <svg class="icon" viewBox="0 0 24 24" v-html="icon(m.icon)" />
            <span>{{ m.text }}</span>
          </span>
        </template>
      </div>

      <div class="links">
        <a
          v-for="l in profile.links"
          :key="l.url"
          class="link"
          :href="l.url"
          target="_blank"
          rel="noopener"
        >
          <svg class="icon" viewBox="0 0 24 24" v-html="icon(l.icon)" />
          <span>{{ l.label }}</span>
        </a>
      </div>
    </div>

    <!-- 技能 -->
    <div class="card section">
      <h2 id="skills" class="section-title">技能栈</h2>
      <div v-for="g in profile.skills" :key="g.title" class="skill-group">
        <div class="skill-title">{{ g.title }}</div>
        <div class="tags">
          <span v-for="s in g.items" :key="s" class="tag">{{ s }}</span>
        </div>
      </div>
    </div>

    <!-- 时间线 -->
    <div class="card section">
      <h2 id="journey" class="section-title">历程</h2>
      <div class="timeline">
        <div v-for="t in profile.timeline" :key="t.time + t.title" class="tl-item">
          <div class="tl-time">{{ t.time }}</div>
          <div class="tl-title">{{ t.title }}</div>
          <div class="tl-desc">{{ t.desc }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 8px 0 8px;
}

.card {
  border: 1px solid var(--vp-c-border);
  border-radius: 16px;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
  transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
}
.card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: var(--vp-shadow-3);
}

/* ---------- 名片 ---------- */
.hero {
  text-align: center;
  padding-bottom: 28px;
}

.banner {
  position: relative;
  height: 112px;
  background: linear-gradient(120deg, var(--vp-c-brand-1), var(--vp-c-brand-3));
}
.banner::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(rgba(255, 255, 255, 0.35) 1px, transparent 1px);
  background-size: 14px 14px;
  opacity: 0.55;
}

.avatar-wrap {
  /* banner 是 relative 定位，绘制层级高于普通流元素，
     这里抬高层级，否则头像（及首字母）会被 banner 盖住 */
  position: relative;
  z-index: 1;
  margin-top: -46px;
}
.avatar {
  width: 92px;
  height: 92px;
  margin: 0 auto;
  border-radius: 50%;
  border: 4px solid var(--vp-c-bg);
  background: linear-gradient(135deg, var(--vp-c-brand-1), var(--vp-c-brand-3));
  color: #fff;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--vp-shadow-2);
  overflow: hidden;
  transition: transform 0.35s ease;
}
.avatar:hover {
  transform: scale(1.05) rotate(-4deg);
}
.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.name {
  margin-top: 14px;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--vp-c-text-1);
}
.slogan {
  margin-top: 4px;
  font-size: 15px;
  color: var(--vp-c-text-2);
}
.about .bio {
  max-width: 520px;
  margin: 16px auto 0;
  font-size: 15px;
  line-height: 1.8;
  color: var(--vp-c-text-2);
}

.meta {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin-top: 14px;
  font-size: 13px;
  color: var(--vp-c-text-3);
}
.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: inherit;
  text-decoration: none;
  transition: color 0.2s ease;
}
.about a.meta-item:hover {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.links {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}
.about a.link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 15px;
  border: 1px solid var(--vp-c-border);
  border-radius: 999px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font-size: 13px;
  text-decoration: none;
  transition: color 0.25s ease, background 0.25s ease, border-color 0.25s ease,
    transform 0.25s ease, box-shadow 0.25s ease;
}
.about a.link:hover {
  color: #fff;
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  transform: translateY(-2px);
  box-shadow: var(--vp-shadow-2);
  text-decoration: none;
}

.icon {
  width: 15px;
  height: 15px;
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* ---------- 通用区块 ---------- */
.section {
  padding: 22px 24px 24px;
}
/* h2 需要覆盖 .vp-doc h2 的边框/间距，并避开固定导航栏做锚点定位 */
.about h2.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  padding: 0;
  border-top: none;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: normal;
  color: var(--vp-c-text-1);
  scroll-margin-top: calc(var(--vp-nav-height) + 24px);
}
.section-title::before {
  content: '';
  width: 3px;
  height: 15px;
  border-radius: 2px;
  background: var(--vp-c-brand-1);
}

/* ---------- 技能 ---------- */
.skill-group {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
}
.skill-group:last-child {
  margin-bottom: 0;
}
.skill-title {
  flex: none;
  width: 44px;
  padding-top: 5px;
  font-size: 13px;
  color: var(--vp-c-text-3);
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tag {
  padding: 4px 11px;
  border-radius: 8px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  font-size: 13px;
  line-height: 1.5;
  transition: transform 0.2s ease;
}
.tag:hover {
  transform: translateY(-2px);
}

/* ---------- 时间线 ---------- */
.timeline {
  position: relative;
  padding-left: 22px;
}
.timeline::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 6px;
  bottom: 6px;
  width: 2px;
  border-radius: 2px;
  background: var(--vp-c-border);
}
.tl-item {
  position: relative;
  padding-bottom: 18px;
}
.tl-item:last-child {
  padding-bottom: 0;
}
.tl-item::before {
  content: '';
  position: absolute;
  left: -22px;
  top: 5px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--vp-c-bg);
  border: 2px solid var(--vp-c-brand-1);
}
.tl-time {
  font-size: 12px;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  font-family: var(--vp-font-family-mono);
}
.tl-title {
  margin-top: 3px;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}
.tl-desc {
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
}

@media (max-width: 640px) {
  .banner {
    height: 88px;
  }
  .avatar-wrap {
    margin-top: -38px;
  }
  .avatar {
    width: 76px;
    height: 76px;
    font-size: 26px;
  }
  .name {
    font-size: 22px;
  }
  .section {
    padding: 18px 18px 20px;
  }
}
</style>
