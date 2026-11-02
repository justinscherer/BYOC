<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { CdxButton, CdxIcon } from '@wikimedia/codex'
import { cdxIconArrowPrevious, cdxIconImage } from '@wikimedia/codex-icons'

import ArticleLens from './ArticleLens.vue'
import BottomSheet from './BottomSheet.vue'
import FactLens from './FactLens.vue'
import ImageLens from './ImageLens.vue'
import type { ReaderDocument } from './document'
import { LENS_FLAGS, LENS_KIND_LABEL, type LensFlag, type LensKind } from './lens'
import { resolveTitles } from './wiki'

const props = defineProps<{ doc: ReaderDocument }>()
const emit = defineEmits<{ back: [] }>()

// — Validate article/image titles against live enwiki; drop any that are gone —

const resolved = ref<Map<string, string | null> | null>(null)
onMounted(async () => {
  const titles = LENS_FLAGS.flatMap((f) => (f.kind === 'fact' ? [] : [f.title]))
  try {
    resolved.value = await resolveTitles(titles)
  } catch {
    resolved.value = new Map(titles.map((t) => [t, t]))
  }
})

const liveFlags = computed<LensFlag[]>(() => {
  if (!resolved.value) return []
  return LENS_FLAGS.flatMap<LensFlag>((f) => {
    if (f.kind === 'fact') return [f]
    const title = resolved.value!.get(f.title)
    return title ? [{ ...f, title }] : []
  })
})

// — Layer toggles —

const enabledKinds = ref<LensKind[]>(['article', 'image', 'fact'])

function toggleKind(k: LensKind) {
  enabledKinds.value = enabledKinds.value.includes(k)
    ? enabledKinds.value.filter((x) => x !== k)
    : [...enabledKinds.value, k]
}

// — Place each flag in the document: first block containing its phrase —

interface Placed {
  flag: LensFlag
  start: number
  end: number
}

const placements = computed(() => {
  const byBlock = new Map<number, Placed[]>()
  for (const flag of liveFlags.value) {
    const i = props.doc.blocks.findIndex((b) => b.type === 'p' && b.text.includes(flag.phrase))
    if (i < 0) {
      console.warn('[byoc-reader] phrase not found:', flag.phrase)
      continue
    }
    const text = (props.doc.blocks[i] as { text: string }).text
    const start = text.indexOf(flag.phrase)
    if (!byBlock.has(i)) byBlock.set(i, [])
    byBlock.get(i)!.push({ flag, start, end: start + flag.phrase.length })
  }
  return byBlock
})

const counts = computed(() => {
  const c: Record<LensKind, number> = { article: 0, image: 0, fact: 0 }
  for (const list of placements.value.values()) for (const p of list) c[p.flag.kind]++
  return c
})

const toggleButtons = computed(() =>
  (['article', 'image', 'fact'] as LensKind[]).map((k) => ({
    value: k,
    label: `${LENS_KIND_LABEL[k]} · ${counts.value[k]}`,
  })),
)

// — Split a paragraph into segments; each segment knows which flags cover it —

interface Segment {
  text: string
  /** Innermost (shortest) visible flag covering the segment — what a tap opens. */
  target?: LensFlag
  fact: boolean
  /** The visible non-fact flag drawing the blue/grey highlight. */
  mark?: 'article' | 'image'
  edgeStart: boolean
  edgeEnd: boolean
  imageAnchor?: string
}

function segmentsFor(i: number, text: string): Segment[] {
  const placed = (placements.value.get(i) ?? []).filter((p) =>
    enabledKinds.value.includes(p.flag.kind),
  )
  if (!placed.length) return [{ text, fact: false, edgeStart: false, edgeEnd: false }]

  const cuts = new Set([0, text.length])
  for (const p of placed) cuts.add(p.start).add(p.end)
  const points = [...cuts].sort((a, b) => a - b)

  const segs: Segment[] = []
  for (let k = 0; k < points.length - 1; k++) {
    const a = points[k]
    const b = points[k + 1]
    const covering = placed
      .filter((p) => p.start <= a && p.end >= b)
      .sort((x, y) => x.end - x.start - (y.end - y.start))
    const inner = covering[0]
    const markFlag = covering.find((p) => p.flag.kind !== 'fact')
    segs.push({
      text: text.slice(a, b),
      target: inner?.flag,
      fact: covering.some((p) => p.flag.kind === 'fact'),
      mark: markFlag?.flag.kind as Segment['mark'],
      edgeStart: !!markFlag && markFlag.start === a,
      edgeEnd: !!markFlag && markFlag.end === b,
      imageAnchor:
        markFlag?.flag.kind === 'image' && markFlag.start === a ? markFlag.flag.id : undefined,
    })
  }
  return segs
}

// — Pagination: the document flows into CSS columns, one column per page —
//
// The flow box is exactly one page tall, so overflow spills into further
// columns to the right; turning a page shifts the flow left by one page
// width. Page turns are vertical swipes (or wheel / arrow keys) to feel like
// an e-reader rather than a scrolling web page.

/** Page gutters. The wider end gutter holds the image margin markers. */
const PAD = { top: 24, bottom: 16, start: 20, end: 44 }
const SWIPE_THRESHOLD = 50
const TURN_MS = 280

const pager = ref<HTMLElement | null>(null)
const pageEl = ref<HTMLElement | null>(null)
const flow = ref<HTMLElement | null>(null)

const size = ref({ w: 0, h: 0 })
const pageCount = ref(1)
const pageIndex = ref(0)
/** Vertical offset of the live page — follows the finger, then animates. */
const offsetY = ref(0)
const animating = ref(false)
/** Finger down and moving — the page tracks it 1:1, no easing. */
const dragging = ref(false)
/** One-frame jump of the live page to the far edge before it slides in. */
const jumping = ref(false)

const flowStyle = computed(() => {
  const cw = Math.max(0, size.value.w - PAD.start - PAD.end)
  return {
    top: `${PAD.top}px`,
    left: `${PAD.start}px`,
    width: `${cw}px`,
    height: `${Math.max(0, size.value.h - PAD.top - PAD.bottom)}px`,
    columnWidth: `${cw}px`,
    columnGap: `${PAD.start + PAD.end}px`,
    transform: `translateX(${-pageIndex.value * size.value.w}px)`,
  }
})

function relayout() {
  const el = pager.value
  if (!el) return
  size.value = { w: el.clientWidth, h: el.clientHeight }
  nextTick(() => {
    const f = flow.value
    if (!f || !size.value.w) return
    const gap = PAD.start + PAD.end
    pageCount.value = Math.max(1, Math.round((f.scrollWidth + gap) / size.value.w))
    pageIndex.value = Math.min(pageIndex.value, pageCount.value - 1)
    nextTick(measureMarkers)
  })
}

// — Image margin markers for the current page —

const markers = ref<{ flag: LensFlag; top: number }[]>([])

function measureMarkers() {
  const page = pageEl.value
  if (!page || !enabledKinds.value.includes('image')) {
    markers.value = []
    return
  }
  const box = page.getBoundingClientRect()
  const out: { flag: LensFlag; top: number }[] = []
  page.querySelectorAll<HTMLElement>('.byoc-reader__flow [data-image-anchor]').forEach((el) => {
    const r = el.getClientRects()[0]
    if (!r || r.left < box.left || r.left >= box.left + size.value.w) return
    const flag = liveFlags.value.find((f) => f.id === el.dataset.imageAnchor)
    if (flag) out.push({ flag, top: r.top - box.top + (r.height - 22) / 2 })
  })
  markers.value = out
}

watch([placements, enabledKinds], () => nextTick(relayout), { deep: true })

let resizeObserver: ResizeObserver | null = null
onMounted(() => {
  resizeObserver = new ResizeObserver(relayout)
  if (pager.value) resizeObserver.observe(pager.value)
  document.fonts?.ready.then(relayout)
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('keydown', onKey)
})

// — Page turns —

/**
 * Animate to the next/previous page. The outgoing page is a static clone that
 * slides off while the live page (already showing the new column) slides in
 * from the opposite edge.
 */
function turn(dir: 1 | -1) {
  const next = pageIndex.value + dir
  if (animating.value || next < 0 || next >= pageCount.value) {
    offsetY.value = 0
    return
  }
  const page = pageEl.value!
  const h = size.value.h
  const ghost = page.cloneNode(true) as HTMLElement
  ghost.classList.add('byoc-reader__page--ghost')
  ghost.style.transition = 'none'
  ghost.style.transform = `translateY(${offsetY.value}px)`
  page.parentElement!.appendChild(ghost)

  animating.value = true
  jumping.value = true
  pageIndex.value = next
  offsetY.value = dir * h

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      jumping.value = false
      ghost.style.transition = `transform ${TURN_MS}ms ease, opacity ${TURN_MS}ms ease`
      ghost.style.transform = `translateY(${-dir * h}px)`
      ghost.style.opacity = '0.4'
      offsetY.value = 0
    })
  })
  window.setTimeout(() => {
    ghost.remove()
    animating.value = false
    measureMarkers()
  }, TURN_MS + 40)
}

let dragStartY: number | null = null
let dragged = false

function onPointerDown(e: PointerEvent) {
  if (animating.value || e.button !== 0) return
  dragStartY = e.clientY
  dragged = false
}

function onPointerMove(e: PointerEvent) {
  if (dragStartY === null) return
  const dy = e.clientY - dragStartY
  if (!dragged && Math.abs(dy) > 8) {
    dragged = true
    dragging.value = true
    pager.value?.setPointerCapture(e.pointerId)
  }
  if (!dragged) return
  // Resist past the first and last page.
  const atEdge =
    (dy > 0 && pageIndex.value === 0) || (dy < 0 && pageIndex.value === pageCount.value - 1)
  offsetY.value = atEdge ? dy * 0.2 : dy
}

function onPointerUp() {
  if (dragStartY === null) return
  dragStartY = null
  dragging.value = false
  if (!dragged) return
  const dy = offsetY.value
  if (dy <= -SWIPE_THRESHOLD) turn(1)
  else if (dy >= SWIPE_THRESHOLD) turn(-1)
  else offsetY.value = 0
}

/** A drag shouldn't also count as a tap on a highlight. */
function onClickCapture(e: MouseEvent) {
  if (dragged) {
    e.stopPropagation()
    e.preventDefault()
    dragged = false
  }
}

let wheelAccum = 0
let wheelLock = 0
function onWheel(e: WheelEvent) {
  e.preventDefault()
  if (Date.now() < wheelLock) return
  wheelAccum += e.deltaY
  if (Math.abs(wheelAccum) > 40) {
    turn(wheelAccum > 0 ? 1 : -1)
    wheelAccum = 0
    wheelLock = Date.now() + 500
  }
}

function onKey(e: KeyboardEvent) {
  if (active.value) return
  if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
    e.preventDefault()
    turn(1)
  } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
    e.preventDefault()
    turn(-1)
  }
}

// — Bottom sheet; article sheets keep their own link history —

const active = ref<LensFlag | null>(null)
const sheetLabel = computed(() => (active.value ? LENS_KIND_LABEL[active.value.kind] : ''))
const articleHistory = ref<string[]>([])
const sheetExpanded = ref(false)

function open(flag?: LensFlag) {
  if (!flag) return
  active.value = flag
  articleHistory.value = flag.kind === 'article' ? [flag.title] : []
}

function closeSheet() {
  active.value = null
  articleHistory.value = []
}

function sheetNavigate(title: string) {
  articleHistory.value = [...articleHistory.value, title]
  sheetExpanded.value = true
}

function sheetBack() {
  articleHistory.value = articleHistory.value.slice(0, -1)
}

const figureFailed = ref(false)
</script>

<template>
  <div class="byoc-reader">
    <header class="byoc-reader__bar">
      <CdxButton weight="quiet" aria-label="Back to library" @click="emit('back')">
        <CdxIcon :icon="cdxIconArrowPrevious" />
      </CdxButton>
      <small class="byoc-reader__bar-source">{{ doc.source }}</small>
    </header>

    <div
      ref="pager"
      class="byoc-reader__pager"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @click.capture="onClickCapture"
      @wheel="onWheel"
    >
      <div
        ref="pageEl"
        class="byoc-reader__page"
        :class="{ 'is-settling': !dragging && !jumping }"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <article ref="flow" class="byoc-reader__flow" :style="flowStyle">
          <p class="byoc-reader__kicker">
            <small>{{ doc.source }} · Newsletter</small>
          </p>
          <h1 class="byoc-reader__title">{{ doc.title }}</h1>
          <p class="byoc-reader__subtitle">{{ doc.subtitle }}</p>
          <p class="byoc-reader__byline">
            <small>{{ doc.author }} · {{ doc.date }}</small>
          </p>

          <section class="byoc-reader__lens" aria-label="Wikipedia lens">
            <p class="byoc-reader__lens-label">
              <small v-if="resolved">Wikipedia lens · tap a highlight</small>
              <small v-else>Reading through Wikipedia…</small>
            </p>
            <div class="byoc-reader__toggles">
              <button
                v-for="b in toggleButtons"
                :key="b.value"
                type="button"
                class="byoc-chip"
                :class="`byoc-chip--${b.value}`"
                :aria-pressed="enabledKinds.includes(b.value)"
                @click="toggleKind(b.value)"
              >
                <span class="byoc-chip__swatch" aria-hidden="true" />
                {{ b.label }}
              </button>
            </div>
          </section>

          <template v-for="(block, i) in doc.blocks" :key="i">
            <h2 v-if="block.type === 'h2'">{{ block.text }}</h2>

            <figure
              v-else-if="block.type === 'figure'"
              v-show="!figureFailed"
              class="byoc-reader__figure"
            >
              <img
                :src="block.src"
                :alt="block.alt"
                width="1536"
                height="1024"
                @load="relayout"
                @error="figureFailed = true"
              />
            </figure>

            <p v-else :class="{ 'byoc-reader__p--emphasis': block.emphasis }">
              <template v-for="(seg, k) in segmentsFor(i, block.text)" :key="k">
                <span
                  v-if="seg.target"
                  class="byoc-hl"
                  :class="{
                    'byoc-hl--fact': seg.fact,
                    'byoc-hl--article': seg.mark === 'article',
                    'byoc-hl--image': seg.mark === 'image',
                    'is-start': seg.edgeStart,
                    'is-end': seg.edgeEnd,
                  }"
                  :data-image-anchor="seg.imageAnchor"
                  role="button"
                  tabindex="0"
                  @click="open(seg.target)"
                  @keydown.enter.prevent="open(seg.target)"
                  >{{ seg.text }}</span
                >
                <template v-else>{{ seg.text }}</template>
              </template>
            </p>
          </template>

          <p class="byoc-reader__end">
            <small>Originally published on {{ doc.source }}.</small>
          </p>
        </article>

        <button
          v-for="m in markers"
          :key="m.flag.id"
          type="button"
          class="byoc-reader__marker"
          :style="{ top: `${m.top}px` }"
          :aria-label="`Images: ${m.flag.phrase}`"
          @click="open(m.flag)"
        >
          <CdxIcon :icon="cdxIconImage" size="small" />
        </button>
      </div>
    </div>

    <footer class="byoc-reader__footer">
      <div class="byoc-reader__progress" aria-hidden="true">
        <span :style="{ width: `${((pageIndex + 1) / pageCount) * 100}%` }" />
      </div>
      <small>
        <template v-if="pageIndex === 0">Swipe up to turn the page · </template>
        {{ pageIndex + 1 }} of {{ pageCount }}
      </small>
    </footer>

    <BottomSheet
      v-model:expanded="sheetExpanded"
      :open="!!active"
      :label="sheetLabel"
      :expandable="active?.kind === 'article'"
      :back="articleHistory.length > 1"
      :scroll-key="articleHistory.length"
      @close="closeSheet"
      @back="sheetBack"
    >
      <template v-if="active">
        <ArticleLens
          v-if="active.kind === 'article'"
          :key="active.id"
          :flag="active"
          :title="articleHistory[articleHistory.length - 1]"
          @navigate="sheetNavigate"
        />
        <ImageLens v-else-if="active.kind === 'image'" :key="active.id" :flag="active" />
        <FactLens v-else :key="active.id" :flag="active" />
      </template>
    </BottomSheet>
  </div>
</template>

<style scoped>
.byoc-reader {
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background-color: var(--background-color-base);
}

.byoc-reader__bar {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: var(--spacing-25);
  padding: var(--spacing-25) var(--spacing-50);
  border-bottom: var(--border-width-base) solid var(--border-color-muted);
}

.byoc-reader__bar-source {
  color: var(--color-subtle);
}

.byoc-reader__pager {
  position: relative;
  flex: 1 1 auto;
  overflow: hidden;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.byoc-reader__page {
  position: absolute;
  inset: 0;
  background-color: var(--background-color-base);
}

.byoc-reader__page.is-settling {
  transition: transform 280ms ease;
}

.byoc-reader__page--ghost {
  pointer-events: none;
  z-index: 1;
}

.byoc-reader__flow {
  position: absolute;
  box-sizing: border-box;
  column-fill: auto;
}

.byoc-reader__flow > :first-child {
  margin-top: 0;
}

.byoc-reader__kicker,
.byoc-reader__byline {
  margin: 0;
  color: var(--color-subtle);
}

.byoc-reader__title {
  margin: var(--spacing-25) 0 var(--spacing-50);
  border: 0;
}

.byoc-reader__subtitle {
  margin: 0 0 var(--spacing-50);
  color: var(--color-subtle);
}

.byoc-reader__lens {
  margin: var(--spacing-150) 0 var(--spacing-100);
  padding: var(--spacing-75) 0;
  border-block: var(--border-width-base) solid var(--border-color-muted);
  break-inside: avoid;
}

.byoc-reader__lens-label {
  margin: 0 0 var(--spacing-50);
  color: var(--color-subtle);
}

.byoc-reader__toggles {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-50);
}

.byoc-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-50);
  min-height: 32px;
  padding: 0 var(--spacing-75);
  background-color: var(--background-color-base);
  border: var(--border-width-base) solid var(--border-color-base);
  border-radius: var(--border-radius-pill);
  color: var(--color-subtle);
  font-family: var(--font-family-base);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-small);
  cursor: pointer;
}

.byoc-chip[aria-pressed='true'] {
  color: var(--color-base);
  border-color: var(--border-color-interactive);
}

.byoc-chip__swatch {
  width: 14px;
  height: 14px;
  border-radius: 3px;
}

.byoc-chip--article .byoc-chip__swatch {
  background-color: var(--background-color-progressive-subtle);
  box-shadow: inset 0 0 0 1px var(--border-color-progressive);
}

.byoc-chip--image .byoc-chip__swatch {
  background-color: var(--background-color-interactive);
  box-shadow: inset 0 0 0 1px var(--border-color-interactive);
}

.byoc-chip--fact .byoc-chip__swatch {
  background-color: var(--background-color-warning-subtle);
  box-shadow: inset 0 0 0 1px var(--border-color-warning);
}

.byoc-chip[aria-pressed='false'] .byoc-chip__swatch {
  background-color: transparent;
}

.byoc-reader__flow h2 {
  break-after: avoid;
}

.byoc-reader__figure {
  margin: var(--spacing-150) 0;
  break-inside: avoid;
}

.byoc-reader__figure img {
  display: block;
  width: 100%;
  height: auto;
  max-height: 40vh;
  object-fit: cover;
  border-radius: var(--border-radius-base);
}

.byoc-reader__p--emphasis {
  font-weight: var(--font-weight-bold);
}

.byoc-reader__marker {
  position: absolute;
  inset-inline-end: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 22px;
  padding: 0;
  background-color: var(--background-color-interactive);
  border: 0;
  border-radius: var(--border-radius-base);
  color: var(--color-subtle);
  cursor: pointer;
}

.byoc-reader__marker .cdx-icon {
  color: var(--color-subtle);
}

.byoc-reader__end {
  margin-top: var(--spacing-200);
  color: var(--color-subtle);
}

.byoc-reader__footer {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-50);
  padding: 0 var(--spacing-150) var(--spacing-75);
  color: var(--color-subtle);
}

.byoc-reader__progress {
  align-self: stretch;
  height: 2px;
  background-color: var(--background-color-interactive);
  border-radius: var(--border-radius-pill);
}

.byoc-reader__progress span {
  display: block;
  height: 100%;
  background-color: var(--background-color-progressive);
  border-radius: inherit;
  transition: width var(--transition-duration-medium) ease;
}

/* — Lens highlights — */

.byoc-hl {
  cursor: pointer;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
}

.byoc-hl--fact {
  background-color: var(--background-color-warning-subtle);
  box-shadow: 0 1px 0 var(--border-color-warning);
}

.byoc-hl--article {
  background-color: var(--background-color-progressive-subtle);
}

.byoc-hl--image {
  background-color: var(--background-color-interactive);
}

.byoc-hl--article.is-start,
.byoc-hl--image.is-start {
  border-start-start-radius: 3px;
  border-end-start-radius: 3px;
}

.byoc-hl--article.is-end,
.byoc-hl--image.is-end {
  border-start-end-radius: 3px;
  border-end-end-radius: 3px;
}

.byoc-hl:focus-visible {
  outline: var(--border-width-thick) solid var(--border-color-progressive);
}
</style>
