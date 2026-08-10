/**
 * Build-time HTML generation.
 *
 * Page transitions need real documents, but the shell — head, menu, header,
 * curtain, canvas, footer — is identical across all of them. Each page file
 * carries only its own content plus placeholder comments, and the Vite plugin
 * in vite.config.ts substitutes these fragments at build time.
 *
 * Everything reads from src/data/site.ts, so the navigation, the inventory
 * tables, the sitemap and the structured data cannot drift from each other.
 */

import {
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
  process,
  relatedBoards,
  services,
  socials,
  stats,
  type Billboard,
} from '../data/site';
import {
  areaOf,
  boardAudience,
  boardFaqs,
  boardIntro,
  boardTechnical,
  parseDimension,
  sizeWords,
} from './boardCopy';
import { faqArticles } from '../data/faq';
import { buildCta, faqPath, FAQ_HUB } from './faqPages';
import { abs, boardPath, buildJsonLd, cityPath, type PageMeta } from './seo';

export type { PageMeta };

const esc = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');


/* --- head ----------------------------------------------------------------- */

export function buildHead(meta: PageMeta): string {
  const title = meta.title.includes(company.shortName)
    ? meta.title
    : `${meta.title} | ${company.shortName}`;

  return `
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(meta.description)}" />
    <link rel="canonical" href="${esc(abs(meta.path))}" />

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
          <span class="links_group__label">${esc(group.label)}</span>
          <ul class="menu-list">${links}</ul>
        </div>`;
    })
    .join('');

  return `
  <a class="skip-link" href="#main">Skip to content</a>

  <canvas aria-hidden="true" class="wgl-canvas" id="wgl_canvas"></canvas>
  <div class="cursor" id="cursor" aria-hidden="true"><span class="cursor__label"></span></div>

  <div class="menu-wrapper" id="menu_wrapper" aria-hidden="true">
    <div class="main-navigation js-main-navigation" id="main_navigation_wrapper"
         role="dialog" aria-modal="true" aria-label="Main menu" data-lenis-prevent>
      <div class="menu-header">
        <a class="brand" href="index.html">
          <img class="brand__mark" src="/logo-mark-reversed.png" alt="" width="312" height="312" decoding="async" />
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
        <a class="text-link" href="mailto:${esc(company.email)}">${esc(company.email)}</a>
      </div>
    </div>
  </div>

  <div class="main-nav-wrapper flex-wrapper space-between" id="main_nav_wrapper">
    <a class="brand" href="index.html">
      <img class="brand__mark" src="/logo-mark-reversed.png" alt="" width="312" height="312" decoding="async" />
      <span class="brand__text">
        <span class="brand__name">${esc(company.wordmark)}</span>
        <span class="brand__sub">Communications Ltd.</span>
      </span>
    </a>
    <nav class="main-links-wrapper flex-wrapper" aria-label="Shortcuts">
      <a class="text-link nav-link hide-xsm" href="billboards.html">Billboards</a>
      <a class="text-link nav-link hide-xsm" href="contact.html">Contact</a>
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

  // Internal links in the footer are how the billboard pages earn crawl depth
  // from every other page on the site.
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

  const sitemapLinks = [
    { label: 'Billboards', href: 'billboards.html' },
    { label: 'Static Billboards', href: 'static-billboards.html' },
    { label: 'Digital Billboards', href: 'digital-billboards.html' },
    { label: 'Services', href: 'services.html' },
    { label: 'Clients', href: 'clients.html' },
    { label: 'About', href: 'about.html' },
    { label: 'Contact', href: 'contact.html' },
    { label: 'News', href: 'news.html' },
    { label: 'Answers', href: FAQ_HUB },
  ]
    .map((l) => `<li><a class="text-link" href="${esc(l.href)}">${esc(l.label)}</a></li>`)
    .join('');

  return `
  <footer class="css-grid-wrapper" id="footer">
    <div class="grid-item grid-100 gl-padding">

      <div class="footer-cta" data-reveal>
        <h2 class="footer-heading">Ready to book a site?</h2>
        <p class="accent-text">Tell us the city and the dates. We will tell you what is free and what it delivers.</p>
        <div class="btn-wrapper">
          <a class="btn addHover" href="tel:${esc(company.phoneHref)}">${esc(company.phone)}</a>
          <a class="btn addHover" href="contact.html">Send a brief</a>
        </div>
      </div>

      <div class="css-grid-wrapper footer-grid">
        <div class="grid-item grid-25 xsm-grid-100">
          <span class="sub-text">Pages</span>
          <ul class="footer-links">${sitemapLinks}</ul>
        </div>

        <div class="grid-item grid-25 xsm-grid-100">
          <span class="sub-text">Answers</span>
          <ul class="footer-links">${answerLinks}</ul>
          <p><a class="text-link" href="${FAQ_HUB}">All ${faqArticles.length} questions</a></p>
        </div>

        <div class="grid-item grid-25 xsm-grid-100">
          <span class="sub-text">Offices</span>
          <p class="text-muted">
            <strong>Corporate</strong><br />
            <a class="text-link" href="${esc(company.mapUrl)}" rel="noopener noreferrer" target="_blank">${esc(company.corporateAddress)}</a>
          </p>
          <p class="text-muted"><strong>Registered</strong><br />${esc(company.registeredAddress)}</p>
        </div>

        <div class="grid-item grid-25 xsm-grid-100">
          <span class="sub-text">Contact</span>
          <p>
            <a class="text-link" href="tel:${esc(company.phoneHref)}">${esc(company.phone)}</a><br />
            <a class="text-link" href="mailto:${esc(company.email)}">${esc(company.email)}</a>
          </p>
          <div class="social-links">${social}</div>
        </div>
      </div>

      <div class="footer-platforms">
        <span class="sub-text">Group platforms</span>
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

export function buildMarquee(): string {
  const items = marqueeItems
    .map((item) => `<span class="marquee__item">${esc(item)}</span>`)
    .join('');
  return `
  <div class="marquee" aria-label="What we do">
    <div class="marquee__track">${items}</div>
  </div>`;
}

export function buildStats(): string {
  const cells = stats
    .map(
      (s) => `
      <div class="grid-item grid-25 xsm-grid-50 stat" data-reveal-item>
        <span class="stat__value" data-count>${esc(s.value)}</span>
        <span class="stat__label">${esc(s.label)}</span>
        <span class="stat__detail">${esc(s.detail)}</span>
      </div>`,
    )
    .join('');

  return `
  <section class="stats-band gl-padding_lr" data-reveal aria-label="AD PRO by the numbers">
    <div class="ascii-rule ascii-rule--full" data-ascii-rule aria-hidden="true"></div>
    <div class="css-grid-wrapper">${cells}</div>
  </section>`;
}

/**
 * One card in the inventory grid.
 *
 * The whole card links through to that site's own page — this is a listing
 * index, and a visitor who taps a photograph expects the listing, not a
 * contact form. `object-position` uses the focal point worked out when the
 * photograph was cropped, so the screen stays in frame at any card shape.
 */
function boardCard(b: Billboard): string {
  const focus = `${(b.focus[0] * 100).toFixed(1)}% ${(b.focus[1] * 100).toFixed(1)}%`;

  return `
    <article class="board-card" data-reveal-item data-city="${esc(b.city)}">
      <a class="board-card__link" href="${esc(boardPath(b))}">
        <div class="board-card__media" data-ascii>
          <img class="board-card__img" src="/${esc(b.image)}"
               alt="${esc(b.title)} LED billboard in ${esc(b.city)}, facing ${esc(b.facing)}"
               style="object-position:${focus}"
               loading="lazy" decoding="async" width="1400" height="933" />
          <span class="board-card__kind">Digital LED</span>
        </div>
        <div class="board-card__body">
          <h3 class="board-card__title" data-scramble>${esc(b.name)}</h3>
          <p class="sub-text">${esc(b.city)} · ${esc(sizeWords(b))}</p>
          <dl class="board-card__specs">
            <div><dt>Facing</dt><dd>${esc(b.facing)}</dd></div>
            <div><dt>On air</dt><dd>${esc(b.schedule || b.hours || 'Daily')}</dd></div>
          </dl>
          <p class="board-card__note">${esc(b.resolution)}${b.ledModel ? ` · ${esc(b.ledModel)} panel` : ''}</p>
          <span class="text-link" aria-hidden="true">View this site</span>
        </div>
      </a>
    </article>`;
}

/** Inventory grid with a city filter. Pass a city slug to scope it. */
export function buildBoards(citySlug?: string): string {
  const list = citySlug ? billboards.filter((b) => b.citySlug === citySlug) : billboards;
  const groups = cityGroups.filter((g) => list.some((b) => b.citySlug === g.slug));

  const filters =
    groups.length > 1
      ? [
          `<button class="filter-btn" type="button" data-filter="all" aria-pressed="true">All<span class="filter-btn__count">${list.length}</span></button>`,
          ...groups.map(
            (g) =>
              `<button class="filter-btn" type="button" data-filter="${esc(g.city)}" aria-pressed="false">${esc(g.city)}<span class="filter-btn__count">${g.boards.length}</span></button>`,
          ),
        ].join('')
      : '';

  const bar = filters
    ? `<div class="filter-bar" role="group" aria-label="Filter sites by city">${filters}</div>
  <p class="visually-hidden" id="filter_status" role="status" aria-live="polite">${list.length} sites shown.</p>`
    : '';

  return `
  ${bar}
  <div class="board-grid" data-reveal>${list.map(boardCard).join('')}</div>`;
}

/* --- listing page ----------------------------------------------------------
   The real-estate shape: one page per site, carrying its own photograph,
   its own spec table, its own questions, and links out to the rest of its
   city, its city index and the format hub. Every listing is therefore
   reachable from every other listing in at most two clicks, and no page in
   the set is a dead end.                                                   */

function specRow(label: string, value: string): string {
  return value ? `<div class="spec"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>` : '';
}

export function buildListing(slug: string): string {
  const board = boardBySlug(slug);
  if (!board) throw new Error(`No billboard with slug "${slug}"`);

  const focus = `${(board.focus[0] * 100).toFixed(1)}% ${(board.focus[1] * 100).toFixed(1)}%`;
  const group = cityGroups.find((g) => g.slug === board.citySlug);
  const related = relatedBoards(board);

  const specs = [
    specRow('Screen size', sizeWords(board)),
    specRow('Facing', board.facing),
    specRow('Resolution', board.resolution),
    specRow('LED panel', board.ledModel),
    specRow('On-air window', board.schedule),
    specRow('Daily on-air hours', board.hours),
    specRow('Minimum booking', board.minimum),
    specRow('Maintenance break', /^n\/?a$/i.test(board.breakTime) ? '' : board.breakTime),
    specRow('Artwork format', board.format),
    specRow('Reporting', board.reporting),
    specRow('City', board.city),
    `<div class="spec"><dt>Rate</dt><dd><a class="text-link" href="tel:${esc(company.phoneHref)}">Call for price</a></dd></div>`,
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
        <a class="nearby__link" href="${esc(boardPath(b))}" data-ascii>
          <img class="nearby__img" src="/${esc(b.image)}" alt=""
               style="object-position:${(b.focus[0] * 100).toFixed(1)}% ${(b.focus[1] * 100).toFixed(1)}%"
               loading="lazy" decoding="async" width="600" height="400" />
          <span class="nearby__body">
            <span class="nearby__title">${esc(b.name)}</span>
            <span class="nearby__meta">${esc(b.city)} · ${esc(sizeWords(b))} · facing ${esc(b.facing)}</span>
          </span>
        </a>
      </li>`,
    )
    .join('');

  return `
        <nav class="breadcrumb gl-padding_lr" aria-label="Breadcrumb" data-reveal>
          <a class="text-link" href="billboards.html">Billboards</a>
          <span aria-hidden="true">/</span>
          <a class="text-link" href="${esc(cityPath(board.citySlug))}">${esc(board.city)}</a>
          <span aria-hidden="true">/</span>
          <span>${esc(board.name)}</span>
        </nav>

        <section class="intro-text-wrapper gl-padding_lr">
          <header class="intro-text" data-reveal>
            <span class="sub-text">LED billboard · ${esc(board.city)}</span>
            <div class="ascii-rule" data-ascii-rule aria-hidden="true"></div>
            <h1 class="listing-title" data-scramble>${esc(board.title)}</h1>
            <p class="h1-em">${esc(boardIntro(board))}</p>
            <div class="btn-wrapper">
              <a class="btn addHover" href="tel:${esc(company.phoneHref)}">Call for price</a>
              <a class="btn addHover" href="contact.html">Check availability</a>
            </div>
          </header>
        </section>

        <section class="gl-section gl-padding_lr" data-reveal>
          <figure class="listing-figure" data-ascii>
            <img class="listing-figure__img" src="/${esc(board.image)}"
                 alt="${esc(board.title)} LED billboard in ${esc(board.city)}, facing ${esc(board.facing)}"
                 style="object-position:${focus}"
                 width="1400" height="933" decoding="async" />
            <figcaption class="listing-figure__caption">
              ${esc(board.title)} — ${esc(board.city)}, facing ${esc(board.facing)}
            </figcaption>
          </figure>
        </section>

        <section class="gl-section gl-padding_lr" data-reveal>
          <div class="css-grid-wrapper">
            <div class="grid-item grid-40 xsm-grid-100">
              <h2 class="accent-title">Site specification</h2>
              <p class="text-muted">Every figure here is the operator's own, not an estimate.</p>
            </div>
            <div class="grid-item grid-60 xsm-grid-100">
              <dl class="spec-list">${specs}</dl>
            </div>
          </div>
        </section>

        <section class="gl-section gl-padding_lr" data-reveal>
          <div class="css-grid-wrapper">
            <div class="grid-item grid-40 xsm-grid-100">
              <h2 class="accent-title">The screen</h2>
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
            </div>
            <div class="grid-item grid-60 xsm-grid-100">
              <p>${esc(boardAudience(board))}</p>
              <div class="btn-wrapper">
                <a class="btn addHover" href="tel:${esc(company.phoneHref)}">Call for price</a>
              </div>
            </div>
          </div>
        </section>

        <!--@MARQUEE-->

        <section class="intro-text-wrapper gl-padding_lr">
          <div class="intro-text" data-reveal>
            <span class="sub-text">About this site</span>
            <h2>Frequently asked questions</h2>
          </div>
          <div class="faq" data-reveal>${faq}</div>
        </section>

        <section class="gl-section gl-padding_lr">
          <div class="intro-text" data-reveal>
            <span class="sub-text">${esc(board.city)} and the wider network</span>
            <h2 class="mtitle" data-scramble>Other sites you might hold instead</h2>
          </div>
          <ul class="nearby" data-reveal>${nearby}</ul>
          <div class="btn-wrapper">
            <a class="btn addHover" href="${esc(cityPath(board.citySlug))}">All ${esc(board.city)} sites${group ? ` (${group.boards.length})` : ''}</a>
            <a class="btn addHover" href="billboards.html">The full network</a>
          </div>
        </section>

        ${buildCta(
            `Want ${esc(board.name)}? Ask us what it costs.`,
            'Screen time on this site is quoted per booking. Call and we will tell you what is open on this face and what it comes to — usually while you are still on the line.',
          )}`;
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

  // Compare actual face area, not the printed string — "9ft × 16ft" sorts
  // above "30ft × 20ft" alphabetically and that would be nonsense.
  const face = (b: Billboard): number => {
    const d = parseDimension(b.dimension);
    return d && d.unit === 'ft' ? areaOf(d) : 0;
  };
  const ranked = [...group.boards].sort((a, b) => face(b) - face(a));
  const largest = ranked[0];
  const smallest = ranked[ranked.length - 1];

  return `
        <nav class="breadcrumb gl-padding_lr" aria-label="Breadcrumb" data-reveal>
          <a class="text-link" href="billboards.html">Billboards</a>
          <span aria-hidden="true">/</span>
          <span>${esc(group.city)}</span>
        </nav>

        <section class="intro-text-wrapper gl-padding_lr">
          <header class="intro-text" data-reveal>
            <span class="sub-text">${group.boards.length} LED site${group.boards.length === 1 ? '' : 's'}</span>
            <div class="ascii-rule" data-ascii-rule aria-hidden="true"></div>
            <h1 data-scramble>LED billboards in ${esc(group.city)}</h1>
            <p class="h1-em">
              Every AD PRO digital screen in ${esc(group.city)}, with the size, the facing and the
              on-air window for each. Rates are quoted per site — call
              ${esc(company.phone)} and we will tell you what is open.
            </p>
            <div class="btn-wrapper">
              <a class="btn addHover" href="tel:${esc(company.phoneHref)}">Call for price</a>
              <a class="btn addHover" href="contact.html">Send a brief</a>
            </div>
          </header>
        </section>

        <section class="gl-section gl-padding_lr">
          ${buildBoards(slug)}
        </section>

        <!--@MARQUEE-->

        <section class="gl-section gl-padding_lr" data-reveal>
          <div class="css-grid-wrapper">
            <div class="grid-item grid-40 xsm-grid-100">
              <h2 class="accent-title">Booking in ${esc(group.city)}</h2>
            </div>
            <div class="grid-item grid-60 xsm-grid-100">
              <p>
                Screen time is sold by the minute per day, with a minimum of
                ${esc(group.boards[0].minimum || '60 min/day')}. Artwork is supplied as
                ${esc(group.boards[0].format || 'MP4')} and can be changed the same day, so a
                campaign can carry a different message in the morning and the evening without a
                reprint. Every booking closes with a log summary showing when each spot played.
              </p>
              <p>
                The largest face here is ${esc(sizeWords(largest))} at ${esc(largest.name)}.
                ${ranked.length > 1 ? `The smallest is ${esc(sizeWords(smallest))} at ${esc(smallest.name)}, which is the one to take when the message is short and the traffic is close.` : ''}
              </p>
              <a class="text-link" href="digital-billboards.html">How digital billboards work</a>
            </div>
          </div>
        </section>

        <section class="gl-section gl-padding_lr" data-reveal>
          <div class="css-grid-wrapper">
            <div class="grid-item grid-40 xsm-grid-100">
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
          )}`;
}

/** The city index used on the billboards hub. */
export function buildCityIndex(): string {
  const cards = cityGroups
    .map((g) => {
      const lead = g.boards[0];
      return `
      <li class="city-card" data-reveal-item>
        <a class="city-card__link" href="${esc(cityPath(g.slug))}" data-ascii>
          <img class="city-card__img" src="/${esc(lead.image)}" alt=""
               style="object-position:${(lead.focus[0] * 100).toFixed(1)}% ${(lead.focus[1] * 100).toFixed(1)}%"
               loading="lazy" decoding="async" width="600" height="400" />
          <span class="city-card__body">
            <span class="city-card__name">${esc(g.city)}</span>
            <span class="city-card__count">${g.boards.length} LED site${g.boards.length === 1 ? '' : 's'}</span>
          </span>
        </a>
      </li>`;
    })
    .join('');

  return `<ul class="city-grid" data-reveal>${cards}</ul>`;
}

export function buildComparison(): string {
  const rows = formatComparison
    .map(
      (r) => `
      <tr>
        <th scope="row">${esc(r.label)}</th>
        <td>${esc(r.digital)}</td>
        <td>${esc(r.static)}</td>
      </tr>`,
    )
    .join('');

  return `
  <div class="table-scroll" data-reveal>
    <table class="compare-table">
      <caption class="visually-hidden">Digital compared with static billboards</caption>
      <thead>
        <tr><th scope="col">&nbsp;</th><th scope="col">Digital</th><th scope="col">Static</th></tr>
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
          <h2 class="service-block__title">${esc(s.title)}</h2>
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

export function buildProcess(): string {
  const items = process
    .map(
      (p) => `
      <article class="grid-item grid-25 xsm-grid-100 principle" data-reveal-item>
        <span class="principle__num">${esc(p.num)}</span>
        <h3 class="accent-title">${esc(p.title)}</h3>
        <p>${esc(p.body)}</p>
      </article>`,
    )
    .join('');

  return `<div class="css-grid-wrapper" data-reveal>${items}</div>`;
}

/**
 * Client wall.
 *
 * Monogram tiles rather than third-party logos — those marks belong to the
 * clients, not to us. Setting `logo` on an entry in site.ts swaps a tile for
 * the real file once it is cleared for use.
 */
export function buildClientWall(limit?: number): string {
  const list = limit ? clients.slice(0, limit) : clients;

  const tiles = list
    .map((c) => {
      const monogram = c.name
        .split(/[\s-]+/)
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase();

      const inner = c.logo
        ? `<img src="/clients/${esc(c.logo)}" alt="${esc(c.name)}" loading="lazy" decoding="async" width="160" height="80" />`
        : `<span class="client-tile__monogram" aria-hidden="true">${esc(monogram)}</span>`;

      return `
        <li class="client-tile" data-sector="${esc(c.sector)}" data-reveal-item>
          ${inner}
          <span class="client-tile__name">${esc(c.name)}</span>
        </li>`;
    })
    .join('');

  return `<ul class="client-wall" data-reveal>${tiles}</ul>`;
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
