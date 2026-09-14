<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { useData } from 'vitepress'
import {
  PENDING_REVEAL_CLASS,
  collectElements,
  createPendingFlag,
  loadGsap,
  prefersReducedMotion,
  type GsapInstance
} from '../utils/animation'

/**
 * 全站的「滚动到才出现」动画。
 *
 * 覆盖 /posts/（列表行）、/archive、/tags（卡片和标签）、文末相关文章、
 * 文章底部标签、以及关于页的几张卡片。
 * 首页的 .VPFeatures .item 不在这里，由 HomeAnimation.vue 负责，
 * 因为它要和英雄区的开场时间轴对齐节奏，两边选择器刻意不重叠。
 *
 * 和首页那套是同一个思路：
 * 1. 首屏隐藏类（reveal-anim）在首次绘制前先把目标藏住，
 *    动画起始值写进行内样式后在同一帧放开，避免「先亮再重播」；
 * 2. GSAP 动态 import，只有真的命中目标元素的页面才会去下载那个 chunk；
 * 3. 元素进入视口才播放，同一批进来的按 DOM 顺序错峰；
 * 4. 离开页面 / 组件卸载时断开观察器、杀掉补间并还原行内样式。
 */

/**
 * 需要揭示的元素。
 * .post-list-item 是加在 PostList.vue 行上的钩子类
 * （那边原来只有一堆 Tailwind 工具类，没有稳定选择器可用）。
 */
const TARGET_SELECTOR = '.post-list-item, .post-card, .post-tag, .about .card'

const { page } = useData()

const pendingFlag = createPendingFlag(PENDING_REVEAL_CLASS)

/** 每次播放一个代号，异步途中若发现代号变了就直接放弃 */
let generation = 0
let gsapRef: GsapInstance | undefined
let disposers: Array<() => void> = []

/**
 * 被置过行内样式的元素，用来做兜底还原。
 * 揭示的补间是在 IntersectionObserver 回调里才创建的，晚于 gsap.context
 * 的执行期，context 抓不到它们，所以这里自己记着，停播时统一清干净。
 */
let touched: HTMLElement[] = []

/** 停掉当前这次播放，并把 DOM 还原 */
function stop() {
  generation++
  if (gsapRef && touched.length) {
    gsapRef.killTweensOf(touched)
    gsapRef.set(touched, { clearProps: 'opacity,transform' })
  }
  touched = []
  disposers.forEach((dispose) => dispose())
  disposers = []
  pendingFlag.release()
}

async function play() {
  stop()
  const token = generation

  pendingFlag.hold()
  await nextTick()

  if (prefersReducedMotion()) {
    pendingFlag.release()
    return
  }

  const targets = await collectElements(TARGET_SELECTOR)
  if (token !== generation) return
  if (!targets.length) {
    // 这个页面没有需要揭示的元素，别让隐藏类白挂着
    pendingFlag.release()
    return
  }

  let gsap: GsapInstance
  try {
    gsap = await loadGsap()
  } catch (error) {
    pendingFlag.release()
    console.warn('[ScrollReveal] GSAP 加载失败，已跳过滚动动画', error)
    return
  }
  if (token !== generation) return
  gsapRef = gsap

  // 没有 IntersectionObserver 就无从判断何时进入视口，
  // 干脆不藏，退化成静态页面，而不是把内容留在 opacity: 0。
  const canObserve = 'IntersectionObserver' in window

  // 同步置好隐藏态，紧跟着就放开首屏隐藏类：都在同一个同步块里，
  // 中间不跨绘制帧，所以不会出现「先亮一下再消失」。
  if (canObserve) {
    gsap.set(targets, { opacity: 0, y: 24 })
    touched.push(...targets)
  }
  pendingFlag.release()

  if (!canObserve) return

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .map((entry) => entry.target as HTMLElement)
      if (!visible.length) return

      gsap.to(visible, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power3.out',
        // 一次进来很多个时把总时长压在 0.6s 内，长列表不会拖成一条长龙
        stagger: Math.min(0.06, 0.6 / visible.length),
        // .post-card 的 hover 是靠 CSS transform 抬起来的，
        // 不清掉行内 transform 会把它盖住
        clearProps: 'transform,opacity'
      })

      visible.forEach((el) => observer.unobserve(el))
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  )

  targets.forEach((el) => observer.observe(el))
  disposers.push(() => observer.disconnect())
}

onMounted(() => {
  play()
})

// 站内跳转时页面内容整体换掉，要重新收集一批目标。
// 用相对路径当 key：同一页面内的哈希跳转（比如标签页点锚点）不重播。
watch(
  () => page.value.relativePath,
  () => {
    play()
  }
)

onBeforeUnmount(() => {
  stop()
})
</script>

<template>
  <!-- 无渲染内容 -->
</template>
