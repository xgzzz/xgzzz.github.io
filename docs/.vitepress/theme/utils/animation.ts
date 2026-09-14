/**
 * 浏览器侧动画的公用逻辑。
 *
 * 模块顶层不碰 window / document，所以 SSR 构建时被引入也没有副作用，
 * 真正会读 DOM 的部分都在函数体内，只有客户端调用才执行。
 */

export type GsapInstance = (typeof import('gsap'))['gsap']

/**
 * 首屏隐藏类名。
 * 这两个名字必须和 config.mts 里那段内联脚本中的字面量保持一致，
 * 否则会出现「藏住了但没人放开」导致内容一直空着。
 */
export const PENDING_HERO_CLASS = 'home-anim'
export const PENDING_REVEAL_CLASS = 'reveal-anim'

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function toArray(nodes: NodeListOf<HTMLElement>): HTMLElement[] {
  return Array.from(nodes)
}

/** 动态加载 GSAP，失败时抛出，交给调用方决定怎么降级 */
export async function loadGsap(): Promise<GsapInstance> {
  const { gsap } = await import('gsap')
  return gsap
}

/**
 * 首屏隐藏开关。
 *
 * SSR 出来的内容是全亮的，等 JS 把动画装好再重播就会「闪一下」。
 * 所以先给 <html> 挂一个类把目标藏住，等动画的起始值写进行内样式后
 * 再在同一个同步块里放开——中间不跨绘制帧，用户看不到切换过程。
 *
 * config.mts 里的内联脚本负责在首次绘制前挂上，并带一个兜底定时器。
 * prefers-reduced-motion 下 hold() 直接不生效。
 */
export function createPendingFlag(className: string) {
  let active = false

  return {
    hold() {
      if (prefersReducedMotion()) return
      document.documentElement.classList.add(className)
      active = true
    },
    release() {
      if (!active) return
      document.documentElement.classList.remove(className)
      active = false
    }
  }
}

/**
 * 等元素出现。
 * 客户端路由切换时，DOM 会比 frontmatter 晚一帧，先等一会儿再放弃。
 */
export async function waitForElement(
  selector: string,
  timeout = 1200
): Promise<HTMLElement | null> {
  const deadline = performance.now() + timeout

  for (;;) {
    const el = document.querySelector<HTMLElement>(selector)
    if (el) return el
    if (performance.now() > deadline) return null
    await new Promise((resolve) => requestAnimationFrame(resolve))
  }
}

/**
 * 收集一组元素，同样带一点重试。
 * 用于「这个页面可能一个目标都没有」的场景：没有就尽快返回空数组，
 * 让调用方把首屏隐藏类放开，别白等。
 */
export async function collectElements(
  selector: string,
  timeout = 300
): Promise<HTMLElement[]> {
  const deadline = performance.now() + timeout

  for (;;) {
    const found = toArray(document.querySelectorAll<HTMLElement>(selector))
    if (found.length || performance.now() > deadline) return found
    await new Promise((resolve) => requestAnimationFrame(resolve))
  }
}
