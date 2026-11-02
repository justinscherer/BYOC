/**
 * The Wikipedia "lens" layered over the newsletter.
 *
 * Wizard of Oz: which phrases get flagged, and the fact-check verdicts and
 * guidance, are hand-authored here — standing in for entity linking, semantic
 * search, and WikiCheck. Everything shown *about* a flag (article summaries,
 * images across language editions, evidence sentences) is fetched live from
 * Wikipedia at tap time. Titles are validated against enwiki on load, and
 * flags whose article no longer exists are dropped.
 *
 * `phrase` must match the document text exactly; the first block containing
 * it gets the flag.
 */

export type LensKind = 'article' | 'image' | 'fact'

/** WikiCheck's three labels (see trokhymovych/WikiCheck `predicted_label`). */
export type FactLabel = 'SUPPORTS' | 'REFUTES' | 'NOT ENOUGH INFO'

interface LensBase {
  id: string
  phrase: string
}

export interface ArticleFlag extends LensBase {
  kind: 'article'
  title: string
  /** `mention`: the phrase names the topic. `passage`: semantic match on an idea. */
  match: 'mention' | 'passage'
}

export interface ImageFlag extends LensBase {
  kind: 'image'
  title: string
}

export interface FactFlag extends LensBase {
  kind: 'fact'
  /** The claim as it would be sent to WikiCheck — one checkable sentence. */
  claim: string
  /** Simulated WikiCheck verdict, used when the live service can't be reached. */
  label: FactLabel
  /** Reader-facing guidance (hand-written). */
  guidance: string
  /** Where to look for live evidence sentences when simulating. */
  evidence: { title: string; keywords: string[] }[]
}

export type LensFlag = ArticleFlag | ImageFlag | FactFlag

let n = 0
const id = (kind: string) => `${kind}-${++n}`

const article = (
  phrase: string,
  title: string,
  match: ArticleFlag['match'] = 'mention',
): ArticleFlag => ({
  id: id('a'),
  kind: 'article',
  phrase,
  title,
  match,
})

const image = (phrase: string, title: string): ImageFlag => ({
  id: id('i'),
  kind: 'image',
  phrase,
  title,
})

const fact = (f: Omit<FactFlag, 'id' | 'kind'>): FactFlag => ({ id: id('f'), kind: 'fact', ...f })

export const LENS_FLAGS: LensFlag[] = [
  // — Articles: named things —
  article('Joyce Appleby', 'Joyce Appleby'),
  article('market capitalism', 'Capitalism'),
  article('zero-sum', 'Zero-sum game'),
  article('factor of production', 'Factors of production'),
  article('mercantilist worldview', 'Mercantilism'),
  article('balance of trade', 'Balance of trade'),
  article('beggar-thy-neighbor', 'Beggar thy neighbour'),
  article('Aggregate demand', 'Aggregate demand'),
  article('subsistence farming', 'Subsistence agriculture'),
  article('intellectual property', 'Intellectual property'),
  article('agricultural revolution', 'British Agricultural Revolution'),
  article('consumer culture', 'Consumer revolution'),
  article('industrious revolution', 'Industrious Revolution'),
  article('Industrial Revolution', 'Industrial Revolution'),
  article('organized labor movements', 'Labour movement'),
  article('socialism', 'Socialism'),
  article('fortune at the bottom of the pyramid', 'Bottom of the pyramid'),
  article('C. K. Prahlad', 'C. K. Prahalad'),
  article('relative deprivation', 'Relative deprivation'),
  article('Marx', 'Karl Marx'),
  article('knowledge work', 'Knowledge worker'),
  article('Claude Code', 'Claude (AI)'),
  article('Netflix', 'Netflix'),
  article('Malthusianism', 'Malthusianism'),
  article('ephemeralization', 'Ephemeralization'),
  article('Buckminster Fuller', 'Buckminster Fuller'),
  article('Malthusian trap', 'Malthusianism'),
  article('cognitive serfs', 'Serfdom'),
  article('paperclip-maximizing', 'Instrumental convergence'),
  article('AI safety', 'AI safety'),
  article('rentier elites', 'Rentier capitalism'),
  article('Donald Trump', 'Donald Trump'),
  article('open weights', 'Open-source artificial intelligence'),

  // — Articles: semantic matches on whole ideas —
  article('the first planetary intelligence', 'Global brain', 'passage'),
  article('wealth could be created rather than merely captured', 'Economic growth', 'passage'),
  article('The global competition for talent', 'Human capital flight', 'passage'),
  article(
    'intelligence is safe only in the hands of those already certified to possess it',
    'Credentialism and degree inflation',
    'passage',
  ),
  article(
    'Not merely freedom from coercion, but freedom to participate in the expanding possibilities of economic life',
    'Positive liberty',
    'passage',
  ),
  article(
    'the familiar story of automation replacing jobs',
    'Technological unemployment',
    'passage',
  ),
  article(
    'It is itself something that can grow as the cost of satisfying it falls.',
    'Jevons paradox',
    'passage',
  ),
  article(
    'The market itself, as the original emergent planetary intelligence',
    'Spontaneous order',
    'passage',
  ),

  // — Images —
  image('bullion', 'Bullion'),
  image('houseplant', 'Houseplant'),
  image('early modern peasant', 'Peasant'),
  image('steam engines', 'Steam engine'),
  image('colorful Indian cottons', 'Calico'),
  image('guillotine', 'Guillotine'),

  // — Fact checks —
  fact({
    phrase: 'Joyce Appleby’s The Relentless Revolution: A History of Capitalism (2010)',
    claim:
      'Joyce Appleby wrote The Relentless Revolution: A History of Capitalism, published in 2010.',
    label: 'SUPPORTS',
    guidance:
      'Wikipedia lists the book among Appleby’s works, published by W. W. Norton in 2010. Appleby was an American historian of capitalism and the early United States.',
    evidence: [{ title: 'Joyce Appleby', keywords: ['Relentless Revolution'] }],
  }),
  fact({
    phrase:
      'If something like 80% of the population was engaged in inefficient subsistence farming, that was simply the natural order of things.',
    claim: 'Before industrialisation, around 80% of the population worked as subsistence farmers.',
    label: 'SUPPORTS',
    guidance:
      'Broadly consistent. Wikipedia cites an estimate that about 85% of people in the Middle Ages were peasants. Shares fell over the early modern period and varied a lot by country, so treat “80%” as a rough figure.',
    evidence: [{ title: 'Peasant', keywords: ['85%', 'majority of the people'] }],
  }),
  fact({
    phrase:
      'Over the following centuries, improvements in agricultural productivity reduced the fraction of the population required to produce food from a large majority to a tiny minority in advanced economies.',
    claim:
      'Rising agricultural productivity reduced the share of the population needed to produce food from a majority to a small minority.',
    label: 'SUPPORTS',
    guidance:
      'Supported in outline. Wikipedia notes agriculture still employs the largest share of people in poorer countries, while US farm output roughly tripled between 1948 and 2023 with almost no increase in inputs.',
    evidence: [
      {
        title: 'Agricultural productivity',
        keywords: ['greatest portion of the population', 'output increased'],
      },
    ],
  }),
  fact({
    phrase:
      'Appleby describes a striking increase in the number of days worked annually, from something like 250 to 300 (sometimes called the industrious revolution), before the Industrial Revolution.',
    claim:
      'Before the Industrial Revolution, the number of days worked per year rose from about 250 to about 300.',
    label: 'SUPPORTS',
    guidance:
      'Mostly supported, but contested. Wikipedia reports estimates of 250–260 working days in fifteenth-century Europe and some workers at 300 days before 1750. It also notes historians Gregory Clark and Ysbrand Van Der Werf found no evidence of an increase.',
    evidence: [
      { title: 'Industrious Revolution', keywords: ['250-260 working days'] },
      { title: 'Industrious Revolution', keywords: ['some people were working 300 days'] },
    ],
  }),
  fact({
    phrase:
      'This happened roughly a century before organized labor movements and socialism emerged as major political forces.',
    claim:
      'The industrious revolution happened about a century before labour movements and socialism became major political forces.',
    label: 'NOT ENOUGH INFO',
    guidance:
      'Depends on the dates you pick. Wikipedia places the industrious revolution around 1600–1800, and the labour movement and socialism alongside the Industrial Revolution (about 1760–1830 onward). The gap could be anywhere from zero to two centuries.',
    evidence: [
      { title: 'Industrious Revolution', keywords: ['1600 to 1800'] },
      { title: 'Labour movement', keywords: ['at about the same time as socialism', '1760–1830'] },
    ],
  }),
  fact({
    phrase:
      'Aggregate global demand was the “fortune at the bottom of the pyramid” as C. K. Prahlad put it.',
    claim: 'The phrase “fortune at the bottom of the pyramid” comes from C. K. Prahalad.',
    label: 'SUPPORTS',
    guidance:
      'Supported — it is the title of Prahalad’s 2004 book. Note the spelling: Wikipedia has “Prahalad”, not “Prahlad”.',
    evidence: [{ title: 'C. K. Prahalad', keywords: ['Fortune at the Bottom of the Pyramid'] }],
  }),
  fact({
    phrase:
      'even Marx saw capitalism not as a dispensable phenomenon, but as a transient phase on the path to communist utopia',
    claim: 'Marx saw capitalism as a transitory stage of history leading toward communism.',
    label: 'SUPPORTS',
    guidance:
      'Supported. Wikipedia’s article on historical materialism describes capitalism, for Marx, as a specific, transitory mode of production whose contradictions contain the potential for a communist society.',
    evidence: [
      {
        title: 'Historical materialism',
        keywords: ['transitory mode of production', 'potential for a communist society'],
      },
    ],
  }),
  fact({
    phrase:
      'It is perhaps not a coincidence that both Claude Code and Netflix Standard cost around $20/month today.',
    claim: 'Claude Code and Netflix Standard both cost around $20 per month.',
    label: 'NOT ENOUGH INFO',
    guidance:
      'Wikipedia doesn’t track current subscription prices, so this can’t be checked here. Prices change often and vary by country — check each company’s own pricing page.',
    evidence: [{ title: 'Netflix', keywords: ['per month'] }],
  }),
  fact({
    phrase: 'Buckminster Fuller’s notion of technology allowing us to do more with less',
    claim: 'Ephemeralization is Buckminster Fuller’s term for technology doing more with less.',
    label: 'SUPPORTS',
    guidance: 'Supported. Fuller coined the term in 1938.',
    evidence: [{ title: 'Ephemeralization', keywords: ['more and more with less'] }],
  }),
  fact({
    phrase: 'mercantilism was not a philosophy of, by, or for merchants',
    claim: 'Mercantilism was not a philosophy of merchants.',
    label: 'REFUTES',
    guidance:
      'Wikipedia points the other way. Almost all mercantilist writers were merchants or government officials, and key English writers such as Thomas Mun were merchants. Adam Smith called the system a conspiracy by manufacturers and merchants. The author’s wider point about statesmen and elites is arguable, but “not for merchants” overstates it.',
    evidence: [
      {
        title: 'Mercantilism',
        keywords: ['were merchants', 'English merchant Thomas Mun', 'manufacturers and merchants'],
      },
    ],
  }),
]

export const LENS_KIND_LABEL: Record<LensKind, string> = {
  article: 'Articles',
  image: 'Images',
  fact: 'Fact checks',
}
