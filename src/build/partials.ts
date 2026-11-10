/**
 * Build-time HTML generation.
 *
 * Page transitions need real documents, but the shell — head, menu, header,
 * curtain, footer — is identical across all of them. Each page file carries
 * only its own content plus placeholder comments, and the Vite plugin in
 * vite.config.ts substitutes these fragments at build time.
 *
 * Everything reads from src/data/site.ts, so the navigation, the inventory
 * tables, the sitemap and the structured data cannot drift from each other.
 *
 * Hook names — the `data-*` attributes and the class names the motion layer
 * and the stylesheets bind to — follow the shared table in .work/spec.md §8.
 * Rename one here and it stops moving; the table is the contract.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  accentOf,
  billboards,
  boardBySlug,
  cityGroups,
  clients,
  company,
  faqs,
  formatComparison,
  marqueeItems,
  nav,
  platforms,
  process as processSteps,
  relatedBoards,
  services,
  socials,
  stats,
  type Billboard,
  type CityGroup,
} from '../data/site';
import {
  boardAudience,
  boardFaqs,
  boardIntro,
  boardTechnical,
  fmtHours,
  fmtResolution,
  fmtSchedule,
  parseDimension,
  areaOf,
  pitchOf,
  sizeWords,
} from './boardCopy';
import { faqArticles } from '../data/faq';
import { BRIEF_BODY, buildCta, ctaMailto, faqPath, FAQ_HUB } from './faqPages';
import { abs, boardPath, buildJsonLd, cityPath, type PageMeta } from './seo';

export type { PageMeta };

const esc = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * A site name as it is displayed.
 *
 * "Gulshan Circle-1" was breaking after the hyphen, leaving a lonely "1" on
 * the next line in a Bebas headline. A non-breaking hyphen (U+2011) in front
 * of a digit keeps the number with its word; everywhere else the hyphen is
 * left alone so long names can still wrap.
 */
export const displayName = (name: string): string => esc(name).replace(/-(\d)/g, '‑$1');

const pad2 = (n: number): string => String(n).padStart(2, '0');

/* --- photographs -----------------------------------------------------------
   One helper decides what every <img> on the site says about a photograph:
   which file, which candidates, how big it is. The source photographs are
   JPEGs under public/boards/; when scripts/images.mjs has produced the
   600/900/1400 WebP sizes beside them, they are used, and when it has not,
   the JPEG is served alone. Either way the markup is the same shape and the
   width and height come from the file itself, so nothing shifts on load.  */

const PUBLIC = [
  join(process.cwd(), 'public'),
  fileURLToPath(new URL('../../public/', import.meta.url)),
].find((dir) => existsSync(dir)) as string;

const WIDTHS = [600, 900, 1400] as const;

interface Photo {
  /** The file for a plain `src`. */
  src: string;
  /** Candidates for `srcset`, widest last; '' when only the JPEG exists. */
  srcset: string;
  width: number;
  height: number;
  /** False when the JPEG the data points at is not on disk. */
  exists: boolean;
}

/** Reads the pixel size out of a JPEG's SOF marker. Null if it is not one. */
function jpegSize(file: string): { width: number; height: number } | null {
  let buf: Buffer;
  try {
    buf = readFileSync(file);
  } catch {
    return null;
  }
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = buf[i + 1];
    // Markers without a payload: padding, SOI, RSTn.
    if (marker === 0xff || marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += marker === 0xff ? 1 : 2;
      continue;
    }
    const length = buf.readUInt16BE(i + 2);
    const isSof = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
    if (isSof) return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    i += 2 + length;
  }
  return null;
}

const photos = new Map<string, Photo>();

export function photoOf(board: Billboard): Photo {
  const cached = photos.get(board.slug);
  if (cached) return cached;

  const jpeg = join(PUBLIC, board.image);
  const exists = existsSync(jpeg);
  const size = exists ? jpegSize(jpeg) : null;
  const variants = WIDTHS.filter((w) => existsSync(join(PUBLIC, 'boards', `${board.slug}-${w}.webp`)));

  const photo: Photo = {
    src: variants.includes(900) ? `/boards/${board.slug}-900.webp` : `/${board.image}`,
    srcset: variants.length
      ? variants.map((w) => `/boards/${board.slug}-${w}.webp ${w}w`).join(', ')
      : size
        ? `/${board.image} ${size.width}w`
        : '',
    width: size?.width ?? 1400,
    height: size?.height ?? 933,
    exists,
  };
  photos.set(board.slug, photo);
  return photo;
}

/** The file to use when one URL is wanted — a preload, a bleed. */
export const imageSrc = (board: Billboard, width: (typeof WIDTHS)[number] = 900): string =>
  existsSync(join(PUBLIC, 'boards', `${board.slug}-${width}.webp`))
    ? `/boards/${board.slug}-${width}.webp`
    : `/${board.image}`;

const focusOf = (board: Billboard): string =>
  `${(board.focus[0] * 100).toFixed(1)}% ${(board.focus[1] * 100).toFixed(1)}%`;

interface ImgOptions {
  sizes: string;
  alt?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  fetchpriority?: 'high';
  /** Adds `data-load` so images.ts can mark it `.is-loaded`. */
  load?: boolean;
  /** `data-parallax="N"`. */
  parallax?: number;
  /** Extra attributes, already escaped. */
  extra?: string;
  /** Leave the focal point to the stylesheet (the hero reads `--fx/--fy`). */
  noFocus?: boolean;
}

/** One `<img>` for a site photograph, with every attribute the spec asks for. */
export function img(board: Billboard, o: ImgOptions): string {
  const p = photoOf(board);
  const attrs = [
    o.className ? `class="${o.className}"` : '',
    `src="${esc(p.src)}"`,
    p.srcset ? `srcset="${esc(p.srcset)}"` : '',
    `sizes="${esc(o.sizes)}"`,
    `width="${p.width}"`,
    `height="${p.height}"`,
    `alt="${esc(o.alt ?? '')}"`,
    o.noFocus ? '' : `style="object-position:${focusOf(board)}"`,
    `loading="${o.loading ?? 'lazy'}"`,
    'decoding="async"',
    o.fetchpriority ? `fetchpriority="${o.fetchpriority}"` : '',
    o.load ? 'data-load' : '',
    o.parallax ? `data-parallax="${o.parallax}"` : '',
    o.extra ?? '',
  ].filter(Boolean);
  return `<img ${attrs.join(' ')}>`;
}

const altOf = (b: Billboard): string =>
  `${b.title} LED billboard in ${b.city}, facing ${b.facing}`;

/* --- contact links ---------------------------------------------------------
   Every "Send a brief" and every "WhatsApp" on the site goes through these,
   so the message a visitor starts from is the same message everywhere: the
   six things the sales desk needs, as a form they fill in by replying.    */

/**
 * A mailto: that opens a structured brief — the same six lines the contact
 * form produces. Defined beside buildCta in faqPages.ts (which this file
 * imports) and re-exported here under the name the rest of the build uses.
 */
export const briefMailto = ctaMailto;

/** A wa.me link with an opening line already typed. Attribute-safe. */
export function waLink(text?: string): string {
  const message =
    text ??
    `Hello AD PRO — I'd like to book a billboard.\n${BRIEF_BODY}`;
  return esc(`https://wa.me/${company.whatsapp}?text=${encodeURIComponent(message)}`);
}

/* --- site ranking ----------------------------------------------------------
   Which sites lead — on the hero, on the rail, as a city's cover — is
   measured, not chosen. `wallScore` (scripts/score-crops.py) is how much
   more lit the screen's crop is than the rest of its own frame: around 1
   means the photograph is mostly street, anything above about 2 is a screen
   doing what a screen should. Replace a photograph, rerun the script, and
   the home page follows without anyone maintaining a list.               */

const scoreOf = (b: Billboard): number => b.wallScore ?? 0;

/** Sites worth leading with, best first, one per city before any repeats. */
function rankedBoards(minScore = 1.6): Billboard[] {
  const usable = billboards
    .filter((b) => scoreOf(b) >= minScore && photoOf(b).exists)
    .sort((a, b) => scoreOf(b) - scoreOf(a));
  const seen = new Set<string>();
  const spread = usable.filter((b) => {
    if (seen.has(b.citySlug)) return false;
    seen.add(b.citySlug);
    return true;
  });
  return [...spread, ...usable.filter((b) => !spread.includes(b))];
}

/**
 * The six the hero switches between. The photograph has to fill a screen,
 * so only sources at least 900px wide qualify. The capital opens: the best
 * Dhaka site takes the first slot, then the rest in measured order — the
 * company is a Dhaka operator and the first frame should say so.
 */
/** Sites that open the hero, in order. */
const HERO_LEADS = [
  'dhaka-gulshan-circle-1-upper',
  'dhaka-gulshan-circle-2-east-side-rob-super-market',
  'coxs-bazar-dolphin-moor-coxs-bazar',
  'sylhet-sylhet-surma-point',
];

/** Indoor screens: fine in the inventory, wrong as the first thing seen. */
const HERO_EXCLUDE = new Set(['dhaka-police-plaza-entry-gate-north-side']);

export function heroBoards(): Billboard[] {
  // The opening frames are chosen by eye, not by score: the lead has to be
  // an outdoor junction that reads as a billboard at a glance. The rest
  // follow in measured order. Indoor panels never take the stage.
  const leads = HERO_LEADS.map((slug) => billboards.find((b) => b.slug === slug)).filter(
    (b): b is Billboard => !!b && photoOf(b).exists && photoOf(b).width >= 700,
  );
  const rest = rankedBoards().filter(
    (b) => photoOf(b).width >= 900 && !leads.includes(b) && !HERO_EXCLUDE.has(b.slug),
  );
  return [...leads, ...rest].slice(0, 6);
}


/** A city's cover: its best-scoring site whose photograph is actually on
    disk, so a missing file never becomes a black card. */
export function leadOf(group: CityGroup): Billboard | undefined {
  const present = group.boards.filter((b) => photoOf(b).exists);
  return [...present].sort((a, b) => scoreOf(b) - scoreOf(a))[0] ?? group.boards[0];
}

/* --- head ----------------------------------------------------------------- */

export function buildHead(meta: PageMeta): string {
  const title = meta.title.includes(company.shortName)
    ? meta.title
    : `${meta.title} | ${company.shortName}`;

  // The hero's first slide is the largest contentful paint on the home page.
  // Telling the browser about it before the stylesheet has parsed is worth
  // several hundred milliseconds on a phone.
  const first = meta.namespace === 'home' ? heroBoards()[0] : undefined;
  const heroPreload = first
    ? (() => {
        const p = photoOf(first);
        const set = p.srcset ? ` imagesrcset="${esc(p.srcset)}" imagesizes="100vw"` : '';
        return `\n    <link rel="preload" as="image" href="${esc(imageSrc(first, 900))}"${set} fetchpriority="high" />`;
      })()
    : '';

  return `
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(meta.description)}" />
    <link rel="canonical" href="${esc(abs(meta.path))}" />
    <!--@FONTS-->${heroPreload}

    <meta property="og:site_name" content="${esc(company.name)}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(meta.description)}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${esc(abs(meta.path))}" />
    <meta property="og:locale" content="en_GB" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(meta.description)}" />

    <meta name="geo.region" content="BD" />
    <meta name="geo.placename" content="Dhaka" />

    <link rel="icon" href="/favicon.png" type="image/png" sizes="256x256" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta property="og:image" content="${esc(abs('og-image.jpg'))}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:image" content="${esc(abs('og-image.jpg'))}" />

    <script type="application/ld+json">${buildJsonLd(meta)}</script>`.trim();
}

/*
  The three font files the first paint needs, as preload links.

  The fonts are bundled by Vite with hashed names, so the links cannot be
  written here; vite.config.ts finds the emitted files after the bundle is
  built and swaps them in for the `<!--@FONTS-->` marker buildHead leaves.
  The names below are what it looks for.
*/
export const PRELOAD_FONTS = [
  'bebas-neue-latin-400-normal',
  'inter-latin-wght-normal',
  'ibm-plex-mono-latin-400-normal',
];

export const fontPreloadTags = (files: string[]): string =>
  files
    .map(
      (f) =>
        `<link rel="preload" as="font" type="font/woff2" href="${esc(f)}" crossorigin />`,
    )
    .join('\n    ');

/* --- shell ---------------------------------------------------------------- */

interface ShellLink {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

/** A menu link, plus its nested children when it has a submenu. */
function menuLink(link: ShellLink, index: number): string {
  const child = (c: { label: string; href: string }, i: number) => `
              <li>
                <a class="menu-sublink" style="--i:${index + i + 1}" href="${esc(c.href)}">${esc(c.label)}</a>
              </li>`;

  return `
          <li class="menu-item">
            <span class="menu-link__mask">
              <a class="menu-link" style="--i:${index}" href="${esc(link.href)}">${esc(link.label)}</a>
            </span>
            ${
              link.children
                ? `<ul class="menu-sublist">${link.children.map(child).join('')}</ul>`
                : ''
            }
          </li>`;
}

/**
 * The viewfinder, scoped to the home hero.
 *
 * A wall of screens is what this company sells, so the hero is framed as
 * something being watched rather than something being read: a hairline
 * border with corner ticks and four readouts that all report something true
 * — which site is on the stage, whether the screens are lit right now, where
 * it is and how big, and what time it is where they are.
 *
 * It used to sit fixed over every page. Now it lives inside the hero and
 * fades as the hero scrolls away (`--hero-progress`, from scrollfx.ts), so
 * nothing ever overlays a breadcrumb or a table. The on-air word is left
 * blank on purpose: hud.ts fills it from the clock, and a page that said "On
 * air" at three in the morning was lying until the script ran.
 */
export function buildChrome(board: Billboard): string {
  return `
    <div class="chrome chrome--hero" aria-hidden="true" data-chrome>
      <div class="chrome__frame">
        <span class="chrome__tick chrome__tick--tl"></span>
        <span class="chrome__tick chrome__tick--tr"></span>
        <span class="chrome__tick chrome__tick--bl"></span>
        <span class="chrome__tick chrome__tick--br"></span>
      </div>
      <p class="chrome__read chrome__read--tl" data-hud-site>[ LIVE · ${displayName(board.name.toUpperCase())} ]</p>
      <p class="chrome__read chrome__read--tr" data-hud-state><span class="chrome__lamp" data-hud-lamp></span><span data-hud-label></span></p>
      <p class="chrome__read chrome__read--bl" data-hud-meta>[ ${esc(board.city.toUpperCase())} · ${esc(sizeWords(board).toUpperCase())} ]</p>
      <p class="chrome__read chrome__read--br"><span data-hud-clock>--:--:--</span> BST</p>
    </div>`;
}

/**
 * The hero: a broadcast switcher.
 *
 * One site fills the stage at full exposure; five more wait on a rail down
 * the right-hand edge and take the stage in turn (hero.ts), each bringing
 * its own accent with it. Behind the stage a blurred copy of the same
 * photograph bleeds its colour into the ink. This is the inventory, not an
 * illustration of it: every frame is a real screen on a real junction.
 */
export function buildHero(): string {
  const boards = heroBoards();
  const lead = boards[0];

  const slides = boards
    .map((b, i) => {
      const [fx, fy] = b.focus;
      const live = i === 0;
      return `
      <a class="hero__slide${live ? ' is-live' : ''}" data-slide="${i}"
         data-name="${displayName(b.name)}" data-city="${esc(b.city)}" data-size="${esc(sizeWords(b))}"
         data-accent="${esc(accentOf(b))}" href="${esc(boardPath(b))}"
         data-cursor="media" data-cursor-label="View site"
         style="--accent:${esc(accentOf(b))}; --fx:${(fx * 100).toFixed(0)}%; --fy:${(fy * 100).toFixed(0)}%">
        ${img(b, {
          sizes: '100vw',
          alt: '',
          loading: live ? 'eager' : 'lazy',
          fetchpriority: live ? 'high' : undefined,
          noFocus: true,
        })}
      </a>`;
    })
    .join('');

  const cues = boards
    .map(
      (b, i) => `
      <li><button class="hero__cue${i === 0 ? ' is-live' : ''}" type="button" data-cue="${i}" style="--accent:${esc(accentOf(b))}" aria-label="Show ${displayName(b.name)}">
        ${img(b, { sizes: '11rem', alt: '' })}<span class="hero__cue-label">${pad2(i + 1)} · ${displayName(b.name.split(',')[0])}</span></button></li>`,
    )
    .join('');

  return `
  <header class="main-header hero" id="main_header" data-hero data-switch-interval="5000" style="--accent:${esc(accentOf(lead))}">
    <div class="hero__bleed" data-bleed="a" aria-hidden="true" style="--bleed-img:url('${esc(imageSrc(lead, 600))}')"></div>
    <div class="hero__bleed" data-bleed="b" aria-hidden="true"></div>
    <div class="hero__stage" data-stage>${slides}
      <div class="hero__scrim" aria-hidden="true"></div>
      <div class="hero__scan" aria-hidden="true"></div>
    </div>
    ${buildChrome(lead)}
    <div class="hero__copy gl-padding_lr">
      <article class="hero__inner">
        <span class="eyebrow">Outdoor advertising, Bangladesh</span>
        <i class="rule" data-reveal="line"></i>
        <h1 data-split="words">Be seen where the country actually is</h1>
        <p class="lede">Digital and static out-of-home across Dhaka, Chattogram and Sylhet — planned around traffic, not around what happens to be vacant.</p>
        <div class="btn-wrapper">
          <a class="btn btn--primary addHover" href="billboards.html"><span class="btn__label">See the inventory</span></a>
          <a class="btn addHover" href="contact.html"><span class="btn__label">Book a site</span></a>
        </div>
      </article>
    </div>
    <ol class="hero__rail" aria-label="Sites on the network" data-rail-cues>${cues}
    </ol>
    <p class="hero__count eyebrow">${billboards.length} sites · ${cityGroups.length} cities · <a class="text-link" href="billboards.html">every one photographed</a></p>
    <p class="visually-hidden">Pictured: ${boards.length} of ${billboards.length} LED billboard sites across ${cityGroups.length} cities in Bangladesh.</p>
  </header>`;
}

export function buildShell(): string {
  // A running index across every group drives the reveal stagger in CSS, so
  // the links cascade as one sequence rather than restarting per column.
  let i = 0;

  const groups = nav
    .map((group) => {
      const links = group.links
        .map((link) => {
          const html = menuLink(link, i);
          i += 1 + (link.children?.length ?? 0);
          return html;
        })
        .join('');

      return `
        <div class="grid-item grid-33 xsm-grid-100 links_group" data-tag="${esc(group.tag)}">
          <span class="links_group__label eyebrow">${esc(group.label)}</span>
          <ul class="menu-list">${links}</ul>
        </div>`;
    })
    .join('');

  return `
  <a class="skip-link" href="#main">Skip to content</a>

  <div class="cursor" id="cursor" aria-hidden="true"><span class="cursor__label"></span></div>

  <div class="menu-wrapper" id="menu_wrapper" aria-hidden="true">
    <div class="main-navigation js-main-navigation" id="main_navigation_wrapper"
         role="dialog" aria-modal="true" aria-label="Main menu" data-lenis-prevent>
      <div class="menu-header">
        <a class="brand" href="index.html">
          <img class="brand__mark" src="/logo-mark-reversed.png" alt="" width="36" height="36" decoding="async" />
          <span class="brand__name">${esc(company.wordmark)}</span>
        </a>
        <button class="menu-close addHover" id="menu_close" type="button" aria-label="Close menu">
          <span class="menu-close__label">Close</span>
          <span class="menu-close__x" aria-hidden="true"></span>
        </button>
      </div>

      <nav class="main__nav css-grid-wrapper" aria-label="Main">
        ${groups}
      </nav>

      <div class="menu-foot gl-padding_lr">
        <a class="text-link" href="tel:${esc(company.phoneHref)}">${esc(company.phone)}</a>
        <a class="text-link" href="${waLink()}" rel="noopener noreferrer" target="_blank">WhatsApp</a>
        <a class="text-link" href="mailto:${esc(company.email)}">${esc(company.email)}</a>
      </div>
    </div>
  </div>

  <div class="main-nav-wrapper flex-wrapper space-between" id="main_nav_wrapper">
    <a class="brand" href="index.html">
      <img class="brand__mark" src="/logo-mark-reversed.png" alt="" width="36" height="36" decoding="async" />
      <span class="brand__text">
        <span class="brand__name">${esc(company.wordmark)}</span>
        <span class="brand__sub">Communications Ltd.</span>
      </span>
    </a>
    <nav class="main-links-wrapper flex-wrapper" aria-label="Shortcuts">
      <a class="text-link nav-link hide-xsm" href="billboards.html">Billboards</a>
      <a class="text-link nav-link hide-xsm" href="contact.html">Contact</a>
      <a class="nav-call addHover" href="tel:${esc(company.phoneHref)}" aria-label="Call AD PRO on ${esc(company.phone)}">
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6.2 6.2l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.7a2 2 0 0 1 1.7 2z"/></svg>
        <span class="nav-call__label">Call</span>
      </a>
      <button class="menu-toggle addHover" id="menu_toggle" type="button"
              aria-expanded="false" aria-controls="main_navigation_wrapper">
        <span class="menu-toggle__label">Menu</span>
        <span class="menu-toggle__bars" aria-hidden="true"><span></span><span></span></span>
      </button>
    </nav>
  </div>

  <div class="fixed__cover fixed__cover___intro flex-wrapper flex-center z-on-top js-fixed__cover visible">
    <div class="cover_curtain_wrapper js-cover_curtain_wrapper" id="curtains">
      <div class="curtain-item" aria-hidden="true"></div>
      <div class="curtain-item" aria-hidden="true"></div>
      <div class="curtain-item" aria-hidden="true"></div>
      <div class="curtain-item" aria-hidden="true"></div>
    </div>
    <div class="intro_logo____wrapper" id="logo_wrapper" aria-hidden="true">
      <img class="intro_logo____mark" src="/logo-mark-reversed.png" alt="" width="312" height="312" decoding="async" />
      <div class="intro_logo____placeholder">${esc(company.wordmark)}</div>
    </div>
  </div>`;
}

/* --- page head -------------------------------------------------------------
   Every page that is not the home page opens the same way: one mono readout
   where the viewfinder used to be, an optional breadcrumb, then a two-column
   head with the title on the left and something page-specific on the right.
   The generated pages build theirs here; the hand-written ones repeat the
   same markup, because a template that only lines up when its author
   remembers the shape is a template that will eventually not line up.   */

interface PageHeadOptions {
  readout: string;
  crumbs?: { label: string; href?: string }[];
  eyebrow: string;
  title: string;
  titleClass?: string;
  lede: string;
  buttons?: string;
  aside?: string;
  /** Extra class on the section — `contact-head`, `listing-head`. */
  className?: string;
}

export function pageHead(o: PageHeadOptions): string {
  const crumbs = o.crumbs?.length
    ? `
    <nav class="breadcrumb eyebrow" aria-label="Breadcrumb" data-reveal="fade">
      ${o.crumbs
        .map((c) =>
          c.href
            ? `<a class="text-link" href="${esc(c.href)}">${esc(c.label)}</a>`
            : `<span aria-current="page">${esc(c.label)}</span>`,
        )
        .join('\n      <span aria-hidden="true">/</span>\n      ')}
    </nav>`
    : '';

  const aside = o.aside
    ? `
      <div class="grid-item grid-45 xsm-grid-100 page-head__aside" data-reveal data-reveal-delay=".1">${o.aside}
      </div>`
    : '';

  return `
  <section class="page-head gl-padding_lr${o.className ? ` ${o.className}` : ''}">
    <p class="page-head__readout" aria-hidden="true">[ ${esc(o.readout)} ]</p>${crumbs}
    <div class="css-grid-wrapper">
      <header class="grid-item ${o.aside ? 'grid-55' : 'grid-70'} xsm-grid-100 intro-text" data-reveal>
        <span class="eyebrow">${esc(o.eyebrow)}</span>
        <i class="rule" data-reveal="line"></i>
        <h1${o.titleClass ? ` class="${o.titleClass}"` : ''} data-split="words">${o.title}</h1>
        <p class="lede">${o.lede}</p>
        ${o.buttons ? `<div class="btn-wrapper">${o.buttons}</div>` : ''}
      </header>${aside}
    </div>
  </section>`;
}

const btn = (label: string, href: string, variant = ''): string =>
  `<a class="btn${variant ? ` ${variant}` : ''} addHover" href="${href}"><span class="btn__label">${label}</span></a>`;

/* --- footer --------------------------------------------------------------- */

export function buildFooter(): string {
  const social = socials
    .map(
      (s) =>
        `<a class="text-link" href="${esc(s.href)}" rel="noopener noreferrer" target="_blank">${esc(s.label)}</a>`,
    )
    .join('');

  const sister = platforms
    .map((p) => `<a class="text-link" href="${esc(p.href)}" rel="noopener">${esc(p.label)}</a>`)
    .join('');

  // The five questions most likely to be somebody's entry point. Linking them
  // from every page is what gets them crawled and what gives a visitor who
  // landed on a listing somewhere to go that is not the contact form.
  const answerLinks = faqArticles
    .filter((a) =>
      [
        'billboard-advertising-cost-bangladesh',
        'digital-vs-static-billboards',
        'best-billboard-locations-in-dhaka',
        'how-to-book-a-billboard-in-bangladesh',
        'how-led-billboards-work',
      ].includes(a.slug),
    )
    .map(
      (a) =>
        `<li><a class="text-link" href="${esc(faqPath(a.slug))}">${esc(a.shortTitle)}</a></li>`,
    )
    .join('');

  // Internal links in the footer are how the billboard pages earn crawl depth
  // from every other page on the site.
  const sitemapLinks = [
    { label: 'Billboards', href: 'billboards.html' },
    { label: 'Static billboards', href: 'static-billboards.html' },
    { label: 'Digital billboards', href: 'digital-billboards.html' },
    { label: 'Services', href: 'services.html' },
    { label: 'Clients', href: 'clients.html' },
    { label: 'About', href: 'about.html' },
    { label: 'Contact', href: 'contact.html' },
    { label: 'News', href: 'news.html' },
    { label: 'Answers', href: FAQ_HUB },
  ]
    .map((l) => `<li><a class="text-link" href="${esc(l.href)}">${esc(l.label)}</a></li>`)
    .join('');

  // No `data-reveal` on the footer itself: a footer that waits to be scrolled
  // into view is a footer that is sometimes never shown. Only the call to
  // action animates.
  return `
  <footer class="css-grid-wrapper" id="footer">
    <div class="grid-item grid-100 gl-padding">

      <div class="footer-cta" data-reveal>
        <h2 class="footer-heading">Ready to book a site?</h2>
        <div class="btn-wrapper">
          ${btn(`Call ${esc(company.phone)}`, `tel:${esc(company.phoneHref)}`, 'btn--primary')}
          ${btn('Send a brief', briefMailto())}
        </div>
      </div>

      <div class="css-grid-wrapper footer-grid">
        <div class="grid-item grid-25 xsm-grid-50">
          <span class="eyebrow">Pages</span>
          <ul class="footer-links">${sitemapLinks}</ul>
        </div>

        <div class="grid-item grid-25 xsm-grid-50">
          <span class="eyebrow">Answers</span>
          <ul class="footer-links">${answerLinks}</ul>
          <p><a class="text-link" href="${FAQ_HUB}">All ${faqArticles.length} questions</a></p>
        </div>

        <div class="grid-item grid-25 xsm-grid-100">
          <span class="eyebrow">Offices</span>
          <p class="text-muted">
            <strong>Corporate</strong><br />
            <a class="text-link" href="${esc(company.mapUrl)}" rel="noopener noreferrer" target="_blank">${esc(company.corporateAddress)}</a>
          </p>
          <p class="text-muted"><strong>Registered</strong><br />${esc(company.registeredAddress)}</p>
        </div>

        <div class="grid-item grid-25 xsm-grid-100">
          <span class="eyebrow">Contact</span>
          <p>
            <a class="text-link" href="tel:${esc(company.phoneHref)}">${esc(company.phone)}</a><br />
            <a class="text-link" href="${waLink()}" rel="noopener noreferrer" target="_blank">WhatsApp</a><br />
            <a class="text-link" href="mailto:${esc(company.email)}">${esc(company.email)}</a>
          </p>
          <div class="social-links">${social}</div>
        </div>
      </div>

      <div class="footer-platforms">
        <span class="eyebrow">Group platforms</span>
        <div class="social-links">${sister}</div>
      </div>

      <div class="footer-meta">
        <span>© ${new Date().getFullYear()} ${esc(company.name)}. All rights reserved.</span>
        <span>${esc(company.descriptor)}</span>
      </div>
    </div>
  </footer>`;
}

/* --- reusable sections ---------------------------------------------------- */

/**
 * The services strip, directly above the footer on every page.
 *
 * The track starts at zero so the first word is whole; marquee.ts clones it
 * until it spans two viewports and the CSS loop takes it from there.
 */
export function buildMarquee(): string {
  const items = marqueeItems
    .map(
      (item) =>
        `<span class="marquee__item">${esc(item)}</span><span class="marquee__dot" aria-hidden="true"></span>`,
    )
    .join('');
  return `
  <div class="marquee" aria-label="What we do">
    <div class="marquee__track">${items}</div>
  </div>`;
}

/**
 * The stats band under the hero. The figures roll in digit by digit
 * (`data-count-roll`, scrollfx.ts splits them at runtime — nothing is
 * pre-split here, so the number is whole for anything that does not run the
 * script).
 */
export function buildStats(): string {
  const cells = stats
    .map(
      (s) => `
      <div class="grid-item grid-25 xsm-grid-50 stat" data-reveal-item>
        <span class="stat__value" data-count data-count-roll>${esc(s.value)}</span>
        <span class="stat__label">${esc(s.label)}</span>
        <span class="stat__detail">${esc(s.detail)}</span>
      </div>`,
    )
    .join('');

  return `
  <section class="stats-band gl-padding_lr" data-reveal aria-label="AD PRO by the numbers">
    <div class="css-grid-wrapper">${cells}</div>
  </section>`;
}

/**
 * The network as a column of figures, for use beside a block of prose.
 *
 * Ten cities and what is in them, each row a link into its own page, with a
 * photograph of the city's lead site sliding in beside the list on hover
 * (netIndex.ts swaps the one `<img>` rather than loading ten).
 */
export function buildNetworkIndex(): string {
  const rows = cityGroups
    .map((g) => {
      const lead = leadOf(g);
      const preview = lead ? ` data-preview="${esc(imageSrc(lead, 600))}"` : '';
      return `
        <li class="net-index__row ruled__row">
          <a class="net-index__link" href="${esc(cityPath(g.slug))}"${preview}>
            <span class="net-index__city">${esc(g.city)}</span>
            <span class="net-index__count">${pad2(g.boards.length)}</span>
          </a>
        </li>`;
    })
    .join('');

  const first = leadOf(cityGroups[0]);

  return `
        <div class="net-index">
          <i class="rule rule--full" data-reveal="line"></i>
          <div class="net-index__head">
            <span class="eyebrow">The network</span>
            <span class="net-index__total" data-count>${billboards.length}</span>
          </div>
          <ul class="net-index__list ruled">${rows}
          </ul>
          <div class="net-index__preview" data-net-preview aria-hidden="true">
            <img src="${first ? esc(imageSrc(first, 600)) : ''}" alt="" width="600" height="400" loading="lazy" decoding="async">
          </div>
          <a class="text-link net-index__all" href="billboards.html">Every site, with photographs</a>
        </div>`;
}

/**
 * A native scroll-snap rail of site plates. The home page shows the top
 * twelve; the 404 page the top six. Never pinned — it is a strip you can
 * swipe, with prev/next buttons on wide screens (rail.ts) and a counter.
 */
export function buildSitesRail(limit = 12, heading = `${billboards.length} sites. Pick a junction.`): string {
  const boards = rankedBoards().slice(0, limit);

  const cards = boards
    .map(
      (b) => `
      <li class="rail__item" data-reveal-item>
        <a class="rail__card" href="${esc(boardPath(b))}" style="--accent:${esc(accentOf(b))}" data-cursor="media" data-cursor-label="View">
          <figure class="plate plate--rail" data-pixelate>
            ${img(b, {
              className: 'rail__img',
              sizes: '(max-width:767px) 78vw, 22vw',
              alt: altOf(b),
              load: true,
              parallax: 12,
            })}
            <figcaption class="plate__caption"><span class="rail__title">${displayName(b.name)}</span><span class="rail__meta">${esc(b.city.toUpperCase())} · ${esc(sizeWords(b).toUpperCase())}</span></figcaption>
          </figure>
        </a>
      </li>`,
    )
    .join('');

  return `
  <section class="gl-section rail-section" data-reveal>
    <header class="section-head gl-padding_lr">
      <span class="eyebrow">Sites that move</span>
      <h2 data-split="words">${esc(heading)}</h2>
      <span class="section-head__fig" data-rail-counter>01 / ${pad2(boards.length)}</span>
    </header>
    <div class="rail" data-rail>
      <ul class="rail__track" data-rail-track>${cards}
        <li class="rail__item"><a class="rail__card rail__card--more" href="billboards.html">All ${billboards.length} sites →</a></li>
      </ul>
      <button class="rail__btn rail__btn--prev" type="button" data-rail-prev aria-label="Previous">←</button>
      <button class="rail__btn rail__btn--next" type="button" data-rail-next aria-label="Next">→</button>
    </div>
    <p class="rail__hint eyebrow" aria-hidden="true">Swipe →</p>
  </section>`;
}

/**
 * The two formats as two full-bleed panes that share a row, captions ruled
 * underneath on the ground. Replaces the pair of stacked image-and-text
 * modules that said the same thing twice with a label printed on the photo.
 */
export function buildFormats(): string {
  const digital = boardBySlug('dhaka-sks-tower-entrance-mohakhali') ?? rankedBoards()[0];
  const stat = boardBySlug('coxs-bazar-dolphin-moor-coxs-bazar') ?? rankedBoards()[1];

  const pane = (
    board: Billboard,
    format: 'digital' | 'static',
    href: string,
    title: string,
    line: string,
  ) => `
    <a class="format-pane" href="${href}" data-format="${format}" data-reveal-item data-cursor="media" data-cursor-label="${title}">
      <figure class="format-pane__media">
        ${img(board, { sizes: '(max-width:767px) 100vw, 50vw', alt: '', parallax: 24 })}
      </figure>
      <div class="format-pane__scrim" aria-hidden="true"></div>
      <div class="format-pane__copy">
        <span class="format-pane__title">${title}</span>
        <span class="eyebrow">${line}</span>
      </div>
    </a>`;

  return `
  <section class="format-split" aria-label="Two formats" data-reveal>
    ${pane(digital, 'digital', 'digital-billboards.html', 'Digital', 'Bookable by the day · 150+ screens')}
    ${pane(stat, 'static', 'static-billboards.html', 'Static', 'One-month minimum · unipoles, gantries, wraps')}
  </section>
  <div class="format-split__captions gl-padding_lr">
    <p class="plate__caption"><span>Full-motion LED, bookable by the day. Change the creative the same day, target particular hours, and get proof-of-play on every slot.</span><a class="text-link" href="digital-billboards.html">Digital billboards</a></p>
    <p class="plate__caption"><span>Unipoles, gantries and building wraps. Sole occupancy for the length of the booking, printed and mounted by our own crews.</span><a class="text-link" href="static-billboards.html">Static billboards</a></p>
  </div>`;
}

/**
 * How a booking runs, as numbered steps under one hairline. The amber line
 * along the top draws across as the section scrolls in (`--section-progress`
 * from scrollfx.ts). The contact page uses a three-step variant with the
 * first-message checklist folded under step one.
 */
export function buildProcess(variant: 'full' | 'contact' = 'full'): string {
  const steps =
    variant === 'contact'
      ? [
          {
            num: '01',
            title: 'Tell us the market and dates',
            body: 'A phone call is fastest — we can usually tell you availability while you are on the line. If you would rather write, these are the things that let us answer properly:',
            list: [
              'Cities or areas you want to reach',
              'Campaign start date and duration',
              'Digital, static, or open to both',
              'Whether artwork exists already',
              'A budget range, even a wide one',
              'The best number to reach you on',
            ],
          },
          {
            num: '02',
            title: 'A plan within one working day',
            body: 'A site list with photographs, traffic notes and an all-in cost — production and mounting included — before anything is signed.',
          },
          {
            num: '03',
            title: 'Mount, monitor, report',
            body: 'Our own crews mount it, condition photography runs through the campaign, and a close report shows exactly what delivered.',
          },
        ]
      : processSteps.map((p) => ({ ...p, list: undefined as string[] | undefined }));

  const items = steps
    .map(
      (p) => `
      <li class="process__step ruled__row" data-reveal-item>
        <span class="process__num">${esc(p.num)}</span>
        <h3 class="process__title">${esc(p.title)}</h3>
        <p>${esc(p.body)}</p>${
          p.list
            ? `
        <ul class="checklist">${p.list.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`
            : ''
        }
      </li>`,
    )
    .join('');

  const head =
    variant === 'contact'
      ? `<span class="eyebrow">What happens next</span><h2 data-split="words">From first message to close report</h2>`
      : `<span class="eyebrow">How it works</span><h2 data-split="words">Brief to close report, one team</h2>`;

  return `
  <section class="gl-section gl-padding_lr process${variant === 'contact' ? ' process--contact' : ''}" data-progress${
    variant === 'contact' ? ' style="border-top:1px solid var(--line)"' : ''
  }>
    <header class="section-head" data-reveal>${head}</header>
    <div class="process__track" aria-hidden="true"><i class="process__line"></i></div>
    <ol class="process__steps ruled" data-reveal>${items}
    </ol>
  </section>`;
}

/**
 * The client roster.
 *
 * On the home page it is two slow bands of names moving in opposite
 * directions (marquee.ts clones the rows); on the clients page a dense grid
 * of bordered tiles. Client marks are their trademarks, not ours to redraw,
 * so a tile shows the real logo only once `logo` is set in site.ts and the
 * file is cleared for use — otherwise the name, set in the display face.
 */
export function buildClientWall(mode: 'marquee' | 'grid' = 'grid'): string {
  if (mode === 'marquee') {
    const half = Math.ceil(clients.length / 2);
    const row = (list: typeof clients) =>
      list
        .map(
          (c) =>
            `<span class="client-marquee__name">${esc(c.name)}</span><span class="client-marquee__dot" aria-hidden="true">·</span>`,
        )
        .join('');

    return `
  <section class="gl-section gl-padding_lr" data-reveal aria-label="Clients">
    <span class="eyebrow">400+ brands and counting</span>
    <div class="client-marquee" aria-label="Brands who have advertised with us">
      <div class="client-marquee__row" data-marquee-row="a">${row(clients.slice(0, half))}</div>
      <div class="client-marquee__row client-marquee__row--reverse" data-marquee-row="b">${row(clients.slice(half))}</div>
    </div>
    <div class="btn-wrapper">
      ${btn('See all clients', 'clients.html')}
    </div>
  </section>`;
  }

  const tiles = clients
    .map((c) => {
      const logo = c.logo
        ? `<img src="/clients/${esc(c.logo)}" alt="" loading="lazy" decoding="async" width="160" height="28" />`
        : '';
      return `
        <li class="client-tile" data-sector="${esc(c.sector)}" data-reveal-item>
          ${logo}<span class="client-tile__name">${esc(c.name)}</span>
        </li>`;
    })
    .join('');

  return `<ul class="client-wall" data-reveal>${tiles}</ul>`;
}

/**
 * The city index on the billboards hub: a scroll-snap rail of city cards,
 * each led by the city's best photograph that is actually on disk. A card
 * whose image still fails marks itself `.is-missing` and shows the
 * placeholder slab, which is better than a black rectangle with a name on
 * it.
 */
export function buildCityIndex(): string {
  const cards = cityGroups
    .map((g) => {
      const lead = leadOf(g);
      const count = `${g.boards.length} LED site${g.boards.length === 1 ? '' : 's'}`;
      const media = lead
        ? img(lead, {
            className: 'city-card__img',
            sizes: '(max-width:767px) 78vw, 22vw',
            alt: '',
            extra: `onerror="this.closest('.city-card').classList.add('is-missing')"`,
          })
        : '';
      return `
      <li class="rail__item" data-reveal-item>
        <a class="city-card${lead ? '' : ' is-missing'}" href="${esc(cityPath(g.slug))}" style="--accent:${lead ? esc(accentOf(lead)) : 'var(--brand-sky)'}" data-cursor="media" data-cursor-label="${esc(g.city)}">
          ${media}
          <span class="city-card__body">
            <span class="city-card__name">${esc(g.city)}</span>
            <span class="city-card__count">${count}</span>
          </span>
        </a>
      </li>`;
    })
    .join('');

  return `
  <section class="gl-section rail-section" data-reveal>
    <header class="section-head gl-padding_lr">
      <span class="eyebrow">By city</span>
      <h2 data-split="words">Where the network is</h2>
      <span class="section-head__fig" data-rail-counter>01 / ${pad2(cityGroups.length)}</span>
    </header>
    <div class="rail city-rail" data-rail>
      <ul class="rail__track" data-rail-track>${cards}
      </ul>
      <button class="rail__btn rail__btn--prev" type="button" data-rail-prev aria-label="Previous">←</button>
      <button class="rail__btn rail__btn--next" type="button" data-rail-next aria-label="Next">→</button>
    </div>
    <p class="rail__hint eyebrow" aria-hidden="true">Swipe →</p>
  </section>`;
}

/**
 * Digital against static. Each cell carries its column heading as
 * `data-label`, which is what lets the table stack into labelled rows on a
 * phone instead of pushing the Static column off the edge.
 */
export function buildComparison(): string {
  const rows = formatComparison
    .map(
      (r) => `
      <tr>
        <th scope="row">${esc(r.label)}</th>
        <td data-label="Digital">${esc(r.digital)}</td>
        <td data-label="Static">${esc(r.static)}</td>
      </tr>`,
    )
    .join('');

  return `
  <div class="table-scroll" data-reveal>
    <table class="compare-table">
      <caption class="visually-hidden">Digital compared with static billboards</caption>
      <thead>
        <tr><th scope="col"><span class="visually-hidden">Question</span></th><th scope="col">Digital</th><th scope="col">Static</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}

export function buildServices(): string {
  return services
    .map(
      (s) => `
      <article class="service-block css-grid-wrapper" id="${esc(s.slug)}" data-reveal>
        <div class="grid-item grid-40 xsm-grid-100">
          <h2 class="service-block__title" data-split="words">${esc(s.title)}</h2>
        </div>
        <div class="grid-item grid-60 xsm-grid-100">
          <p class="service-block__subtitle">${esc(s.subtitle)}</p>
          <p>${esc(s.body)}</p>
          <ul class="checklist">${s.points.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>
          <a class="text-link" href="${esc(s.href)}">${esc(s.linkLabel)}</a>
        </div>
      </article>`,
    )
    .join('');
}

export function buildFaq(): string {
  return `
  <div class="faq" data-reveal>
    ${faqs
      .map(
        (f) => `
      <details class="faq__item" data-reveal-item>
        <summary class="faq__q">${esc(f.q)}<span class="faq__marker" aria-hidden="true"></span></summary>
        <div class="faq__a"><p>${esc(f.a)}</p></div>
      </details>`,
      )
      .join('')}
  </div>`;
}

/* --- inventory grid --------------------------------------------------------- */

/**
 * One card in the inventory grid.
 *
 * The whole card links through to that site's own page — this is a listing
 * index, and a visitor who taps a photograph expects the listing, not a
 * contact form. The reveal state lives on the card body only: a photograph
 * that waits to be scrolled into view before it is allowed to load is a
 * photograph that is sometimes never shown.
 */
function boardCard(b: Billboard, index: number): string {
  return `
    <article class="board-card" data-city="${esc(b.city)}" style="--accent:${esc(accentOf(b))}">
      <a class="board-card__link" href="${esc(boardPath(b))}">
        <div class="board-card__media" data-pixelate>
          ${img(b, {
            className: 'board-card__img',
            sizes: '(max-width:767px) 100vw, (max-width:1279px) 50vw, 33vw',
            alt: altOf(b),
            loading: index < 6 ? 'eager' : 'lazy',
            fetchpriority: index < 3 ? 'high' : undefined,
            load: true,
          })}
          <span class="board-card__kind">Digital LED</span>
        </div>
        <div class="board-card__body" data-reveal-item>
          <h3 class="board-card__title" data-scramble>${displayName(b.name)}</h3>
          <p class="eyebrow">${esc(b.city)} · ${esc(sizeWords(b))}</p>
          <dl class="board-card__specs">
            <div><dt>Facing</dt><dd>${esc(b.facing)}</dd></div>
            <div><dt>On air</dt><dd>${esc(fmtSchedule(b.schedule) || b.hours || 'Daily')}</dd></div>
          </dl>
          <p class="board-card__note">${esc(fmtResolution(b.resolution))}${b.ledModel ? ` · ${esc(b.ledModel)} panel` : ''}</p>
          <span class="text-link" aria-hidden="true">View this site</span>
        </div>
      </a>
    </article>`;
}

/**
 * The sticky city filter. Rendered on its own so the billboards hub can put
 * it directly under the page head, where it stays pinned while the rail,
 * the formats and the comparison scroll past; pages with one city get none.
 */
export function buildFilterBar(citySlug?: string): string {
  const list = citySlug ? billboards.filter((b) => b.citySlug === citySlug) : billboards;
  const groups = cityGroups.filter((g) => list.some((b) => b.citySlug === g.slug));
  if (groups.length < 2) return '';

  const chips = [
    `<button class="filter-btn" type="button" data-filter="all" aria-pressed="true">All<span class="filter-btn__count">${list.length}</span></button>`,
    ...groups.map(
      (g) =>
        `<button class="filter-btn" type="button" data-filter="${esc(g.city)}" aria-pressed="false">${esc(g.city)}<span class="filter-btn__count">${g.boards.length}</span></button>`,
    ),
  ].join('');

  return `
  <i data-filter-sentinel aria-hidden="true"></i>
  <div class="filter-bar gl-padding_lr" role="group" aria-label="Filter sites by city" data-filter-bar>
    ${chips}
    <span class="filter-bar__status eyebrow" data-filter-count aria-hidden="true">${list.length} sites shown</span>
  </div>
  <p class="visually-hidden" id="filter_status" role="status" aria-live="polite">${list.length} sites shown.</p>`;
}

/** Inventory grid. Pass a city slug to scope it; `withBar` adds the filter. */
export function buildBoards(citySlug?: string, withBar = true): string {
  const list = citySlug ? billboards.filter((b) => b.citySlug === citySlug) : billboards;
  return `
  ${withBar ? buildFilterBar(citySlug) : ''}
  <div class="board-grid">${list.map(boardCard).join('')}</div>`;
}

/* --- listing page ----------------------------------------------------------
   The real-estate shape: one page per site, carrying its own photograph,
   its own spec table, its own questions, and links out to the rest of its
   city, its city index and the format hub. Every listing is therefore
   reachable from every other listing in at most two clicks, and no page in
   the set is a dead end.                                                   */

/**
 * One line of the specification sheet.
 *
 * The value is set in the mono face and the row carries its own hairline, so
 * the sheet reads as a technical document rather than as a styled definition
 * list. `numeric` marks the rows a buyer scans for — sizes, resolutions,
 * hours — which are set larger than the prose rows beside them.
 */
function specRow(label: string, value: string, numeric = false): string {
  if (!value) return '';
  return `<div class="spec ruled__row${numeric ? ' spec--numeric' : ''}">
            <dt class="spec__label">${esc(label)}</dt>
            <dd class="spec__value">${esc(value)}</dd>
          </div>`;
}

export function buildListing(slug: string): string {
  const board = boardBySlug(slug);
  if (!board) throw new Error(`No billboard with slug "${slug}"`);

  const group = cityGroups.find((g) => g.slug === board.citySlug);
  const related = relatedBoards(board);
  const index = billboards.findIndex((b) => b.slug === slug) + 1;
  const schedule = fmtSchedule(board.schedule);
  const hours = fmtHours(board.hours);
  const pitch = pitchOf(board);
  const breakTime = /^n\/?a$/i.test(board.breakTime) ? '' : fmtSchedule(board.breakTime);

  const specs = [
    specRow('Screen size', sizeWords(board), true),
    specRow('Resolution', fmtResolution(board.resolution), true),
    specRow('On-air window', schedule, true),
    specRow('Daily on-air hours', hours, true),
    specRow('Facing', board.facing),
    specRow('LED panel', pitch ? `${board.ledModel} · ${pitch} mm pitch` : board.ledModel),
    specRow('Minimum booking', board.minimum),
    specRow('Maintenance break', breakTime),
    specRow('Artwork format', board.format),
    specRow('Reporting', board.reporting),
    specRow('City', board.city),
    `<div class="spec ruled__row"><dt class="spec__label">Rate</dt>
       <dd class="spec__value"><a class="text-link text-link--hot" href="tel:${esc(company.phoneHref)}">Call for price</a></dd>
     </div>`,
  ].join('');

  const faq = boardFaqs(board)
    .map(
      (f) => `
      <details class="faq__item" data-reveal-item>
        <summary class="faq__q">${esc(f.q)}<span class="faq__marker" aria-hidden="true"></span></summary>
        <div class="faq__a"><p>${esc(f.a)}</p></div>
      </details>`,
    )
    .join('');

  const nearby = related
    .map(
      (b) => `
      <li class="nearby__item" data-reveal-item>
        <a class="nearby__link" href="${esc(boardPath(b))}" style="--accent:${esc(accentOf(b))}" data-cursor="media" data-cursor-label="View">
          <figure class="plate" data-pixelate>
            ${img(b, {
              className: 'nearby__img',
              sizes: '(max-width:767px) 50vw, 30vw',
              alt: altOf(b),
              load: true,
            })}
            <figcaption class="plate__caption">
              <span class="nearby__title">${displayName(b.name)}</span>
              <span class="nearby__meta eyebrow">${esc(b.city)} · ${esc(sizeWords(b))}</span>
            </figcaption>
          </figure>
        </a>
      </li>`,
    )
    .join('');

  // The four figures a buyer actually scans for, on glass over the lower
  // right of the photograph. The screen size leads at the largest size on
  // the page in this site's own accent.
  const glance = `
      <dl class="glance glance--glass" data-reveal data-reveal-delay=".1">
        <div class="glance__row glance__row--lead">
          <dt class="glance__label">Screen</dt>
          <dd class="glance__value glance__value--lead">${esc(sizeWords(board))}</dd>
        </div>
        <div class="glance__row">
          <dt class="glance__label">Resolution</dt>
          <dd class="glance__value">${esc(fmtResolution(board.resolution))}</dd>
        </div>
        <div class="glance__row">
          <dt class="glance__label">On air</dt>
          <dd class="glance__value">${esc([schedule, hours].filter(Boolean).join(' · ') || 'Daily')}</dd>
        </div>
        <div class="glance__row">
          <dt class="glance__label">Facing</dt>
          <dd class="glance__value">${esc(board.facing)}</dd>
        </div>
      </dl>`;

  const head = pageHead({
    readout: `SITE ${pad2(index)} / ${pad2(billboards.length)} · ${board.city.toUpperCase()}`,
    crumbs: [
      { label: 'Billboards', href: 'billboards.html' },
      { label: board.city, href: cityPath(board.citySlug) },
      { label: board.name },
    ],
    eyebrow: `LED billboard · ${board.city}`,
    title: displayName(board.title),
    titleClass: 'listing-title',
    lede: boardIntro(board),
    buttons: [
      btn('Call for price', `tel:${esc(company.phoneHref)}`, 'btn--primary'),
      btn('WhatsApp', waLink(`Hello AD PRO — is ${board.title} (${board.city}) available? Dates: `), 'btn--accent'),
      btn('Check availability', 'contact.html'),
    ].join('\n          '),
    className: 'listing-head',
  });

  // Everything below inherits this site's own accent. It is set once, on a
  // wrapper, rather than repeated on each element that uses it — which also
  // means a board without a sampled colour falls back exactly once.
  return `
        <div class="listing" style="--accent:${esc(accentOf(board))}">
        ${head}

        <section class="gl-section gl-section--bleed listing-hero">
          <div class="listing__bleed" aria-hidden="true" style="--bleed-img:url('${esc(imageSrc(board, 600))}')"></div>
          <figure class="plate listing-figure listing-figure--bleed" data-reveal="clip" data-pixelate>
            ${img(board, {
              className: 'listing-figure__img',
              sizes: '100vw',
              alt: altOf(board),
              loading: 'eager',
              fetchpriority: 'high',
              load: true,
              parallax: 40,
            })}
            <figcaption class="plate__caption gl-padding_lr"><span>${displayName(board.title)} — ${esc(board.city)}, facing ${esc(board.facing)}</span><span>Photographed from the reading position</span></figcaption>
          </figure>
          ${glance}
        </section>

        <section class="gl-section gl-padding_lr" data-reveal>
          <div class="css-grid-wrapper">
            <div class="grid-item grid-40 xsm-grid-100">
              <span class="eyebrow">Specification</span>
              <h2 class="accent-title">Site specification</h2>
              <p class="text-muted">Every figure here is the operator's own, not an estimate.</p>
            </div>
            <div class="grid-item grid-60 xsm-grid-100">
              <dl class="spec-list ruled">${specs}</dl>
            </div>
          </div>
        </section>

        <section class="gl-section gl-padding_lr" data-reveal>
          <div class="css-grid-wrapper">
            <div class="grid-item grid-40 xsm-grid-100">
              <h2 class="accent-title">The screen</h2>
              <p class="pull-figure" aria-hidden="true">${pitch ? `${esc(board.ledModel)} · ${pitch} mm` : esc(sizeWords(board))}</p>
            </div>
            <div class="grid-item grid-60 xsm-grid-100">
              <p>${esc(boardTechnical(board))}</p>
            </div>
          </div>
        </section>

        <section class="gl-section gl-padding_lr" data-reveal>
          <div class="css-grid-wrapper">
            <div class="grid-item grid-40 xsm-grid-100">
              <h2 class="accent-title">Who it reaches</h2>
              <p class="pull-figure pull-figure--display" aria-hidden="true">${esc(board.facing)}</p>
            </div>
            <div class="grid-item grid-60 xsm-grid-100">
              <p>${esc(boardAudience(board))}</p>
              <div class="btn-wrapper">
                ${btn('Call for price', `tel:${esc(company.phoneHref)}`, 'btn--primary')}
                ${btn('WhatsApp', waLink(`Hello AD PRO — is ${board.title} (${board.city}) available? Dates: `), 'btn--accent')}
              </div>
            </div>
          </div>
        </section>

        <section class="gl-section gl-padding_lr">
          <header class="section-head" data-reveal>
            <span class="eyebrow">About this site</span>
            <h2 data-split="words">Frequently asked questions</h2>
          </header>
          <div class="faq" data-reveal>${faq}</div>
        </section>

        <section class="gl-section gl-padding_lr">
          <header class="section-head" data-reveal>
            <span class="eyebrow">${esc(board.city)} and the wider network</span>
            <h2 data-split="words">Other sites you might hold instead</h2>
          </header>
          <ul class="nearby" data-reveal>${nearby}</ul>
          <div class="btn-wrapper">
            ${btn(`All ${esc(board.city)} sites${group ? ` (${group.boards.length})` : ''}`, esc(cityPath(board.citySlug)))}
            ${btn('The full network', 'billboards.html')}
          </div>
        </section>

        ${buildCta(
          `Want ${esc(board.name)}? Ask us what it costs.`,
          'Screen time on this site is quoted per booking. Call and we will tell you what is open on this face and what it comes to — usually while you are still on the line.',
          board.title,
        )}
        </div>`;
}

/* --- city index ----------------------------------------------------------- */

export function buildCity(slug: string): string {
  const group = cityGroups.find((g) => g.slug === slug);
  if (!group) throw new Error(`No city with slug "${slug}"`);

  const others = cityGroups
    .filter((g) => g.slug !== slug)
    .map(
      (g) =>
        `<li><a class="text-link" href="${esc(cityPath(g.slug))}">${esc(g.city)} (${g.boards.length})</a></li>`,
    )
    .join('');

  // Compare actual face area, not the printed string — "9 ft × 16 ft" sorts
  // above "30 ft × 20 ft" alphabetically and that would be nonsense.
  const face = (b: Billboard): number => {
    const d = parseDimension(b.dimension);
    return d && d.unit === 'ft' ? areaOf(d) : 0;
  };
  const ranked = [...group.boards].sort((a, b) => face(b) - face(a));
  const largest = ranked[0];
  const smallest = ranked[ranked.length - 1];
  const n = group.boards.length;

  // The counterweight to the headline: the city in three figures.
  const aside = `
        <dl class="glance">
          <div class="glance__row glance__row--lead">
            <dt class="glance__label">LED sites</dt>
            <dd class="glance__value glance__value--lead" data-count>${pad2(n)}</dd>
          </div>
          <div class="glance__row">
            <dt class="glance__label">Largest face</dt>
            <dd class="glance__value">${esc(sizeWords(largest))}</dd>
          </div>
          ${
            n > 1
              ? `<div class="glance__row">
            <dt class="glance__label">Smallest face</dt>
            <dd class="glance__value">${esc(sizeWords(smallest))}</dd>
          </div>`
              : ''
          }
          <div class="glance__row">
            <dt class="glance__label">Share of network</dt>
            <dd class="glance__value">${Math.round((n / billboards.length) * 100)}%</dd>
          </div>
        </dl>`;

  const head = pageHead({
    readout: `${group.city.toUpperCase()} · ${pad2(n)} / ${pad2(billboards.length)} SITES`,
    crumbs: [{ label: 'Billboards', href: 'billboards.html' }, { label: group.city }],
    eyebrow: `${n} LED site${n === 1 ? '' : 's'}`,
    title: `LED billboards in ${esc(group.city)}`,
    lede: `Every AD PRO digital screen in ${esc(group.city)}, with the size, the facing and the on-air window for each. Rates are quoted per site — call <span class="num nowrap">${esc(company.phone)}</span> and we will tell you what is open.`,
    buttons: [
      btn('Call for price', `tel:${esc(company.phoneHref)}`, 'btn--primary'),
      btn('WhatsApp', waLink(`Hello AD PRO — what is free in ${group.city}? Dates: `)),
      btn('Send a brief', briefMailto(`${group.city}, [dates]`)),
    ].join('\n          '),
    aside,
  });

  return `
        ${head}

        <section class="gl-section gl-padding_lr">
          ${buildBoards(slug)}
        </section>

        <section class="gl-section gl-padding_lr" data-reveal>
          <div class="css-grid-wrapper">
            <div class="grid-item grid-40 xsm-grid-100">
              <span class="eyebrow">Booking</span>
              <h2 class="accent-title">Booking in ${esc(group.city)}</h2>
            </div>
            <div class="grid-item grid-60 xsm-grid-100">
              <p>
                Screen time is sold by the minute per day, with a minimum of
                <span class="num">${esc(group.boards[0].minimum || '60 min/day')}</span>. Artwork is supplied as
                ${esc(group.boards[0].format || 'MP4')} and can be changed the same day, so a
                campaign can carry a different message in the morning and the evening without a
                reprint. Every booking closes with a log summary showing when each spot played.
              </p>
              <p>
                The largest face here is <span class="num">${esc(sizeWords(largest))}</span> at ${displayName(largest.name)}.
                ${n > 1 ? `The smallest is <span class="num">${esc(sizeWords(smallest))}</span> at ${displayName(smallest.name)}, which is the one to take when the message is short and the traffic is close.` : ''}
              </p>
              <a class="text-link" href="digital-billboards.html">How digital billboards work</a>
            </div>
          </div>
        </section>

        <section class="gl-section gl-padding_lr" data-reveal>
          <div class="css-grid-wrapper">
            <div class="grid-item grid-40 xsm-grid-100">
              <span class="eyebrow">Elsewhere</span>
              <h2 class="accent-title">Other cities</h2>
            </div>
            <div class="grid-item grid-60 xsm-grid-100">
              <ul class="city-links">${others}</ul>
            </div>
          </div>
        </section>

        ${buildCta(
          `Booking in ${esc(group.city)}?`,
          'Tell us the dates and we will come back with what is free across the city, with sizes, hours and an all-in cost.',
          `${group.city}, [dates]`,
        )}`;
}
