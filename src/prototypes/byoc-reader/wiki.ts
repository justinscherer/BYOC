/**
 * Live Wikipedia reads for the lens bottom sheet. Anonymous, read-only,
 * cached per title for the session.
 */

const EN = 'https://en.wikipedia.org'

function actionUrl(host: string, params: Record<string, string>): string {
  const q = new URLSearchParams({ format: 'json', formatversion: '2', origin: '*', ...params })
  return `${host}/w/api.php?${q}`
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

function memo<A extends string, R>(fn: (key: A) => Promise<R>): (key: A) => Promise<R> {
  const cache = new Map<string, Promise<R>>()
  return (key) => {
    if (!cache.has(key)) {
      const p = fn(key)
      p.catch(() => cache.delete(key))
      cache.set(key, p)
    }
    return cache.get(key)!
  }
}

export const articleUrl = (title: string, host = EN) =>
  `${host}/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`

/**
 * Resolve titles (following redirects) against enwiki. Returns input title →
 * canonical title, or `null` when the page doesn't exist.
 */
export async function resolveTitles(titles: string[]): Promise<Map<string, string | null>> {
  const unique = [...new Set(titles)]
  const out = new Map<string, string | null>()
  for (let i = 0; i < unique.length; i += 50) {
    const batch = unique.slice(i, i + 50)
    const data = await getJson<any>(
      actionUrl(EN, { action: 'query', redirects: '1', titles: batch.join('|') }),
    )
    const q = data.query ?? {}
    const hop = new Map<string, string>()
    for (const r of [...(q.normalized ?? []), ...(q.redirects ?? [])]) hop.set(r.from, r.to)
    const exists = new Map<string, boolean>(
      (q.pages ?? []).map((p: any) => [p.title, !p.missing && !p.invalid]),
    )
    for (const t of batch) {
      let cur = t
      for (let guard = 0; hop.has(cur) && guard < 4; guard++) cur = hop.get(cur)!
      out.set(t, exists.get(cur) ? cur : null)
    }
  }
  return out
}

export interface Summary {
  title: string
  description?: string
  extract: string
  thumbnail?: { source: string; width: number; height: number }
  url: string
}

export const fetchSummary = memo(async (title: string): Promise<Summary> => {
  const d = await getJson<any>(
    `${EN}/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`,
  )
  return {
    title: d.title,
    description: d.description,
    extract: d.extract,
    thumbnail: d.thumbnail,
    url: d.content_urls?.mobile?.page ?? articleUrl(title),
  }
})

/** Languages to sample when gathering lead images, in display order. */
const IMAGE_LANGS = [
  'de',
  'fr',
  'es',
  'it',
  'ja',
  'ru',
  'zh',
  'pt',
  'nl',
  'pl',
  'ar',
  'uk',
  'sv',
  'ko',
  'fa',
  'hi',
]

export interface LensImage {
  file: string
  thumb: string
  /** Language editions where this file is the article's lead image. */
  langs: { lang: string; title: string }[]
  commonsUrl: string
}

/**
 * Lead images for one topic across Wikipedia language editions: enwiki gives
 * the interlanguage links, then each edition's own `pageimages` lead image.
 * Files are de-duplicated, so the result shows how different editions
 * illustrate the same topic.
 */
export const fetchCrossLanguageImages = memo(
  async (title: string): Promise<{ images: LensImage[]; editions: number }> => {
    const en = await getJson<any>(
      actionUrl(EN, {
        action: 'query',
        redirects: '1',
        titles: title,
        prop: 'pageimages|langlinks',
        piprop: 'thumbnail|name',
        pithumbsize: '640',
        lllimit: 'max',
      }),
    )
    const page = en.query?.pages?.[0] ?? {}
    const langlinks: { lang: string; title: string }[] = page.langlinks ?? []
    const sampled = IMAGE_LANGS.map((lang) => langlinks.find((l) => l.lang === lang)).filter(
      Boolean,
    ) as {
      lang: string
      title: string
    }[]

    const byFile = new Map<string, LensImage>()
    const add = (lang: string, t: string, p: any) => {
      if (!p?.pageimage || !p.thumbnail?.source) return
      const file: string = p.pageimage
      if (!byFile.has(file)) {
        byFile.set(file, {
          file,
          thumb: p.thumbnail.source,
          langs: [],
          commonsUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`,
        })
      }
      byFile.get(file)!.langs.push({ lang, title: t })
    }

    add('en', page.title, page)
    const others = await Promise.allSettled(
      sampled.map(async (l) => {
        const d = await getJson<any>(
          actionUrl(`https://${l.lang}.wikipedia.org`, {
            action: 'query',
            redirects: '1',
            titles: l.title,
            prop: 'pageimages',
            piprop: 'thumbnail|name',
            pithumbsize: '640',
          }),
        )
        return { l, p: d.query?.pages?.[0] }
      }),
    )
    for (const r of others)
      if (r.status === 'fulfilled') add(r.value.l.lang, r.value.l.title, r.value.p)

    return { images: [...byFile.values()], editions: langlinks.length + 1 }
  },
)

const fetchPlainText = memo(async (title: string): Promise<string> => {
  const d = await getJson<any>(
    actionUrl(EN, {
      action: 'query',
      redirects: '1',
      titles: title,
      prop: 'extracts',
      explaintext: '1',
    }),
  )
  return d.query?.pages?.[0]?.extract ?? ''
})

export interface EvidenceSentence {
  article: string
  text: string
}

/**
 * Pick the best-matching sentence from an article for a claim — a stand-in for
 * WikiCheck's sentence retrieval. Keywords dominate the score; plain word
 * overlap with the claim breaks ties.
 */
export async function findEvidence(
  title: string,
  keywords: string[],
  claim: string,
): Promise<EvidenceSentence | null> {
  const text = await fetchPlainText(title)
  const sentences = text
    .replace(/\n+==+[^=]+==+\n*/g, '\n')
    // Sentence ends need a lowercase letter/digit before the stop, so initials ("W. W. Norton") don't split.
    .split(/(?<=[a-z0-9)%”"][.!?])\s+(?=[A-Z“"(])|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30)

  const claimWords = new Set(claim.toLowerCase().match(/[a-z]{4,}/g) ?? [])
  let best: { s: string; score: number } | null = null
  for (const s of sentences) {
    const lower = s.toLowerCase()
    let score = 0
    for (const k of keywords) if (lower.includes(k.toLowerCase())) score += 10
    for (const w of lower.match(/[a-z]{4,}/g) ?? []) if (claimWords.has(w)) score += 1
    if (!best || score > best.score) best = { s, score }
  }
  if (!best || best.score < 10) return null
  return { article: title, text: clip(best.s, keywords) }
}

/** Long run-on "sentences" (lists, bibliographies) get windowed around the first keyword hit. */
function clip(s: string, keywords: string[], max = 320): string {
  if (s.length <= max) return s
  const lower = s.toLowerCase()
  const hit = keywords.map((k) => lower.indexOf(k.toLowerCase())).filter((i) => i >= 0)
  const at = hit.length ? Math.min(...hit) : 0
  const start = Math.max(0, at - 120)
  const end = Math.min(s.length, start + max)
  return `${start > 0 ? '…' : ''}${s.slice(start, end).trim()}${end < s.length ? '…' : ''}`
}
