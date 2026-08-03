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
  clients,
  company,
  faqs,
  formatComparison,
  marqueeItems,
  nav,
  platforms,
  process,
  services,
  socials,
  stats,
  type Billboard,
  type BillboardKind,
} from '../data/site';
import { buildJsonLd, type PageMeta } from './seo';

export type { PageMeta };

const esc = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const abs = (href: string): string =>
  `${company.siteUrl.replace(/\/$/, '')}/${href.replace(/^\//, '')}`;

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

    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />

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
        <a class="brand" href="index.html">${esc(company.wordmark)}</a>
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
      ${esc(company.wordmark)}<span class="brand__sub">Communications Ltd.</span>
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
  const sitemapLinks = [
    { label: 'Billboards', href: 'billboards.html' },
    { label: 'Static Billboards', href: 'static-billboards.html' },
    { label: 'Digital Billboards', href: 'digital-billboards.html' },
    { label: 'Services', href: 'services.html' },
    { label: 'Clients', href: 'clients.html' },
    { label: 'About', href: 'about.html' },
    { label: 'Contact', href: 'contact.html' },
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
        <div class="grid-item grid-33 xsm-grid-100">
          <span class="sub-text">Pages</span>
          <ul class="footer-links">${sitemapLinks}</ul>
        </div>

        <div class="grid-item grid-33 xsm-grid-100">
          <span class="sub-text">Offices</span>
          <p class="text-muted">
            <strong>Corporate</strong><br />
            <a class="text-link" href="${esc(company.mapUrl)}" rel="noopener noreferrer" target="_blank">${esc(company.corporateAddress)}</a>
          </p>
          <p class="text-muted"><strong>Registered</strong><br />${esc(company.registeredAddress)}</p>
        </div>

        <div class="grid-item grid-33 xsm-grid-100">
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
        <span class="stat__value">${esc(s.value)}</span>
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

function boardCard(b: Billboard): string {
  // Images are optional: drop a file of the named shape into public/ and the
  // placeholder is replaced without touching markup.
  const media = b.image
    ? `<img class="board-card__img" src="/${esc(b.image)}" alt="${esc(b.location)} billboard in ${esc(b.city)}" loading="lazy" decoding="async" width="1200" height="800" />`
    : '<div class="board-card__placeholder" aria-hidden="true"></div>';

  return `
    <article class="board-card" data-reveal-item data-city="${esc(b.city)}">
      <div class="board-card__media">
        ${media}
        <span class="board-card__kind">${b.kind === 'digital' ? 'Digital' : 'Static'}</span>
      </div>
      <div class="board-card__body">
        <h3 class="board-card__title">${esc(b.location)}</h3>
        <p class="sub-text">${esc(b.city)} · ${esc(b.size)}</p>
        <dl class="board-card__specs">
          <div><dt>Facing</dt><dd>${esc(b.facing)}</dd></div>
          <div><dt>Hours</dt><dd>${esc(b.hours)}</dd></div>
        </dl>
        <p class="board-card__note">${esc(b.note)}</p>
        <a class="text-link" href="contact.html">Check availability</a>
      </div>
    </article>`;
}

/** Inventory grid. Pass a kind to show only digital or only static sites. */
export function buildBoards(kind?: BillboardKind): string {
  const list = kind ? billboards.filter((b) => b.kind === kind) : billboards;
  const cityFilters = [...new Set(list.map((b) => b.city))];

  const filters = [
    `<button class="filter-btn" type="button" data-filter="all" aria-pressed="true">All<span class="filter-btn__count">${list.length}</span></button>`,
    ...cityFilters.map(
      (c) =>
        `<button class="filter-btn" type="button" data-filter="${esc(c)}" aria-pressed="false">${esc(c)}<span class="filter-btn__count">${list.filter((b) => b.city === c).length}</span></button>`,
    ),
  ].join('');

  return `
  <div class="filter-bar" role="group" aria-label="Filter sites by city">${filters}</div>
  <p class="visually-hidden" id="filter_status" role="status" aria-live="polite">${list.length} sites shown.</p>
  <div class="board-grid" data-reveal>${list.map(boardCard).join('')}</div>`;
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
