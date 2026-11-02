<script setup lang="ts">
/**
 * Mobile bottom sheet: scrim + panel rising from the bottom of the phone
 * column. Closes on the close button, scrim tap, or Escape.
 *
 * `expandable` sheets open at half height and can be dragged (or scrolled)
 * up to cover most of the screen, leaving a strip of the page above visible
 * for context. `back` shows a browser-style back button in the top-left.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { CdxButton, CdxIcon } from '@wikimedia/codex'
import { cdxIconArrowPrevious, cdxIconClose } from '@wikimedia/codex-icons'

const props = withDefaults(
  defineProps<{
    open: boolean
    label: string
    expandable?: boolean
    back?: boolean
    /** Change to scroll the body back to the top (e.g. after in-sheet navigation). */
    scrollKey?: string | number
  }>(),
  { expandable: false, back: false, scrollKey: undefined },
)
const emit = defineEmits<{ close: []; back: [] }>()
const expanded = defineModel<boolean>('expanded', { default: false })

/** Height of page left visible above a fully expanded sheet. */
const PEEK = 128
const HALF = 0.55

const viewportH = ref(window.innerHeight)
const fullH = computed(() => viewportH.value - PEEK)
const halfH = computed(() => Math.round(viewportH.value * HALF))

const dragH = ref<number | null>(null)
const height = computed(() => {
  if (!props.expandable) return undefined
  return dragH.value ?? (expanded.value ? fullH.value : halfH.value)
})

// — Drag the bar to resize; release snaps to half / full, or closes —

let startY = 0
let startH = 0

function onBarDown(e: PointerEvent) {
  if (!props.expandable || (e.target as Element).closest('button')) return
  startY = e.clientY
  startH = height.value ?? 0
  dragH.value = startH
  ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
}

function onBarMove(e: PointerEvent) {
  if (dragH.value === null) return
  dragH.value = Math.min(fullH.value, Math.max(80, startH - (e.clientY - startY)))
}

function onBarUp() {
  if (dragH.value === null) return
  const h = dragH.value
  dragH.value = null
  if (Math.abs(h - startH) < 6) {
    expanded.value = !expanded.value
  } else if (h < halfH.value * 0.6) {
    emit('close')
  } else {
    expanded.value = h > (halfH.value + fullH.value) / 2
  }
}

// — Scrolling the body of a half-height sheet pulls it up —

const body = ref<HTMLElement | null>(null)
function onBodyScroll() {
  if (props.expandable && !expanded.value && (body.value?.scrollTop ?? 0) > 24)
    expanded.value = true
}

watch(
  () => props.scrollKey,
  () => nextTick(() => body.value?.scrollTo({ top: 0 })),
)
watch(
  () => props.open,
  (open) => {
    if (!open) expanded.value = false
  },
)

function onKey(e: KeyboardEvent) {
  if (props.open && e.key === 'Escape') emit('close')
}
function onResize() {
  viewportH.value = window.innerHeight
}
onMounted(() => {
  window.addEventListener('keydown', onKey)
  window.addEventListener('resize', onResize)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', onResize)
})
</script>

<template>
  <Transition name="byoc-sheet-scrim">
    <div v-if="open" class="byoc-sheet__scrim" @click="emit('close')" />
  </Transition>
  <Transition name="byoc-sheet">
    <section
      v-if="open"
      class="byoc-sheet"
      :class="{ 'is-expandable': expandable, 'is-dragging': dragH !== null }"
      :style="height ? { height: `${height}px` } : undefined"
      role="dialog"
      aria-modal="true"
      :aria-label="label"
    >
      <div
        class="byoc-sheet__bar"
        @pointerdown="onBarDown"
        @pointermove="onBarMove"
        @pointerup="onBarUp"
        @pointercancel="onBarUp"
      >
        <CdxButton
          v-if="back"
          class="byoc-sheet__back"
          weight="quiet"
          aria-label="Back"
          @click="emit('back')"
        >
          <CdxIcon :icon="cdxIconArrowPrevious" />
        </CdxButton>
        <span class="byoc-sheet__grip" aria-hidden="true" />
        <CdxButton
          class="byoc-sheet__close"
          weight="quiet"
          aria-label="Close"
          @click="emit('close')"
        >
          <CdxIcon :icon="cdxIconClose" />
        </CdxButton>
      </div>
      <div ref="body" class="byoc-sheet__body" @scroll.passive="onBodyScroll">
        <slot />
      </div>
    </section>
  </Transition>
</template>

<style scoped>
.byoc-sheet__scrim {
  position: fixed;
  inset: 0;
  z-index: 100;
  background-color: var(--background-color-backdrop-light);
}

.byoc-sheet {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: 101;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  max-width: 412px;
  max-height: 82vh;
  margin-inline: auto;
  background-color: var(--background-color-base);
  border-radius: 16px 16px 0 0;
  box-shadow: var(--box-shadow-large);
}

.byoc-sheet.is-expandable {
  max-height: none;
  transition: height var(--transition-duration-medium) ease;
}

.byoc-sheet.is-dragging {
  transition: none;
}

.byoc-sheet__bar {
  position: relative;
  display: flex;
  flex: 0 0 auto;
  justify-content: center;
  min-height: 44px;
  touch-action: none;
}

.is-expandable .byoc-sheet__bar {
  cursor: grab;
}

.byoc-sheet__grip {
  width: 36px;
  height: 4px;
  margin-top: var(--spacing-75);
  background-color: var(--border-color-base);
  border-radius: var(--border-radius-pill);
}

.byoc-sheet__back {
  position: absolute;
  top: var(--spacing-25);
  inset-inline-start: var(--spacing-50);
}

.byoc-sheet__close {
  position: absolute;
  top: var(--spacing-25);
  inset-inline-end: var(--spacing-50);
}

.byoc-sheet__body {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 0 var(--spacing-150) var(--spacing-200);
  overscroll-behavior: contain;
}

.byoc-sheet-enter-active,
.byoc-sheet-leave-active {
  transition: transform var(--transition-duration-medium) ease;
}

.byoc-sheet-enter-from,
.byoc-sheet-leave-to {
  transform: translateY(100%);
}

.byoc-sheet-scrim-enter-active,
.byoc-sheet-scrim-leave-active {
  transition: opacity var(--transition-duration-medium) ease;
}

.byoc-sheet-scrim-enter-from,
.byoc-sheet-scrim-leave-to {
  opacity: 0;
}
</style>
