import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { billboards, cityGroups, company } from './src/data/site';
import { boardSummary, sizeWords } from './src/build/boardCopy';
import {
  buildBoards,
  buildCity,
  buildCityIndex,
  buildClientWall,
  buildComparison,
  buildFaq,
  buildFooter,
  buildHead,
  buildListing,
  buildMarquee,
  buildProcess,
  buildServices,
  buildShell,
  buildStats,
  type PageMeta,
} from './src/build/partials';
import { boardPath, buildRobots, buildSitemap, cityPath } from './src/build/seo';

/*
  A multi-page build rather than a client-side router.

  Barba fetches real documents and swaps the `[data-barba="container"]` node
  out of the response, so every route has to exist as its own HTML file. That
  is also what keeps the site readable with JavaScript disabled: without the
  transition layer, these are ordinary pages.

  `meta` is the register of routes — the eight hand-written pages here, plus
  one per billboard and per city appended below. Rollup's inputs and the
  sitemap are both derived from its keys, so a route cannot be built without
  being crawlable or listed without being built.
*/
const meta: Record<string, PageMeta> = {
  index: {
    title: `${company.name} — ${company.descriptor}`,
    description:
      '58 digital LED billboard sites across ten cities in Bangladesh, owned and operated by AD PRO Communications Limited. Sizes, facings and on-air hours for every site — call for price.',
    path: '',
    namespace: 'home',
    priority: 1,
  },
  billboards: {
    title: 'Billboards in Bangladesh',
    description:
      'Every AD PRO billboard site in Bangladesh — 58 digital LED screens across Dhaka, Chattogram, Sylhet and seven more cities, each with its own page, photograph and specification.',
    path: 'billboards.html',
    namespace: 'billboards',
    breadcrumbs: [],
    priority: 0.9,
  },
  'static-billboards': {
    title: 'Static Billboards',
    description:
      'Unipole, gantry and building-wrap billboards across Bangladesh, surveyed, fabricated and mounted in-house. Availability and rates on request — call for price.',
    path: 'static-billboards.html',
    namespace: 'static-billboards',
    breadcrumbs: [{ name: 'Billboards', path: 'billboards.html' }],
    service: 'static-billboards',
    priority: 0.85,
  },
  'digital-billboards': {
    title: 'Digital Billboards',
    description:
      '58 full-motion LED billboard sites across ten cities in Bangladesh, sold by the minute per day with same-day creative changes and a played-spot log. Call for price.',
    path: 'digital-billboards.html',
    namespace: 'digital-billboards',
    breadcrumbs: [{ name: 'Billboards', path: 'billboards.html' }],
    service: 'digital-billboards',
    priority: 0.85,
  },
  services: {
    title: 'Outdoor Advertising Services',
    description:
      'Digital and static billboards, portable LED, transit and airport branding, activation and in-house printing — one agency, start to finish.',
    path: 'services.html',
    namespace: 'services',
    priority: 0.8,
  },
  clients: {
    title: '400+ Brands We Have Advertised',
    description:
      'Telecom, banking, FMCG, automotive and airline brands that have advertised on the AD PRO network across Bangladesh.',
    path: 'clients.html',
    namespace: 'clients',
    priority: 0.7,
  },
  about: {
    title: 'About AD PRO Communications Limited',
    description:
      'AD PRO Communications Limited is an outdoor advertising agency headquartered in Dhaka, operating its own digital and static billboard network.',
    path: 'about.html',
    namespace: 'about',
    priority: 0.7,
  },
  contact: {
    title: 'Book a Billboard',
    description:
      'Tell us the city and the dates. AD PRO replies within one working day with availability and an all-in cost.',
    path: 'contact.html',
    namespace: 'contact',
    faq: true,
    priority: 0.8,
  },
};

/*
  One route per site and per city, on top of the eight hand-written pages.

  These are what make the inventory searchable: a query for a specific
  junction lands on that junction's own page rather than on a grid of 58
  cards, and each page carries the address, the specification and its own
  questions. The entry files are written by scripts/generate-listing-pages.mjs
  before the build; the metadata below is derived from the same JSON, so a
  route can neither exist without metadata nor be described by metadata that
  points nowhere.
*/
for (const board of billboards) {
  meta[`led-${board.slug}`] = {
    title: `${board.title} LED Billboard, ${board.city}`,
    description: boardSummary(board),
    path: boardPath(board),
    namespace: 'listing',
    breadcrumbs: [
      { name: 'Billboards', path: 'billboards.html' },
      { name: board.city, path: cityPath(board.citySlug) },
    ],
    board: board.slug,
    priority: 0.7,
  };
}

for (const group of cityGroups) {
  const sizes = group.boards.map((b) => sizeWords(b));
  meta[`billboards-${group.slug}`] = {
    title: `LED Billboards in ${group.city}`,
    description: `${group.boards.length} digital LED billboard site${
      group.boards.length === 1 ? '' : 's'
    } in ${group.city}, from ${sizes[sizes.length - 1]} to ${sizes[0]}, with sizes, facings and on-air hours for each. Call ${company.phone} for availability and price.`,
    path: cityPath(group.slug),
    namespace: 'city',
    breadcrumbs: [{ name: 'Billboards', path: 'billboards.html' }],
    citySlug: group.slug,
    priority: 0.8,
  };
}

/**
 * Substitutes the shared shell into every page.
 *
 * The alternative is eight copies of the same header, menu, curtain and
 * footer, which drift the moment one of them is edited. Placeholders mirror
 * the `<!--@HEAD-->` convention already used elsewhere in this repository.
 */
const shellPlugin = (): Plugin => ({
  name: 'adpro-shell',
  transformIndexHtml: {
    order: 'pre',
    handler(html, ctx) {
      const name = (ctx.path.split('/').pop() ?? 'index.html').replace(/\.html$/, '');
      const page = meta[name] ?? meta.index;

      // Listing and city bodies are rendered from the slug in the filename,
      // so 68 routes share one template each rather than 68 templates.
      if (page.board) html = html.replace('<!--@LISTING-->', buildListing(page.board));
      if (page.citySlug) html = html.replace('<!--@CITY-->', buildCity(page.citySlug));

      return html
        .replace('<!--@HEAD-->', buildHead(page))
        .replace('<!--@SHELL-->', buildShell())
        .replace('<!--@FOOTER-->', buildFooter())
        .replace('<!--@STATS-->', buildStats())
        .replace('<!--@PROCESS-->', buildProcess())
        .replace('<!--@SERVICES-->', buildServices())
        .replace('<!--@COMPARISON-->', buildComparison())
        .replace('<!--@FAQ-->', buildFaq())
        .replace('<!--@CLIENT_TEASER-->', buildClientWall(16))
        .replace('<!--@CLIENT_WALL-->', buildClientWall())
        .replace('<!--@CITY_INDEX-->', buildCityIndex())
        // A marquee appears inside generated listing bodies too, so this has
        // to run after the body is in place — hence `replaceAll`.
        .replaceAll('<!--@MARQUEE-->', buildMarquee())
        .replace('<!--@BOARDS_ALL-->', buildBoards());
    },
  },
  // robots.txt and sitemap.xml are generated from the same page metadata
  // that renders the pages, so a page added to `pages` above cannot be
  // forgotten from crawl discovery.
  generateBundle() {
    this.emitFile({ type: 'asset', fileName: 'robots.txt', source: buildRobots() });
    this.emitFile({
      type: 'asset',
      fileName: 'sitemap.xml',
      source: buildSitemap(Object.values(meta)),
    });
  },
});

const input = Object.fromEntries(
  Object.keys(meta).map((name) => [name, resolve(__dirname, `pages/${name}.html`)]),
);

// Root-relative by default, which is what any plain static host wants. A
// GitHub Pages *project* site serves from `/<repo>/`, so BASE_PATH overrides
// it. Vite requires the trailing slash; normalise rather than trusting input.
const rawBase = process.env.BASE_PATH || '/';
const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

export default defineConfig({
  base,
  plugins: [shellPlugin()],
  build: {
    target: 'es2020',
    rollupOptions: {
      input,
      output: {
        // GSAP and Barba change on their own cadence; splitting them from the
        // app code means a copy tweak never invalidates the motion chunk.
        manualChunks: (id) => {
          if (id.includes('node_modules/gsap') || id.includes('node_modules/@barba')) {
            return 'motion';
          }
          return undefined;
        },
      },
    },
  },
});
