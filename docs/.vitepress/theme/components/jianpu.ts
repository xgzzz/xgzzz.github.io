/**
 * 简谱脚本的解析、排版与试听计算（纯函数，不依赖 Vue）
 *
 * 记法（参考番茄简谱，做了简化）：
 *   音符    1 2 3 4 5 6 7        休止符 0
 *   低音    ,5  ,,5              数字前加逗号，几个逗号就是低几个八度
 *   高音    5'  5''              数字后加撇
 *   升降号  #4  b3
 *   减时线  5_  5__              八分 / 十六分
 *   增时线  5-  5--              每个 - 延长一拍（四分音符）
 *   附点    5.  5..
 *   小节线  |
 *   换行    直接回车，单行过长会自动折行
 *   描述头  1=C  4/4             写在开头，可选
 */

export interface Note {
  kind: 'note' | 'rest' | 'bar'
  digit: string
  accidental: '' | '#' | 'b'
  /** 正数为高音八度数，负数为低音八度数 */
  octave: number
  underlines: number
  dots: number
  dashes: number
  /** 排版：单元左边界 */
  x: number
  w: number
  /** 时值，以四分音符为 1 */
  duration: number
  /** 频率，休止符与小节线为 null */
  freq: number | null
}

export interface Score {
  key: string
  beat: string
  lines: Note[][]
  notes: Note[]
  width: number
  height: number
}

export const LAYOUT = {
  charW: 20,
  gap: 8,
  dashW: 12,
  dotW: 6,
  barW: 8,
  lineH: 64,
  padX: 18,
  padY: 30,
  maxW: 700
}

/** 依次匹配：低音逗号、升降号、数字、高音撇、减时线、增时线、附点 */
const NOTE_RE = /^([,]*)([#b]?)([0-7])([']*)(_*)(-*)(\.*)/
/** 各调相对 C 的半音数 */
const KEY_OFFSET: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
/** 1 2 3 4 5 6 7 相对主音的半音数 */
const SCALE = [0, 2, 4, 5, 7, 9, 11]
/** 中音 do 的频率（C4） */
const BASE_FREQ = 261.63

function freqOf(
  digit: string,
  octave: number,
  accidental: string,
  keyOffset: number
): number | null {
  const d = Number(digit)
  if (!d) return null
  let semi = SCALE[d - 1] + 12 * octave + keyOffset
  if (accidental === '#') semi += 1
  if (accidental === 'b') semi -= 1
  return BASE_FREQ * Math.pow(2, semi / 12)
}

function durationOf(underlines: number, dots: number, dashes: number): number {
  let d = 1 / Math.pow(2, underlines)
  // 附点：1 个附点 x1.5，2 个 x1.75
  if (dots) d *= 2 - 1 / Math.pow(2, dots)
  return d + dashes
}

function tokenize(line: string, keyOffset: number): Note[] {
  const out: Note[] = []
  let s = line
  while (s.length) {
    if (/^\s/.test(s)) {
      s = s.slice(1)
      continue
    }
    if (s.startsWith('|')) {
      out.push({
        kind: 'bar',
        digit: '',
        accidental: '',
        octave: 0,
        underlines: 0,
        dots: 0,
        dashes: 0,
        x: 0,
        w: LAYOUT.barW,
        duration: 0,
        freq: null
      })
      s = s.slice(1)
      continue
    }
    const m = NOTE_RE.exec(s)
    if (!m) {
      // 无法识别的字符直接跳过
      s = s.slice(1)
      continue
    }
    const [, lows, acc, digit, highs, under, dashes, dots] = m
    const octave = highs.length - lows.length
    const nUnder = under.length
    const nDash = dashes.length
    const nDots = dots.length
    out.push({
      kind: digit === '0' ? 'rest' : 'note',
      digit,
      accidental: (acc || '') as Note['accidental'],
      octave,
      underlines: nUnder,
      dots: nDots,
      dashes: nDash,
      x: 0,
      w: LAYOUT.charW + nDash * LAYOUT.dashW + nDots * LAYOUT.dotW + LAYOUT.gap,
      duration: durationOf(nUnder, nDots, nDash),
      freq: freqOf(digit, octave, acc, keyOffset)
    })
    s = s.slice(m[0].length)
  }
  return out
}

export function parseScore(text: string): Score {
  let key = 'C'
  let beat = '4/4'
  let body = text

  // 描述头：调号与拍号
  const keyMatch = /(?:^|\s)1\s*=\s*([A-Ga-g])/.exec(body)
  if (keyMatch) {
    key = keyMatch[1].toUpperCase()
    body = body.replace(keyMatch[0], ' ')
  }
  const beatMatch = /(?:^|\s)(\d)\s*\/\s*(\d)(?=\s|$)/.exec(body)
  if (beatMatch) {
    beat = `${beatMatch[1]}/${beatMatch[2]}`
    body = body.replace(beatMatch[0], ' ')
  }
  const keyOffset = KEY_OFFSET[key] ?? 0

  const lines: Note[][] = []
  for (const raw of body.split(/\r?\n/)) {
    const tokens = tokenize(raw, keyOffset)
    if (!tokens.length) continue
    let cur: Note[] = []
    let x = LAYOUT.padX
    for (const n of tokens) {
      // 超宽自动折行
      if (x + n.w > LAYOUT.padX + LAYOUT.maxW) {
        lines.push(cur)
        cur = []
        x = LAYOUT.padX
      }
      n.x = x
      x += n.w
      cur.push(n)
    }
    if (cur.length) lines.push(cur)
  }

  const width = Math.max(
    LAYOUT.padX * 2 + 40,
    ...lines.map(l => (l.length ? l[l.length - 1].x + l[l.length - 1].w : 0) + LAYOUT.padX)
  )
  const height = Math.max(LAYOUT.lineH, lines.length * LAYOUT.lineH) + LAYOUT.padY

  return { key, beat, lines, notes: lines.flat(), width, height }
}
