/**
 * The knowledge base.
 *
 * Eighteen questions people actually type before they book out-of-home in
 * Bangladesh, each with a page of its own. The set is chosen to span the
 * whole funnel — "what is OOH advertising" at the top, "how much does a
 * billboard cost in Dhaka" in the middle, "how do I book one" at the bottom —
 * because a site that only answers buying questions never meets anyone who
 * has not decided to buy yet.
 *
 * Three rules held throughout:
 *
 * 1. Every number is either from our own inventory (src/data/boards.json) or
 *    stated as a rule of thumb. No invented research, no borrowed statistics
 *    dressed up as ours, and no external citations — none were supplied, and
 *    a fabricated source is worse than none at all.
 *
 * 2. No rates. Screen time is quoted per site; every answer that touches
 *    money explains how pricing works and then points at the phone.
 *
 * 3. `shortAnswer` is written to stand alone in about fifty words, because
 *    that is the shape a search engine lifts for a featured snippet and the
 *    shape a reader in a hurry actually wants.
 */

export type FaqBlock =
  | { kind: 'p'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'ol'; items: string[] }
  | { kind: 'table'; caption: string; head: string[]; rows: string[][] }
  | { kind: 'note'; text: string }
  /** A real site photograph, pulled from the inventory by slug. */
  | { kind: 'photo'; board: string; caption: string }
  | { kind: 'cta'; text: string };

export type FaqCategory =
  | 'Costs and budget'
  | 'Formats and inventory'
  | 'Planning a campaign'
  | 'Artwork and production'
  | 'Proof and measurement'
  | 'Cities';

export interface FaqArticle {
  slug: string;
  /** The H1 and the <title>. Phrased the way it is searched. */
  question: string;
  /** Shorter label for lists and related-question rails. */
  shortTitle: string;
  category: FaqCategory;
  /** ~50 words, complete on its own. */
  shortAnswer: string;
  /** ~155 characters, keyword first. */
  metaDescription: string;
  /** Drives internal linking and the on-page keyword rail. */
  keywords: string[];
  body: FaqBlock[];
  /** Slugs of questions a reader would naturally go to next. */
  related: string[];
  /** City slugs whose inventory this question is about, for cross-links. */
  cities?: string[];
}

export const faqArticles: FaqArticle[] = [
  /* ------------------------------------------------------------------ costs */
  {
    slug: 'billboard-advertising-cost-bangladesh',
    question: 'How much does billboard advertising cost in Bangladesh?',
    shortTitle: 'What billboard advertising costs',
    category: 'Costs and budget',
    shortAnswer:
      'There is no single rate. Digital LED billboards in Bangladesh are sold by the minute per day, so your cost depends on the site, the screen size, how many minutes a day you take and how long you run. Two screens a kilometre apart can price very differently.',
    metaDescription:
      'Billboard advertising cost in Bangladesh, explained honestly: what actually moves the price, what is included, and how to get a real number the same week.',
    keywords: [
      'billboard advertising cost Bangladesh',
      'billboard price in Dhaka',
      'LED billboard rate',
      'OOH advertising budget',
    ],
    body: [
      {
        kind: 'p',
        text: "Let me save you some time. If you have been ringing around for a flat per-month figure, you will keep getting the same frustrating answer, and it is not because anyone is being cagey. It is because a billboard is not a product with a shelf price. It is a position — and positions are not interchangeable.",
      },
      {
        kind: 'p',
        text: 'Think of it the way you would think about renting retail space. Nobody quotes you "shop, per month" without asking which street. Out-of-home works the same way, except the street is doing the selling.',
      },
      { kind: 'h2', text: 'What actually moves the number' },
      {
        kind: 'p',
        text: 'Five things, roughly in order of how much they matter:',
      },
      {
        kind: 'ol',
        items: [
          '<strong>Where the screen is.</strong> A face at Gulshan Circle-2 and a face on a quieter arterial road are not the same product, however similar the spec sheet looks. You are paying for the queue in front of it.',
          '<strong>How big it is.</strong> Our network runs from a 10 sq ft indoor panel at Shimanto Square to 1,500 sq ft at SKS Tower on the Mohakhali flyover. That is a 150-fold spread in face area, and it shows up in the price.',
          '<strong>How many minutes a day you take.</strong> Digital is sold by screen time. Sixty minutes a day is the usual minimum. Take more, and the cost per minute tends to soften.',
          '<strong>How long you run.</strong> A fortnight and a quarter are priced differently, in the direction you would expect.',
          '<strong>When you book.</strong> Ramadan, Eid, Pohela Boishakh and the run-up to Victory Day are the busiest windows in the Bangladeshi calendar. Demand does what demand does.',
        ],
      },
      {
        kind: 'photo',
        board: 'dhaka-gulshan-circle-2-east-side-rob-super-market',
        caption:
          'Gulshan Circle-2, east side — 40ft × 20ft. Site, size and dwell time are what you are really buying.',
      },
      { kind: 'h2', text: 'What is usually inside the number, and what is not' },
      {
        kind: 'p',
        text: 'This is where quotes stop being comparable, so it is worth being blunt about it.',
      },
      {
        kind: 'table',
        caption: 'What a digital out-of-home quote should and should not contain',
        head: ['Item', 'Digital LED', 'Static print'],
        rows: [
          ['Media — the screen time itself', 'Included', 'Included'],
          ['Uploading and scheduling your file', 'Included', 'Not applicable'],
          ['Printing the skin', 'Not applicable', 'Should be included'],
          ['Mounting crew and access equipment', 'Not applicable', 'Should be included'],
          ['Proof that it ran', 'Included — played-spot log', 'Included — dated site photographs'],
          ['Artwork design, if you have none', 'Quoted separately', 'Quoted separately'],
          ['Changing the creative mid-run', 'Included, same day', 'A reprint — quoted separately'],
        ],
      },
      {
        kind: 'note',
        text: 'If a quote is meaningfully cheaper than the others, check whether production and mounting are in it. That is where the difference usually hides.',
      },
      { kind: 'h2', text: 'So why not just publish a rate card?' },
      {
        kind: 'p',
        text: 'Honestly? Because it would be out of date within the month, and a stale number on a website helps nobody. Rates move with season and occupancy. A published figure would either be so padded it scared people off, or so optimistic that every real quote came in above it — and starting a relationship with a number you have to walk back is a poor way to begin.',
      },
      {
        kind: 'p',
        text: 'What we can promise is speed. Give us the cities, the dates and a rough budget band, and you get a written plan — sites, sizes, minutes and an all-in cost — inside one working day. No rate card, no ten-day wait.',
      },
      {
        kind: 'cta',
        text: 'Tell us the city and the dates and we will tell you what is free and what it costs.',
      },
    ],
    related: [
      'minimum-budget-billboard-campaign',
      'digital-vs-static-billboards',
      'how-to-book-a-billboard-in-bangladesh',
      'billboard-advertising-vs-online-ads',
    ],
  },

  {
    slug: 'minimum-budget-billboard-campaign',
    question: 'What is the minimum budget for a billboard campaign in Bangladesh?',
    shortTitle: 'The realistic minimum budget',
    category: 'Costs and budget',
    shortAnswer:
      'Lower than most people assume. Digital screen time is sold by the minute per day — the minimum on most of our sites is 60 minutes a day, and on a few it is 30 — so a short run on a smaller panel is genuinely within reach of a single-outlet business.',
    metaDescription:
      'The minimum billboard budget in Bangladesh is smaller than most assume. How short runs, smaller panels and 30-minute minimums make out-of-home reachable.',
    keywords: [
      'minimum billboard budget Bangladesh',
      'cheap billboard advertising Dhaka',
      'small business billboard',
      'LED screen time minimum',
    ],
    body: [
      {
        kind: 'p',
        text: 'There is a persistent belief in this market that billboards are for telecom operators, banks and nobody else. I understand where it comes from — those are the brands you see on the big faces — but it is not really true any more, and the reason is digital.',
      },
      {
        kind: 'h2',
        text: 'Why digital changed the maths',
      },
      {
        kind: 'p',
        text: 'A printed billboard has a hard floor. Somebody has to print a skin, send a crew up a structure, and hang it. You cannot do a third of that. So the smallest sensible static booking is a month, and the print bill lands whether you run for four weeks or twelve.',
      },
      {
        kind: 'p',
        text: 'An LED screen has no such floor. Your file goes into a loop. Taking sixty minutes a day for a fortnight costs a fraction of taking a face for a quarter, and there is nothing to print. That single fact is what put out-of-home within reach of a restaurant group, a clinic, a coaching centre, a new showroom.',
      },
      {
        kind: 'table',
        caption: 'How the entry point changes with the shape of the booking',
        head: ['Lever', 'Pushes cost down', 'Pushes cost up'],
        rows: [
          ['Screen size', 'Smaller panels and indoor screens', 'Large flyover-facing faces'],
          ['Minutes per day', '30-60 minutes where available', 'Heavy share of the loop'],
          ['Run length', 'A focused fortnight', 'A full quarter'],
          ['Location', 'Strong secondary junctions', 'Gulshan, Mohakhali, Panthapath'],
          ['Timing', 'Ordinary weeks', 'Eid, Boishakh, Victory Day'],
          ['City', 'Sylhet, Rajshahi, Cumilla, Bogura', 'Central Dhaka'],
        ],
      },
      {
        kind: 'photo',
        board: 'dhaka-shimanto-square-6-led-screens',
        caption:
          'Shimanto Square — six indoor screens. Small formats, close range, and a much gentler entry point than a flyover face.',
      },
      { kind: 'h2', text: 'A more useful question than "what is the minimum"' },
      {
        kind: 'p',
        text: 'Ask instead: <em>what is the smallest booking that still does something?</em> Because a token presence on a great site for three days is money spent on very little. Frequency is what out-of-home trades in. The same commuter passing the same screen eleven mornings running is the mechanism.',
      },
      {
        kind: 'p',
        text: 'So if the budget is tight, my honest advice is to narrow the geography rather than the duration. One screen on the road your customers actually use, held for a fortnight, beats four screens scattered across the city for four days. Every time.',
      },
      {
        kind: 'note',
        text: 'Four of our sites carry a 30 min/day minimum rather than 60. If budget is the binding constraint, say so when you call and we will start there.',
      },
      {
        kind: 'cta',
        text: 'Give us a budget band — even a wide one — and we will come back with what it genuinely buys.',
      },
    ],
    related: [
      'billboard-advertising-cost-bangladesh',
      'can-small-businesses-use-billboards',
      'how-many-minutes-per-day-billboard',
      'how-to-book-a-billboard-in-bangladesh',
    ],
  },

  {
    slug: 'can-small-businesses-use-billboards',
    question: 'Can a small business afford billboard advertising in Bangladesh?',
    shortTitle: 'Billboards for small businesses',
    category: 'Costs and budget',
    shortAnswer:
      'Yes, and the ones that do it well tend to buy narrow rather than broad — a single screen on the road their customers already use, held long enough to be noticed, instead of a scattering of sites nobody sees twice.',
    metaDescription:
      'Can a small business afford a billboard in Bangladesh? Yes — here is how to buy one screen properly instead of four badly, and what to expect from it.',
    keywords: [
      'small business billboard advertising',
      'local billboard advertising Dhaka',
      'affordable OOH Bangladesh',
      'SME advertising',
    ],
    body: [
      {
        kind: 'p',
        text: 'A restaurant owner in Dhanmondi asked me last year whether a billboard was "a bit much" for one branch. Fair question. Here is the way I would frame it.',
      },
      {
        kind: 'p',
        text: 'You are not buying national fame. You are buying the road outside. And the road outside a single-branch business is, in a city like Dhaka, absurdly busy — thousands of the same people, at the same hour, most days of the week. That is not mass media. That is closer to a very large, very patient shop sign three hundred metres up the street.',
      },
      { kind: 'h2', text: 'The three rules that make small budgets work' },
      {
        kind: 'ol',
        items: [
          '<strong>Buy the catchment, not the city.</strong> If your customers come from within four kilometres, a screen twelve kilometres away is decoration. Pick the junction they are already sitting at.',
          '<strong>Buy length over breadth.</strong> Frequency is the whole trick. One site for a fortnight will out-perform four sites for four days at the same spend, because the fourth exposure is the one that lands.',
          "<strong>Say one thing.</strong> A passing driver gives you somewhere between two and four seconds. That is a name, an offer and a direction — not a menu, not a paragraph, and definitely not a QR code nobody can scan from a moving car.",
        ],
      },
      {
        kind: 'photo',
        board: 'dhaka-dhanmondi-2',
        caption:
          'Dhanmondi. For a local business, the right screen is usually the one on the road your customers already drive down.',
      },
      { kind: 'h2', text: 'What smaller advertisers get wrong' },
      {
        kind: 'p',
        text: 'Two things, mostly. The first is treating it like a print ad — cramming in a phone number, three services and a website. The second is stopping too early. A fortnight in, you are only just becoming familiar; that is precisely the wrong moment to pull the plug because "nobody has mentioned it".',
      },
      {
        kind: 'p',
        text: 'And people rarely do mention it, by the way. Out-of-home works quietly. It is why the shop feels vaguely established when someone finally walks in, and why they cannot tell you where they heard of you.',
      },
      {
        kind: 'note',
        text: 'If you are weighing your first booking, ask us for the smallest sensible plan rather than the best one. We would rather you started well and came back.',
      },
      {
        kind: 'cta',
        text: 'Tell us where your customers come from and we will find the screen they already pass.',
      },
    ],
    related: [
      'minimum-budget-billboard-campaign',
      'how-to-design-a-billboard-that-works',
      'billboard-advertising-vs-online-ads',
      'billboard-advertising-cost-bangladesh',
    ],
  },

  /* --------------------------------------------------------------- formats */
  {
    slug: 'digital-vs-static-billboards',
    question: 'Digital or static billboards — which is better in Bangladesh?',
    shortTitle: 'Digital vs static billboards',
    category: 'Formats and inventory',
    shortAnswer:
      'Neither is better; they do different jobs. Static gives you sole occupancy of a face for a month or more, which suits always-on presence. Digital gives you a share of a loop you can change the same day, which suits launches, offers and anything with a date on it.',
    metaDescription:
      'Digital vs static billboards in Bangladesh: what each format is actually good at, what they cost you in flexibility, and how to choose between them.',
    keywords: [
      'digital vs static billboard',
      'LED billboard Bangladesh',
      'unipole vs LED screen',
      'OOH formats',
    ],
    body: [
      {
        kind: 'p',
        text: 'This is the question I get asked most, usually phrased as though one answer is obviously right. It is not. They are different instruments, and choosing badly is a more expensive mistake than choosing a slightly worse site.',
      },
      {
        kind: 'h2',
        text: 'The honest comparison',
      },
      {
        kind: 'table',
        caption: 'Digital LED compared with printed static, in practice',
        head: ['', 'Digital LED', 'Printed static'],
        rows: [
          ['You occupy', 'A share of a rotating loop', 'The whole face, alone'],
          ['Shortest sensible booking', 'Days', 'A month'],
          ['Changing the creative', 'Same day, no reprint', 'A reprint and a crew'],
          ['Targeting by hour', 'Yes — morning and evening can differ', 'No'],
          ['Runs after dark', 'Yes, to the site’s on-air window', 'Only if the face is lit'],
          ['Proof it ran', 'Played-spot log', 'Dated site photographs'],
          ['Best for', 'Launches, offers, dated messages', 'Always-on presence, category ownership'],
          ['Lead time', '24-48 hours from approved artwork', 'Five to seven working days'],
        ],
      },
      { kind: 'h2', text: 'What the table does not tell you' },
      {
        kind: 'p',
        text: 'Two things worth knowing before you decide.',
      },
      {
        kind: 'p',
        text: '<strong>Sole occupancy is genuinely different.</strong> On a static face, your brand <em>is</em> that junction for a month. Nobody follows you eight seconds later. There is a psychological weight to that which a share of a loop does not quite reproduce, and for category-leader positioning it still matters.',
      },
      {
        kind: 'p',
        text: '<strong>But motion is hard to ignore.</strong> A screen that changes while somebody is sitting at a red light pulls the eye in a way a static panel cannot. If your message has a date, a price or an offer attached, digital does the job better and lets you correct it if the offer changes.',
      },
      {
        kind: 'photo',
        board: 'dhaka-sks-tower-flyover-view-mohakhali',
        caption:
          'SKS Tower, Mohakhali — the largest face in our network at 1,500 sq ft, read from the flyover.',
      },
      { kind: 'h2', text: 'How I would actually choose' },
      {
        kind: 'ul',
        items: [
          'Message has a deadline, a price or a launch date → <strong>digital</strong>.',
          'You want to own a junction for a season → <strong>static</strong>.',
          'You need to be live this week → <strong>digital</strong>, comfortably.',
          'Budget is thin and you want the longest possible presence → <strong>digital</strong>, short daily minutes over a longer run.',
          'You are defending a category position against a competitor on the same road → <strong>static</strong>, and take the better face.',
        ],
      },
      {
        kind: 'note',
        text: 'Every one of the 58 sites listed on this site is an LED screen. We build and mount static faces to order rather than selling them from a list, because a unipole is surveyed and fabricated for the campaign that holds it.',
      },
      {
        kind: 'cta',
        text: 'Not sure which way to go? Describe the campaign and we will tell you which format we would actually recommend.',
      },
    ],
    related: [
      'how-led-billboards-work',
      'billboard-advertising-cost-bangladesh',
      'how-quickly-can-a-billboard-go-live',
      'best-billboard-locations-in-dhaka',
    ],
  },

  {
    slug: 'how-led-billboards-work',
    question: 'How do LED billboards work?',
    shortTitle: 'How LED billboards work',
    category: 'Formats and inventory',
    shortAnswer:
      'An LED billboard is a grid of tiny light modules playing video files in a loop. The number after the "P" in its model name is the gap between pixels in millimetres — P5 means 5mm — and that single number decides how close you can stand before the picture breaks into dots.',
    metaDescription:
      'How LED billboards work, in plain English: pixel pitch, viewing distance, loops and why a P10 screen looks perfect from a flyover and awful up close.',
    keywords: [
      'how LED billboards work',
      'pixel pitch explained',
      'P5 P6 P10 LED screen',
      'digital billboard technology',
    ],
    body: [
      {
        kind: 'p',
        text: 'Strip away the jargon and an LED billboard is a very large, very bright screen made of modules bolted into a grid, each module packed with clusters of red, green and blue lights. Your file plays on it. That is genuinely the whole thing.',
      },
      {
        kind: 'p',
        text: 'The interesting part — and the part worth understanding before you book — is the spacing.',
      },
      { kind: 'h2', text: 'Pixel pitch, and why it is the only spec that matters' },
      {
        kind: 'p',
        text: 'When you see a screen described as P5, P6 or P10, that number is the distance between the centres of two neighbouring pixels, in millimetres. Smaller number, tighter grid, finer picture.',
      },
      {
        kind: 'p',
        text: 'There is a rule of thumb the industry has used for years: <strong>roughly one metre of viewing distance per millimetre of pitch</strong> before the dots stop being visible. It is an approximation, not physics, but it is a good one. A P10 screen wants to be read from about ten metres and beyond. A P3 screen holds up at three.',
      },
      {
        kind: 'table',
        caption: 'Pitch, viewing distance and where each one belongs',
        head: ['Pitch', 'Comfortable from', 'Typically used for', 'In our network'],
        rows: [
          ['P3', '~3 m and beyond', 'Indoor panels, entry gates, close approach', '2 sites'],
          ['P4', '~4 m and beyond', 'Indoor and covered locations', '3 sites'],
          ['P5', '~5 m and beyond', 'Mid-sized street-level faces', '15 sites'],
          ['P6', '~6 m and beyond', 'The workhorse — most junction screens', '28 sites'],
          ['P10', '~10 m and beyond', 'Large faces read across a junction or from a flyover', '3 sites'],
        ],
      },
      {
        kind: 'note',
        text: 'This is why a coarse pitch on a big flyover face is not a compromise — nobody is ever standing close enough for it to matter, and the coarser grid buys brightness and size for the money.',
      },
      { kind: 'h2', text: 'What "resolution" means on a billboard' },
      {
        kind: 'p',
        text: 'Most of our screens run 1920 × 1080 — the same shape as a television, which is convenient, because it means artwork built for a video edit usually adapts without a redraw. A handful are portrait: 1080 × 1920, or 1152 × 1536. Those want a different composition, not a rotated version of the same one.',
      },
      {
        kind: 'photo',
        board: 'dhaka-police-plaza-front-side',
        caption:
          'A portrait face at Police Plaza. Tall screens want a stacked composition, not a landscape lock-up turned sideways.',
      },
      { kind: 'h2', text: 'The loop' },
      {
        kind: 'p',
        text: 'Your file does not play continuously. It sits in a rotation with the other advertisers on that screen, coming round every minute or two depending on how the loop is built. What you buy is total minutes per day — sixty on most of our sites — and those minutes are distributed across the on-air window.',
      },
      {
        kind: 'p',
        text: 'Every screen also has an on-air window and, on most sites, a short maintenance break in the afternoon. Both are on each site’s own page, because "24 hours" is a claim that does not survive contact with a real electricity supply.',
      },
      {
        kind: 'cta',
        text: 'Want to know which pitch suits your creative? Send us the artwork and we will tell you which screens will do it justice.',
      },
    ],
    related: [
      'billboard-artwork-size-and-format',
      'digital-vs-static-billboards',
      'led-billboard-brightness-and-weather',
      'how-many-minutes-per-day-billboard',
    ],
  },

  {
    slug: 'what-is-ooh-advertising',
    question: 'What is OOH advertising?',
    shortTitle: 'What OOH advertising is',
    category: 'Formats and inventory',
    shortAnswer:
      'Out-of-home advertising is any advertising that reaches people while they are out of the house — billboards, LED screens, transit branding, airport panels, mall displays and street furniture. In Bangladesh it is dominated by roadside billboards, increasingly digital ones.',
    metaDescription:
      'What is OOH advertising? A plain-English guide to out-of-home media in Bangladesh — the formats, what each is good at, and where digital fits in.',
    keywords: [
      'what is OOH advertising',
      'out of home advertising Bangladesh',
      'OOH media types',
      'outdoor advertising meaning',
    ],
    body: [
      {
        kind: 'p',
        text: 'Out-of-home — OOH, if you want the abbreviation everyone in the industry uses — is the oldest advertising medium there is, and one of the very few that has never been switched off, skipped, blocked or scrolled past.',
      },
      {
        kind: 'p',
        text: 'That last point is not a sales line. It is structural. You cannot install an ad blocker on a junction.',
      },
      { kind: 'h2', text: 'The formats you will actually be offered here' },
      {
        kind: 'table',
        caption: 'Out-of-home formats in Bangladesh and what each one does well',
        head: ['Format', 'What it is', 'Strongest at'],
        rows: [
          ['Digital LED billboard', 'A large screen playing files in a loop', 'Dated messages, offers, launches'],
          ['Static billboard', 'A printed skin on a unipole or gantry', 'Owning a junction for a season'],
          ['Building wrap', 'Print across a facade', 'Scale and landmark association'],
          ['Transit branding', 'Buses, vehicle fleets, LED vans', 'Following the route rather than waiting on it'],
          ['Airport and terminal', 'Panels and screens in transit halls', 'High-dwell, high-income audiences'],
          ['Mall and indoor screens', 'Smaller panels inside footfall', 'Close-range, decision-point messaging'],
          ['Street furniture', 'Shelters, kiosks, railings', 'Repetition along a corridor'],
        ],
      },
      { kind: 'h2', text: 'Why it still works in a country this connected' },
      {
        kind: 'p',
        text: 'Bangladesh has enormous mobile penetration and a genuinely crowded digital ad market. So why does a screen at a traffic signal still earn its keep?',
      },
      {
        kind: 'ul',
        items: [
          '<strong>Nobody is trying to avoid it.</strong> It arrives without asking for attention, which is a different psychological transaction from an interruption.',
          '<strong>The dwell time is real.</strong> Dhaka traffic is famously slow. That is a problem for the city and an asset for a well-placed screen.',
          '<strong>It is a public signal.</strong> Being on a major junction says something about a business that a targeted feed advert cannot say, because everyone sees it — including your competitors, your distributors and your future staff.',
          '<strong>It lifts the things that follow it.</strong> Search, direct traffic and branded queries tend to move with a run. It rarely gets the credit, because there is no click to attribute.',
        ],
      },
      {
        kind: 'photo',
        board: 'dhaka-karwan-bazar',
        caption: 'Karwan Bazar. Out-of-home is the medium you cannot close, skip or block.',
      },
      {
        kind: 'cta',
        text: 'New to out-of-home? Tell us the goal rather than the format and we will suggest what fits.',
      },
    ],
    related: [
      'digital-vs-static-billboards',
      'billboard-advertising-vs-online-ads',
      'transit-and-airport-advertising-bangladesh',
      'how-to-measure-billboard-results',
    ],
  },

  {
    slug: 'transit-and-airport-advertising-bangladesh',
    question: 'What transit and airport advertising is available in Bangladesh?',
    shortTitle: 'Transit and airport advertising',
    category: 'Formats and inventory',
    shortAnswer:
      'Beyond fixed billboards, you can brand vehicle fleets and buses, run LED-equipped vans that go to the audience, and take panels and screens at airports, railway stations and launch terminals. We hold screens at the airport approach, Kamlapur and Sadarghat.',
    metaDescription:
      'Transit and airport advertising in Bangladesh: fleet branding, LED vans, railway station and terminal screens, and when mobile OOH beats a fixed site.',
    keywords: [
      'transit advertising Bangladesh',
      'airport advertising Dhaka',
      'bus branding',
      'LED van advertising',
      'railway station advertising',
    ],
    body: [
      {
        kind: 'p',
        text: 'A fixed billboard waits for the audience. Transit media goes and finds them. Both are useful; they are just answers to different questions.',
      },
      { kind: 'h2', text: 'When mobile beats fixed' },
      {
        kind: 'p',
        text: 'If your audience is defined by a <em>route</em> rather than a <em>place</em> — a distribution corridor, a campaign following a cricket tour, a launch that needs to hit six neighbourhoods in a week — a vehicle does something a structure cannot. An LED van can be at a stadium at four and a market at seven.',
      },
      {
        kind: 'p',
        text: 'If your audience is defined by a place, take the place. It is cheaper per exposure and it never gets stuck in traffic on the wrong side of town.',
      },
      { kind: 'h2', text: 'Terminals: the dwell-time argument' },
      {
        kind: 'p',
        text: 'Airports, railway stations and launch terminals share a quality no roadside site has: people are standing still and slightly bored. Dwell time at a departure gate is measured in tens of minutes, not seconds. That is the one out-of-home environment where a longer message genuinely works.',
      },
      {
        kind: 'table',
        caption: 'Terminal and transit sites in our own network',
        head: ['Site', 'City', 'Environment'],
        rows: [
          ['Airport Entrance, Banani facing', 'Dhaka', 'Airport approach road'],
          ['Airport Railway Station entry gate', 'Dhaka', 'Station entrance'],
          ['Kamlapur Railway Station entry gate', 'Dhaka', 'Main terminus'],
          ['Sadarghat Launch Terminal', 'Dhaka', 'River terminal'],
          ['Shohortoli Railway Station entry gate', 'Chattogram', 'Station entrance'],
        ],
      },
      {
        kind: 'photo',
        board: 'dhaka-kamlapur-railway-station-entry-gate',
        caption:
          'Kamlapur. At a terminus, people are stationary and waiting — the one place a longer message earns its space.',
      },
      {
        kind: 'note',
        text: 'Fleet branding, LED covered vans and airport packages are quoted per campaign rather than listed, because availability depends on the route and the concession. Ask and we will tell you what is open.',
      },
      {
        kind: 'cta',
        text: 'Describe the route or the terminal and we will come back with what we can put on it.',
      },
    ],
    related: [
      'what-is-ooh-advertising',
      'best-billboard-locations-in-dhaka',
      'how-to-book-a-billboard-in-bangladesh',
      'digital-vs-static-billboards',
    ],
  },

  /* -------------------------------------------------------------- planning */
  {
    slug: 'best-billboard-locations-in-dhaka',
    question: 'What are the best billboard locations in Dhaka?',
    shortTitle: 'The best locations in Dhaka',
    category: 'Planning a campaign',
    shortAnswer:
      'The strongest sites are the ones with the slowest traffic, not the most: Gulshan Circle-1 and Circle-2, Mohakhali, Karwan Bazar, Panthapath, Science Lab, Bijoy Sarani and Mirpur-10. Dhaka carries 38 of the 58 screens in our network.',
    metaDescription:
      'The best billboard locations in Dhaka, ranked by what actually matters — dwell time, approach angle and catchment. Gulshan, Mohakhali, Karwan Bazar and more.',
    keywords: [
      'best billboard locations Dhaka',
      'Gulshan billboard advertising',
      'Mohakhali LED screen',
      'billboard advertising Dhaka',
    ],
    cities: ['dhaka'],
    body: [
      {
        kind: 'p',
        text: 'Everyone asks for "the busiest road". It is the wrong metric, and chasing it is how advertisers end up paying a premium for a site nobody can read.',
      },
      {
        kind: 'p',
        text: 'What you actually want is <strong>slow</strong> traffic with a <strong>clean approach angle</strong>. A motorway with 80,000 vehicles doing sixty gives you a fraction of a second. A signalled junction with a fraction of that volume gives you ninety seconds of a captive, stationary audience. Dhaka, for all its frustrations, is extraordinarily good at producing the second kind.',
      },
      { kind: 'h2', text: 'The catchments worth knowing' },
      {
        kind: 'table',
        caption: 'Dhaka billboard catchments and what each one delivers',
        head: ['Catchment', 'Audience character', 'Sites we hold'],
        rows: [
          ['Gulshan 1 and 2', 'Corporate, diplomatic, highest-income in the city', '7'],
          ['Mohakhali and SKS Tower', 'Flyover traffic, offices, hospital corridor', '4'],
          ['Police Plaza', 'Retail, leisure, Gulshan approach', '6'],
          ['Dhanmondi and Science Lab', 'Residential, education, family retail', '5'],
          ['Karwan Bazar and Panthapath', 'Media, wholesale, heavy through-traffic', '2'],
          ['Mirpur and Shyamoli', 'Dense residential, mass-market reach', '2'],
          ['Banani and Airport Road', 'Arrivals, corporate, hotel corridor', '3'],
          ['Terminals — Kamlapur, Sadarghat', 'High dwell, mass intercity', '3'],
        ],
      },
      {
        kind: 'photo',
        board: 'dhaka-gulshan-circle-1-upper',
        caption:
          'Gulshan Circle-1, upper — 30ft × 20ft, facing Police Plaza and Mohakhali, on air fourteen hours a day.',
      },
      { kind: 'h2', text: 'Three questions that beat "which is best"' },
      {
        kind: 'ol',
        items: [
          '<strong>Which direction is my customer travelling?</strong> A screen facing the morning commute into the city is a different product from the one facing the evening commute out of it — even at the same junction.',
          '<strong>What is my catchment radius?</strong> A single clinic in Dhanmondi does not need Mohakhali. A national FMCG launch does.',
          '<strong>What is the competitor doing?</strong> Sharing a junction with your direct rival is sometimes exactly right and sometimes a waste. Worth deciding deliberately rather than by accident.',
        ],
      },
      {
        kind: 'note',
        text: 'Every Dhaka site has its own page with the size, the direction it faces, the on-air window and a photograph taken from the road. That is the fastest way to judge an approach angle without going there.',
      },
      {
        kind: 'cta',
        text: 'Tell us which side of the city your customers come from and we will shortlist the faces that catch them.',
      },
    ],
    related: [
      'billboard-advertising-in-sylhet',
      'billboard-advertising-in-chattogram',
      'best-time-of-day-for-billboard-advertising',
      'billboard-advertising-cost-bangladesh',
    ],
  },

  {
    slug: 'how-quickly-can-a-billboard-go-live',
    question: 'How quickly can a billboard campaign go live in Bangladesh?',
    shortTitle: 'How fast you can go live',
    category: 'Planning a campaign',
    shortAnswer:
      'A digital campaign can be on air 24 to 48 hours after artwork is approved, because there is nothing to print. A printed static face usually takes five to seven working days to cover printing, permissions and a mounting slot.',
    metaDescription:
      'How fast can a billboard go live in Bangladesh? Digital in 24-48 hours from approved artwork, static in five to seven working days. What the timeline covers.',
    keywords: [
      'billboard lead time Bangladesh',
      'how fast billboard campaign',
      'urgent billboard booking',
      'same week billboard',
    ],
    body: [
      {
        kind: 'p',
        text: 'Short answer: faster than you think, if it is digital, and not as fast as you would like, if it is printed.',
      },
      { kind: 'h2', text: 'Digital: a day or two' },
      {
        kind: 'p',
        text: 'There is no physical object to make. Once your MP4 is approved and the site is free, it goes into the loop. Twenty-four to forty-eight hours is normal, and I have seen it done faster when a slot was already open and the file was already right.',
      },
      {
        kind: 'p',
        text: 'The thing that delays digital bookings is almost never us. It is artwork sign-off — three rounds of internal review on a file that then turns out to be the wrong aspect ratio.',
      },
      { kind: 'h2', text: 'Static: five to seven working days' },
      {
        kind: 'p',
        text: 'Print takes a day or two. Permissions take what they take. And mounting needs a crew, access equipment and, ideally, a dry morning — which in monsoon season is its own kind of scheduling problem.',
      },
      {
        kind: 'table',
        caption: 'A realistic timeline from decision to on air',
        head: ['Stage', 'Digital LED', 'Printed static'],
        rows: [
          ['Availability confirmed', 'Same day', 'Same day'],
          ['Written plan and cost', 'Within one working day', 'Within one working day'],
          ['Artwork adapted to the face', '1 day', '1-2 days'],
          ['Printing', '—', '1-2 days'],
          ['Permissions and clearances', '—', 'Varies by site'],
          ['Upload or mounting', 'Hours', '1 day, weather permitting'],
          ['<strong>Typical total</strong>', '<strong>24-48 hours</strong>', '<strong>5-7 working days</strong>'],
        ],
      },
      {
        kind: 'note',
        text: 'If you are working to a hard launch date, tell us the date first. It changes which sites we even show you, because some faces have longer notice periods than others.',
      },
      {
        kind: 'cta',
        text: 'Working to a deadline? Call us with the date and we will tell you honestly whether it is achievable.',
      },
    ],
    related: [
      'billboard-artwork-size-and-format',
      'billboard-permission-and-licence-bangladesh',
      'how-to-book-a-billboard-in-bangladesh',
      'digital-vs-static-billboards',
    ],
  },

  {
    slug: 'how-many-minutes-per-day-billboard',
    question: 'How many minutes a day should I book on a digital billboard?',
    shortTitle: 'How many minutes to book',
    category: 'Planning a campaign',
    shortAnswer:
      'Sixty minutes a day is the standard minimum across most of our network, and for most campaigns it is also the right answer. Buy more minutes only once you already have enough days — frequency over the run beats intensity on any single day.',
    metaDescription:
      'How many minutes a day to book on a digital billboard in Bangladesh, and why more days almost always beats more minutes on the same budget.',
    keywords: [
      'digital billboard minutes per day',
      'LED screen time booking',
      'billboard loop share',
      'OOH frequency',
    ],
    body: [
      {
        kind: 'p',
        text: 'Here is a trade-off almost every first-time buyer gets wrong, and it is an easy one to fix.',
      },
      {
        kind: 'p',
        text: 'You have a fixed budget. You can spend it on <em>more minutes per day over fewer days</em>, or <em>fewer minutes per day over more days</em>. Instinct says go loud. Instinct is wrong.',
      },
      { kind: 'h2', text: 'Why the longer, quieter run wins' },
      {
        kind: 'p',
        text: 'Out-of-home does not work by volume on a single day. It works by turning up again on Tuesday, and Wednesday, and the Tuesday after that, until a brand that was unfamiliar is simply part of the furniture of somebody’s commute. Doubling your minutes on Monday does not double the number of people who see you — it mostly shows the same person twice in an hour.',
      },
      {
        kind: 'p',
        text: 'Extending the run, on the other hand, reaches the people who were not on that road on Monday. And there are a lot of them.',
      },
      {
        kind: 'table',
        caption: 'Same spend, two shapes — what each one actually buys',
        head: ['Shape', 'What it gives you', 'Good for'],
        rows: [
          ['Heavy minutes, short run', 'High intensity, narrow reach', 'A single-day event, a one-night launch'],
          ['Standard minutes, long run', 'Repeat exposure, broad reach', 'Almost everything else'],
          ['Standard minutes, several sites', 'Route coverage', 'Corridor and catchment campaigns'],
        ],
      },
      { kind: 'h2', text: 'When more minutes genuinely is the answer' },
      {
        kind: 'ul',
        items: [
          'A dated event — a concert, a one-day sale, a match — where there is no "later".',
          'A competitor is on the same screen and you want a clearly larger share of the loop.',
          'A short on-air window. On a site running six hours a day, sixty minutes is already a big share; on a fourteen-hour site it is a modest one.',
        ],
      },
      {
        kind: 'note',
        text: 'On-air windows across our network run from six to fifteen hours. The same sixty minutes means very different things on those two sites — which is why each site page states its window.',
      },
      {
        kind: 'cta',
        text: 'Give us the budget and the dates and we will show you both shapes so you can see the difference.',
      },
    ],
    related: [
      'minimum-budget-billboard-campaign',
      'best-time-of-day-for-billboard-advertising',
      'how-led-billboards-work',
      'how-to-measure-billboard-results',
    ],
  },

  {
    slug: 'best-time-of-day-for-billboard-advertising',
    question: 'What is the best time of day to run a billboard advert?',
    shortTitle: 'The best time of day to run',
    category: 'Planning a campaign',
    shortAnswer:
      'For most brands, the two commute peaks — roughly 8am to 11am and 5pm to 9pm. But the better move on digital is to run different creative in each: a functional message in the morning and an emotional or offer-led one in the evening.',
    metaDescription:
      'The best time of day for billboard advertising in Bangladesh: commute peaks, day-part targeting, and how to run two messages from one booking.',
    keywords: [
      'best time for billboard advertising',
      'day-part targeting OOH',
      'commute peak advertising Dhaka',
      'digital billboard scheduling',
    ],
    body: [
      {
        kind: 'p',
        text: 'The obvious answer is "rush hour", and the obvious answer is mostly right. But it is also the least interesting thing digital lets you do, and almost nobody uses the capability properly.',
      },
      { kind: 'h2', text: 'The two peaks, and what people are doing in them' },
      {
        kind: 'p',
        text: 'A morning commuter is task-focused, slightly late, and thinking about the day ahead. An evening commuter is tired, has decisions to make about dinner, and is far more receptive to something pleasurable.',
      },
      {
        kind: 'p',
        text: 'Same person. Same screen. Completely different frame of mind. Running one identical file at both ends of the day is leaving something on the table.',
      },
      {
        kind: 'table',
        caption: 'Day-parts and what to say in them',
        head: ['Window', 'Mindset', 'What tends to land'],
        rows: [
          ['8am - 11am', 'Purposeful, time-poor', 'Utility: opening hours, a service, a location'],
          ['11am - 4pm', 'Errands, shopping, deliveries', 'Retail offers, in-store promotions'],
          ['5pm - 9pm', 'Winding down, deciding', 'Food, leisure, brand and emotional work'],
          ['After 9pm', 'Lighter traffic, higher attention', 'Brand presence, launches, category ownership'],
        ],
      },
      {
        kind: 'photo',
        board: 'dhaka-bijoy-saroni-mor',
        caption:
          'Bijoy Sarani. The same face reaches two quite different audiences twelve hours apart.',
      },
      { kind: 'h2', text: 'The practical constraint' },
      {
        kind: 'p',
        text: 'Not every screen runs all day. Across our network, on-air windows range from six hours to fifteen, and most sites take a short maintenance break in the early afternoon. If the evening peak is the one you care about, check the window before you fall in love with the site — a screen that closes at 7pm is no good to a restaurant.',
      },
      {
        kind: 'note',
        text: 'Two files in one booking costs no more in media. It costs one extra artwork adaptation, which is usually a very good trade.',
      },
      {
        kind: 'cta',
        text: 'Ask us which of our sites are still on air at the hour that matters to you.',
      },
    ],
    related: [
      'how-many-minutes-per-day-billboard',
      'best-billboard-locations-in-dhaka',
      'how-to-design-a-billboard-that-works',
      'how-led-billboards-work',
    ],
  },

  {
    slug: 'billboard-advertising-vs-online-ads',
    question: 'Is billboard advertising better than Facebook and Google ads?',
    shortTitle: 'Billboards vs online ads',
    category: 'Planning a campaign',
    shortAnswer:
      'They are not competitors, they are stages. Out-of-home builds the familiarity that makes people notice and trust you; online ads harvest the demand that familiarity creates. The brands that do best in Bangladesh run both and stop trying to attribute one to the other.',
    metaDescription:
      'Billboard advertising vs Facebook and Google ads in Bangladesh: what each one is genuinely good at, and why measuring OOH like a click campaign fails.',
    keywords: [
      'billboard vs Facebook ads',
      'OOH vs digital advertising',
      'outdoor advertising ROI',
      'brand building Bangladesh',
    ],
    body: [
      {
        kind: 'p',
        text: 'I get asked this a lot, usually by someone who has been running performance ads for two years and has watched their cost per acquisition climb every quarter. Which is, in itself, the answer.',
      },
      { kind: 'h2', text: 'What each one is actually for' },
      {
        kind: 'p',
        text: 'A performance ad is a harvesting tool. It finds people who are already somewhere near a decision and closes them efficiently. It is superb at that. What it cannot do is create the demand it harvests — and when you have harvested the easy demand, the cost of the next customer goes up. That is not a targeting problem you can optimise your way out of.',
      },
      {
        kind: 'p',
        text: 'Out-of-home does the unglamorous part: making a name familiar to a large number of people who were not looking for you. Familiarity is what makes somebody click the ad rather than scroll past it, and trust the shop rather than the cheaper unknown.',
      },
      {
        kind: 'table',
        caption: 'Two different jobs, honestly compared',
        head: ['', 'Out-of-home', 'Performance ads'],
        rows: [
          ['Primary job', 'Create familiarity and trust', 'Convert existing intent'],
          ['Who it reaches', 'Everyone on the road', 'People who match a signal'],
          ['Can be skipped', 'No', 'Yes, constantly'],
          ['Attribution', 'Indirect and lagged', 'Direct and immediate'],
          ['Cost trend as you scale', 'Roughly linear', 'Rises as the easy demand runs out'],
          ['Effect on the other', 'Lifts click-through and branded search', 'Little effect on OOH'],
        ],
      },
      { kind: 'h2', text: 'The measurement trap' },
      {
        kind: 'p',
        text: 'Here is where sensible marketers go wrong. They measure the billboard with the tools they use for the ads — last click, cost per acquisition — find nothing, and conclude it did not work.',
      },
      {
        kind: 'p',
        text: 'But nobody clicks a billboard. What they do is search your name three days later, or walk in, or finally notice the ad they had been scrolling past for a month. All of which is attributed to something else.',
      },
      {
        kind: 'note',
        text: 'The practical fix is embarrassingly simple: watch branded search volume, direct traffic and walk-ins before, during and after a run. If they move together while nothing else changed, you have your answer.',
      },
      {
        kind: 'cta',
        text: 'Already running performance ads? Tell us where they have plateaued and we will suggest what to put on the road.',
      },
    ],
    related: [
      'how-to-measure-billboard-results',
      'what-is-ooh-advertising',
      'can-small-businesses-use-billboards',
      'billboard-advertising-cost-bangladesh',
    ],
  },

  /* ------------------------------------------------- artwork and production */
  {
    slug: 'billboard-artwork-size-and-format',
    question: 'What size and format should billboard artwork be?',
    shortTitle: 'Artwork size and format',
    category: 'Artwork and production',
    shortAnswer:
      'For our digital network: MP4 video, built to the exact pixel dimensions of the screen you have booked. Most sites are 1920 × 1080; a few are portrait at 1080 × 1920 or 1152 × 1536. Design to the pixels, not to a print size.',
    metaDescription:
      'Billboard artwork size and format for Bangladesh LED screens: MP4 at 1920x1080 or portrait, file specs, safe areas and the mistakes that cost a day.',
    keywords: [
      'billboard artwork size',
      'LED billboard file format',
      'digital billboard design specs',
      'MP4 billboard advertising',
    ],
    body: [
      {
        kind: 'p',
        text: 'Getting this right saves you a day, and getting it wrong is the single most common reason a campaign misses its start date. So let us be precise.',
      },
      { kind: 'h2', text: 'The specification' },
      {
        kind: 'table',
        caption: 'Artwork requirements for the AD PRO LED network',
        head: ['Item', 'Requirement'],
        rows: [
          ['File format', 'MP4 — every screen in the network'],
          ['Landscape screens', '1920 × 1080 pixels (40 of 58 sites)'],
          ['Portrait screens', '1080 × 1920, or 1152 × 1536 on some faces'],
          ['Small entry-gate panels', '640 × 960 on the P3 gate screens'],
          ['Length', 'Usually 10-20 seconds, looped'],
          ['Audio', 'Not used — design as if silent, because it is'],
          ['Colour', 'RGB. Avoid very dark greys, which read as black on LED'],
          ['Safe area', 'Keep essential type away from the outer 5% of the frame'],
        ],
      },
      {
        kind: 'note',
        text: 'Design to the pixel dimensions of the actual screen. A file built at "billboard size" in millimetres and exported at whatever resolution the software chose is the classic cause of a soft, stretched result.',
      },
      { kind: 'h2', text: 'The four mistakes we see every week' },
      {
        kind: 'ol',
        items: [
          '<strong>A print file, upscaled.</strong> A CMYK layout at 300 dpi is not a video. Colours shift, type softens, and the result looks tired next to the screens either side of it.',
          '<strong>A landscape file rotated for a portrait screen.</strong> Portrait wants a genuinely different composition — stacked, not turned.',
          '<strong>Type too small.</strong> The rule of thumb is roughly 25mm of letter height for every 10 metres of viewing distance. It is always more than you think.',
          '<strong>Low contrast.</strong> Mid-grey on charcoal looks sophisticated on a monitor at arm’s length and disappears entirely at forty metres in daylight.',
        ],
      },
      { kind: 'h2', text: 'If you do not have artwork' },
      {
        kind: 'p',
        text: 'Most clients send us something from their own agency and we adapt it per face — which is real work, because a 40ft × 20ft landscape and a 10ft × 13ft portrait are not the same canvas. If there is nothing to adapt, our design team builds it as part of the booking. Either way, you approve before anything goes up.',
      },
      {
        kind: 'cta',
        text: 'Send us the artwork you have and we will tell you which screens it will work on as-is.',
      },
    ],
    related: [
      'how-to-design-a-billboard-that-works',
      'how-led-billboards-work',
      'how-quickly-can-a-billboard-go-live',
      'digital-vs-static-billboards',
    ],
  },

  {
    slug: 'how-to-design-a-billboard-that-works',
    question: 'How do you design a billboard that actually works?',
    shortTitle: 'Designing a billboard that works',
    category: 'Artwork and production',
    shortAnswer:
      'Say one thing. You have between two and four seconds with a moving audience, so the working limit is about seven words, one image, a legible brand mark and enormous contrast. Everything else you add makes those four elements harder to read.',
    metaDescription:
      'How to design a billboard that works: the seven-word rule, contrast, letter height and the six things to cut. Practical rules for Bangladeshi roadsides.',
    keywords: [
      'billboard design tips',
      'how to design a billboard',
      'outdoor advertising creative',
      'billboard copywriting',
    ],
    body: [
      {
        kind: 'p',
        text: 'The best billboard I saw in Dhaka last year had four words on it and no product shot. The worst had a phone number, two QR codes, a website, three service lines and a photograph of the managing director. Guess which one I can still remember.',
      },
      { kind: 'h2', text: 'The constraint nobody designs for' },
      {
        kind: 'p',
        text: 'You do not have a reader. You have a glance — two to four seconds, from a moving vehicle, at an angle, in glare, while somebody else is trying to merge. Every design decision has to survive that.',
      },
      {
        kind: 'p',
        text: 'Which is why the rules below are less about taste and more about physics.',
      },
      { kind: 'h2', text: 'The rules worth keeping' },
      {
        kind: 'ol',
        items: [
          '<strong>Seven words, maximum.</strong> Six is better. If you cannot get it to seven, the idea is not finished yet.',
          '<strong>One idea, one image.</strong> Not a hierarchy of three messages. One.',
          '<strong>Contrast beats beauty.</strong> Light type on dark, or dark on light. Nothing subtle survives daylight at distance.',
          '<strong>Brand mark large and early.</strong> If a viewer only takes away one thing, it must be who you are.',
          '<strong>Letter height, roughly 25mm per 10 metres of distance.</strong> Then go bigger.',
          '<strong>Leave air.</strong> A crowded frame reads as noise before it reads as anything else.',
        ],
      },
      { kind: 'h2', text: 'The things to cut, in order' },
      {
        kind: 'table',
        caption: 'What to remove first when the frame is too busy',
        head: ['Element', 'Why it goes'],
        rows: [
          ['QR codes', 'Nobody scans one from a moving car. Nobody.'],
          ['Website URL', 'People search your name; they do not memorise a slash'],
          ['Phone numbers', 'Eleven digits at forty metres in three seconds — no'],
          ['Social handles', 'The same problem as the URL, in smaller type'],
          ['Body copy', 'If it needs a sentence, it needs a different medium'],
          ['Secondary offers', 'The second offer weakens the first'],
        ],
      },
      {
        kind: 'photo',
        board: 'dhaka-manik-mia-avenue-aarong-signal',
        caption:
          'Manik Mia Avenue — 800 sq ft. A big face is an invitation to say less, not more.',
      },
      {
        kind: 'note',
        text: 'A useful test before you sign off: look at the artwork at thumbnail size on your phone, for two seconds, then look away. Whatever you can still recall is what the road will get.',
      },
      {
        kind: 'cta',
        text: 'Send us your draft. We will tell you what to cut — for free, and fairly bluntly.',
      },
    ],
    related: [
      'billboard-artwork-size-and-format',
      'can-small-businesses-use-billboards',
      'best-time-of-day-for-billboard-advertising',
      'how-to-measure-billboard-results',
    ],
  },

  {
    slug: 'led-billboard-brightness-and-weather',
    question: 'How do LED billboards handle sunlight, rain and the monsoon?',
    shortTitle: 'Brightness, rain and monsoon',
    category: 'Artwork and production',
    shortAnswer:
      'Outdoor LED screens are built far brighter than any television and adjust through the day, so they stay readable in direct sun and do not glare at night. The structures are weather-rated and sealed; monsoon affects mounting schedules for printed faces far more than it affects screens.',
    metaDescription:
      'Do LED billboards work in sunlight and monsoon rain in Bangladesh? How brightness control, sealing and weather rating keep screens readable year round.',
    keywords: [
      'LED billboard brightness',
      'billboard in monsoon Bangladesh',
      'outdoor LED screen weather',
      'billboard maintenance',
    ],
    body: [
      {
        kind: 'p',
        text: 'Two worries come up in almost every first conversation: will anyone see it at two in the afternoon, and what happens when it rains for a week. Both are reasonable. Both have fairly boring answers, which is the best kind.',
      },
      { kind: 'h2', text: 'Sunlight' },
      {
        kind: 'p',
        text: 'An outdoor LED billboard is engineered to be many times brighter than the screen you are reading this on. It has to be — it is competing with the sky. Brightness is managed automatically through the day so the screen stays readable at noon without becoming a hazard after dark, which matters as much for the drivers as it does for you.',
      },
      {
        kind: 'p',
        text: 'What sunlight <em>does</em> punish is weak artwork. A washed-out palette that looked refined in a meeting room will vanish in direct light. This is the practical reason we push so hard on contrast.',
      },
      { kind: 'h2', text: 'Rain and monsoon' },
      {
        kind: 'p',
        text: 'The panels are sealed and the structures are engineered for local wind and rain loads. A wet week is, for a digital screen, an ordinary week — and arguably a good one, since traffic slows further and dwell time goes up.',
      },
      {
        kind: 'p',
        text: 'The monsoon’s real effect is on <strong>printed</strong> campaigns. Mounting a skin needs a crew, access equipment and a dry window. That is why static lead times stretch between June and September, and why a hard launch date in that period is better served by digital.',
      },
      {
        kind: 'table',
        caption: 'What weather actually changes',
        head: ['Condition', 'Digital LED', 'Printed static'],
        rows: [
          ['Direct midday sun', 'Brightness adjusts; readable', 'Fine; fading over months'],
          ['Heavy rain', 'Unaffected', 'Fine once mounted'],
          ['Monsoon season', 'Unaffected', 'Mounting windows get tighter'],
          ['High wind', 'Structure-rated', 'Structure-rated; skin checked after'],
          ['Power interruption', 'Off while it lasts; logged', 'Unaffected'],
        ],
      },
      {
        kind: 'note',
        text: 'Most of our sites take a short maintenance break in the early afternoon. It is stated on every site page, because a screen that is honest about its downtime is easier to plan around than one that claims never to have any.',
      },
      {
        kind: 'cta',
        text: 'Planning a monsoon-season launch? Ask us which format we would recommend for those dates.',
      },
    ],
    related: [
      'how-led-billboards-work',
      'how-quickly-can-a-billboard-go-live',
      'how-to-measure-billboard-results',
      'billboard-artwork-size-and-format',
    ],
  },

  /* ---------------------------------------------- proof and legal / measure */
  {
    slug: 'how-to-measure-billboard-results',
    question: 'How do you measure whether a billboard campaign worked?',
    shortTitle: 'Measuring billboard results',
    category: 'Proof and measurement',
    shortAnswer:
      'Two separate things: proof it ran, and proof it did something. We supply the first as a played-spot log for digital and dated site photographs for static. For the second, watch branded search, direct traffic and walk-ins across the run rather than looking for clicks.',
    metaDescription:
      'How to measure billboard advertising results in Bangladesh: proof-of-play logs, site photography, and the brand signals that actually move during a run.',
    keywords: [
      'measure billboard ROI',
      'proof of play OOH',
      'billboard campaign report',
      'OOH measurement Bangladesh',
    ],
    body: [
      {
        kind: 'p',
        text: 'Let us separate two questions that get tangled together constantly, because conflating them is how people end up disappointed by a campaign that worked perfectly well.',
      },
      { kind: 'h2', text: 'Question one: did it actually run?' },
      {
        kind: 'p',
        text: 'This one has a hard answer, and you should never accept a soft one.',
      },
      {
        kind: 'ul',
        items: [
          '<strong>Digital.</strong> A played-spot log — a record of every slot served, when it played and on which screen. Every site in our network reports this way.',
          '<strong>Static.</strong> Dated, geotagged photographs at installation and through the run, so you can see the skin is up, intact and unobstructed.',
        ],
      },
      {
        kind: 'p',
        text: 'Both land in a close report at the end. If a supplier cannot produce this, that is worth knowing before you book, not after.',
      },
      { kind: 'h2', text: 'Question two: did it do anything?' },
      {
        kind: 'p',
        text: 'Harder, and this is where honesty matters more than a dashboard. Out-of-home has no click. Anyone promising you a clean cost-per-acquisition from a billboard is selling you a number they made up.',
      },
      {
        kind: 'p',
        text: 'What you can do is watch the signals that move when familiarity moves — and, critically, measure them <em>before</em> the run so you have something to compare against.',
      },
      {
        kind: 'table',
        caption: 'What to track around a run',
        head: ['Signal', 'How to read it', 'When it moves'],
        rows: [
          ['Branded search volume', 'Searches for your name, not your category', 'During, and for weeks after'],
          ['Direct traffic', 'People typing you in rather than clicking', 'During the run'],
          ['Walk-ins or calls', 'Counted at the outlet', 'Lagged by days'],
          ['Click-through on your other ads', 'Same creative, same targeting', 'Often lifts during the run'],
          ['"Where did you hear about us"', 'Ask at the point of sale', 'Under-reports OOH badly — expect that'],
        ],
      },
      {
        kind: 'note',
        text: 'Take a two-week baseline before you go live. Without it you are comparing the campaign to a feeling, and a feeling always loses the argument in a review meeting.',
      },
      {
        kind: 'cta',
        text: 'Ask us for a sample close report before you book — you should know what you are getting.',
      },
    ],
    related: [
      'billboard-advertising-vs-online-ads',
      'how-many-minutes-per-day-billboard',
      'how-to-book-a-billboard-in-bangladesh',
      'billboard-advertising-cost-bangladesh',
    ],
  },

  {
    slug: 'billboard-permission-and-licence-bangladesh',
    question: 'Do you need permission or a licence for a billboard in Bangladesh?',
    shortTitle: 'Permissions and licences',
    category: 'Proof and measurement',
    shortAnswer:
      'Yes — outdoor structures need clearance from the relevant city corporation or local authority, and the structure itself needs to be sound. When you book an existing site from an operator, those permissions sit with the operator, which is one of the practical reasons to book from one.',
    metaDescription:
      'Billboard permission and licensing in Bangladesh: who clears what, why booking an existing site avoids the paperwork, and what to ask an operator.',
    keywords: [
      'billboard permission Bangladesh',
      'billboard licence Dhaka city corporation',
      'outdoor advertising regulation',
      'billboard legal requirements',
    ],
    body: [
      {
        kind: 'p',
        text: 'This is the part of out-of-home nobody puts on a slide, and it is exactly the part that catches out advertisers who try to arrange a structure themselves because somebody offered them a cheap wall.',
      },
      { kind: 'h2', text: 'What needs clearing' },
      {
        kind: 'p',
        text: 'Broadly three things, and they are separate from each other:',
      },
      {
        kind: 'ol',
        items: [
          '<strong>The structure.</strong> A unipole, gantry or screen frame is a piece of engineering above a public road. It needs to be built and certified to stand up, in this climate, for years.',
          '<strong>The site.</strong> Permission to have an advertising structure in that location, from the relevant city corporation or local authority.',
          '<strong>Access.</strong> Agreement with whoever owns the rooftop, facade or land it stands on.',
        ],
      },
      {
        kind: 'p',
        text: 'Each has its own timeline, and none of them can be rushed by wanting them more.',
      },
      { kind: 'h2', text: 'What this means for you, practically' },
      {
        kind: 'p',
        text: 'If you book screen time or a face on an existing, operating site, all of that is already done and it stays with the operator. You are buying media, not commissioning construction. This is the ordinary case and it is why lead times are measured in days.',
      },
      {
        kind: 'p',
        text: 'If you want a structure built somewhere one does not exist, you are in a different conversation with a different timeline — survey, permission, fabrication, mounting. Worth doing for a long-term flagship position. Not worth starting six weeks before a launch.',
      },
      {
        kind: 'table',
        caption: 'Two very different routes to a billboard',
        head: ['', 'Booking an existing site', 'Commissioning a new structure'],
        rows: [
          ['Permissions', 'Already held by the operator', 'To be obtained'],
          ['Structural certification', 'Already in place', 'Part of the build'],
          ['Typical lead time', 'Days', 'Months'],
          ['Who carries the risk', 'The operator', 'Shared, and worth pinning down in writing'],
          ['Suits', 'Campaigns', 'Long-term flagship presence'],
        ],
      },
      {
        kind: 'note',
        text: 'A fair question to ask any operator, including us: who holds the permission on this site, and what happens to my campaign if it lapses mid-run? A straight answer to that tells you a lot.',
      },
      {
        kind: 'cta',
        text: 'Want a structure where none exists? Tell us the location and we will tell you honestly what it involves.',
      },
    ],
    related: [
      'how-quickly-can-a-billboard-go-live',
      'digital-vs-static-billboards',
      'how-to-book-a-billboard-in-bangladesh',
      'how-to-measure-billboard-results',
    ],
  },

  /* ---------------------------------------------------------------- cities */
  {
    slug: 'billboard-advertising-in-sylhet',
    question: 'What billboard advertising is available in Sylhet?',
    shortTitle: 'Billboards in Sylhet',
    category: 'Cities',
    shortAnswer:
      'Sylhet is the second-largest city network we operate, with eight LED sites covering Bondor Bazar, Chowkideki, Jitu Miah Point, Nairpul, Rikabi Bazar, Surma Point, Tilaghar and Uposohor — effectively the whole central ring.',
    metaDescription:
      'Billboard advertising in Sylhet: eight LED sites across Bondor Bazar, Surma Point, Rikabi Bazar and more, with sizes, hours and photographs of each.',
    keywords: [
      'billboard advertising Sylhet',
      'LED screen Sylhet',
      'Bondor Bazar advertising',
      'outdoor advertising Sylhet',
    ],
    cities: ['sylhet'],
    body: [
      {
        kind: 'p',
        text: 'Sylhet is a genuinely different proposition from Dhaka, and advertisers who treat it as "Dhaka, smaller" tend to under-buy it.',
      },
      { kind: 'h2', text: 'Why a smaller city can be the better buy' },
      {
        kind: 'p',
        text: 'Dhaka is enormous, which means a single screen reaches a slice of it. Sylhet concentrates its traffic through a handful of central points — which means a modest set of well-placed faces reaches a large share of the city rather than a fragment.',
      },
      {
        kind: 'p',
        text: 'Add the remittance economy, a strong retail and hospitality sector and a substantial diaspora audience visiting through the year, and the case for treating Sylhet as a market in its own right — not a rounding error on a national plan — is quite strong.',
      },
      {
        kind: 'p',
        text: 'We hold eight LED sites there, across the central points: <strong>Bondor Bazar</strong>, <strong>Chowkideki Point</strong>, <strong>Jitu Miah Point</strong>, <strong>Nairpul Point</strong>, <strong>Rikabi Bazar</strong>, <strong>Surma Point</strong>, <strong>Tilaghar Point</strong> and <strong>Uposohor</strong>.',
      },
      {
        kind: 'photo',
        board: 'sylhet-sylhet-surma-point',
        caption: 'Surma Point, Sylhet. A handful of central faces covers most of the city.',
      },
      { kind: 'h2', text: 'The eight sites, and what each one is for' },
      {
        kind: 'table',
        caption: 'AD PRO LED sites in Sylhet',
        head: ['Site', 'Character of the location'],
        rows: [
          ['Bondor Bazar', 'The commercial heart — retail footfall and through-traffic'],
          ['Surma Point', 'A major approach, heavy vehicle flow'],
          ['Chowkideki Point', 'Junction traffic on the central ring'],
          ['Jitu Miah Point', 'Dense local movement, close-range reading'],
          ['Nairpul Point', 'Connecting route between centre and suburbs'],
          ['Rikabi Bazar', 'Market and residential mix'],
          ['Tilaghar Point', 'Education and residential catchment'],
          ['Uposohor', 'Planned residential, higher-income households'],
        ],
      },
      {
        kind: 'p',
        text: 'Sizes across the city are more uniform than in Dhaka, which makes planning simpler: one artwork usually adapts across the whole set without a redraw per face. That alone takes a chunk of production cost out of a multi-site booking.',
      },
      { kind: 'h2', text: 'Timing it' },
      {
        kind: 'p',
        text: 'Two patterns are worth knowing. The first is the diaspora calendar — visitor numbers swell around the winter months and the Eid holidays, and hospitality, jewellery, property and travel advertisers move with it. The second is the academic year, which drives a lot of the movement through Tilaghar and Uposohor.',
      },
      {
        kind: 'p',
        text: 'If either of those is your market, plan backwards from the season rather than forwards from your budget cycle. It is the single change that most improves a regional booking.',
      },
      {
        kind: 'note',
        text: 'Because the sites ring the centre, a multi-site booking in Sylhet behaves more like a route campaign than a scatter — the same commuter is likely to pass two or three of them, which is how you get frequency without buying more minutes.',
      },
      {
        kind: 'cta',
        text: 'Planning Sylhet? Ask for the full eight-site availability and we will show you which ones overlap.',
      },
    ],
    related: [
      'billboard-advertising-in-chattogram',
      'best-billboard-locations-in-dhaka',
      'billboard-advertising-cost-bangladesh',
      'how-to-book-a-billboard-in-bangladesh',
    ],
  },

  {
    slug: 'billboard-advertising-in-chattogram',
    question: 'What billboard advertising is available in Chattogram and beyond?',
    shortTitle: 'Chattogram and the regions',
    category: 'Cities',
    shortAnswer:
      'Outside Dhaka and Sylhet we operate LED sites in Chattogram, Cox’s Bazar, Rajshahi, Cumilla, Rangpur, Bogura, Narayanganj and Feni — ten cities in total. Regional sites tend to be the most efficient reach in the network.',
    metaDescription:
      'Billboard advertising in Chattogram, Cox’s Bazar, Rajshahi, Rangpur, Bogura, Cumilla, Narayanganj and Feni — regional LED sites and how to plan them.',
    keywords: [
      'billboard advertising Chattogram',
      'Cox’s Bazar advertising',
      'Rajshahi billboard',
      'regional OOH Bangladesh',
    ],
    cities: ['chattogram', 'coxs-bazar', 'rajshahi', 'cumilla', 'rangpur', 'bogura', 'narayanganj', 'feni'],
    body: [
      {
        kind: 'p',
        text: 'National plans in Bangladesh have a habit of stopping at the edge of Dhaka, then bolting on "regional" as an afterthought two weeks before launch. It is usually the wrong way round.',
      },
      { kind: 'h2', text: 'Where we hold sites' },
      {
        kind: 'table',
        caption: 'The regional network outside Dhaka and Sylhet',
        head: ['City', 'Sites', 'Character'],
        rows: [
          ['Chattogram', '2', 'Port city — Agrabad Circle and the Shohortoli station approach'],
          ['Cox’s Bazar', '3', 'Tourism and hospitality, strongly seasonal'],
          ['Rajshahi', '2', 'Education and regional retail'],
          ['Cumilla', '1', 'Kandirpar — the commercial centre'],
          ['Rangpur', '1', 'Shapla Mor, the northern hub'],
          ['Bogura', '1', 'Police Plaza, facing the Circuit House'],
          ['Narayanganj', '1', 'Industrial belt adjoining Dhaka'],
          ['Feni', '1', 'Inside the city, on the southern corridor'],
        ],
      },
      { kind: 'h2', text: 'Two things regional buying gets you' },
      {
        kind: 'p',
        text: '<strong>Efficiency.</strong> A single face in Cumilla or Rangpur covers a much larger proportion of that city than any one Dhaka site covers of Dhaka. If you are measuring reach per taka, the regions usually win.',
      },
      {
        kind: 'p',
        text: '<strong>Distribution support.</strong> If you sell through a regional distributor network, a visible presence in their town does something for the trade relationship that a Dhaka billboard never will. Salespeople notice. So do retailers.',
      },
      {
        kind: 'photo',
        board: 'coxs-bazar-dolphin-moor-coxs-bazar',
        caption: 'Dolphin Moor, Cox’s Bazar. Seasonal, tourism-led, and worth timing deliberately.',
      },
      {
        kind: 'note',
        text: 'Cox’s Bazar swings hard with the tourist season. If that is your market, book around the season rather than the calendar quarter.',
      },
      {
        kind: 'cta',
        text: 'Building a national plan? Send us the priority markets and we will map what is available in each.',
      },
    ],
    related: [
      'billboard-advertising-in-sylhet',
      'best-billboard-locations-in-dhaka',
      'minimum-budget-billboard-campaign',
      'how-to-book-a-billboard-in-bangladesh',
    ],
  },

  /* --------------------------------------------------------------- booking */
  {
    slug: 'how-to-book-a-billboard-in-bangladesh',
    question: 'How do you book a billboard in Bangladesh?',
    shortTitle: 'How to book a billboard',
    category: 'Planning a campaign',
    shortAnswer:
      'Tell an operator four things — the cities, the dates, the format and a rough budget — and you should have a written plan with sites, sizes and an all-in cost within a working day. Artwork follows, then you are live in 24 to 48 hours on digital.',
    metaDescription:
      'How to book a billboard in Bangladesh, step by step: what to send, what to expect back, what to check in the quote and how fast you can be on air.',
    keywords: [
      'how to book a billboard Bangladesh',
      'billboard booking process',
      'rent a billboard Dhaka',
      'billboard advertising agency Bangladesh',
    ],
    body: [
      {
        kind: 'p',
        text: 'It is less complicated than most people expect, and the whole thing usually turns on one early conversation being specific enough.',
      },
      { kind: 'h2', text: 'The four things to have ready' },
      {
        kind: 'ol',
        items: [
          '<strong>Cities or areas.</strong> Not "Dhaka" — which side. If your customers come from Uttara, say Uttara.',
          '<strong>Dates.</strong> A start date and a duration. If the date is hard, say so first; it changes what we show you.',
          '<strong>Format, or the goal.</strong> If you do not know whether you want digital or static, describe the campaign instead and let the operator recommend.',
          '<strong>A budget band.</strong> Even a wide one. Without it you get a plan aimed at the wrong tier and a week disappears.',
        ],
      },
      { kind: 'h2', text: 'What should come back' },
      {
        kind: 'table',
        caption: 'What a proper proposal contains',
        head: ['Item', 'Why it matters'],
        rows: [
          ['A named site list, not "premium locations"', 'You cannot judge an approach angle from an adjective'],
          ['A photograph of each face', 'Shows obstruction, angle and what surrounds it'],
          ['Size, facing and on-air window per site', 'Tells you who actually sees it and when'],
          ['Minutes per day and run length', 'The two levers that set the cost'],
          ['An all-in cost including production', 'Stops a second invoice appearing later'],
          ['What proof you get at the end', 'Played-spot log or dated photographs'],
        ],
      },
      { kind: 'h2', text: 'The sequence' },
      {
        kind: 'ol',
        items: [
          'You send the four things above. <em>Same day.</em>',
          'We come back with availability and a written plan. <em>Within one working day.</em>',
          'You pick the sites and confirm.',
          'Artwork is supplied or designed, then adapted per face and approved by you.',
          'Digital goes live in 24-48 hours; static is printed, permitted and mounted in five to seven working days.',
          'You get monitoring through the run and a close report at the end.',
        ],
      },
      {
        kind: 'note',
        text: 'The fastest route is genuinely the phone. We can usually tell you what is free while you are still on the line — call +880 1316-743003.',
      },
      {
        kind: 'cta',
        text: 'Ready? Call +880 1316-743003, or send the cities and dates and we will do the rest.',
      },
    ],
    related: [
      'billboard-advertising-cost-bangladesh',
      'how-quickly-can-a-billboard-go-live',
      'best-billboard-locations-in-dhaka',
      'how-to-measure-billboard-results',
    ],
  },
];

export const faqCategories: FaqCategory[] = [
  'Costs and budget',
  'Formats and inventory',
  'Planning a campaign',
  'Artwork and production',
  'Proof and measurement',
  'Cities',
];

export const faqBySlug = (slug: string): FaqArticle | undefined =>
  faqArticles.find((a) => a.slug === slug);

/** Questions grouped for the hub, in the order the categories are declared. */
export const faqGroups = faqCategories
  .map((category) => ({
    category,
    articles: faqArticles.filter((a) => a.category === category),
  }))
  .filter((g) => g.articles.length > 0);
