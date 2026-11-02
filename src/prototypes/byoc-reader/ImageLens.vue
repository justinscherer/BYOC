<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { CdxButton, CdxIcon, CdxProgressBar } from '@wikimedia/codex'
import { cdxIconImage, cdxIconLinkExternal } from '@wikimedia/codex-icons'

import type { ImageFlag } from './lens'
import { articleUrl, fetchCrossLanguageImages, type LensImage } from './wiki'
import './lens-sheet.css'

const props = defineProps<{ flag: ImageFlag }>()

const images = ref<LensImage[] | null>(null)
const editions = ref(0)
const error = ref(false)
const selected = ref(0)

watchEffect(async () => {
  images.value = null
  error.value = false
  selected.value = 0
  try {
    const r = await fetchCrossLanguageImages(props.flag.title)
    images.value = r.images
    editions.value = r.editions
  } catch {
    error.value = true
  }
})

const current = computed(() => images.value?.[selected.value])

/** "File:Foo_bar.jpg" → "Foo bar" */
const fileLabel = (file: string) => file.replace(/_/g, ' ').replace(/\.[a-z0-9]+$/i, '')

function openCommons() {
  if (current.value) window.open(current.value.commonsUrl, '_blank', 'noopener')
}
</script>

<template>
  <div class="byoc-lens">
    <p class="byoc-lens__kicker">
      <CdxIcon :icon="cdxIconImage" size="small" />
      <small>Images across Wikipedia</small>
    </p>
    <h3 class="byoc-lens__title">{{ flag.title }}</h3>

    <CdxProgressBar v-if="!images && !error" inline aria-label="Loading images" />
    <p v-else-if="error || !images?.length"><small>No images found for this topic.</small></p>

    <template v-else-if="current">
      <p class="byoc-lens__desc">
        <small>
          {{ images!.length }} distinct lead {{ images!.length === 1 ? 'image' : 'images' }} across
          {{ editions }} language editions
        </small>
      </p>

      <figure class="byoc-image__main">
        <a :href="current.commonsUrl" target="_blank" rel="noopener">
          <img :src="current.thumb" :alt="fileLabel(current.file)" />
        </a>
        <figcaption>
          {{ fileLabel(current.file) }}
          <br />
          Lead image on
          <template v-for="(l, i) in current.langs" :key="l.lang">
            <a
              :href="articleUrl(l.title, `https://${l.lang}.wikipedia.org`)"
              target="_blank"
              rel="noopener"
              :lang="l.lang"
              >{{ l.lang }}</a
            >{{ i < current.langs.length - 1 ? ', ' : '' }}
          </template>
          Wikipedia
        </figcaption>
      </figure>

      <div v-if="images!.length > 1" class="byoc-image__strip" role="listbox" aria-label="Images">
        <button
          v-for="(img, i) in images"
          :key="img.file"
          type="button"
          role="option"
          class="byoc-image__pick"
          :class="{ 'is-selected': i === selected }"
          :aria-selected="i === selected"
          @click="selected = i"
        >
          <img :src="img.thumb" :alt="fileLabel(img.file)" />
          <small>{{ img.langs.map((l) => l.lang).join(' · ') }}</small>
        </button>
      </div>

      <CdxButton weight="quiet" action="progressive" class="byoc-lens__cta" @click="openCommons">
        View on Wikimedia Commons
        <CdxIcon :icon="cdxIconLinkExternal" />
      </CdxButton>
    </template>
  </div>
</template>

<style scoped>
.byoc-image__main {
  margin: 0;
}

.byoc-image__main img {
  display: block;
  width: 100%;
  max-height: 46vh;
  object-fit: contain;
  background-color: var(--background-color-interactive-subtle);
  border-radius: var(--border-radius-base);
}

.byoc-image__main figcaption {
  margin-top: var(--spacing-50);
  color: var(--color-subtle);
}

.byoc-image__strip {
  display: flex;
  gap: var(--spacing-50);
  overflow-x: auto;
  padding-bottom: var(--spacing-25);
}

.byoc-image__pick {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-25);
  width: 76px;
  padding: var(--spacing-25);
  background: none;
  border: var(--border-width-base) solid transparent;
  border-radius: var(--border-radius-base);
  color: var(--color-subtle);
  cursor: pointer;
}

.byoc-image__pick img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: var(--border-radius-base);
}

.byoc-image__pick.is-selected {
  border-color: var(--border-color-progressive);
}
</style>
