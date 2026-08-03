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
  phone: '+880 1316-743003',
  phoneHref: '+8801316743003',
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

/* --- billboard inventory -------------------------------------------------- */

export type BillboardKind = 'digital' | 'static';

export interface Billboard {
  slug: string;
  location: string;
  city: string;
  kind: BillboardKind;
  size: string;
  /** Static boards read all day; digital boards have operating hours. */
  hours: string;
  facing: string;
  note: string;
  image?: string;
}

export const billboards: Billboard[] = [
  {
    slug: 'panthapath-digital',
    location: 'Panthapath Signal',
    city: 'Dhaka',
    kind: 'digital',
    size: '24ft × 32ft',
    hours: '07:00 – 01:00',
    facing: 'Karwan Bazar bound',
    note: 'One of the heaviest signal queues in Dhaka. Long dwell in both peaks.',
  },
  {
    slug: 'bashundhara-digital',
    location: 'Bashundhara City',
    city: 'Dhaka',
    kind: 'digital',
    size: '20ft × 30ft',
    hours: '07:00 – 01:00',
    facing: 'Panthapath bound',
    note: 'Mall footfall plus signal traffic — the strongest weekend audience we hold.',
  },
  {
    slug: 'gulshan-1-digital',
    location: 'Gulshan 1 Circle',
    city: 'Dhaka',
    kind: 'digital',
    size: '18ft × 24ft',
    hours: '07:00 – 01:00',
    facing: 'Gulshan 2 bound',
    note: 'Corporate and diplomatic catchment. Highest-income audience in the network.',
  },
  {
    slug: 'mohakhali-digital',
    location: 'Mohakhali Flyover',
    city: 'Dhaka',
    kind: 'digital',
    size: '20ft × 40ft',
    hours: '07:00 – 01:00',
    facing: 'Airport bound',
    note: 'Read from the flyover approach — long sightline, low competition.',
  },
  {
    slug: 'banani-static',
    location: 'Banani 11',
    city: 'Dhaka',
    kind: 'static',
    size: '20ft × 40ft',
    hours: 'Lit 18:00 – 02:00',
    facing: 'Kemal Ataturk Avenue',
    note: 'Retail and restaurant strip. Evening dwell is the reason to take it.',
  },
  {
    slug: 'uttara-static',
    location: 'Uttara Sector 7',
    city: 'Dhaka',
    kind: 'static',
    size: '20ft × 60ft',
    hours: 'Lit 18:00 – 02:00',
    facing: 'Airport Road, north bound',
    note: 'The largest single face we operate on the airport corridor.',
  },
  {
    slug: 'motijheel-static',
    location: 'Motijheel Shapla Chattar',
    city: 'Dhaka',
    kind: 'static',
    size: '15ft × 40ft',
    hours: 'Lit 18:00 – 02:00',
    facing: 'Dilkusha bound',
    note: 'Banking district. Weekday commercial audience, quiet at weekends.',
  },
  {
    slug: 'dhanmondi-static',
    location: 'Dhanmondi 27',
    city: 'Dhaka',
    kind: 'static',
    size: '12ft × 24ft',
    hours: 'Lit 18:00 – 02:00',
    facing: 'Mirpur Road',
    note: 'Student and family catchment either side of the junction.',
  },
  {
    slug: 'ctg-gec-digital',
    location: 'GEC Circle',
    city: 'Chattogram',
    kind: 'digital',
    size: '18ft × 24ft',
    hours: '07:00 – 01:00',
    facing: 'Agrabad bound',
    note: 'The city’s central junction — our strongest board outside Dhaka.',
  },
  {
    slug: 'ctg-agrabad-static',
    location: 'Agrabad Commercial Area',
    city: 'Chattogram',
    kind: 'static',
    size: '20ft × 40ft',
    hours: 'Lit 18:00 – 02:00',
    facing: 'Port bound',
    note: 'Port and corporate traffic, heaviest in the morning peak.',
  },
  {
    slug: 'sylhet-zindabazar-digital',
    location: 'Zindabazar',
    city: 'Sylhet',
    kind: 'digital',
    size: '16ft × 20ft',
    hours: '07:00 – 01:00',
    facing: 'Amberkhana bound',
    note: 'Retail centre of the city. Strong reach into the remittance market.',
  },
  {
    slug: 'sylhet-amberkhana-static',
    location: 'Amberkhana Point',
    city: 'Sylhet',
    kind: 'static',
    size: '15ft × 30ft',
    hours: 'Lit 18:00 – 02:00',
    facing: 'Airport Road',
    note: 'On the airport approach — high visibility for arrivals.',
  },
];

export const digitalBoards = billboards.filter((b) => b.kind === 'digital');
export const staticBoards = billboards.filter((b) => b.kind === 'static');

/** Cities with inventory, derived so it can never drift from the list above. */
export const cities = [...new Set(billboards.map((b) => b.city))];

/* --- format comparison, used on the billboards hub ------------------------ */

export const formatComparison = [
  { label: 'Minimum booking', digital: 'One day', static: 'One month' },
  { label: 'Creative changes', digital: 'Same day, unlimited', static: 'Reprint required' },
  { label: 'Day-part targeting', digital: 'Yes, by hour', static: 'No' },
  { label: 'Share of screen', digital: 'Rotating slots', static: 'Sole occupancy' },
  { label: 'Typical monthly cost', digital: 'BDT 50,000 – 300,000', static: 'From BDT 25,000' },
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
    q: 'How much does a billboard cost in Bangladesh?',
    a: 'Digital LED billboards run roughly BDT 50,000 to BDT 300,000 per month depending on the location, the screen size and the share of loop you take. Static billboards start from about BDT 25,000 per month. Production and mounting are quoted on the same plan, so there is no separate invoice at the end.',
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
    'The fastest route is a phone call — we can usually tell you availability while you are on the line. If you would rather write, include the cities you want, your campaign window and a budget range, and we will send a plan rather than a rate card.',
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
