/**
 * 小刘的打卡记录。
 *
 * 加一条就往数组里补一行，日期写成 `YYYY-MM-DD` 就行。
 * 顺序随意，页面会自己按日期倒序排；同一天写了多条只算最后一条。
 * `note` 可以留空，留空时日历格子的提示显示「已打卡」。
 */

export interface DakaRecord {
  /** 打卡日期，YYYY-MM-DD */
  date: string
  /** 当天做了什么，可留空 */
  note?: string
}

/**
 * 日历要覆盖的月份范围（含首尾），页面一次展示两个月、可用箭头切换。
 * 想往后延长就把 to 改一下，比如十月开始打卡了改成 '2026-10'。
 */
export const range = {
  from: '2026-06',
  to: '2026-09'
}

export const records: DakaRecord[] = [
  { date: '2026-09-14' }
]
