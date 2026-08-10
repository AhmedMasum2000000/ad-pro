/**
 * News and long-form articles.
 *
 * The FAQ layer answers a question someone typed. This layer covers the
 * subjects nobody phrases as a question but everybody searches around —
 * seasonal planning, sector playbooks, the state of the medium, how the
 * network is changing. Different search intent, different shape: dated,
 * bylined, and written to be read start to finish rather than skimmed for
 * one paragraph.
 *
 * The blocks are the same primitives the FAQ uses, so both layers share one
 * renderer and one set of styles.
 *
 * Same three rules as the answers: no rates, no invented citations, and no
 * page that exists only to hold a keyword. Where an article states a figure
 * about our own network it comes from src/data/boards.json.
 */

import type { FaqBlock } from './faq';

export type ArticleBlock = FaqBlock;

export type ArticleTopic =
  | 'Industry'
  | 'Planning'
  | 'Sector guides'
  | 'Network news';

export interface Article {
  slug: string;
  title: string;
  /** Shorter headline for cards and rails. */
  shortTitle: string;
  topic: ArticleTopic;
  /** ISO date. Drives the Article schema and the visible dateline. */
  published: string;
  /** One or two sentences under the headline on the card and the page. */
  standfirst: string;
  metaDescription: string;
  keywords: string[];
  /** Minutes, stated on the card so the reader can decide. */
  readingMinutes: number;
  body: ArticleBlock[];
  /** Slugs of other articles. */
  related: string[];
  /** FAQ slugs this article should hand off to. */
  answers: string[];
  cities?: string[];
}

export const articles: Article[] = [
  {
    slug: 'ramadan-eid-outdoor-advertising-bangladesh',
    title: 'Planning outdoor advertising around Ramadan and Eid in Bangladesh',
    shortTitle: 'Advertising around Ramadan and Eid',
    topic: 'Planning',
    published: '2026-01-14',
    standfirst:
      'The busiest and strangest weeks in the Bangladeshi out-of-home calendar. Traffic patterns invert, demand spikes, and the brands that plan backwards from Chand Raat get the sites the rest are still asking about.',
    metaDescription:
      'How to plan billboard advertising around Ramadan and Eid in Bangladesh: when traffic shifts, when to book, and what actually works on a screen during Iftar week.',
    keywords: [
      'Ramadan advertising Bangladesh',
      'Eid billboard campaign',
      'seasonal OOH planning',
      'Chand Raat advertising',
    ],
    readingMinutes: 7,
    body: [
      {
        kind: 'p',
        text: 'If you only run one out-of-home campaign a year in Bangladesh, this is probably the window. It is also the one where the usual rules bend hardest, so it repays a bit of planning.',
      },
      { kind: 'h2', text: 'The traffic inverts, and most plans ignore it' },
      {
        kind: 'p',
        text: 'For eleven months of the year the shape of a Dhaka day is familiar: a heavy morning peak, a grinding evening one. During Ramadan that changes. The morning softens. The pre-Iftar window becomes the most concentrated movement of the day — everybody trying to get somewhere before the call. And then, remarkably, the city comes back out afterwards, and stays out late.',
      },
      {
        kind: 'p',
        text: 'A media plan built on ordinary commute assumptions will therefore put its weight in the wrong hours. On digital, that is a scheduling fix rather than a booking one — which is one of the strongest arguments for taking screens rather than print in this period.',
      },
      {
        kind: 'table',
        caption: 'How a Ramadan day differs from an ordinary one',
        head: ['Window', 'Ordinary week', 'During Ramadan'],
        rows: [
          ['Morning', 'Heaviest peak', 'Lighter, later start'],
          ['Midday', 'Steady errands', 'Quiet'],
          ['Pre-Iftar', 'Unremarkable', 'The densest movement of the day'],
          ['Post-Iftar', 'Winding down', 'Second peak — social, retail, family'],
          ['Late night', 'Thin', 'Substantial, especially the last ten days'],
        ],
      },
      { kind: 'h2', text: 'Book earlier than feels necessary' },
      {
        kind: 'p',
        text: 'The best faces for this window are usually gone weeks before it opens. If you are ringing around in the second week of Ramadan you are choosing from what is left, and what is left is left for a reason.',
      },
      {
        kind: 'p',
        text: 'My rule of thumb: have the sites confirmed before Ramadan begins, and have the artwork approved a week before that. It sounds early. It is the difference between the position you wanted and the position you settled for.',
      },
      {
        kind: 'photo',
        board: 'dhaka-gulshan-circle-2-east-side-rob-super-market',
        caption:
          'Gulshan Circle-2 — the kind of face that is spoken for long before the season starts.',
      },
      { kind: 'h2', text: 'What to actually say' },
      {
        kind: 'p',
        text: 'Two failure modes, both common. The first is generic goodwill: a greeting, a moon, a logo, nothing else. Warm, forgettable, indistinguishable from the nine other brands doing the same thing on the same road.',
      },
      {
        kind: 'p',
        text: 'The second is the opposite — cramming a full retail offer into a moment when people are not shopping, they are commuting to break a fast.',
      },
      {
        kind: 'ul',
        items: [
          '<strong>Pre-Iftar hours:</strong> immediacy. What is open, what is near, what can be collected on the way home.',
          '<strong>Post-Iftar and late:</strong> the softer work — family, gifting, the brand rather than the offer.',
          '<strong>The last ten days:</strong> shopping intent peaks. This is where a straight retail message earns its place.',
          '<strong>Chand Raat and Eid:</strong> greetings work, but only if the brand is unmistakably yours at a glance.',
        ],
      },
      {
        kind: 'note',
        text: 'Day-parting costs nothing extra in media on digital — the same booking can carry two files. It is the single most under-used capability in this market.',
      },
      { kind: 'h2', text: 'And the week after' },
      {
        kind: 'p',
        text: 'Everybody stops on Eid. The city empties, then refills, and for about a week afterwards the roads are quieter and the screens are cheaper to hold. If your category has any post-Eid relevance — travel, home, electronics, anything bought with Eid money — that lull is quietly one of the better-value windows in the year.',
      },
      {
        kind: 'cta',
        text: 'Planning for the season? The good sites go early — tell us the dates now.',
      },
    ],
    related: [
      'dhaka-traffic-and-why-billboards-work',
      'fmcg-brands-outdoor-advertising-bangladesh',
      'ooh-advertising-trends-bangladesh',
    ],
    answers: [
      'best-time-of-day-for-billboard-advertising',
      'how-quickly-can-a-billboard-go-live',
      'billboard-advertising-cost-bangladesh',
    ],
  },

  {
    slug: 'dhaka-traffic-and-why-billboards-work',
    title: 'Why Dhaka traffic makes billboards work harder than almost anywhere',
    shortTitle: 'Dhaka traffic and dwell time',
    topic: 'Industry',
    published: '2026-02-03',
    standfirst:
      'The thing everyone complains about is the thing that makes the medium work. A stationary audience at a signalled junction is worth more per second than a motorway doing sixty — and Dhaka produces that condition all day.',
    metaDescription:
      'Dhaka traffic is why billboard advertising works here. How dwell time, approach angles and signalled junctions turn congestion into attention.',
    keywords: [
      'Dhaka traffic advertising',
      'billboard dwell time',
      'outdoor advertising Dhaka',
      'OOH attention',
    ],
    cities: ['dhaka'],
    readingMinutes: 6,
    body: [
      {
        kind: 'p',
        text: 'There is a slightly uncomfortable truth at the centre of out-of-home in this city, and it is worth saying plainly: our medium is subsidised by everybody else’s misery.',
      },
      {
        kind: 'p',
        text: 'Nobody enjoys forty minutes at Mohakhali. But those forty minutes are, in media terms, extraordinary. Attention is the scarcest commodity in advertising, and Dhaka manufactures it by the hour.',
      },
      { kind: 'h2', text: 'Volume is the wrong metric' },
      {
        kind: 'p',
        text: 'Buyers new to the medium ask for the busiest road. It is intuitive and it is wrong, because volume and attention are different things and they often point in opposite directions.',
      },
      {
        kind: 'table',
        caption: 'The same audience, two different conditions',
        head: ['Condition', 'Vehicles', 'Time in view', 'What lands'],
        rows: [
          ['Fast arterial road', 'Very high', 'Under two seconds', 'A logo, at best'],
          ['Signalled junction', 'Lower', 'Thirty seconds to two minutes', 'A logo, a line, and a second look'],
          ['Flyover approach', 'High', 'Three to six seconds', 'A strong single idea'],
          ['Market or bazaar road', 'Moderate, slow', 'Sustained, repeated', 'Detail, and genuine recall'],
        ],
      },
      {
        kind: 'p',
        text: 'A junction that queues gives you the one thing no other medium can guarantee: a person with nothing else to look at.',
      },
      {
        kind: 'photo',
        board: 'dhaka-mohakhali-rail-crossing',
        caption:
          'Mohakhali rail crossing. A barrier down is thirty seconds nobody can skip.',
      },
      { kind: 'h2', text: 'The angle matters as much as the address' },
      {
        kind: 'p',
        text: 'Two screens can sit at the same junction and perform completely differently, because one faces the queue and the other faces the traffic already moving away. When we list a site as "facing Gulshan 2 and Mohakhali", that is not decoration — it tells you which flow of people has it in view, and for how long.',
      },
      {
        kind: 'p',
        text: 'This is the single most common planning mistake I see. A brand books a famous junction, takes whichever face was free, and reaches the people leaving rather than the people arriving.',
      },
      { kind: 'h2', text: 'What this means for your creative' },
      {
        kind: 'p',
        text: 'If you have genuinely bought dwell time, you can afford one more beat than the usual seven-word rule allows — a second line, a price, a location. Not a paragraph. But the standard advice, which is written for motorway media in countries where traffic moves, is slightly too austere for a Dhaka signal.',
      },
      {
        kind: 'note',
        text: 'Every site page states which direction the face is pointing and what its on-air window is. Between those two facts you can work out who sees it and when, before anyone visits.',
      },
      {
        kind: 'cta',
        text: 'Tell us which side of the city your customers come from and we will find the face that catches them.',
      },
    ],
    related: [
      'ooh-advertising-trends-bangladesh',
      'ramadan-eid-outdoor-advertising-bangladesh',
      'regional-cities-outdoor-advertising-bangladesh',
    ],
    answers: [
      'best-billboard-locations-in-dhaka',
      'how-to-design-a-billboard-that-works',
      'what-is-ooh-advertising',
    ],
  },

  {
    slug: 'ooh-advertising-trends-bangladesh',
    title: 'What is changing in Bangladeshi out-of-home advertising',
    shortTitle: 'What is changing in OOH',
    topic: 'Industry',
    published: '2026-03-02',
    standfirst:
      'Print is not dying, but it is being asked to do a narrower job. The shift to LED has changed how campaigns are bought, how quickly they can change, and — most usefully — what an advertiser can prove afterwards.',
    metaDescription:
      'Out-of-home advertising trends in Bangladesh: the shift to LED, day-part buying, proof-of-play, and what it means for how you plan a campaign.',
    keywords: [
      'OOH advertising trends Bangladesh',
      'digital out of home',
      'LED billboard growth',
      'outdoor advertising industry',
    ],
    readingMinutes: 7,
    body: [
      {
        kind: 'p',
        text: 'Ten years ago a billboard campaign in this country was a printed skin, a mounting crew and a photograph to prove it went up. Today a substantial share of the good positions are screens, and that changes more than it first appears.',
      },
      { kind: 'h2', text: 'One: the unit of sale changed' },
      {
        kind: 'p',
        text: 'Print sells space for a month. LED sells time by the day. That single difference is why out-of-home is now reachable for advertisers who could never have justified a printed face — a restaurant group, a clinic, a coaching centre, a single showroom.',
      },
      {
        kind: 'p',
        text: 'It also means budget behaves differently. On print, you decide how many faces. On digital, you decide how many faces <em>and</em> how many minutes <em>and</em> how many days, which is three levers instead of one and a great deal more room to fit a real budget.',
      },
      { kind: 'h2', text: 'Two: campaigns became editable' },
      {
        kind: 'p',
        text: 'A printed campaign is a decision you live with. A screen campaign is a decision you can revise on Tuesday afternoon. Prices change, stock runs out, a competitor moves — and for the first time the roadside can respond within hours.',
      },
      {
        kind: 'p',
        text: 'Very few advertisers here use this yet. The ones that do — running one file before noon and a different one after — get noticeably more out of the same money.',
      },
      {
        kind: 'table',
        caption: 'What moved, and what it changed',
        head: ['Then', 'Now', 'Consequence'],
        rows: [
          ['Space, by the month', 'Time, by the day', 'A far lower entry point'],
          ['One creative per run', 'Change it the same day', 'Offers and dates become viable'],
          ['One message all day', 'Different message by hour', 'Morning and evening can differ'],
          ['A photo as proof', 'A played-spot log', 'Delivery is auditable, not asserted'],
          ['Book weeks ahead', 'Live in 24-48 hours', 'Reactive campaigns are possible'],
        ],
      },
      { kind: 'h2', text: 'Three: proof got harder to fudge' },
      {
        kind: 'p',
        text: 'This is the change I would argue matters most, and it gets the least attention. A printed face was verified by a photograph — which tells you it was up on the day somebody visited, and nothing about the other twenty-nine days.',
      },
      {
        kind: 'p',
        text: 'A screen produces a log: every slot, every time it played. An advertiser can audit delivery rather than trust it. In a market where out-of-home has historically been sold on relationships, that is a quiet but genuine shift in the balance of power, and it is good for everyone who intends to deliver what they sold.',
      },
      {
        kind: 'photo',
        board: 'dhaka-sks-tower-flyover-view-mohakhali',
        caption: 'SKS Tower, Mohakhali — 1,500 sq ft, and every second of it logged.',
      },
      { kind: 'h2', text: 'What has not changed' },
      {
        kind: 'p',
        text: 'The fundamentals, which is reassuring. Position still beats everything. A brilliant creative on a poor face loses to a plain one on a great face. Frequency still does the work. And a crowded design still fails at forty metres regardless of how many pixels are behind it.',
      },
      {
        kind: 'cta',
        text: 'Wondering what this means for your next campaign? Ask us — we will tell you what we would do.',
      },
    ],
    related: [
      'dhaka-traffic-and-why-billboards-work',
      'regional-cities-outdoor-advertising-bangladesh',
      'fmcg-brands-outdoor-advertising-bangladesh',
    ],
    answers: [
      'digital-vs-static-billboards',
      'how-to-measure-billboard-results',
      'how-led-billboards-work',
    ],
  },

  {
    slug: 'fmcg-brands-outdoor-advertising-bangladesh',
    title: 'An out-of-home playbook for FMCG brands in Bangladesh',
    shortTitle: 'OOH for FMCG brands',
    topic: 'Sector guides',
    published: '2026-03-24',
    standfirst:
      'Fast-moving consumer goods live or die on distribution and mental availability. Out-of-home is unusually good at the second and, in this market, quietly useful for the first.',
    metaDescription:
      'How FMCG brands should buy outdoor advertising in Bangladesh: mental availability, trade visibility, regional coverage and what to put on the screen.',
    keywords: [
      'FMCG advertising Bangladesh',
      'consumer brand billboard',
      'trade marketing OOH',
      'distribution advertising',
    ],
    readingMinutes: 6,
    body: [
      {
        kind: 'p',
        text: 'FMCG is the category out-of-home was arguably invented for, and it is still the one that uses it best. The reason is not glamour. It is that people do not research a packet of biscuits.',
      },
      { kind: 'h2', text: 'You are buying mental availability' },
      {
        kind: 'p',
        text: 'A shopper standing at a shelf makes a decision in about two seconds, mostly from memory. Nobody compares four brands of soap. What wins is whichever name feels most familiar at the moment of reaching.',
      },
      {
        kind: 'p',
        text: 'Out-of-home builds exactly that: broad, repeated, low-effort familiarity across an entire city. It is not a performance channel and pretending otherwise leads to disappointment — but as a machine for making a name feel normal, it is very hard to beat.',
      },
      { kind: 'h2', text: 'The under-rated second benefit: the trade sees it' },
      {
        kind: 'p',
        text: 'Here is something that rarely makes it into a media plan. Your distributors, your wholesalers and the retailers who decide how much shelf you get all drive past the same billboards as everybody else.',
      },
      {
        kind: 'p',
        text: 'A visible presence in a regional market does measurable work in a negotiation with the trade in that market. Salespeople will tell you this long before a media agency does.',
      },
      {
        kind: 'table',
        caption: 'How an FMCG plan usually breaks down',
        head: ['Objective', 'Where to put it', 'What to say'],
        rows: [
          ['National familiarity', 'High-dwell Dhaka junctions', 'Brand, pack, one line'],
          ['Trade support', 'Regional city centres', 'Brand and pack, prominently'],
          ['New variant launch', 'Digital, short and heavy', 'The new thing, unmistakably'],
          ['Seasonal push', 'Digital, day-parted', 'Occasion-led message'],
          ['Defending a position', 'The junction your rival holds', 'Category-leading confidence'],
        ],
      },
      {
        kind: 'photo',
        board: 'dhaka-mirpur-10-circle-4-screens',
        caption: 'Mirpur-10 Circle. Dense, mass-market, and exactly where an FMCG name should be familiar.',
      },
      { kind: 'h2', text: 'Put the pack on it' },
      {
        kind: 'p',
        text: 'The single most reliable piece of FMCG out-of-home advice, and the one most often argued away in a design review: show the packaging, large, exactly as it appears on the shelf.',
      },
      {
        kind: 'p',
        text: 'Recognition at the shelf is the entire mechanism. A beautifully art-directed abstract execution that does not show the pack is asking the shopper to do a translation they will not do.',
      },
      {
        kind: 'note',
        text: 'Regional sites are typically the most efficient reach in the network — a single face covers far more of Cumilla or Rangpur than any one site covers of Dhaka.',
      },
      {
        kind: 'cta',
        text: 'Building a national FMCG plan? Send us the priority markets and we will map what is available in each.',
      },
    ],
    related: [
      'regional-cities-outdoor-advertising-bangladesh',
      'ramadan-eid-outdoor-advertising-bangladesh',
      'ooh-advertising-trends-bangladesh',
    ],
    answers: [
      'how-to-design-a-billboard-that-works',
      'billboard-advertising-in-chattogram',
      'billboard-advertising-vs-online-ads',
    ],
  },

  {
    slug: 'regional-cities-outdoor-advertising-bangladesh',
    title: 'Beyond Dhaka: buying out-of-home in Bangladesh’s regional cities',
    shortTitle: 'Buying beyond Dhaka',
    topic: 'Planning',
    published: '2026-04-11',
    standfirst:
      'Regional markets are usually planned last and bought worst. They are also, per taka of reach, the most efficient inventory in the country — and they behave nothing like a smaller Dhaka.',
    metaDescription:
      'How to buy billboard advertising in Bangladesh’s regional cities — Chattogram, Sylhet, Rajshahi, Rangpur, Bogura, Cumilla and Cox’s Bazar.',
    keywords: [
      'regional advertising Bangladesh',
      'billboard Rajshahi Rangpur Bogura',
      'Cox’s Bazar advertising',
      'national OOH plan',
    ],
    cities: ['chattogram', 'sylhet', 'coxs-bazar', 'rajshahi', 'cumilla', 'rangpur', 'bogura'],
    readingMinutes: 6,
    body: [
      {
        kind: 'p',
        text: 'A familiar sequence: the Dhaka plan is built, refined and signed off, and then somebody asks what we are doing regionally. There is a fortnight left and whatever is available gets taken.',
      },
      {
        kind: 'p',
        text: 'Which is a shame, because regional inventory is where the arithmetic is friendliest.',
      },
      { kind: 'h2', text: 'The efficiency argument' },
      {
        kind: 'p',
        text: 'Dhaka is so large that one screen reaches a slice of it. A regional city concentrates its movement through a handful of central points, so a single well-chosen face covers a genuinely large share of the population that matters to you.',
      },
      {
        kind: 'p',
        text: 'If your metric is reach per taka rather than absolute impressions, the regions win, often comfortably.',
      },
      { kind: 'h2', text: 'They are not small Dhakas' },
      {
        kind: 'p',
        text: 'Each market has a rhythm of its own, and treating them as interchangeable is where regional plans go wrong.',
      },
      {
        kind: 'ul',
        items: [
          '<strong>Chattogram</strong> is a port and an industrial economy. Its traffic is commercial as much as commuter, and the station approaches carry a different audience from the circles.',
          '<strong>Sylhet</strong> swells with the diaspora calendar. Hospitality, jewellery, property and travel move with it.',
          '<strong>Cox’s Bazar</strong> is almost purely seasonal. Book around the tourist season rather than the financial quarter.',
          '<strong>Rajshahi</strong> is education-led, with a young population and an academic calendar to match.',
          '<strong>Rangpur, Bogura and Cumilla</strong> are regional hubs — the centre of gravity for a wide rural catchment, which is more people than the city population suggests.',
          '<strong>Narayanganj</strong> is effectively an industrial extension of Dhaka, with its own dense local movement.',
        ],
      },
      {
        kind: 'photo',
        board: 'chattogram-agrabad-circle-chittagong',
        caption: 'Agrabad Circle, Chattogram. A port city’s traffic is commercial as much as commuter.',
      },
      { kind: 'h2', text: 'How to sequence a national plan' },
      {
        kind: 'ol',
        items: [
          'Decide the regional markets <strong>first</strong>, not last — they are the constraint, because there are fewer good faces in each.',
          'Book them early. In a city with two or three strong positions, "available" disappears fast.',
          'Use one adaptable artwork. Regional formats are more uniform than Dhaka’s, so one file usually travels without a redraw per face.',
          'Hold them longer. Frequency does even more work where a single face is most of the coverage.',
        ],
      },
      {
        kind: 'note',
        text: 'Outside Dhaka we operate in Sylhet, Chattogram, Cox’s Bazar, Rajshahi, Cumilla, Rangpur, Bogura, Narayanganj and Feni — every site with a page of its own.',
      },
      {
        kind: 'cta',
        text: 'Send us the priority markets and we will come back with what is open in each.',
      },
    ],
    related: [
      'fmcg-brands-outdoor-advertising-bangladesh',
      'dhaka-traffic-and-why-billboards-work',
      'ooh-advertising-trends-bangladesh',
    ],
    answers: [
      'billboard-advertising-in-chattogram',
      'billboard-advertising-in-sylhet',
      'minimum-budget-billboard-campaign',
    ],
  },

  {
    slug: 'ad-pro-led-network-58-sites',
    title: 'The AD PRO LED network now runs to 58 sites across ten cities',
    shortTitle: 'The network: 58 sites, ten cities',
    topic: 'Network news',
    published: '2026-05-06',
    standfirst:
      'Every screen we operate is now listed publicly, with its size, the direction it faces, the hours it runs and a photograph taken from the road. Here is what the network looks like.',
    metaDescription:
      'The AD PRO LED billboard network: 58 digital sites across ten Bangladeshi cities, now listed publicly with sizes, facings, hours and site photographs.',
    keywords: [
      'AD PRO LED network',
      'billboard inventory Bangladesh',
      'LED billboard list Dhaka',
      'digital billboard sites',
    ],
    readingMinutes: 5,
    body: [
      {
        kind: 'p',
        text: 'Out-of-home in this country has a transparency problem, and we have contributed to it as much as anyone. Inventory tends to be described rather than shown — "premium locations", "high-traffic junctions" — and you find out what you actually bought when the photographs arrive.',
      },
      {
        kind: 'p',
        text: 'So we have published the lot.',
      },
      { kind: 'h2', text: 'What is now public' },
      {
        kind: 'p',
        text: 'All 58 LED sites, each on its own page, each carrying:',
      },
      {
        kind: 'ul',
        items: [
          'A photograph of the site taken from the road, cropped so the screen is the subject',
          'The screen size in feet, and its resolution in pixels',
          'The direction it faces — which decides who has it in view',
          'The on-air window, the daily hours and any maintenance break',
          'The LED pitch, and therefore roughly how far back it reads cleanly',
          'The minimum booking and how delivery is reported',
        ],
      },
      {
        kind: 'table',
        caption: 'The network by city',
        head: ['City', 'Sites'],
        rows: [
          ['Dhaka', '38'],
          ['Sylhet', '8'],
          ['Cox’s Bazar', '3'],
          ['Chattogram', '2'],
          ['Rajshahi', '2'],
          ['Cumilla, Rangpur, Bogura, Narayanganj, Feni', '1 each'],
        ],
      },
      { kind: 'h2', text: 'What we have not published' },
      {
        kind: 'p',
        text: 'Rates. Not as a negotiating tactic — because screen time is priced per site and the number moves with season and occupancy, and a stale figure on a website is worse than no figure at all. What we will do is turn a real quote around inside a working day.',
      },
      {
        kind: 'p',
        text: 'That is a trade we are comfortable defending: everything factual about the site is public, and the one number that genuinely varies is a phone call away.',
      },
      {
        kind: 'photo',
        board: 'sylhet-sylhet-bondor-bazar',
        caption: 'Bondor Bazar, Sylhet — one of eight sites ringing the city centre.',
      },
      { kind: 'h2', text: 'The range, honestly' },
      {
        kind: 'p',
        text: 'The network is not uniform and we would rather say so. It runs from a 10 sq ft indoor panel at Shimanto Square to 1,500 sq ft on the Mohakhali flyover — and the small ones are not lesser sites, they are different tools. A P3 panel at an entry gate is read from three metres by somebody walking. A P10 face is read from a flyover at speed. Buying the second when you needed the first is a more expensive mistake than paying slightly over the odds for either.',
      },
      {
        kind: 'cta',
        text: 'Browse the network, then call us about whichever face you keep coming back to.',
      },
    ],
    related: [
      'ooh-advertising-trends-bangladesh',
      'regional-cities-outdoor-advertising-bangladesh',
      'dhaka-traffic-and-why-billboards-work',
    ],
    answers: [
      'best-billboard-locations-in-dhaka',
      'how-led-billboards-work',
      'how-to-book-a-billboard-in-bangladesh',
    ],
  },
];

export const articleTopics: ArticleTopic[] = [
  'Industry',
  'Planning',
  'Sector guides',
  'Network news',
];

export const articleBySlug = (slug: string): Article | undefined =>
  articles.find((a) => a.slug === slug);

/** Newest first — the order a news index should read in. */
export const articlesByDate = [...articles].sort((a, b) =>
  b.published.localeCompare(a.published),
);
