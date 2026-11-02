<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { CdxButton, CdxIcon, CdxProgressBar } from '@wikimedia/codex'
import { cdxIconLinkExternal, cdxIconLogoWikipedia } from '@wikimedia/codex-icons'

import type { ArticleFlag } from './lens'
import { fetchSummary, type Summary } from './wiki'
import './lens-sheet.css'

const props = defineProps<{ flag: ArticleFlag }>()

const summary = ref<Summary | null>(null)
const error = ref(false)

watchEffect(async () => {
  summary.value = null
  error.value = false
  try {
    summary.value = await fetchSummary(props.flag.title)
  } catch {
    error.value = true
  }
})

function openArticle() {
  if (summary.value) window.open(summary.value.url, '_blank', 'noopener')
}
</script>

<template>
  <div class="byoc-lens">
    <p class="byoc-lens__kicker">
      <CdxIcon :icon="cdxIconLogoWikipedia" size="small" />
      <small>{{
        flag.match === 'passage' ? 'Related idea on Wikipedia' : 'Wikipedia article'
      }}</small>
    </p>

    <blockquote v-if="flag.match === 'passage'" class="byoc-lens__passage">
      “{{ flag.phrase }}”
    </blockquote>

    <CdxProgressBar v-if="!summary && !error" inline aria-label="Loading article" />
    <p v-else-if="error"><small>Couldn’t load this article.</small></p>

    <template v-else-if="summary">
      <img
        v-if="summary.thumbnail"
        class="byoc-lens__thumb"
        :src="summary.thumbnail.source"
        alt=""
        :width="summary.thumbnail.width"
        :height="summary.thumbnail.height"
      />
      <h3 class="byoc-lens__title">{{ summary.title }}</h3>
      <p v-if="summary.description" class="byoc-lens__desc">
        <small>{{ summary.description }}</small>
      </p>
      <p>{{ summary.extract }}</p>
      <CdxButton action="progressive" weight="primary" class="byoc-lens__cta" @click="openArticle">
        Read on Wikipedia
        <CdxIcon :icon="cdxIconLinkExternal" />
      </CdxButton>
    </template>
  </div>
</template>

<style scoped>
.byoc-lens__thumb {
  float: inline-end;
  width: 96px;
  height: auto;
  max-height: 128px;
  margin: 0 0 var(--spacing-75) var(--spacing-100);
  object-fit: cover;
  border-radius: var(--border-radius-base);
}
</style>
