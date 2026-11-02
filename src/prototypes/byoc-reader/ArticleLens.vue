<script setup lang="ts">
/**
 * The full Wikipedia article, rendered in-sheet with the shared in-app
 * article surface. Wiki links are intercepted and reported via `navigate`, so
 * the sheet keeps its own browsing history instead of leaving the reader;
 * non-wiki links open in a new tab.
 */
import { computed, provide } from 'vue'
import { CdxIcon } from '@wikimedia/codex'
import { cdxIconLogoWikipedia } from '@wikimedia/codex-icons'

import ArticleLive from '@/components/article/ArticleLive.vue'
import {
  PROTOWIKI_ARTICLE_WIKI_HOST,
  PROTOWIKI_IN_ARTICLE_WIKI_LINK,
} from '@/composables/useInArticleWikiLinks'

import type { ArticleFlag } from './lens'
import { articleUrl } from './wiki'
import './lens-sheet.css'

const props = defineProps<{
  /** The highlight that opened the sheet — shown as context on the first page only. */
  flag: ArticleFlag
  /** The article currently shown (top of the sheet's history). */
  title: string
}>()
const emit = defineEmits<{ navigate: [title: string] }>()

const isRoot = computed(() => props.title === props.flag.title)

provide(
  PROTOWIKI_ARTICLE_WIKI_HOST,
  computed(() => 'en.wikipedia.org'),
)
provide(PROTOWIKI_IN_ARTICLE_WIKI_LINK, {
  navigate(title) {
    const t = title?.trim()
    if (t) emit('navigate', t)
  },
  resolveUrl: (title) => (title ? articleUrl(title) : null),
})

/** Anything the wiki-link handler didn't claim (external links, files) opens in a new tab. */
function onClick(e: MouseEvent) {
  if (e.defaultPrevented) return
  const a = (e.target as Element).closest('a[href]') as HTMLAnchorElement | null
  if (!a || a.getAttribute('href')?.startsWith('#')) return
  e.preventDefault()
  window.open(a.href, '_blank', 'noopener')
}
</script>

<template>
  <div class="byoc-lens byoc-article" @click="onClick">
    <template v-if="isRoot">
      <p class="byoc-lens__kicker">
        <CdxIcon :icon="cdxIconLogoWikipedia" size="small" />
        <small>{{
          flag.match === 'passage' ? 'Related idea on Wikipedia' : 'Wikipedia article'
        }}</small>
      </p>
      <blockquote v-if="flag.match === 'passage'" class="byoc-lens__passage">
        “{{ flag.phrase }}”
      </blockquote>
    </template>

    <ArticleLive :key="title" app :article="title" />
  </div>
</template>

<style scoped>
/* No lead image → drop the app's empty 16:9 placeholder; it wastes half the sheet. */
.byoc-article :deep(.article__lead-image:not(:has(img))) {
  display: none;
}
</style>
