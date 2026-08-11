/**
 * Every string on the site, in one file.
 *
 * Nothing else hard-codes copy: pages pull from here, and the build-time
 * generators in src/build/ read the same objects, so navigation, sitemap,
 * structured data and the visible page can never disagree.
 */

export interface NavLink {
  label: string;
  href: string;
  /** Renders as a nested group in the overlay menu. */
  children?: NavLink[];
}

export interface NavGroup {
  tag: string;
  label: string;
  links: NavLink[];
}

export const company = {
  name: 'AD PRO Communications Limited',
  shortName: 'AD PRO',
  wordmark: 'AD PRO',
  descriptor: 'Outdoor Advertising Agency in Bangladesh',
  tagline: 'Out-of-home that the whole city stops for',
  founded: 2019,
  email: 'info@adprobd.com',
  phone: '+880 1763-924619',
  phoneHref: '+8801763924619',
  corporateAddress:
    'Flat A1, House 99 (1st floor), Road 10/2, Block D, Niketon, Gulshan 1, Dhaka',
  registeredAddress:
    '37/2 Purana Paltan (9th floor), Fayanaz Apartment, Paltan, Dhaka 1000',
  mapUrl: 'https://www.openstreetmap.org/search?query=Niketon%20Gulshan%201%20Dhaka',
  /** Set this the moment a domain is live — it feeds canonical, OG and sitemap. */
  siteUrl: 'https://adpro.com.bd',
  country: 'Bangladesh',
  city: 'Dhaka',
} as const;

/** Headline figures. Kept in one place because they appear on several pages. */
export const stats = [
  { value: '400+', label: 'Brands advertised', detail: 'From local challengers to global names.' },
  { value: '2,000+', label: 'Campaigns delivered', detail: 'Planned, printed, mounted, monitored.' },
  { value: '150+', label: 'Digital locations', detail: 'LED inventory across the country.' },
  { value: '60%', label: 'Of premium digital boards', detail: 'The largest single network in Bangladesh.' },
];

export const nav: NavGroup[] = [
  {
    tag: 'inventory',
    label: 'Inventory',
    links: [
      {
        label: 'Billboards',
        href: 'billboards.html',
        children: [
          { label: 'Static Billboards', href: 'static-billboards.html' },
          { label: 'Digital Billboards', href: 'digital-billboards.html' },
        ],
      },
      { label: 'Services', href: 'services.html' },
    ],
  },
  {
    tag: 'learn',
    label: 'Read',
    links: [
      { label: 'News', href: 'news.html' },
      { label: 'How it works', href: 'faq.html' },
    ],
  },
  {
    tag: 'company',
    label: 'Company',
    links: [
      { label: 'Clients', href: 'clients.html' },
      { label: 'About', href: 'about.html' },
    ],
  },
  {
    tag: 'contact',
    label: 'Talk to us',
    links: [{ label: 'Book a site', href: 'contact.html' }],
  },
];

export const socials: NavLink[] = [
  { label: 'Facebook', href: 'https://facebook.com' },
  { label: 'LinkedIn', href: 'https://linkedin.com' },
  { label: 'Instagram', href: 'https://instagram.com' },
  { label: 'YouTube', href: 'https://youtube.com' },
];

/** Sister platforms the group operates. */
export const platforms: NavLink[] = [
  { label: 'OOH BD', href: 'https://oohbd.com' },
  { label: 'LED Ad Pro', href: 'https://adpro.com.bd' },
  { label: 'Event360Pro', href: 'https://adpro.com.bd' },
  { label: 'Transit Ad Pro', href: 'https://adpro.com.bd' },
  { label: 'Brand Activation BD', href: 'https://adpro.com.bd' },
];

export interface Slide {
  eyebrow: string;
  title: string;
  lede: string;
  caption: string;
  /** Drop a file of this name into public/ to replace the gradient stand-in. */
  image?: string;
  cta?: { label: string; href: string };
}

export const slides: Slide[] = [
  {
    eyebrow: 'Outdoor advertising, Bangladesh',
    title: 'Be seen where the country actually is',
    lede: 'Digital and static out-of-home across Dhaka, Chattogram and Sylhet — planned around traffic, not around what happens to be vacant.',
    caption: 'Panthapath, Dhaka — 24ft × 32ft digital',
    cta: { label: 'See the inventory', href: 'billboards.html' },
  },
  {
    eyebrow: 'Digital network',
    title: 'The largest LED network in the country',
    lede: 'Around 60% of the premium digital boards in Bangladesh, across 150+ locations, bookable by the day.',
    caption: 'Bashundhara City, Dhaka — full-motion LED',
    cta: { label: 'Digital billboards', href: 'digital-billboards.html' },
  },
  {
    eyebrow: 'Static network',
    title: 'The formats that hold a junction',
    lede: 'Unipoles, gantries and building wraps in the positions people sit in front of every morning.',
    caption: 'Gulshan 1 junction, Dhaka — gantry',
    cta: { label: 'Static billboards', href: 'static-billboards.html' },
  },
];

export const homeIntro = {
  heading: 'One agency, from the site survey to the last night of the run',
  body: [
    'AD PRO Communications Limited plans, builds and runs out-of-home advertising across Bangladesh. We own and operate the network rather than reselling it, which is why we can tell you what a site actually delivers before you book it — the traffic that passes it, the angle it is read from, and the hours it is worth paying for.',
    'Everything happens under one roof: site selection, structural work, printing, mounting, permissions, and the monitoring photographs that prove your campaign ran the way it was sold.',
  ],
  ctas: [
    { label: 'Browse billboards', href: 'billboards.html' },
    { label: 'Book a site', href: 'contact.html' },
  ],
};

export const marqueeItems = [
  'Digital billboards',
  'Static billboards',
  'LED caravans',
  'Transit branding',
  'Airport branding',
  'Brand activation',
  'Signage & fabrication',
  'Printing & packaging',
];

export interface Service {
  slug: string;
  title: string;
  subtitle: string;
  body: string;
  points: string[];
  linkLabel: string;
  href: string;
}

export const services: Service[] = [
  {
    slug: 'digital-billboards',
    title: 'Digital Billboards',
    subtitle: 'Full-motion LED, bookable by the day',
    body: 'High-brightness LED across the country’s busiest junctions. Creative can change by time of day, so a breakfast message and an evening one run from the same booking without a reprint.',
    points: [
      'Day-part scheduling and same-day creative swaps',
      'Automatic brightness for daylight and night legibility',
      'Proof-of-play reporting for every slot',
    ],
    linkLabel: 'Digital billboards',
    href: 'digital-billboards.html',
  },
  {
    slug: 'static-billboards',
    title: 'Static Billboards',
    subtitle: 'Unipoles, gantries and building wraps',
    body: 'The formats that own a junction for a month at a time. Printed on weather-rated media, mounted by our own crews, and photographed on installation so you can see exactly what went up.',
    points: [
      'Unipole, gantry, wall wrap and rooftop formats',
      'Weather-rated print with anti-glare lamination',
      'Installation and monthly condition photography',
    ],
    linkLabel: 'Static billboards',
    href: 'static-billboards.html',
  },
  {
    slug: 'portable-led',
    title: 'Portable LED & Caravans',
    subtitle: 'Screens that go to the audience',
    body: 'Truck-mounted LED and portable screens for launches, match days and campaigns that need to move — routed through the areas and hours where your audience actually is.',
    points: [
      'Route planning around events and peak footfall',
      'Screens from 6ft to 20ft, with sound',
      'Same-day deployment inside Dhaka',
    ],
    linkLabel: 'Enquire',
    href: 'contact.html',
  },
  {
    slug: 'transit-airport',
    title: 'Transit & Airport Branding',
    subtitle: 'Vehicles, terminals and glass',
    body: 'Bus and vehicle wraps, terminal panels, airport branding and glass application. High-dwell placements where people are already waiting and reading.',
    points: [
      'Fleet wraps and rear-panel networks',
      'Airport and terminal placements',
      'Frosted and printed glass application',
    ],
    linkLabel: 'Enquire',
    href: 'contact.html',
  },
  {
    slug: 'activation',
    title: 'Brand Activation & Events',
    subtitle: 'Outlet launches and roadshows',
    body: 'Stalls, stages, roadshows and outlet launches, built and staffed by our own team. The structures come from the same fabrication shop that builds our billboards.',
    points: [
      'Concept, fabrication, crew and teardown',
      'Outlet launches and in-mall activations',
      'Permits and local coordination handled',
    ],
    linkLabel: 'Enquire',
    href: 'contact.html',
  },
  {
    slug: 'print',
    title: 'Signage, Printing & Packaging',
    subtitle: 'The production behind everything else',
    body: 'Large-format print, illuminated signage, shop fascias and packaging. Owning the press is why our lead times hold when a campaign date moves.',
    points: [
      'Large-format and backlit printing',
      'Illuminated signage and shop fascias',
      'Packaging and point-of-sale production',
    ],
    linkLabel: 'Enquire',
    href: 'contact.html',
  },
];

/* --- billboard inventory ---------------------------------------------------

   The real network, read from src/data/boards.json — 58 LED sites lifted out
   of the AD PRO proposal deck, one record per screen, each with the site
   photograph that came with it.

   Rates are deliberately absent. The deck quotes a per-minute cost for every
   screen; those move, and a stale number on a public page is worse than no
   number, so every listing asks the visitor to call instead.                */

import boardData from './boards.json';

export type BillboardKind = 'digital' | 'static';

export interface Billboard {
  slug: string;
  /** The site as the deck names it, e.g. "Gulshan Circle-1, Upper". */
  name: string;
  /** Unique across the network — two sites share a name, so the page title
      carries the facing as well. */
  title: string;
  city: string;
  citySlug: string;
  /** As printed: W-30' x H-20'. */
  dimension: string;
  facing: string;
  resolution: string;
  format: string;
  ledModel: string;
  hours: string;
  schedule: string;
  minimum: string;
  breakTime: string;
  reporting: string;
  image: string;
  /** Where the screen sits in the cropped photo, 0-1 across and down, so
      `object-position` can hold it in frame at any aspect ratio. */
  focus: [number, number];
  /**
   * The dominant colour of whatever this screen was showing when it was
   * photographed, lifted until it clears 3.5:1 on the page background.
   * Sampled by scripts/sample-accents.py rather than chosen — it is what
   * makes 58 pages off one template read as 58 places instead of one page
   * repeated 58 times.
   */
  accent?: string;
}

export const billboards: Billboard[] = (boardData as Billboard[]).map((b) => ({
  ...b,
  focus: [b.focus[0], b.focus[1]] as [number, number],
}));

/** A site's accent, or the brand blue where its screen carried no usable
    colour. One place, so a missing sample degrades the same way everywhere. */
export const accentOf = (board: Billboard): string => board.accent || '#6ba3e8';

/** Every screen in the deck is LED. Static formats are sold, but none of the
    sites in this inventory are static, so the split is a constant. */
export const kindOf = (_board: Billboard): BillboardKind => 'digital';

export const digitalBoards = billboards;
export const staticBoards: Billboard[] = [];

export interface CityGroup {
  city: string;
  slug: string;
  boards: Billboard[];
}

/** Cities with inventory, largest network first — derived, so it can never
    drift from the list above. */
export const cityGroups: CityGroup[] = [...new Set(billboards.map((b) => b.citySlug))]
  .map((slug) => {
    const boards = billboards.filter((b) => b.citySlug === slug);
    return { city: boards[0].city, slug, boards };
  })
  .sort((a, b) => b.boards.length - a.boards.length || a.city.localeCompare(b.city));

export const cities = cityGroups.map((g) => g.city);

export const boardBySlug = (slug: string): Billboard | undefined =>
  billboards.find((b) => b.slug === slug);

/** Sites a visitor would plausibly consider instead of this one: the rest of
    its city first, then the next city along, which is what makes the network
    navigable without going back to the hub every time. */
export function relatedBoards(board: Billboard, limit = 6): Billboard[] {
  const sameCity = billboards.filter(
    (b) => b.citySlug === board.citySlug && b.slug !== board.slug,
  );
  const elsewhere = billboards.filter((b) => b.citySlug !== board.citySlug);
  return [...sameCity, ...elsewhere].slice(0, limit);
}

/* --- format comparison, used on the billboards hub ------------------------ */

export const formatComparison = [
  { label: 'Minimum booking', digital: 'One day', static: 'One month' },
  { label: 'Creative changes', digital: 'Same day, unlimited', static: 'Reprint required' },
  { label: 'Day-part targeting', digital: 'Yes, by hour', static: 'No' },
  { label: 'Share of screen', digital: 'Rotating slots', static: 'Sole occupancy' },
  { label: 'Rates', digital: 'On request — call for price', static: 'On request — call for price' },
  { label: 'Best for', digital: 'Launches, offers, dated messages', static: 'Always-on presence' },
];

/* --- clients -------------------------------------------------------------- */

/**
 * Client sectors rather than a wall of third-party logos.
 *
 * Client marks are their trademarks, not ours to redraw, so the wall renders
 * monogram tiles built from the name. Drop approved logo files into
 * public/clients/ and set `logo` to switch a tile to the real mark.
 */
export interface Client {
  name: string;
  sector: string;
  logo?: string;
}

export const clientSectors = [
  'Telecom',
  'Banking & Fintech',
  'FMCG',
  'Automotive',
  'Airlines & Travel',
  'Electronics',
  'Food & Beverage',
  'Real Estate',
  'Pharmaceutical',
  'Retail & E-commerce',
  'Education',
  'Development & NGO',
];

export const clients: Client[] = [
  { name: 'Grameenphone', sector: 'Telecom' },
  { name: 'Robi', sector: 'Telecom' },
  { name: 'Banglalink', sector: 'Telecom' },
  { name: 'Teletalk', sector: 'Telecom' },
  { name: 'bKash', sector: 'Banking & Fintech' },
  { name: 'Nagad', sector: 'Banking & Fintech' },
  { name: 'BRAC Bank', sector: 'Banking & Fintech' },
  { name: 'City Bank', sector: 'Banking & Fintech' },
  { name: 'Eastern Bank', sector: 'Banking & Fintech' },
  { name: 'Unilever', sector: 'FMCG' },
  { name: 'Nestle', sector: 'FMCG' },
  { name: 'Pran RFL', sector: 'FMCG' },
  { name: 'ACI', sector: 'FMCG' },
  { name: 'Square', sector: 'Pharmaceutical' },
  { name: 'Beximco', sector: 'Pharmaceutical' },
  { name: 'Renata', sector: 'Pharmaceutical' },
  { name: 'Coca-Cola', sector: 'Food & Beverage' },
  { name: 'KFC', sector: 'Food & Beverage' },
  { name: 'Pizza Hut', sector: 'Food & Beverage' },
  { name: 'Bata', sector: 'Retail & E-commerce' },
  { name: 'Daraz', sector: 'Retail & E-commerce' },
  { name: 'Aarong', sector: 'Retail & E-commerce' },
  { name: 'Walton', sector: 'Electronics' },
  { name: 'Samsung', sector: 'Electronics' },
  { name: 'Singer', sector: 'Electronics' },
  { name: 'Vision', sector: 'Electronics' },
  { name: 'Royal Enfield', sector: 'Automotive' },
  { name: 'Yamaha', sector: 'Automotive' },
  { name: 'Toyota', sector: 'Automotive' },
  { name: 'Bajaj', sector: 'Automotive' },
  { name: 'Emirates', sector: 'Airlines & Travel' },
  { name: 'Malaysia Airlines', sector: 'Airlines & Travel' },
  { name: 'Biman', sector: 'Airlines & Travel' },
  { name: 'US-Bangla', sector: 'Airlines & Travel' },
  { name: 'Bashundhara', sector: 'Real Estate' },
  { name: 'Sheltech', sector: 'Real Estate' },
  { name: 'Navana', sector: 'Real Estate' },
  { name: 'BRAC University', sector: 'Education' },
  { name: 'NSU', sector: 'Education' },
  { name: 'BRAC', sector: 'Development & NGO' },
  { name: 'UNICEF', sector: 'Development & NGO' },
  { name: 'Grameen', sector: 'Development & NGO' },
];

/* --- process -------------------------------------------------------------- */

/** A genuine sequence, which is why these carry numbers. */
export const process = [
  {
    num: '01',
    title: 'Brief and site survey',
    body: 'Tell us the market, the dates and the budget. We come back with the sites that fit — with traffic notes, sightlines and photographs taken from the reading position, not a stock shot.',
  },
  {
    num: '02',
    title: 'Plan and permissions',
    body: 'We lock the schedule, handle city permissions and confirm structural clearances. You get one plan with every cost on it, including production.',
  },
  {
    num: '03',
    title: 'Production and mounting',
    body: 'Printing and fabrication in-house, mounted by our own crews. Installation photographs land with you the day the campaign opens.',
  },
  {
    num: '04',
    title: 'Monitoring and report',
    body: 'Condition photography through the run, proof-of-play for digital slots, and a close report showing exactly what delivered.',
  },
];

/* --- about ---------------------------------------------------------------- */

export const about = {
  heading: 'The network, and the people who run it',
  intro: [
    'AD PRO Communications Limited is an outdoor advertising agency headquartered in Dhaka. We own and operate our own inventory — digital LED and static structures across Dhaka, Chattogram and Sylhet — alongside the print, fabrication and installation teams that keep them running.',
    'That vertical structure is the whole argument. When one company surveys the site, prints the skin, builds the frame and mounts it, there is nobody to point at when a date slips.',
  ],
  values: [
    {
      title: 'Own the inventory',
      body: 'We sell sites we operate. It means the availability we quote is real, and the price is ours to set rather than a margin on somebody else’s rate card.',
    },
    {
      title: 'Prove the delivery',
      body: 'Every campaign closes with photographs and, for digital, proof-of-play. Out-of-home has been sold on trust for too long; it should be sold on evidence.',
    },
    {
      title: 'Build it properly',
      body: 'Structures are engineered for Bangladeshi weather. A board that fails in the first storm of the season costs a client more than it ever saved.',
    },
  ],
  leadership: [
    { name: 'Zakaria Habib', role: 'Chairman' },
    { name: 'Maruf Sunny', role: 'Managing Director' },
    { name: 'Mahmudul Hasan', role: 'Director' },
    { name: 'Ahmed Masum', role: 'Director' },
    { name: 'Tanjina Rimi', role: 'Director' },
  ],
  memberships: ['Bangladesh Billboard Advertising Owners Association'],
};

/* --- FAQ (also emitted as FAQPage structured data) ------------------------ */

export interface Faq {
  q: string;
  a: string;
}

export const faqs: Faq[] = [
  {
    q: 'How is a billboard priced in Bangladesh?',
    a: 'A digital site is priced per minute of screen time, so what you pay depends on the location, the screen size, how many minutes a day you take and how long the campaign runs. Rates move with demand and season, which is why we quote rather than publish them — call +880 1763-924619 or send the cities and dates and you will have a written price, production and mounting included, within one working day.',
  },
  {
    q: 'What is the difference between a static and a digital billboard?',
    a: 'A static billboard is a printed skin you occupy alone for the whole booking, usually a month or more. A digital billboard is an LED screen where your creative runs in a rotating loop, bookable by the day, with the ability to change artwork the same day and to target particular hours. Static suits always-on presence; digital suits launches, offers and anything with a date on it.',
  },
  {
    q: 'How quickly can a campaign go live?',
    a: 'Digital can be live within 24 to 48 hours of artwork approval, since there is nothing to print. Static typically takes five to seven working days to allow for printing, permissions and a mounting slot.',
  },
  {
    q: 'Which cities do you cover?',
    a: 'Dhaka, Chattogram and Sylhet are covered by our own network, with additional sites available in suburban and emerging areas on request. Dhaka carries the majority of the digital inventory.',
  },
  {
    q: 'Do you handle the artwork?',
    a: 'We can. Most clients supply artwork from their own agency and we adapt it to each format’s dimensions and viewing distance. If you do not have artwork, our design team produces it as part of the booking.',
  },
  {
    q: 'How do I know my campaign actually ran?',
    a: 'Static campaigns get installation and condition photography, dated and geotagged. Digital campaigns get proof-of-play logs showing every slot served. Both arrive in a close report at the end of the run.',
  },
];

export const contact = {
  heading: 'Book a site',
  lede: 'Tell us the market and the dates. We will come back with what is available and what it delivers.',
  intro:
    'The fastest route is a phone call — we can usually tell you availability and price while you are on the line. If you would rather write, include the cities you want, your campaign window and a budget range, and we will send a plan rather than a rate card.',
  checklistTitle: 'What helps in a first message',
  checklist: [
    'Cities or areas you want to reach',
    'Campaign start date and duration',
    'Digital, static, or open to both',
    'Whether artwork exists already',
    'A budget range, even a wide one',
    'The best number to reach you on',
  ],
  process:
    'We reply within one working day. If the fit is right you get a site list with photographs, traffic notes and an all-in cost — including production and mounting — before anything is signed.',
};
