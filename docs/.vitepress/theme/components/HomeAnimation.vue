<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { useData } from 'vitepress'
import {
  PENDING_HERO_CLASS,
  createPendingFlag,
  loadGsap,
  prefersReducedMotion,
  toArray,
  waitForElement,
  type GsapInstance
} from '../utils/animation'

/**
 * 首页开场动画（GSAP）
 *
 * 四条硬性约束，都是被 VitePress 的静态站特性逼出来的：
 *
 * 1. SSR 安全：VitePress 会预渲染每个页面，所以模块顶层不能碰 window。
 *    GSAP 只在 onMounted 之后动态 import，服务端构建时这段代码根本不会执行。
 *
 * 2. 按需加载：只有首页会去拉 gsap 那个 chunk，文章页的包体不受影响。
 *
 * 3. 不闪屏：首屏 HTML 里英雄区是全亮的，等 JS 把动画装好再重播就会「闪一下」。
 *    所以由 config.mts 里的内联脚本在首次绘制前给 <html> 加 .home-anim 先把
 *    英雄区藏起来，等 GSAP 时间轴建好（起始值已写进行内样式）再摘下这个类。
 *    内联脚本里另有一个 3s 的兜底定时器，万一 GSAP 没加载成功也不会一直空着。
 *
 * 4. 可撤退：prefers-reduced-motion 时完全不播放；离开首页或组件卸载时
 *    ctx.revert() 会把行内样式全部还原，拆开的文字也拼回去，不留痕迹。
 *
 * 另外只动「没有 CSS transform」的元素；像 .image-bg / .image-src 这种
 * 靠 translate(-50%, -50%) 居中的，先用 xPercent/yPercent 把百分比位移
 * 归一化，再叠 scale 和视差，居中就不会丢。
 */

interface CharSplit {
  chars: HTMLElement[]
  restore: () => void
}

const { frontmatter } = useData()

const pendingFlag = createPendingFlag(PENDING_HERO_CLASS)

/** 每次播放一个代号，异步途中若发现代号变了就直接放弃 */
let generation = 0
let ctx: ReturnType<GsapInstance['context']> | undefined
let gsapRef: GsapInstance | undefined
let splits: CharSplit[] = []
let disposers: Array<() => void> = []

/**
 * 在 context 之外被置过行内样式的元素。
 * ctx.revert() 只能还原它自己管的那些，这里的要靠 stop() 手动清，
 * 保证任何异常路径下都不会有元素被留在 opacity: 0 的状态里。
 */
let touched: HTMLElement[] = []

/** 停掉当前这次播放，并把 DOM 还原 */
function stop() {
  generation++
  ctx?.revert()
  ctx = undefined
  splits.forEach((split) => split.restore())
  splits = []
  if (gsapRef && touched.length) {
    // 兜底：把 context 管不到的行内样式也清掉，别让卡片留在透明状态
    gsapRef.set(touched, { clearProps: 'opacity,transform' })
  }
  touched = []
  disposers.forEach((dispose) => dispose())
  disposers = []
  pendingFlag.release()
}

/**
 * 把一段纯文本拆成单字 span，方便做逐字入场。
 * 标题里若混了标签（v-html 的场景）就返回 null，交给调用方整块动画，避免破坏结构。
 */
function splitChars(el: HTMLElement | null, withMask: boolean): CharSplit | null {
  if (!el) return null

  const source = el.textContent ?? ''
  if (el.children.length > 0 || !source.trim()) return null

  const previous = {
    overflow: el.style.overflow,
    paddingBottom: el.style.paddingBottom,
    marginBottom: el.style.marginBottom
  }

  const fragment = document.createDocumentFragment()
  const chars: HTMLElement[] = []

  for (const char of Array.from(source)) {
    if (/\s/.test(char)) {
      fragment.appendChild(document.createTextNode(char))
      continue
    }
    const span = document.createElement('span')
    span.textContent = char
    span.style.display = 'inline-block'
    fragment.appendChild(span)
    chars.push(span)
  }

  el.textContent = ''
  el.appendChild(fragment)

  if (withMask) {
    // 遮罩式上滑：overflow:hidden 负责裁切。padding + 负 margin 把裁切框
    // 往下撑一点，避免带下伸部的字母（g / y / p）被切掉，外框尺寸不变。
    el.style.overflow = 'hidden'
    el.style.paddingBottom = '0.16em'
    el.style.marginBottom = '-0.16em'
  }

  return {
    chars,
    restore() {
      el.textContent = source
      el.style.overflow = previous.overflow
      el.style.paddingBottom = previous.paddingBottom
      el.style.marginBottom = previous.marginBottom
    }
  }
}

function clamp(value: number) {
  return Math.max(-1, Math.min(1, value))
}

async function play() {
  stop()
  const token = generation

  pendingFlag.hold()
  await nextTick()

  const hero = await waitForElement('.VPHome .VPHomeHero')
  if (token !== generation) return
  if (!hero || prefersReducedMotion()) {
    pendingFlag.release()
    return
  }

  let gsap: GsapInstance
  try {
    gsap = await loadGsap()
  } catch (error) {
    pendingFlag.release()
    console.warn('[HomeAnimation] GSAP 加载失败，已跳过首页动画', error)
    return
  }
  if (token !== generation) return
  gsapRef = gsap

  const image = hero.querySelector<HTMLElement>('.image')
  const glow = hero.querySelector<HTMLElement>('.image-bg')
  const avatar = hero.querySelector<HTMLElement>('.image-src')
  const name = hero.querySelector<HTMLElement>('.name')
  const text = hero.querySelector<HTMLElement>('.text')
  const tagline = hero.querySelector<HTMLElement>('.tagline')
  const actions = toArray(hero.querySelectorAll<HTMLElement>('.actions .action'))
  const features = toArray(document.querySelectorAll<HTMLElement>('.VPFeatures .item'))

  // 卡片的隐藏态同步置好（和首屏隐藏类同一个逻辑：先藏住，等时间轴建好
  // 在同一帧里放开，避免 IntersectionObserver 回调晚于首帧导致卡片先亮一下）。
  // 放在 context 外是为了任何异常路径都能靠 stop() 的 clearProps 兜底放出来。
  if (features.length) {
    gsap.set(features, { opacity: 0, y: 28 })
    touched.push(...features)
  }

  try {
    ctx = gsap.context(() => {
      /* ---------- 1. 居中位移归一化 ----------
         VitePress 用 translate(-50%, -50%) 让光晕和插画居中，
         先换成 GSAP 的 xPercent/yPercent，后面叠 scale、视差都不会把居中弄丢。 */
      const centered = [glow, avatar].filter((el): el is HTMLElement => Boolean(el))
      if (centered.length) {
        gsap.set(centered, { xPercent: -50, yPercent: -50, x: 0, y: 0 })
      }

      /* ---------- 2. 逐字入场 ---------- */
      const nameSplit = splitChars(name, true)
      if (nameSplit) splits.push(nameSplit)

      const textSplit = splitChars(text, true)
      if (textSplit) splits.push(textSplit)

      /* ---------- 3. 入场时间轴 ---------- */
      const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.8 } })

      if (image) {
        tl.from(image, { y: -120, opacity: 0, scale: 0.88, duration: 1, ease: 'back.out(1.4)' }, 0)
      }
      if (glow) {
        tl.from(glow, { scale: 0.45, opacity: 0, duration: 1.1, ease: 'power2.out' }, 0.05)
      }
      if (nameSplit) {
        tl.from(
          nameSplit.chars,
          { yPercent: 118, opacity: 0, duration: 0.8, stagger: 0.03, ease: 'power4.out' },
          0.25
        )
      } else if (name) {
        tl.from(name, { y: 24, opacity: 0 }, 0.25)
      }
      if (textSplit) {
        tl.from(
          textSplit.chars,
          { yPercent: 118, opacity: 0, duration: 0.7, stagger: 0.025, ease: 'power4.out' },
          0.65
        )
      } else if (text) {
        tl.from(text, { y: 24, opacity: 0 }, 0.65)
      }
      if (tagline) {
        tl.from(tagline, { y: 16, opacity: 0, duration: 0.7 }, 1)
      }
      if (actions.length) {
        tl.from(
          actions,
          { y: 20, opacity: 0, scale: 0.94, duration: 0.6, stagger: 0.08, ease: 'back.out(1.8)' },
          1.15
        )
      }

      /* ---------- 4. 常驻微动效：插画浮动 + 光晕呼吸 ---------- */
      if (image) {
        tl.to(image, { y: 9, duration: 2.6, ease: 'sine.inOut', repeat: -1, yoyo: true }, 2)
      }
      if (glow) {
        tl.to(glow, { scale: 1.08, opacity: 0.72, duration: 3.4, ease: 'sine.inOut', repeat: -1, yoyo: true }, 2)
      }

      /* ---------- 5. 鼠标视差 ----------
         只给精确指针设备开；触摸屏没有 hover，跑了也只是白耗性能。 */
      const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
      if (finePointer && (glow || avatar)) {
        const moveGlowX = glow ? gsap.quickTo(glow, 'x', { duration: 0.7, ease: 'power3' }) : null
        const moveGlowY = glow ? gsap.quickTo(glow, 'y', { duration: 0.7, ease: 'power3' }) : null
        const moveAvatarX = avatar ? gsap.quickTo(avatar, 'x', { duration: 0.7, ease: 'power3' }) : null
        const moveAvatarY = avatar ? gsap.quickTo(avatar, 'y', { duration: 0.7, ease: 'power3' }) : null

        const onMove = (event: MouseEvent) => {
          const rect = hero.getBoundingClientRect()
          if (!rect.width || !rect.height) return
          // 归一化到 -1 ~ 1，鼠标越靠边位移越大
          const nx = clamp(((event.clientX - rect.left) / rect.width - 0.5) * 2)
          const ny = clamp(((event.clientY - rect.top) / rect.height - 0.5) * 2)

          // 光晕远、插画近，位移幅度不同，叠出景深
          moveGlowX?.(nx * 12)
          moveGlowY?.(ny * 10)
          moveAvatarX?.(nx * 26)
          moveAvatarY?.(ny * 20)
        }

        hero.addEventListener('mousemove', onMove)
        disposers.push(() => hero.removeEventListener('mousemove', onMove))
        disposers.push(() => {
          if (avatar) gsap.set(avatar, { clearProps: 'transform' })
          if (glow) gsap.set(glow, { clearProps: 'transform' })
        })
      }

      /* ---------- 6. feature 卡片滚动揭示 ----------
         卡片的隐藏态在进 context 之前就同步置好了（见下面的 touched），
         这里只负责在进入视口时把它们放出来。 */
      if (features.length) {
        if (!('IntersectionObserver' in window)) {
          gsap.to(features, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 })
        } else {
          let first = true
          const observer = new IntersectionObserver(
            (entries) => {
              const visible = entries
                .filter((entry) => entry.isIntersecting)
                .map((entry) => entry.target as HTMLElement)
              if (!visible.length) return

              // 首屏就可见时（大屏）稍等一下，让卡片排在英雄区动画之后
              gsap.to(visible, {
                opacity: 1,
                y: 0,
                duration: 0.7,
                stagger: 0.08,
                delay: first ? 0.7 : 0
              })
              first = false
              visible.forEach((el) => observer.unobserve(el))
            },
            { rootMargin: '0px 0px -10% 0px', threshold: 0.1 }
          )

          features.forEach((el) => observer.observe(el))
          disposers.push(() => observer.disconnect())
        }
      }
    }, hero)
  } catch (error) {
    // 时间轴构建失败就整体回退成静态页面：stop() 会还原 DOM、摘掉首屏隐藏类
    console.warn('[HomeAnimation] 首页动画构建失败，已回退为静态页面', error)
    stop()
  } finally {
    // 时间轴已建好（from 的起始值都写进行内样式了），这时候再放开首屏，
    // 同一帧内完成，不会有「先亮再动」的闪屏。中途抛错也照样放开，
    // 退化成没有动画的静态页面，而不是空白。
    pendingFlag.release()
  }
}

onMounted(() => {
  if (frontmatter.value.layout === 'home') play()
})

watch(
  () => frontmatter.value.layout === 'home',
  (isHome) => {
    if (isHome) {
      // 客户端路由切回首页时内联脚本不会重跑，这里补上首屏隐藏
      pendingFlag.hold()
      play()
    } else {
      stop()
    }
  }
)

onBeforeUnmount(() => {
  stop()
})
</script>

<template>
  <!-- 无渲染内容 -->
</template>
