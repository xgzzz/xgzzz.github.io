<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { DakaRecord } from '../../daka/xiaoliu.records'

/**
 * 打卡看板：汇总数字 + 月历热力图。
 *
 * 数据从外面传进来（见 docs/daka/xiaoliu.md 的 <script setup>），
 * 所以再加一个人只要复制一份 records 文件、换个页面传进去就行。
 *
 * 两个刻意的设计：
 *
 * 1. 所有统计都基于「最后一条记录」，而不是 new Date()。
 *    静态站是构建时预渲染的，用「今天」会让服务端和浏览器算出不同的值，
 *    触发 hydration 不匹配；以数据为准既稳定，语义也更准确（最近连续打卡）。
 *
 * 2. 日期一律用 new Date(y, m-1, d) 这种本地时间构造。
 *    直接写 new Date('2026-09-01') 会被当成 UTC 解析，在负时区会差一天，
 *    星期几和「连续天数」都会算错。
 */

const props = withDefaults(
  defineProps<{
    records?: DakaRecord[]
    /** 日历覆盖的月份范围，含首尾 */
    range?: { from: string; to: string }
  }>(),
  { records: () => [] }
)

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

interface CalCell {
  day: number
  date: string
  record?: DakaRecord
}

interface CalMonth {
  key: string
  label: string
  weeks: Array<Array<CalCell | null>>
}

/** 日期字符串 → 本地时间 Date */
function toDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

/** 周一为一周的第一天 */
function mondayIndex(date: string): number {
  return (toDate(date).getDay() + 6) % 7
}

function dayDiff(newer: string, older: string): number {
  return Math.round((toDate(newer).getTime() - toDate(older).getTime()) / 86400000)
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-')
  return `${y} 年 ${Number(m)} 月`
}

/** 月份加减，跨年也对（2026-12 + 1 → 2027-01） */
function addMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number)
  const index = y * 12 + (m - 1) + delta
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`
}

/** 同一天只保留最后一条，并按日期倒序 */
const sorted = computed(() => {
  const byDate = new Map<string, DakaRecord>()
  props.records.forEach((record) => {
    if (record?.date) byDate.set(record.date, record)
  })
  return Array.from(byDate.values()).sort((a, b) => (a.date < b.date ? 1 : -1))
})

const total = computed(() => sorted.value.length)

/** 从最近一条往前数，连着没断的有几天 */
const streak = computed(() => {
  if (!sorted.value.length) return 0

  let count = 1
  for (let i = 1; i < sorted.value.length; i++) {
    if (dayDiff(sorted.value[i - 1].date, sorted.value[i].date) !== 1) break
    count++
  }
  return count
})

const latestMonth = computed(() => sorted.value[0]?.date.slice(0, 7) ?? '')

const latestMonthTotal = computed(
  () => sorted.value.filter((record) => record.date.startsWith(latestMonth.value)).length
)

/** 按日期索引记录，供日历查询 */
const byDate = computed(() => new Map(sorted.value.map((record) => [record.date, record])))

/**
 * 可以切换的月份，按时间正序（早的在前/左，晚的在后/右）。
 *
 * 来源两部分：
 * 1. range 覆盖的连续月份（主要来源，见 xiaoliu.records.ts 的 range）；
 * 2. 有记录但不在 range 里的月份——兜底，免得补了记录却看不到。
 *
 * 页面一次只渲染 SPAN 个月，所以 range 写大一点也不会把页面撑爆。
 * 依然不用 new Date()，预渲染和浏览器算出来一定一致。
 */
const monthKeys = computed(() => {
  const keys = new Set<string>()

  const from = props.range?.from
  const to = props.range?.to
  if (from && to && from <= to) {
    let current = from
    // 上限 240 个月，防止 range 填反或写错导致死循环
    for (let i = 0; i < 240 && current <= to; i++) {
      keys.add(current)
      current = addMonth(current, 1)
    }
  }

  sorted.value.forEach((record) => keys.add(record.date.slice(0, 7)))

  return Array.from(keys).sort((a, b) => (a > b ? 1 : -1))
})

/** 一次展示几个月 */
const SPAN = 2

/** 当前展示的起始下标，默认停在最后两个月（最新的） */
const cursor = ref(0)

watch(
  monthKeys,
  (keys) => {
    cursor.value = Math.max(0, keys.length - SPAN)
  },
  { immediate: true }
)

const visibleMonths = computed<CalMonth[]>(() =>
  monthKeys.value.slice(cursor.value, cursor.value + SPAN).map((key) => {
    const [year, month] = key.split('-').map(Number)
    const leading = mondayIndex(`${key}-01`)
    const daysInMonth = new Date(year, month, 0).getDate()

    const cells: Array<CalCell | null> = []
    // 月初补空格，让 1 号落在正确的星期几下面
    for (let i = 0; i < leading; i++) cells.push(null)
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${key}-${String(day).padStart(2, '0')}`
      cells.push({ day, date, record: byDate.value.get(date) })
    }
    // 月末补齐整周，网格好排
    while (cells.length % 7) cells.push(null)

    const weeks: Array<Array<CalCell | null>> = []
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

    return { key, label: monthLabel(key), weeks }
  })
)

const canPrev = computed(() => cursor.value > 0)
const canNext = computed(() => cursor.value + SPAN < monthKeys.value.length)

function go(delta: number) {
  const next = cursor.value + delta
  if (next < 0 || next + SPAN > monthKeys.value.length) return
  cursor.value = next
}

function cellTitle(cell: CalCell | null): string {
  if (!cell) return ''
  if (!cell.record) return `${cell.date} · 未打卡`
  return `${cell.date} · ${cell.record.note || '已打卡'}`
}
</script>

<template>
  <div class="daka">
    <!-- 汇总 -->
    <div class="daka-card stats">
      <div class="stat">
        <div class="stat-value">{{ total }}</div>
        <div class="stat-label">累计打卡（天）</div>
      </div>
      <div class="stat">
        <div class="stat-value">{{ streak }}</div>
        <div class="stat-label">最近连续（天）</div>
      </div>
      <div class="stat">
        <div class="stat-value">{{ latestMonthTotal }}</div>
        <div class="stat-label">{{ latestMonth ? monthLabel(latestMonth) : '本月' }}</div>
      </div>
    </div>

    <p v-if="!total" class="daka-empty">
      还没有记录。在 <code>docs/daka/xiaoliu.records.ts</code> 里加一条，日历和统计就会跟着变。
    </p>

    <template v-else>
      <!-- 月历热力图 -->
      <div class="daka-card">
        <div class="daka-nav">
          <button
            type="button"
            class="daka-nav-btn"
            :disabled="!canPrev"
            aria-label="往前一个月"
            @click="go(-1)"
          >
            ←
          </button>
          <span class="daka-nav-range">
            {{ visibleMonths[0]?.label }} – {{ visibleMonths[visibleMonths.length - 1]?.label }}
          </span>
          <button
            type="button"
            class="daka-nav-btn"
            :disabled="!canNext"
            aria-label="往后一个月"
            @click="go(1)"
          >
            →
          </button>
        </div>

        <div class="daka-calendars">
          <div v-for="month in visibleMonths" :key="month.key" class="cal">
            <div class="cal-month">{{ month.label }}</div>
            <div class="cal-grid">
              <span v-for="weekday in WEEKDAYS" :key="`wd-${weekday}`" class="cal-wd">
                {{ weekday }}
              </span>
              <template v-for="(week, wi) in month.weeks" :key="`w-${wi}`">
                <span
                  v-for="(cell, ci) in week"
                  :key="`c-${wi}-${ci}`"
                  class="cal-day"
                  :class="{ 'is-blank': !cell, 'is-done': cell?.record }"
                  :title="cellTitle(cell)"
                >{{ cell?.day ?? '' }}</span>
              </template>
            </div>
          </div>

          <div class="cal-legend">
            <span class="cal-dot is-done" />已打卡
            <span class="cal-dot" />未打卡
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.daka {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 8px 0;
}

/* 和关于页同一套卡片：圆角 16 + 1px 描边 + bg-soft 铺底 */
.daka-card {
  padding: 20px 22px;
  border: 1px solid var(--vp-c-border);
  border-radius: 16px;
  background: var(--vp-c-bg-soft);
}

/* ---------- 汇总 ---------- */
.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 18px 12px;
}

.stat {
  text-align: center;
}

.stat + .stat {
  border-left: 1px solid var(--vp-c-divider);
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--vp-c-brand-1);
}

.stat-label {
  margin-top: 4px;
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.daka-empty {
  margin: 0;
  font-size: 14px;
  color: var(--vp-c-text-3);
}

/* ---------- 月份切换 ---------- */
.daka-nav {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-bottom: 16px;
}

.daka-nav-range {
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.daka-nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  transition: color 0.25s ease, background-color 0.25s ease, border-color 0.25s ease;
}

.daka-nav-btn:hover:not(:disabled) {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}

.daka-nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ---------- 月历 ---------- */
.daka-calendars {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 22px 24px;
}

.cal-month {
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 5px;
  max-width: 300px;
}

.cal-wd {
  text-align: center;
  font-size: 11px;
  line-height: 1.6;
  color: var(--vp-c-text-3);
}

.cal-day {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  border: 1px solid var(--vp-c-divider);
  border-radius: 7px;
  background: var(--vp-c-bg);
  font-size: 11px;
  color: var(--vp-c-text-3);
  transition: transform 0.2s ease, background-color 0.2s ease;
}

.cal-day.is-blank {
  border-color: transparent;
  background: transparent;
}

.cal-day.is-done {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-1);
  color: #fff;
  font-weight: 600;
}

.cal-day.is-done:hover {
  transform: scale(1.12);
}

.cal-legend {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--vp-c-text-3);
}

.cal-dot {
  width: 13px;
  height: 13px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 4px;
  background: var(--vp-c-bg);
}

.cal-dot.is-done {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-1);
}

.cal-legend .cal-dot:nth-of-type(2) {
  margin-left: 8px;
}

</style>
