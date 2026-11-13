<script setup lang="ts">
/**
 * 节日倒计时
 *
 * 左右切换多个节日，显示：
 * - 距离目标日期还有多少自然日
 * - 除去周末还有多少工作日（今天不算，目标日算）
 *
 * 日期一律按本地时区的 0 点计算，避免时区和时分误差。
 *
 * 数据来源分两类：
 * - 固定公历节日（元旦 / 劳动节 / 国庆 / 圣诞）：写 month + day，
 *   自动取「下一个还没过的年份」，所以不用每年手动更新。
 * - 农历等无法用公历推算的（春节）：用 dates 显式列出具体日期，
 *   过完之后自动从列表里移除。
 *
 * 想加节日，往 EVENTS 里加一条即可。
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

interface EventDef {
  name: string
  /** 固定公历节日的月份，1-12 */
  month?: number
  /** 固定公历节日的日 */
  day?: number
  /** 无法用公历推算的日期，格式 YYYY-MM-DD */
  dates?: string[]
}

interface CountdownItem {
  name: string
  target: Date
}

const EVENTS: EventDef[] = [
  { name: '元旦', month: 1, day: 1 },
  { name: '过年啦', dates: ['2027-02-05'] },
  { name: '劳动节', month: 5, day: 1 },
  { name: '国庆节', month: 10, day: 1 }
]

const DAY_MS = 86400000
/** 自动轮播间隔 */
const AUTO_PLAY_MS = 5000

/** 本地时区的当天 0 点 */
function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function parseDate(text: string) {
  const [y, m, d] = text.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * 解析某个事件「下一次」的日期。
 * 固定公历节日取今年；已经过了就顺延到明年。
 * 全部过期的返回 null，由调用方过滤掉。
 */
function nextDate(def: EventDef, today: Date): Date | null {
  if (def.dates?.length) {
    const upcoming = def.dates
      .map(parseDate)
      .filter((date) => date.getTime() >= today.getTime())
      .sort((a, b) => a.getTime() - b.getTime())
    return upcoming[0] ?? null
  }

  if (def.month && def.day) {
    const thisYear = new Date(today.getFullYear(), def.month - 1, def.day)
    return thisYear.getTime() >= today.getTime()
      ? thisYear
      : new Date(today.getFullYear() + 1, def.month - 1, def.day)
  }

  return null
}

/** 两个 0 点日期之间的自然日 */
function naturalDays(from: Date, to: Date) {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS)
}

/** 从明天开始、到目标日（含）之间的工作日，周六周日不算 */
function workdays(from: Date, to: Date) {
  let count = 0
  const cursor = new Date(from)
  cursor.setDate(cursor.getDate() + 1)
  while (cursor.getTime() <= to.getTime()) {
    const week = cursor.getDay()
    if (week !== 0 && week !== 6) count++
    cursor.setDate(cursor.getDate() + 1)
  }
  return count
}

const today = ref<Date | null>(null)
const index = ref(0)
const dir = ref<'left' | 'right'>('right')
const showWorkdays = ref(true)
const autoPlay = ref(true)
const panelOpen = ref(false)

/** 已解析出下一次日期的节日，按日期从近到远排序 */
const items = computed<CountdownItem[]>(() => {
  if (!today.value) return []
  return EVENTS.map((def) => {
    const target = nextDate(def, today.value as Date)
    return target ? { name: def.name, target } : null
  })
    .filter((item): item is CountdownItem => item !== null)
    .sort((a, b) => a.target.getTime() - b.target.getTime())
})

const current = computed(() => items.value[index.value] ?? null)

const days = computed(() =>
  current.value && today.value ? naturalDays(today.value, current.value.target) : 0
)

const work = computed(() =>
  current.value && today.value ? workdays(today.value, current.value.target) : 0
)

const dateText = computed(() => {
  const target = current.value?.target
  return target
    ? `${target.getFullYear()}年${target.getMonth() + 1}月${target.getDate()}日`
    : '--'
})

function go(step: number) {
  const total = items.value.length
  if (total < 2) return
  dir.value = step > 0 ? 'right' : 'left'
  index.value = (index.value + step + total) % total
}

function jump(next: number) {
  if (next === index.value || !items.value.length) return
  dir.value = next > index.value ? 'right' : 'left'
  index.value = next
}

/** 把 index 夹回合法范围：跨天刷新后条目数量可能变少 */
function clampIndex() {
  if (index.value >= items.value.length) index.value = 0
}

let clock: number | undefined
let carousel: number | undefined
let startX = 0

function syncToday() {
  const now = startOfDay(new Date())
  if (!today.value || today.value.getTime() !== now.getTime()) {
    today.value = now
    clampIndex()
  }
}

function onKeydown(event: KeyboardEvent) {
  const el = event.target as HTMLElement | null
  if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) {
    return
  }
  if (event.key === 'ArrowLeft') go(-1)
  else if (event.key === 'ArrowRight') go(1)
}

function onPointerDown(event: PointerEvent) {
  startX = event.clientX
}

function onPointerUp(event: PointerEvent) {
  const delta = event.clientX - startX
  if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1)
}

onMounted(() => {
  syncToday()
  // 每 30 秒检查一次是否跨天，跨天自动刷新天数
  clock = window.setInterval(syncToday, 30000)
  carousel = window.setInterval(() => {
    if (autoPlay.value && items.value.length > 1) go(1)
  }, AUTO_PLAY_MS)
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  if (clock) window.clearInterval(clock)
  if (carousel) window.clearInterval(carousel)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="cd-page">
    <div class="cd-stage">
      <button
        class="cd-arrow"
        type="button"
        aria-label="上一个"
        :disabled="items.length < 2"
        @click="go(-1)"
      >
        ‹
      </button>

      <div
        class="cd-card"
        @pointerdown="onPointerDown"
        @pointerup="onPointerUp"
      >
        <button
          class="cd-gear"
          type="button"
          aria-label="设置"
          :aria-expanded="panelOpen"
          :class="{ 'cd-gear-on': panelOpen }"
          @click="panelOpen = !panelOpen"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
            />
          </svg>
        </button>

        <Transition name="cd-fade">
          <div v-if="panelOpen" class="cd-panel">
            <label class="cd-option">
              <input v-model="showWorkdays" type="checkbox" />
              <span>显示工作日</span>
            </label>
            <label class="cd-option">
              <input v-model="autoPlay" type="checkbox" />
              <span>自动轮播</span>
            </label>
          </div>
        </Transition>

        <Transition :name="`cd-slide-${dir}`" mode="out-in">
          <div
            :key="current ? `${current.name}-${current.target.getTime()}` : 'loading'"
            class="cd-body"
            aria-live="polite"
          >
            <template v-if="current">
              <h2 class="cd-title">{{ current.name }}</h2>
              <p class="cd-sub">距离 {{ dateText }} 还有</p>
              <p class="cd-days">
                <span class="cd-num">{{ days }}</span>
                <span class="cd-unit">天</span>
              </p>
              <p class="cd-work" :class="{ 'cd-work-hide': !showWorkdays }">
                除去周末还有 {{ work }} 天
              </p>
            </template>
            <p v-else class="cd-loading">正在计算…</p>
          </div>
        </Transition>
      </div>

      <button
        class="cd-arrow"
        type="button"
        aria-label="下一个"
        :disabled="items.length < 2"
        @click="go(1)"
      >
        ›
      </button>
    </div>

    <div v-if="items.length > 1" class="cd-dots">
      <button
        v-for="(item, i) in items"
        :key="item.name"
        class="cd-dot"
        type="button"
        :class="{ 'cd-dot-on': i === index }"
        :aria-label="`切换到${item.name}`"
        @click="jump(i)"
      />
    </div>
  </div>
</template>

<style scoped>
.cd-page {
  /* 强调色。想换成截图里那种荧光绿，把这里改成 #00e676 即可 */
  --cd-accent: var(--vp-c-brand-1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  padding: 28px 24px 56px;
}

.cd-stage {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 540px;
}

.cd-card {
  position: relative;
  flex: 1;
  min-height: 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 34px 52px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 18px;
  background: var(--vp-c-bg-soft);
  box-shadow: var(--vp-shadow-2);
  overflow: hidden;
  touch-action: pan-y;
}

/* 顶部一层跟随主题色的柔光，给大数字一点氛围 */
.cd-card::before {
  content: '';
  position: absolute;
  top: -55%;
  left: 50%;
  width: 340px;
  height: 260px;
  transform: translateX(-50%);
  background: radial-gradient(
    circle,
    color-mix(in srgb, var(--cd-accent) 20%, transparent) 0%,
    transparent 70%
  );
  pointer-events: none;
}

.cd-body {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.cd-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--cd-accent);
}

.cd-sub {
  margin: 10px 0 0;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.cd-days {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  margin: 6px 0 0;
}

.cd-num {
  font-size: 76px;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  font-variant-numeric: tabular-nums;
  color: var(--cd-accent);
}

.cd-unit {
  font-size: 20px;
  font-weight: 600;
  color: var(--cd-accent);
}

.cd-work {
  margin: 10px 0 0;
  font-size: 14px;
  color: var(--vp-c-text-3);
  transition: opacity 0.2s ease;
}

/* 关掉工作日时不改变卡片高度，避免布局跳动 */
.cd-work-hide {
  opacity: 0;
}

.cd-loading {
  margin: 0;
  font-size: 14px;
  color: var(--vp-c-text-3);
}

.cd-arrow {
  flex: none;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  padding-bottom: 3px;
  font-size: 24px;
  line-height: 1;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease, background-color 0.2s ease;
}

.cd-arrow:hover:not(:disabled) {
  color: var(--cd-accent);
  border-color: var(--cd-accent);
}

.cd-arrow:disabled {
  opacity: 0.35;
  cursor: default;
}

.cd-gear {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  color: var(--vp-c-text-3);
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.cd-gear:hover,
.cd-gear-on {
  color: var(--cd-accent);
  background: var(--vp-c-default-soft);
}

.cd-panel {
  position: absolute;
  top: 48px;
  right: 12px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg);
  box-shadow: var(--vp-shadow-2);
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.cd-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  white-space: nowrap;
}

.cd-option input {
  width: 14px;
  height: 14px;
  accent-color: var(--cd-accent);
  cursor: pointer;
}

.cd-dots {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cd-dot {
  width: 7px;
  height: 7px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--vp-c-divider);
  cursor: pointer;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.cd-dot:hover {
  background: var(--vp-c-text-3);
}

.cd-dot-on {
  background: var(--cd-accent);
  transform: scale(1.25);
}

/* 切换动画：按方向滑入滑出 */
.cd-slide-right-enter-active,
.cd-slide-right-leave-active,
.cd-slide-left-enter-active,
.cd-slide-left-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.cd-slide-right-enter-from {
  opacity: 0;
  transform: translateX(26px);
}

.cd-slide-right-leave-to {
  opacity: 0;
  transform: translateX(-26px);
}

.cd-slide-left-enter-from {
  opacity: 0;
  transform: translateX(-26px);
}

.cd-slide-left-leave-to {
  opacity: 0;
  transform: translateX(26px);
}

.cd-fade-enter-active,
.cd-fade-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.cd-fade-enter-from,
.cd-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (max-width: 640px) {
  .cd-stage {
    gap: 8px;
  }

  .cd-card {
    padding: 30px 34px;
  }

  .cd-num {
    font-size: 60px;
  }

  .cd-arrow {
    width: 32px;
    height: 32px;
    font-size: 20px;
  }
}
</style>
