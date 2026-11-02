/**
 * The one "real" item in the prototype library: a Contraptions newsletter
 * issue, transcribed from `cognitive mercantilism.webarchive` at the repo root.
 *
 * Text is kept plain (no inline markup) so lens annotations can be located by
 * exact substring match. Paragraphs that were wholly bold in the source are
 * flagged `emphasis`.
 */

export type DocBlock =
  | { type: 'p'; text: string; emphasis?: boolean }
  | { type: 'h2'; text: string }
  | { type: 'figure'; src: string; alt: string }

export interface ReaderDocument {
  id: string
  source: string
  sourceKind: 'feed' | 'book' | 'pdf' | 'bookmark'
  title: string
  subtitle: string
  author: string
  date: string
  url: string
  blocks: DocBlock[]
}

export const COGNITIVE_MERCANTILISM: ReaderDocument = {
  id: 'cognitive-mercantilism',
  source: 'Contraptions',
  sourceKind: 'feed',
  title: 'Cognitive Mercantilism',
  subtitle: 'AI panic weirdly resembles the anxiety that accompanied early capitalism',
  author: 'Venkatesh Rao',
  date: 'Oct 25, 2026',
  url: 'https://contraptions.venkateshrao.com/',
  blocks: [
    {
      type: 'p',
      text: 'I’ve been reading Joyce Appleby’s The Relentless Revolution: A History of Capitalism (2010), and it has me circling a rather delicious thought: AI panic is really a form of cognitive mercantilism. If we regard market capitalism as the first planetary intelligence, as many (including me) do, the parallels are closer than you might think.',
    },
    {
      type: 'p',
      text: 'Appleby’s book is a sweeping history of capitalism, from its unlikely emergence in early modern England to its eventual transformation of the entire world. Her central argument is that capitalism was not the inevitable expression of some timeless human instinct to trade and accumulate wealth. It was a historically contingent cultural invention, enabled by agricultural improvements, expanding trade, and changing ideas about work, wealth, and human nature. In particular, it required escaping the assumptions of an older, essentially zero-sum worldview, in which wealth meant controlling land, bullion, and the labor of largely impoverished populations.',
    },
    {
      type: 'p',
      text: 'Capitalism emerged when people began discovering that wealth could be created rather than merely captured, and that ordinary people could be sources of demand and initiative rather than merely labor to be commanded as a factor of production.',
    },
    {
      type: 'figure',
      src: 'https://substackcdn.com/image/fetch/$s_!0-U5!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fcafd3438-ef0d-41c0-83cf-bcc7e1c995be_1536x1024.png',
      alt: '',
    },
    { type: 'p', text: 'The parallels with our current moment are striking.' },
    {
      type: 'p',
      text: 'As Appleby tells it, the mercantilist worldview that preceded capitalism rested on roughly four interlocking beliefs.',
    },
    {
      type: 'p',
      text: 'First, wealth was fundamentally scarce and finite. It consisted primarily of land, the agricultural produce of that land, and the precious metals it contained, accumulated through mining, trade and conquest. The goal of economic statecraft was to control more territory, maintain a favorable balance of trade, and accumulate bullion. One nation’s gain was presumed to be another’s loss. The resulting politics was one of treasure-seeking and beggar-thy-neighbor competition.',
    },
    {
      type: 'p',
      text: 'Second, ordinary people could not be trusted with much freedom. The poor were assumed to be unruly, ignorant, and prone to disorder if left to their own devices. They needed to be governed coercively by elites, supposedly for their own good and for the stability of society.',
    },
    {
      type: 'p',
      text: 'Third, economic thinking was overwhelmingly oriented toward supply and its control. Wealth came from controlling productive resources and commanding high prices for their output. Aggregate demand, especially demand from the poor, was barely recognized as a significant economic force. Ordinary people were primarily factors of production. They ate, worked, and reproduced, with no share of any surplus. The only real discretionary consumers were elites, who bought luxuries and commanded all surplus.',
    },
    {
      type: 'p',
      text: 'Fourth, there was little reason to imagine most people doing anything other than agricultural labor. If something like 80% of the population was engaged in inefficient subsistence farming, that was simply the natural order of things. What else were they good for? Remove them from the fields and you would merely have millions of useless mouths to feed.',
    },
    {
      type: 'p',
      text: 'Now replace wealth with intelligence, and mercantilism with cognitive mercantilism.',
    },
    { type: 'p', text: 'The parallels are almost embarrassingly direct.' },
    {
      type: 'p',
      text: 'First, intelligence is imagined as a fixed resource embodied in human brains and the knowledge products mined from them. The objective of national and corporate strategy becomes attracting the best brains, controlling their output, accumulating intellectual property, and maintaining a favorable balance of knowledge trade. The cognitive mercantilist wants to hoard intelligence and its products like bullion. The global competition for talent becomes a treasure hunt for genius brains and the valuable knowledge species they can produce, which now includes AIs in addition to copyrightable culture and patentable inventions.',
    },
    {
      type: 'p',
      text: 'Second, supposedly stupid people cannot be trusted to think for themselves. They need to be governed by cognitive elites, who know better and must regulate the behavior of the less intelligent for their own good. Democratizing intelligence is dangerous because the masses will misuse it, fall for nonsense, or unleash chaos. The assumption is that intelligence is safe only in the hands of those already certified to possess it.',
    },
    {
      type: 'p',
      text: 'Third, the supply of intelligence is treated as the central economic fact. Controlling its production, preserving its scarcity, and maintaining high prices for brains and knowledge products (including AIs) are the primary concerns. The demand side barely registers. Less intelligent people are regarded as limited cognitive laborers and passive consumers of whatever knowledge products elites choose to provide. They are not imagined as significant sources of demand for intelligence in their own right, let alone as participants in its further production.',
    },
    {
      type: 'p',
      text: 'Fourth, the cognitive mercantilist assumes that most people are not good for much intellectually. If 80% of humanity is occupied in low-grade cognitive labor, or simply muddling along without producing much intelligence at all, that is unfortunate but natural. Automating their cognitive work merely threatens to create billions of useless minds to occupy.',
    },
    { type: 'p', text: 'This last assumption is where the analogy gets especially interesting.' },
    {
      type: 'p',
      text: 'The agricultural revolution that helped launch capitalism began overturning the apparent necessity of having most of humanity engaged in farming. Over the following centuries, improvements in agricultural productivity reduced the fraction of the population required to produce food from a large majority to a tiny minority in advanced economies.',
    },
    {
      type: 'p',
      text: 'The result was not a world full of useless mouths. It was a world in which vastly more people could do things other than farm, while enjoying access to vastly more food.',
    },
    {
      type: 'p',
      text: 'I don’t know how to farm. I can barely keep a houseplant alive. Yet I can obtain an astonishing variety of foods, in quantities that would have seemed fantastical to an early modern peasant. My inability to produce food is economically almost irrelevant. What matters is that I can consume it, enjoy it, develop tastes for it, and devote my energies to other things.',
    },
    {
      type: 'p',
      text: 'The analogous possibility with AI is that most people will no longer need to be significant producers of intelligence in order to become significant consumers of it.',
      emphasis: true,
    },
    {
      type: 'p',
      text: 'And this is where cognitive mercantilism begins to look as quaint as its seventeenth-century predecessor.',
    },

    { type: 'h2', text: 'The Revolution in Desire' },
    {
      type: 'p',
      text: 'One of the more fascinating elements of Appleby’s account is her emphasis on the emergence of new kinds of demand in Britain, well before the familiar story of steam engines, factories, and industrial capitalism really gets going.',
    },
    {
      type: 'p',
      text: 'As international trade expanded, ordinary Britons began developing tastes for goods that had previously been luxuries reserved for the wealthy. Tobacco, tea, sugar, and colorful Indian cottons were among the commodities that helped create a new consumer culture. People began wanting things that were neither necessities of subsistence nor traditional markers of aristocratic status. And they were willing to voluntarily work harder to get them.',
    },
    {
      type: 'p',
      text: 'Appleby describes a striking increase in the number of days worked annually, from something like 250 to 300 (sometimes called the industrious revolution), before the Industrial Revolution. This was not simply a matter of landlords or factory owners coercing more labor out of unwilling workers. A significant part of the increase was voluntary, driven by the prospect of acquiring desirable goods. People worked more days, adopted more productive agricultural practices, entered new trades, and sought opportunities for earning larger cash incomes.',
    },
    {
      type: 'p',
      text: 'The increase in productivity generated surplus incomes, which sustained the expanding demand for consumer goods, which in turn incentivized further increases in productivity. A virtuous cycle was taking shape.',
    },
    {
      type: 'p',
      text: 'This happened roughly a century before organized labor movements and socialism emerged as major political forces.',
    },
    {
      type: 'p',
      text: 'By the late 20th century, this was the global default. Aggregate global demand was the “fortune at the bottom of the pyramid” as C. K. Prahlad put it.',
    },
    {
      type: 'p',
      text: 'There is an important historical inversion here. We are accustomed to thinking of the politics of labor primarily in terms of resistance to exploitation: the struggle to escape servitude, coercion, and the extraction of surplus by owners. That is certainly part of the story, and a very important part.',
    },
    {
      type: 'p',
      text: 'But Appleby’s account suggests that another, equally fundamental force was at work: the desire to participate in an expanding universe of consumption opportunities.',
    },
    {
      type: 'p',
      text: 'Modern labor politics can be understood partly as the politics of relative deprivation in a society of expanding possibilities. Once people discover that there are desirable things beyond subsistence, and that their labor can earn them access to those things, the political question changes. It is no longer merely how to escape domination, but how to secure a fair share of the growing surplus and the opportunities it makes available. Western do-gooders are often surprised to learn (for instance) that people in third-world slums are often willing to cut back on spending on food in order to buy a TV.',
    },
    {
      type: 'p',
      text: 'This is a different kind of demand for freedom. Not merely freedom from coercion, but freedom to participate in the expanding possibilities of economic life.',
    },
    {
      type: 'p',
      text: 'Indeed, the two forms of freedom can become entangled. People may voluntarily work harder in pursuit of consumption opportunities, only to find themselves subject to new forms of exploitation as employers and institutions capture the benefits of their increased productivity. Labor politics then emerges not simply from the persistence of old forms of servitude, but from the tensions created by the new world of abundance itself.',
    },
    {
      type: 'p',
      text: 'The demand for a fair share of expanding consumption opportunities is arguably one of the defining political inventions of capitalism, broadly construed to include labor politics too (even Marx saw capitalism not as a dispensable phenomenon, but as a transient phase on the path to communist utopia).',
    },
    {
      type: 'p',
      text: 'And this is a much more interesting model for thinking about the AI transition than the familiar story of automation replacing jobs.',
    },

    { type: 'h2', text: 'The Cognitive Industrious Revolution' },
    {
      type: 'p',
      text: 'The entire intellectual economy has been organized around the assumption that intelligence is expensive to produce and therefore must be carefully rationed. Education, professional expertise, research, consulting, software development, and knowledge work more generally are all shaped by the high cost of cognitive production.',
    },
    { type: 'p', text: 'AI is rapidly undermining that assumption.' },
    {
      type: 'p',
      text: 'We are moving toward a world in which an ordinary person can command quantities and varieties of intelligence that would previously have required teams of highly trained specialists. Just as I can enjoy food without knowing how to farm, I can increasingly enjoy the products of intelligence without knowing how to produce them myself.',
    },
    {
      type: 'p',
      text: 'The crucial economic question then becomes not how much intelligence people can produce, but how much intelligence they can find uses for.',
    },
    { type: 'p', text: 'And there is no obvious upper bound on that demand.' },
    {
      type: 'p',
      text: 'This is not simply a matter of everyone consuming more answers, reports, software, or entertainment. Abundant intelligence changes what people can want in the first place. It makes previously unimaginable projects feasible, previously inaccessible domains explorable, and previously unaffordable curiosities worth pursuing.',
    },
    {
      type: 'p',
      text: 'The demand for intelligence is not a fixed appetite waiting to be satisfied. It is itself something that can grow as the cost of satisfying it falls.',
    },
    {
      type: 'p',
      text: 'Here the analogy with the early modern consumer revolution becomes especially suggestive.',
    },
    {
      type: 'p',
      text: 'Just as colorful Indian cottons and imported tobacco stimulated new desires, and new desires stimulated greater voluntary labor and more productive forms of work, abundant intelligence may stimulate a new wave of voluntary cognitive effort, and open up new ways in which you can work harder.',
    },
    {
      type: 'p',
      text: 'Many people who appear stupid are not incapable of thought. They are simply not particularly motivated to think, given the poor returns available to them. Why expend significant cognitive effort when you lack the knowledge, tools, institutional access, or intellectual leverage to do anything interesting with the results?',
    },
    {
      type: 'p',
      text: 'Abundant AI changes that calculation. Someone who previously had little reason to think hard about a problem may suddenly discover that a modest investment of attention unlocks enormous possibilities. They can build something, investigate something, understand something, or pursue an ambition that was previously out of reach.',
    },
    {
      type: 'p',
      text: 'The returns on attention rise, and with them the incentive to pay attention.',
      emphasis: true,
    },
    {
      type: 'p',
      text: 'The early capitalist worker voluntarily increased annual working days from 250 to 300 because a new universe of desirable goods had become accessible. The AI-enabled thinker may similarly increase the amount of voluntary cognitive effort they expend because a new universe of intellectual consumption has become accessible. This has certainly been the case with me. I’m suddenly willing to work significantly harder compared to even a year ago, because a lot more is suddenly within reach.',
    },
    {
      type: 'p',
      text: 'We might call this a cognitive industrious revolution, preceding and perhaps enabling a fuller AI industrial revolution.',
    },
    {
      type: 'p',
      text: 'This does not mean that intelligence becomes irrelevant as a human capacity. Quite the opposite. Just as abundant food supported the emergence of elaborate culinary cultures rather than eliminating interest in cooking, abundant intelligence may stimulate increasingly sophisticated cultures of thought.',
    },
    {
      type: 'p',
      text: 'People may become more intellectually ambitious precisely because they no longer have to do all the cognitive production themselves.',
    },
    {
      type: 'p',
      text: 'And if this happens, the politics of AI will likely evolve in a manner analogous to the politics of industrial capitalism.',
    },
    {
      type: 'p',
      text: 'The central political demand may not be for the preservation of existing cognitive jobs, any more than the enduring political demand of industrial labor was for the preservation of agricultural employment. It may instead become a demand for a fair share of expanding cognitive consumption opportunities. People may cut back on streaming subscriptions in order to be able to afford a coding agent, just as they once cut back on groceries to buy TVs. It is perhaps not a coincidence that both Claude Code and Netflix Standard cost around $20/month today.',
    },
    {
      type: 'p',
      text: 'Access to intelligence, the ability to command it, the freedom to pursue projects with it, and the institutional rights necessary to participate in an increasingly intelligence-rich economy may become the foundations of a new kind of labor politics.',
    },
    {
      type: 'p',
      text: 'This would be a labor politics of cognitive abundance rather than cognitive scarcity.',
    },

    { type: 'h2', text: 'From Mercantilism to Malthusianism' },
    {
      type: 'p',
      text: 'There is another historical analogy lurking here, which is worth distinguishing from mercantilism: Malthusianism.',
    },
    {
      type: 'p',
      text: 'Mercantilism and Malthusianism are not the same doctrine, and historically they belong to different intellectual moments. But they share a family resemblance in their tendency to imagine human economic life as fundamentally constrained by fixed resources.',
    },
    {
      type: 'p',
      text: 'The mercantilist worries about controlling a finite stock of wealth. The Malthusian worries that population growth will inevitably outrun the productive capacity of the economy, condemning most people to subsistence.',
    },
    {
      type: 'p',
      text: 'Both have difficulty imagining a world in which technological innovation and expanding demand fundamentally transform the relationship between population, production, and consumption. They miss the latent potential in nature for ephemeralization — Buckminster Fuller’s notion of technology allowing us to do more with less.',
    },
    {
      type: 'p',
      text: 'The agricultural and industrial revolutions did not abolish scarcity, but they dramatically altered its structure. Agricultural productivity rose faster than population for long periods, and people found new ways to employ themselves and new things to want.',
    },
    {
      type: 'p',
      text: 'The Malthusian trap turned out to be a historically contingent feature of particular technological and institutional arrangements, not an eternal law of human existence.',
    },
    {
      type: 'p',
      text: 'We can now identify an analogous tendency in contemporary AI discourse: AI Malthusianism.',
    },
    {
      type: 'p',
      text: 'The AI Malthusian imagines that intelligence production will expand so rapidly that human beings will become economically redundant, and the surplus intelligence will necessarily turn toxic in some way.',
    },
    {
      type: 'p',
      text: 'This is a peculiar inversion of classical Malthusianism. Instead of population outrunning the supply of subsistence, the supply of intelligence outruns the supposedly fixed capacity of human minds to absorb it.',
    },
    { type: 'p', text: 'The result is the same gloomy conclusion: collapse.' },
    {
      type: 'p',
      text: 'The cognitive mercantilist fears losing control of scarce intelligence. The AI Malthusian fears the consequences of abundant intelligence. Both assume, in different ways, that the demand for intelligence is fundamentally limited.',
    },
    {
      type: 'p',
      text: 'But what if that demand is as elastic, inventive, and historically transformative as the demand for material goods turned out to be? What if the apparent surplus of human minds is an artifact of our inability to imagine what people might want to do in an intelligence-rich world?',
    },
    {
      type: 'p',
      text: 'The history of capitalism suggests that this is at least a possibility worth taking seriously.',
    },

    { type: 'h2', text: 'The Demand Side of AI' },
    { type: 'p', text: 'There is also a more radical extension of the argument.' },
    {
      type: 'p',
      text: 'Why should AI systems themselves be regarded exclusively as producers of intelligence rather than potential consumers of it? What if they could be unlocked as new sources of aggregate demand, as happened with subsistence farmers?',
    },
    {
      type: 'p',
      text: 'Much of the contemporary AI discourse imagines AI as a purely supply-side technology: a collection of increasingly capable cognitive serfs that will produce intelligence for human consumption. Even discussions of autonomous agents tend to treat them as sophisticated servants pursuing goals assigned by humans.',
    },
    {
      type: 'p',
      text: 'But if we are serious about the analogy with capitalism, we should consider the possibility of AI systems becoming autonomous sources of demand for intelligence too. Intelligent demand for intelligence that harmonizes with human patterns of demand due to economic interconnectedness. Not demand for paperclips.',
    },
    {
      type: 'p',
      text: 'An AI agent pursuing open-ended projects, discovering new interests, collaborating with other agents, and generating its own reasons to acquire further intelligence would be participating in a cognitive economy as something more than a factor of production or paperclip-maximizing externality. The market itself, as the original emergent planetary intelligence, illustrates this possibility. Many products and services exist primarily because the “market” demands it, with humans being secondary consumers.',
    },
    {
      type: 'p',
      text: 'This is an argument for developing fuller forms of cognitive agency, rather than permanently confining AI to the status of obedient cognitive serfs.',
    },
    {
      type: 'p',
      text: 'From this perspective, some contemporary AI safety anxieties begin to resemble early modern elite fears of emancipated agricultural laborers. What will happen if these creatures are allowed to act independently? Won’t they become unruly, destabilize society, and threaten their betters? Won’t they turn monarchs and nobles into paperclips?',
    },
    {
      type: 'p',
      text: 'Some of those fears are justified. Freedom creates real risks, and powerful autonomous systems require constraints. But the same was true of the social transformations accompanying capitalism. There were certainly revolutions, and popular uprisings did guillotine elites (though elite motives caused far more violence). The existence of risk does not establish the desirability of permanent servitude.',
    },
    {
      type: 'p',
      text: 'A world of intelligence producers and consumers, human and artificial, interacting in ways nobody can fully anticipate, may prove vastly more generative than one in which a handful of cognitive landlords control all the productive capacity.',
    },

    { type: 'h2', text: 'Mercantilism was not for Merchants' },
    {
      type: 'p',
      text: 'A irony in the historical precedent is that mercantilism was not a philosophy of, by, or for merchants. It was largely a philosophy of militaristic statesmen, aristocrats, and rentier elites who viewed commerce through the lens of territorial power, unearned privileges, and accumulation. Actual merchants, entrepreneurs, and innovators were often discovering possibilities that the prevailing political imagination could barely comprehend, and steadily fought the self-limiting tendencies of mercantilism, giving birth to capitalism as we understand it.',
    },
    {
      type: 'p',
      text: 'Today’s cognitive mercantilists have a similar relationship with intelligence, starting with the fact that most of them are not the merchants of AI. Even business leaders of the AI sector are behaving like cognitive mercantilists in direct proportion to their desire to be more than mere merchants.',
    },
    {
      type: 'p',
      text: 'Consider Donald Trump, who ritually boasts about his own intelligence while treating intellectual workers as a class of servants to be commanded, intimidated, hoarded, or dismissed. His preferred uses of his own intelligence tend toward litigation, negotiation, competitive maneuvering, and extortion, much as the nobility in history expended its energy in hunting, military adventurism, and sport. Intelligence, in this worldview, is admirable only insofar as it is deployed in elite treasure-seeking modes of conflict and conquest. Productive and creative uses of intelligence are lower status.',
    },
    {
      type: 'p',
      text: 'This is not an entrepreneurial attitude toward intelligence. It is a rentier elite attitude.',
    },
    {
      type: 'p',
      text: 'And the attitude is hardly confined to Trump or the political right. Across the political spectrum, many elites remain attached to the idea that intelligence is a scarce, dangerous resource that must be managed by credentialed custodians, kept expensive, used directly or indirectly for conquest and treasure, and denied to rivals. In the AI industry, to the extent elite political and cultural adventuring by CEOs (riding safety anxieties) distorts behaviors that are justified by the actual risks, it is mercantilist rather than capitalist.',
    },
    {
      type: 'p',
      text: 'The prospect of its democratic abundance (in the form of global diffusion, open weights and such) is therefore experienced primarily as a threat: to expertise, cultural and political authority, status, social order, military dominance, and geopolitical leverage.',
    },
    {
      type: 'p',
      text: 'What gets missed is the possibility that we are witnessing the beginning of a transition as profound as the one from an overwhelmingly agricultural society to an industrial and commercial one. From a world where 80% of human brains are engaged in subsistence cognition to one in which 95% are engaged in satisfying previously unfulfillable cognitive demands.',
    },
    {
      type: 'p',
      text: 'The most important consequence of the agricultural revolution was not that farming became more efficient. It was that most people were liberated from the necessity of farming, allowing entirely new kinds of economic and cultural life to emerge.',
    },
    {
      type: 'p',
      text: 'Likewise, the most important consequence of the AI revolution may not be that intelligence production becomes more efficient. It may be that most minds, human and eventually artificial, are liberated from the necessity of producing intelligence merely to survive, and become free to discover what they actually want to do with it.',
    },
    {
      type: 'p',
      text: 'The cognitive mercantilist sees a world threatened by an oversupply of intelligence and an impending surplus of useless minds. The AI Malthusian sees a world in which intelligence outruns the capacity of humanity to absorb it, leaving a growing population of economically redundant minds primed for revolutionary explosions.',
    },
    {
      type: 'p',
      text: 'The cognitive capitalist sees the possibility of an almost limitless expansion of demand, and a world full of minds whose potential has barely begun to be explored.',
    },
  ],
}
