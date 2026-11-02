<script setup lang="ts">
import { computed, ref } from 'vue'
import { CdxButton, CdxIcon, CdxToggleButtonGroup } from '@wikimedia/codex'
import {
  cdxIconAdd,
  cdxIconArticle,
  cdxIconBook,
  cdxIconBookmark,
  cdxIconLogoWikipedia,
  cdxIconNewspaper,
} from '@wikimedia/codex-icons'

import BottomSheet from './BottomSheet.vue'
import { COGNITIVE_MERCANTILISM, type ReaderDocument } from './document'
import { LENS_FLAGS } from './lens'

const emit = defineEmits<{ open: [id: string] }>()

type Kind = ReaderDocument['sourceKind']

interface LibraryItem {
  id: string
  kind: Kind
  title: string
  meta: string
  /** Only the newsletter opens; everything else is set dressing. */
  openable?: boolean
  unread?: boolean
}

const ITEMS: LibraryItem[] = [
  {
    id: COGNITIVE_MERCANTILISM.id,
    kind: 'feed',
    title: COGNITIVE_MERCANTILISM.title,
    meta: `${COGNITIVE_MERCANTILISM.source} · ${COGNITIVE_MERCANTILISM.author} · ${COGNITIVE_MERCANTILISM.date}`,
    openable: true,
    unread: true,
  },
  {
    id: 'relentless-revolution',
    kind: 'book',
    title: 'The Relentless Revolution: A History of Capitalism',
    meta: 'Joyce Appleby · EPUB · 34% read',
  },
  {
    id: 'industrious-revolution-pdf',
    kind: 'pdf',
    title: 'The Industrial Revolution and the Industrious Revolution',
    meta: 'Jan de Vries · Journal of Economic History, 1994 · PDF',
  },
  {
    id: 'diff',
    kind: 'feed',
    title: 'Diff',
    meta: 'diff.wikimedia.org · RSS feed',
  },
  {
    id: 'wealth-of-nations',
    kind: 'bookmark',
    title: 'The Wealth of Nations',
    meta: 'Adam Smith · gutenberg.org · Saved page',
  },
]

const KIND_ICON = {
  feed: cdxIconNewspaper,
  book: cdxIconBook,
  pdf: cdxIconArticle,
  bookmark: cdxIconBookmark,
}

const filter = ref<Kind | 'all'>('all')
const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'feed', label: 'Feeds' },
  { value: 'book', label: 'Books' },
  { value: 'pdf', label: 'PDFs' },
  { value: 'bookmark', label: 'Saved' },
]
const visible = computed(() =>
  ITEMS.filter((i) => filter.value === 'all' || i.kind === filter.value),
)

const lensCount = LENS_FLAGS.filter((f) => f.kind !== 'fact').length
const factCount = LENS_FLAGS.filter((f) => f.kind === 'fact').length

const sheet = ref<'add' | 'placeholder' | null>(null)

function tap(item: LibraryItem) {
  if (item.openable) emit('open', item.id)
  else sheet.value = 'placeholder'
}

function openNewsletter() {
  sheet.value = null
  emit('open', COGNITIVE_MERCANTILISM.id)
}

const ADD_OPTIONS = [
  { icon: cdxIconNewspaper, label: 'Follow an RSS feed or newsletter' },
  { icon: cdxIconBook, label: 'Import an ebook (EPUB)' },
  { icon: cdxIconArticle, label: 'Upload a PDF' },
  { icon: cdxIconBookmark, label: 'Save a web page' },
]
</script>

<template>
  <div class="byoc-library">
    <header class="byoc-library__bar">
      <h1 class="byoc-library__title">Library</h1>
      <CdxButton weight="quiet" aria-label="Add to library" @click="sheet = 'add'">
        <CdxIcon :icon="cdxIconAdd" />
      </CdxButton>
    </header>

    <CdxToggleButtonGroup v-model="filter" :buttons="FILTERS" class="byoc-library__filters" />

    <ul class="byoc-library__list">
      <li v-for="item in visible" :key="item.id">
        <button type="button" class="byoc-library__item" @click="tap(item)">
          <span class="byoc-library__icon" aria-hidden="true">
            <CdxIcon :icon="KIND_ICON[item.kind]" />
          </span>
          <span class="byoc-library__text">
            <span class="byoc-library__item-title">
              <span v-if="item.unread" class="byoc-library__unread" aria-label="Unread" />
              {{ item.title }}
            </span>
            <small class="byoc-library__meta">{{ item.meta }}</small>
            <small v-if="item.openable" class="byoc-library__lens">
              <CdxIcon :icon="cdxIconLogoWikipedia" size="x-small" />
              {{ lensCount }} connections · {{ factCount }} fact checks
            </small>
          </span>
        </button>
      </li>
    </ul>

    <BottomSheet :open="sheet === 'add'" label="Add to library" @close="sheet = null">
      <h3>Bring your own content</h3>
      <p><small>Everything you add is read through Wikipedia.</small></p>
      <ul class="byoc-library__add">
        <li v-for="o in ADD_OPTIONS" :key="o.label">
          <CdxButton weight="quiet" disabled>
            <CdxIcon :icon="o.icon" />
            {{ o.label }}
          </CdxButton>
        </li>
      </ul>
      <p><small>Adding sources isn’t wired up in this prototype.</small></p>
    </BottomSheet>

    <BottomSheet :open="sheet === 'placeholder'" label="Not available" @close="sheet = null">
      <h3>Not in this prototype</h3>
      <p>
        Only the <em>{{ COGNITIVE_MERCANTILISM.title }}</em> newsletter has a Wikipedia lens so far.
      </p>
      <CdxButton action="progressive" weight="primary" @click="openNewsletter">
        Open the newsletter
      </CdxButton>
    </BottomSheet>
  </div>
</template>

<style scoped>
.byoc-library {
  min-height: 100vh;
  padding: 0 var(--spacing-100) var(--spacing-200);
  background-color: var(--background-color-base);
}

.byoc-library__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-100) 0 var(--spacing-50);
}

.byoc-library__title {
  margin: 0;
  border: 0;
}

.byoc-library__filters {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: var(--spacing-100);
}

.byoc-library__list,
.byoc-library__add {
  margin: 0;
  padding: 0;
  list-style: none;
}

.byoc-library__item {
  display: flex;
  gap: var(--spacing-75);
  width: 100%;
  padding: var(--spacing-100) 0;
  background: none;
  border: 0;
  border-bottom: var(--border-width-base) solid var(--border-color-muted);
  color: inherit;
  font: inherit;
  text-align: start;
  cursor: pointer;
}

.byoc-library__icon {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 56px;
  background-color: var(--background-color-interactive-subtle);
  border-radius: var(--border-radius-base);
}

.byoc-library__icon .cdx-icon {
  color: var(--color-subtle);
}

.byoc-library__text {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-25);
  min-width: 0;
}

.byoc-library__item-title {
  font-weight: var(--font-weight-bold);
}

.byoc-library__unread {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-inline-end: var(--spacing-25);
  vertical-align: middle;
  background-color: var(--background-color-progressive);
  border-radius: 50%;
}

.byoc-library__meta {
  color: var(--color-subtle);
}

.byoc-library__lens {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-25);
  align-self: flex-start;
  padding: 0 var(--spacing-50);
  background-color: var(--background-color-progressive-subtle);
  border-radius: var(--border-radius-pill);
  color: var(--color-progressive);
}

.byoc-library__lens .cdx-icon {
  color: var(--color-progressive);
}
</style>
