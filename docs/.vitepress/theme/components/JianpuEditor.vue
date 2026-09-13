<script setup lang="ts">
/**
 * 在线写简谱
 *
 * 左侧写脚本文本，右侧实时渲染成简谱谱面，支持试听与导出。
 * 记法见页面底部的「语法说明」，解析逻辑在 ./jianpu.ts。
 */
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { LAYOUT, parseScore, type Note } from './jianpu'

interface Sample {
  name: string
  text: string
}
interface Symbol {
  label: string
  text: string
}

const SAMPLES: Sample[] = [
  {
    name: '小星星',
    text: "1=C 4/4\n1 1 5 5 6 6 5- | 4 4 3 3 2 2 1- |\n5 5 4 4 3 3 2- | 5 5 4 4 3 3 2- |\n1 1 5 5 6 6 5- | 4 4 3 3 2 2 1-"
  },
  {
    name: '欢乐颂',
    text: "1=C 4/4\n3 3 4 5 | 5 4 3 2 | 1 1 2 3 | 3. 2_ 2- |\n3 3 4 5 | 5 4 3 2 | 1 1 2 3 | 2. 1_ 1-"
  },
  {
    name: '两只老虎',
    text: "1=C 4/4\n1 2 3 1 | 1 2 3 1 | 3 4 5- | 3 4 5- |\n5_ 6_ 5_ 4_ 3 1 | 5_ 6_ 5_ 4_ 3 1 |\n2 ,5 1- | 2 ,5 1-"
  },
  {
    name: '音阶（高低音）',
    text: "1=C 4/4\n1 2 3 4 5 6 7 1' | 1' 7 6 5 4 3 2 1 |\n1, 2, 3, 4, 5, 6, ,7 1"
  }
]

/** 点击插入的常用记号，插到光标处 */
const SYMBOLS: Symbol[] = [
  { label: '1', text: '1 ' },
  { label: '2', text: '2 ' },
  { label: '3', text: '3 ' },
  { label: '4', text: '4 ' },
  { label: '5', text: '5 ' },
  { label: '6', text: '6 ' },
  { label: '7', text: '7 ' },
  { label: '0 休止', text: '0 ' },
  { label: '低音 ,', text: ',' },
  { label: "高音 '", text: "'" },
  { label: '减时 _', text: '_' },
  { label: '增时 -', text: '-' },
  { label: '附点 .', text: '.' },
  { label: '升 #', text: '#' },
  { label: '降 b', text: 'b' },
  { label: '小节 |', text: '| ' }
]

const title = ref(SAMPLES[0].name)
const script = ref(SAMPLES[0].text)
const bpm = ref(96)
const zoom = ref(1)
const score = computed(() => parseScore(script.value))
const svgRef = ref<SVGSVGElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const playing = ref(false)
const copied = ref(false)
/** 试听时高亮的音符坐标 */
const active = ref<{ l: number; n: number } | null>(null)

const noteCount = computed(
  () => score.value.notes.filter(n => n.kind !== 'bar').length
)
const barCount = computed(
  () => score.value.lines.reduce((c, l) => c + l.filter(n => n.kind === 'bar').length, 0)
)
const isEmpty = computed(() => noteCount.value === 0)

/** 谱面标题区高度，有曲名时预留出来 */
const titleH = computed(() => (title.value.trim() ? 58 : 0))
const svgW = computed(() => score.value.width)
const svgH = computed(() => score.value.height + titleH.value)
const contentY = computed(() => LAYOUT.padY + titleH.value)
/** 导出文件名用曲名，去掉非法字符 */
const fileName = computed(() =>
  (title.value.trim() || 'jianpu').replace(/[\\/:*?"<>|]/g, '_')
)

/* ---------- 谱面绘制辅助 ---------- */

const charW = LAYOUT.charW

function highDots(n: Note): number {
  return n.octave > 0 ? n.octave : 0
}
function lowDots(n: Note): number {
  return n.octave < 0 ? -n.octave : 0
}
/** 高音点：数字上方，多个点纵向排列 */
function highDotY(i: number): number {
  return -22 - i * 6
}
/** 低音点：数字下方 */
function lowDotY(i: number): number {
  return 9 + i * 6
}
/** 减时线：有低音点时整体下移，避免重叠 */
function underY(n: Note, i: number): number {
  return (n.octave < 0 ? 22 : 7) + i * 5
}
/** 附点：排在数字与增时线之后 */
function dotX(n: Note, i: number): number {
  return n.x + LAYOUT.charW + n.dashes * LAYOUT.dashW + 2 + i * LAYOUT.dotW
}
function isActive(l: number, n: number): boolean {
  return !!active.value && active.value.l === l && active.value.n === n
}

/* ---------- 编辑 ---------- */

function loadSample(s: Sample) {
  script.value = s.text
  title.value = s.name
}

/** 在光标处插入记号，并把光标移到插入内容之后 */
async function insert(text: string) {
  const ta = textareaRef.value
  if (!ta) {
    script.value += text
    return
  }
  const start = ta.selectionStart
  const end = ta.selectionEnd
  script.value = script.value.slice(0, start) + text + script.value.slice(end)
  await nextTick()
  const pos = start + text.length
  ta.setSelectionRange(pos, pos)
  ta.focus()
}

/* ---------- 试听 ---------- */

interface ScheduleItem {
  l: number
  n: number
  t: number
  dur: number
}

let audio: AudioContext | null = null
let endTimer: number | undefined
let rafId = 0
let schedule: ScheduleItem[] = []

function clearActive() {
  active.value = null
  if (rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
}

function stop() {
  if (endTimer) {
    clearTimeout(endTimer)
    endTimer = undefined
  }
  clearActive()
  schedule = []
  if (audio) {
    void audio.close()
    audio = null
  }
  playing.value = false
}

function tick() {
  if (!audio) return
  const now = audio.currentTime
  const cur = schedule.find(s => now >= s.t && now < s.t + s.dur)
  active.value = cur ? { l: cur.l, n: cur.n } : null
  rafId = requestAnimationFrame(tick)
}

function play() {
  stop()
  if (!window.AudioContext) return
  audio = new AudioContext()
  const quarter = 60 / bpm.value
  const master = audio.createGain()
  master.gain.value = 0.22
  master.connect(audio.destination)

  let t = audio.currentTime + 0.1
  score.value.lines.forEach((line, li) => {
    line.forEach((n, ni) => {
      if (n.kind === 'bar') return
      const dur = n.duration * quarter
      schedule.push({ l: li, n: ni, t, dur })
      if (n.freq && dur > 0) {
        const osc = audio!.createOscillator()
        const gain = audio!.createGain()
        osc.type = 'triangle'
        osc.frequency.value = n.freq
        // 简单的起落包络，避免爆音
        gain.gain.setValueAtTime(0, t)
        gain.gain.linearRampToValueAtTime(0.9, t + 0.015)
        gain.gain.setTargetAtTime(0, t + Math.max(0.05, dur * 0.7), 0.05)
        osc.connect(gain)
        gain.connect(master)
        osc.start(t)
        osc.stop(t + dur + 0.08)
      }
      t += dur
    })
  })

  playing.value = true
  rafId = requestAnimationFrame(tick)
  endTimer = window.setTimeout(
    () => {
      clearActive()
      schedule = []
      playing.value = false
    },
    (t - audio!.currentTime) * 1000
  )
}

onBeforeUnmount(stop)

/* ---------- 导出 ---------- */

function triggerDownload(url: string, name: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
}

function serialize(): string | null {
  const svg = svgRef.value
  if (!svg) return null
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  return new XMLSerializer().serializeToString(clone)
}

function downloadSVG() {
  const str = serialize()
  if (!str) return
  const url = URL.createObjectURL(new Blob([str], { type: 'image/svg+xml;charset=utf-8' }))
  triggerDownload(url, `${fileName.value}.svg`)
  URL.revokeObjectURL(url)
}

async function downloadPNG() {
  const str = serialize()
  if (!str) return
  const img = new Image()
  const scale = 2
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('svg load failed'))
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(str)
  })
  const canvas = document.createElement('canvas')
  canvas.width = svgW.value * scale
  canvas.height = svgH.value * scale
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  triggerDownload(canvas.toDataURL('image/png'), `${fileName.value}.png`)
}

async function copyScript() {
  try {
    await navigator.clipboard.writeText(script.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1600)
  } catch {
    /* 剪贴板不可用时忽略 */
  }
}
</script>

<template>
  <section class="vp-tw mx-auto max-w-7xl px-6 pb-10 text-text1">
    <details class="rounded-2xl border border-border bg-bg-soft">
      <summary
        class="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6"
      >
        <span class="text-sm font-semibold text-text1">在线写简谱</span>
        <span class="text-xs text-text2">工具与设置（点击展开）</span>
      </summary>
      <div class="border-t border-border px-4 pb-4 pt-4 sm:px-6">
        <p class="text-[13px] text-text2">
          写脚本实时出谱面；可试听、导出 SVG / PNG，纯前端不上传数据。
        </p>

      <!-- 曲名 + 示例 -->
      <div class="mt-5 flex flex-wrap items-end gap-4">
        <label class="min-w-[220px] flex-1">
          <span class="mb-1.5 block text-xs font-medium text-text2">
            曲名（显示在谱面上方，并作为导出文件名）
          </span>
          <input
            v-model="title"
            type="text"
            class="w-full rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text1 outline-none transition focus:border-brand"
          />
        </label>
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs font-medium text-text2">示例</span>
          <button
            v-for="s in SAMPLES"
            :key="s.name"
            type="button"
            class="rounded-lg border border-border bg-bg px-3 py-1 text-[13px] text-text2 transition hover:border-brand hover:text-brand"
            @click="loadSample(s)"
          >
            {{ s.name }}
          </button>
        </div>
      </div>

      <!-- 插入记号 -->
      <div class="mt-4 flex flex-wrap items-center gap-1.5">
        <span class="mr-1 text-xs font-medium text-text2">插入</span>
        <button
          v-for="sym in SYMBOLS"
          :key="sym.label"
          type="button"
          title="插入到光标处"
          class="min-w-[32px] rounded-md border border-border bg-bg px-2 py-1 font-mono text-[13px] text-text2 transition hover:border-brand hover:text-brand"
          @click="insert(sym.text)"
        >
          {{ sym.label }}
        </button>
      </div>

      <!-- 操作区 -->
      <div class="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <label class="flex items-center gap-2 text-sm text-text2">
          速度
          <input
            v-model.number="bpm"
            type="number"
            min="40"
            max="208"
            class="w-16 rounded-lg border border-border bg-bg px-2 py-1 text-sm text-text1 outline-none focus:border-brand"
          />
          BPM
        </label>
        <label class="flex items-center gap-2 text-sm text-text2">
          缩放
          <input
            v-model.number="zoom"
            type="range"
            min="0.75"
            max="2"
            step="0.05"
            class="w-28 accent-brand"
          />
          <span class="w-10 text-text1">{{ Math.round(zoom * 100) }}%</span>
        </label>
        <span class="hidden h-5 w-px bg-border sm:block" />
        <button
          type="button"
          class="rounded-lg bg-brand px-4 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
          @click="playing ? stop() : play()"
        >
          {{ playing ? '停止' : '试听' }}
        </button>
        <button
          type="button"
          class="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text2 transition hover:border-brand hover:text-brand"
          @click="downloadSVG"
        >
          导出 SVG
        </button>
        <button
          type="button"
          class="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text2 transition hover:border-brand hover:text-brand"
          @click="downloadPNG"
        >
          导出 PNG
        </button>
        <button
          type="button"
          class="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text2 transition hover:border-brand hover:text-brand"
          @click="copyScript"
        >
          {{ copied ? '已复制' : '复制脚本' }}
        </button>
        <button
          type="button"
          class="rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-text2 transition hover:border-brand hover:text-brand"
          @click="script = ''"
        >
          清空
        </button>
      </div>

      <details class="mt-4 rounded-xl border border-border bg-bg p-3 text-sm">
        <summary class="cursor-pointer font-medium text-text2">语法说明</summary>
        <ul class="mt-3 space-y-1.5 text-[13px] leading-6 text-text2">
          <li><code>1 2 3 4 5 6 7</code> 为音符，<code>0</code> 为休止符</li>
          <li><code>,5</code> 低音（数字前加逗号），<code>5'</code> 高音（数字后加撇），可叠加</li>
          <li><code>5_</code> 八分音符，<code>5__</code> 十六分音符（减时线）</li>
          <li><code>5-</code> 增时线，每个 <code>-</code> 延长一拍</li>
          <li><code>5.</code> 附点，<code>5..</code> 双附点</li>
          <li><code>#4</code> 升号，<code>b3</code> 降号</li>
          <li><code>|</code> 小节线，直接回车即可换行</li>
          <li>开头可写 <code>1=C 4/4</code> 指定调号与拍号</li>
        </ul>
      </details>
      </div>
    </details>

    <div class="mt-4 flex flex-col gap-4">
      <!-- 编辑区 -->
      <div class="order-2 rounded-2xl border border-border bg-bg-soft p-4 sm:p-5">
        <div class="mb-2 flex items-center justify-between text-sm">
          <span class="font-medium text-text2">简谱脚本</span>
          <span class="text-[13px] text-text2">
            {{ noteCount }} 个音符 · {{ barCount }} 个小节
          </span>
        </div>
        <textarea
          ref="textareaRef"
          v-model="script"
          rows="14"
          spellcheck="false"
          placeholder="例如：1=C 4/4&#10;1 1 5 5 6 6 5- | 4 4 3 3 2 2 1-"
          class="h-[240px] w-full resize-none overflow-auto rounded-xl border border-border bg-bg p-3 font-mono text-[13px] leading-6 text-text1 outline-none transition focus:border-brand"
          @keydown.ctrl.enter.prevent="playing ? stop() : play()"
        />

      </div>

      <!-- 预览区 -->
      <div class="order-1 rounded-2xl border border-border bg-bg-soft p-4 sm:p-5">
        <div class="mb-2 flex items-center justify-between text-sm">
          <span class="font-medium text-text2">谱面预览</span>
          <span class="text-[13px] text-text2">1={{ score.key }} · {{ score.beat }}</span>
        </div>
        <div class="h-[420px] overflow-auto rounded-xl border border-border bg-bg p-4">
          <p v-if="isEmpty" class="py-16 text-center text-sm text-text2">
            左边还没有音符，写点什么或点上面的示例试试
          </p>
          <svg
            v-else
            ref="svgRef"
            class="mx-auto"
            :viewBox="`0 0 ${svgW} ${svgH}`"
            :width="svgW * zoom"
            :height="svgH * zoom"
            xmlns="http://www.w3.org/2000/svg"
          >
            <!-- 曲名与调号拍号 -->
            <g v-if="title.trim()">
              <text
                :x="svgW / 2"
                y="26"
                text-anchor="middle"
                font-size="20"
                font-family="serif"
                fill="currentColor"
              >
                {{ title }}
              </text>
              <text
                :x="svgW / 2"
                y="46"
                text-anchor="middle"
                font-size="12"
                font-family="serif"
                fill="currentColor"
                opacity="0.7"
              >
                1={{ score.key }} {{ score.beat }}
              </text>
            </g>
            <g
              v-for="(line, i) in score.lines"
              :key="i"
              :transform="`translate(0, ${contentY + i * LAYOUT.lineH})`"
            >
              <template v-for="(n, j) in line" :key="j">
                <!-- 小节线 -->
                <line
                  v-if="n.kind === 'bar'"
                  :x1="n.x + 4"
                  y1="-18"
                  :x2="n.x + 4"
                  y2="14"
                  stroke="currentColor"
                  stroke-width="1.5"
                />
                <g v-else>
                  <!-- 试听高亮 -->
                  <circle
                    v-if="isActive(i, j)"
                    :cx="n.x + charW / 2"
                    cy="-7"
                    r="13"
                    fill="currentColor"
                    opacity="0.18"
                  />
                  <!-- 升降号 -->
                  <text
                    v-if="n.accidental"
                    :x="n.x - 1"
                    y="-3"
                    font-size="12"
                    font-family="serif"
                    fill="currentColor"
                  >
                    {{ n.accidental === '#' ? '♯' : '♭' }}
                  </text>
                  <!-- 数字 -->
                  <text
                    :x="n.x + charW / 2"
                    y="0"
                    text-anchor="middle"
                    font-size="22"
                    font-family="serif"
                    fill="currentColor"
                  >
                    {{ n.digit }}
                  </text>
                  <!-- 高音点 -->
                  <circle
                    v-for="k in highDots(n)"
                    :key="`h${k}`"
                    :cx="n.x + charW / 2"
                    :cy="highDotY(k - 1)"
                    r="2"
                    fill="currentColor"
                  />
                  <!-- 低音点 -->
                  <circle
                    v-for="k in lowDots(n)"
                    :key="`l${k}`"
                    :cx="n.x + charW / 2"
                    :cy="lowDotY(k - 1)"
                    r="2"
                    fill="currentColor"
                  />
                  <!-- 减时线 -->
                  <line
                    v-for="k in n.underlines"
                    :key="`u${k}`"
                    :x1="n.x + 2"
                    :y1="underY(n, k - 1)"
                    :x2="n.x + charW - 2"
                    :y2="underY(n, k - 1)"
                    stroke="currentColor"
                    stroke-width="1.5"
                  />
                  <!-- 增时线 -->
                  <line
                    v-for="k in n.dashes"
                    :key="`d${k}`"
                    :x1="n.x + charW + (k - 1) * LAYOUT.dashW"
                    y1="-7"
                    :x2="n.x + charW + (k - 1) * LAYOUT.dashW + LAYOUT.dashW - 4"
                    y2="-7"
                    stroke="currentColor"
                    stroke-width="1.5"
                  />
                  <!-- 附点 -->
                  <circle
                    v-for="k in n.dots"
                    :key="`p${k}`"
                    :cx="dotX(n, k - 1)"
                    cy="-3"
                    r="1.8"
                    fill="currentColor"
                  />
                </g>
              </template>
            </g>
          </svg>
        </div>
      </div>
    </div>
  </section>
</template>
