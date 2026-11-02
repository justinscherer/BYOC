<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { CdxIcon, CdxMessage, CdxProgressBar } from '@wikimedia/codex'
import { cdxIconLabFlask } from '@wikimedia/codex-icons'

import type { FactFlag, FactLabel } from './lens'
import { articleUrl } from './wiki'
import { checkClaim, type FactCheckResult } from './wikicheck'
import './lens-sheet.css'

const props = defineProps<{ flag: FactFlag }>()

const result = ref<FactCheckResult | null>(null)

watchEffect(async () => {
  result.value = null
  result.value = await checkClaim(props.flag)
})

const VERDICT: Record<FactLabel, { type: 'success' | 'error' | 'notice'; text: string }> = {
  SUPPORTS: { type: 'success', text: 'Supported by Wikipedia' },
  REFUTES: { type: 'error', text: 'Contradicted by Wikipedia' },
  'NOT ENOUGH INFO': { type: 'notice', text: 'Not enough information on Wikipedia' },
}

const verdict = computed(() =>
  result.value ? (VERDICT[result.value.label] ?? VERDICT['NOT ENOUGH INFO']) : null,
)
</script>

<template>
  <div class="byoc-lens">
    <p class="byoc-lens__kicker">
      <CdxIcon :icon="cdxIconLabFlask" size="small" />
      <small>Fact check</small>
    </p>

    <blockquote class="byoc-lens__passage">“{{ flag.phrase }}”</blockquote>

    <CdxProgressBar v-if="!result" inline aria-label="Checking claim" />

    <template v-else>
      <CdxMessage :type="verdict!.type">
        <strong>{{ verdict!.text }}</strong>
      </CdxMessage>

      <p>{{ flag.guidance }}</p>

      <section v-if="result.evidence.length" class="byoc-fact__evidence">
        <h4>Evidence from Wikipedia</h4>
        <figure v-for="e in result.evidence" :key="e.article + e.text" class="byoc-fact__quote">
          <blockquote>{{ e.text }}</blockquote>
          <figcaption>
            <a :href="articleUrl(e.article)" target="_blank" rel="noopener">{{ e.article }}</a>
          </figcaption>
        </figure>
      </section>

      <p class="byoc-lens__footnote">
        <small v-if="result.source === 'live'">Checked live with WikiCheck.</small>
        <small v-else>
          Claim checked: “{{ flag.claim }}” WikiCheck couldn’t be reached, so this verdict is
          simulated. Evidence sentences are pulled live from Wikipedia.
        </small>
      </p>
    </template>
  </div>
</template>

<style scoped>
.byoc-fact__evidence h4 {
  margin: var(--spacing-100) 0 var(--spacing-50);
}

.byoc-fact__quote {
  margin: 0 0 var(--spacing-75);
}

.byoc-fact__quote blockquote {
  margin: 0;
  padding: var(--spacing-50) var(--spacing-75);
  background-color: var(--background-color-interactive-subtle);
  border-radius: var(--border-radius-base);
}

.byoc-fact__quote figcaption {
  margin-top: var(--spacing-25);
}
</style>
