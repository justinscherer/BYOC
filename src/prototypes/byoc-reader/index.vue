<script setup lang="ts">
definePage({
  meta: {
    // title + description: ask the author, or omit
    platform: 'web',
  },
})

import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import MobileWrapper from '@/components/MobileWrapper.vue'

import { COGNITIVE_MERCANTILISM } from './document'
import LibraryView from './LibraryView.vue'
import ReaderView from './ReaderView.vue'

const DOCS = { [COGNITIVE_MERCANTILISM.id]: COGNITIVE_MERCANTILISM }

const route = useRoute()
const router = useRouter()

const doc = computed(() => DOCS[route.query.doc as string] ?? null)

function openDoc(id: string) {
  void router.push({ query: { ...route.query, doc: id } })
  window.scrollTo(0, 0)
}

function back() {
  const query = { ...route.query }
  delete query.doc
  void router.push({ query })
  window.scrollTo(0, 0)
}
</script>

<template>
  <MobileWrapper>
    <ReaderView v-if="doc" :doc="doc" @back="back" />
    <LibraryView v-else @open="openDoc" />
  </MobileWrapper>
</template>
