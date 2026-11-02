<script setup lang="ts">
/**
 * Mobile bottom sheet: scrim + panel rising from the bottom of the phone
 * column. Closes on the close button, scrim tap, or Escape.
 */
import { onBeforeUnmount, onMounted } from 'vue'
import { CdxButton, CdxIcon } from '@wikimedia/codex'
import { cdxIconClose } from '@wikimedia/codex-icons'

const props = defineProps<{ open: boolean; label: string }>()
const emit = defineEmits<{ close: [] }>()

function onKey(e: KeyboardEvent) {
  if (props.open && e.key === 'Escape') emit('close')
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Transition name="byoc-sheet-scrim">
    <div v-if="open" class="byoc-sheet__scrim" @click="emit('close')" />
  </Transition>
  <Transition name="byoc-sheet">
    <section v-if="open" class="byoc-sheet" role="dialog" aria-modal="true" :aria-label="label">
      <div class="byoc-sheet__bar">
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
      <div class="byoc-sheet__body">
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

.byoc-sheet__bar {
  position: relative;
  display: flex;
  justify-content: center;
  min-height: 44px;
}

.byoc-sheet__grip {
  width: 36px;
  height: 4px;
  margin-top: var(--spacing-75);
  background-color: var(--border-color-base);
  border-radius: var(--border-radius-pill);
}

.byoc-sheet__close {
  position: absolute;
  top: var(--spacing-25);
  inset-inline-end: var(--spacing-50);
}

.byoc-sheet__body {
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
