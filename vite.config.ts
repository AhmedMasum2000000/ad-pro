import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { company } from './src/data/site';
import {
  buildBoards,
  buildClientWall,
  buildComparison,
  buildFaq,
  buildFooter,
  buildHead,
  buildMarquee,
  buildProcess,
  buildServices,
  buildShell,
  buildStats,
  type PageMeta,
} from './src/build/partials';
import { buildRobots, buildSitemap } from './src/build/seo';

/*
  A multi-page build rather than a client-side router.

  Barba fetches real documents and swaps the `[data-barba="container"]` node
  out of the response, so every route has to exist as its own HTML file. That
  is also what keeps the site readable with JavaScript disabled: without the
  transition layer, these are just eight ordinary pages.
*/
const pages = [
  'index',
  'billboards',
  'static-billboards',
  'digital-billboards',
  'services',
  'clients',
  'about',
  'contact',
] as const;

type PageName = (typeof pages)[number];

const meta: Record<PageName, PageMeta> = {
  index: {
    title: `${company.name} — ${company.descriptor}`,
    description:
      'Digital and static billboards across Dhaka, Chattogram and Sylhet. AD PRO owns and operates its own out-of-home network — 400+ brands, 150+ digital locations.',
    path: '',
    namespace: 'home',
    priority: 1,
  },
  billboards: {
    title: 'Billboards in Bangladesh',
    description:
      'Digital and static billboard sites across Dhaka, Chattogram and Sylhet, with sizes, hours and traffic notes for every location.',
    path: 'billboards.html',
    namespace: 'billboards',
    breadcrumbs: [],
    priority: 0.9,
  },
  'static-billboards': {
    title: 'Static Billboards',
    description:
      'Unipole, gantry and building-wrap billboards across Bangladesh, printed and mounted in-house, from BDT 25,000 a month.',
    path: 'static-billboards.html',
    namespace: 'static-billboards',
    breadcrumbs: [{ name: 'Billboards', path: 'billboards.html' }],
    service: 'static-billboards',
    priority: 0.85,
  },
  'digital-billboards': {
    title: 'Digital Billboards',
    description:
      'Full-motion LED billboards across Bangladesh, bookable by the day with same-day creative changes, from BDT 50,000 a month.',
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
      const name = (ctx.path.split('/').pop() ?? 'index.html').replace(
        /\.html$/,
        '',
      ) as PageName;
      const page = meta[name] ?? meta.index;

      return html
        .replace('<!--@HEAD-->', buildHead(page))
        .replace('<!--@SHELL-->', buildShell())
        .replace('<!--@FOOTER-->', buildFooter())
        .replace('<!--@MARQUEE-->', buildMarquee())
        .replace('<!--@STATS-->', buildStats())
        .replace('<!--@PROCESS-->', buildProcess())
        .replace('<!--@SERVICES-->', buildServices())
        .replace('<!--@COMPARISON-->', buildComparison())
        .replace('<!--@FAQ-->', buildFaq())
        .replace('<!--@CLIENT_TEASER-->', buildClientWall(16))
        .replace('<!--@CLIENT_WALL-->', buildClientWall())
        .replace('<!--@BOARDS_ALL-->', buildBoards())
        .replace('<!--@BOARDS_DIGITAL-->', buildBoards('digital'))
        .replace('<!--@BOARDS_STATIC-->', buildBoards('static'));
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
  pages.map((name) => [name, resolve(__dirname, `pages/${name}.html`)]),
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
