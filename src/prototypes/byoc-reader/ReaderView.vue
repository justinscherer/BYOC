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

const imageFlagsByBlock = computed(() => {
  const out = new Map<number, LensFlag[]>()
  if (!enabledKinds.value.includes('image')) return out
  for (const [i, list] of placements.value) {
    const imgs = list.filter((p) => p.flag.kind === 'image').map((p) => p.flag)
    if (imgs.length) out.set(i, imgs)
  }
  return out
})

// — Margin markers for image flags: align to the line the phrase starts on —

const root = ref<HTMLElement | null>(null)
const markerTop = ref<Record<string, number>>({})

function measureMarkers() {
  const tops: Record<string, number> = {}
  root.value?.querySelectorAll<HTMLElement>('[data-image-anchor]').forEach((el) => {
    tops[el.dataset.imageAnchor!] = el.offsetTop
  })
  markerTop.value = tops
}

watch([placements, enabledKinds], () => nextTick(measureMarkers), { deep: true })
onMounted(() => window.addEventListener('resize', measureMarkers))
onBeforeUnmount(() => window.removeEventListener('resize', measureMarkers))

// — Bottom sheet —

const active = ref<LensFlag | null>(null)
const sheetLabel = computed(() => (active.value ? LENS_KIND_LABEL[active.value.kind] : ''))

function open(flag?: LensFlag) {
  if (flag) active.value = flag
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

    <article ref="root" class="byoc-reader__doc">
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
          <img :src="block.src" :alt="block.alt" loading="lazy" @error="figureFailed = true" />
        </figure>

        <div v-else class="byoc-reader__block">
          <p :class="{ 'byoc-reader__p--emphasis': block.emphasis }">
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

          <button
            v-for="flag in imageFlagsByBlock.get(i) ?? []"
            :key="flag.id"
            type="button"
            class="byoc-reader__marker"
            :style="{ top: `${markerTop[flag.id] ?? 0}px` }"
            :aria-label="`Images: ${flag.phrase}`"
            @click="open(flag)"
          >
            <CdxIcon :icon="cdxIconImage" size="small" />
          </button>
        </div>
      </template>

      <p class="byoc-reader__end">
        <small>Originally published on {{ doc.source }}.</small>
      </p>
    </article>

    <BottomSheet :open="!!active" :label="sheetLabel" @close="active = null">
      <template v-if="active">
        <ArticleLens v-if="active.kind === 'article'" :key="active.id" :flag="active" />
        <ImageLens v-else-if="active.kind === 'image'" :key="active.id" :flag="active" />
        <FactLens v-else :key="active.id" :flag="active" />
      </template>
    </BottomSheet>
  </div>
</template>

<style scoped>
.byoc-reader {
  min-height: 100vh;
  background-color: var(--background-color-base);
}

.byoc-reader__bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: var(--spacing-25);
  padding: var(--spacing-25) var(--spacing-50);
  background-color: var(--background-color-base);
  border-bottom: var(--border-width-base) solid var(--border-color-muted);
}

.byoc-reader__bar-source {
  color: var(--color-subtle);
}

.byoc-reader__doc {
  /* Wider end padding leaves a margin column for image markers. */
  padding: var(--spacing-150) 44px var(--spacing-200) var(--spacing-150);
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

.byoc-reader__figure {
  margin: var(--spacing-150) 0;
}

.byoc-reader__figure img {
  display: block;
  width: 100%;
  height: auto;
  border-radius: var(--border-radius-base);
}

.byoc-reader__block {
  position: relative;
}

.byoc-reader__p--emphasis {
  font-weight: var(--font-weight-bold);
}

.byoc-reader__marker {
  position: absolute;
  inset-inline-end: -36px;
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
