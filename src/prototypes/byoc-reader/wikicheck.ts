/**
 * Fact checking via WikiCheck (https://github.com/trokhymovych/WikiCheck).
 *
 * Tries the live API first — `POST {base}/get-fact-check-aggregated-base/`
 * with `{ text }`, answering `{ predicted_label, predicted_evidence: [[article, sentence], …] }`.
 * The hosted instance (nli.wmcloud.org) needs a login token and was returning
 * 503 when this was built, so on any failure we simulate: the hand-authored
 * verdict from `lens.ts` plus evidence sentences retrieved live from Wikipedia.
 *
 * Point at a self-hosted instance with `?wikicheck=http://localhost:8000`.
 */
import type { FactFlag, FactLabel } from './lens'
import { findEvidence, type EvidenceSentence } from './wiki'

const DEFAULT_BASE = 'https://nli.wmcloud.org'
const TIMEOUT_MS = 5000

export interface FactCheckResult {
  source: 'live' | 'simulated'
  label: FactLabel
  evidence: EvidenceSentence[]
}

function wikicheckBase(): string {
  return new URLSearchParams(window.location.search).get('wikicheck') || DEFAULT_BASE
}

async function checkLive(claim: string): Promise<FactCheckResult> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${wikicheckBase()}/get-fact-check-aggregated-base/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: claim }),
      signal: ctrl.signal,
    })
    if (!res.ok) throw new Error(`WikiCheck ${res.status}`)
    const d = await res.json()
    return {
      source: 'live',
      label: d.predicted_label,
      evidence: (d.predicted_evidence ?? [])
        .slice(0, 3)
        .map(([article, text]: [string, string]) => ({ article, text })),
    }
  } finally {
    clearTimeout(timer)
  }
}

async function simulate(flag: FactFlag): Promise<FactCheckResult> {
  const found = await Promise.all(
    flag.evidence.map((e) => findEvidence(e.title, e.keywords, flag.claim).catch(() => null)),
  )
  return {
    source: 'simulated',
    label: flag.label,
    evidence: found.filter(Boolean) as EvidenceSentence[],
  }
}

const cache = new Map<string, Promise<FactCheckResult>>()
/** After one failed live call, skip straight to simulation for the rest of the session. */
let liveUnavailable = false

export function checkClaim(flag: FactFlag): Promise<FactCheckResult> {
  if (!cache.has(flag.id)) {
    const live = liveUnavailable ? Promise.reject(new Error('skip')) : checkLive(flag.claim)
    cache.set(
      flag.id,
      live.catch(() => {
        liveUnavailable = true
        return simulate(flag)
      }),
    )
  }
  return cache.get(flag.id)!
}
