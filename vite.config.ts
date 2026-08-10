import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import { billboards, cityGroups, company } from './src/data/site';
import { boardMetaDescription, sizeWords } from './src/build/boardCopy';
import { faqArticles } from './src/data/faq';
import { buildCta, buildFaqArticle, buildFaqHub, faqPath } from './src/build/faqPages';
import { articles } from './src/data/articles';
import { buildArticle, buildNewsHub, newsPath } from './src/build/newsPages';
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
    title: `Billboard Advertising in Bangladesh — ${company.shortName}`,
    description:
      'Billboard advertising in Bangladesh from the operator: 58 digital LED sites in ten cities, each with photographs, sizes and on-air hours. Call for price.',
    path: '',
    namespace: 'home',
    priority: 1,
  },
  billboards: {
    title: 'Billboards in Bangladesh — All 58 LED Sites',
    description:
      'Every billboard site we operate in Bangladesh: 58 LED screens across Dhaka, Sylhet, Chattogram and seven more cities, with sizes, facings and photographs.',
    path: 'billboards.html',
    namespace: 'billboards',
    breadcrumbs: [],
    priority: 0.9,
  },
  'static-billboards': {
    title: 'Static Billboards in Bangladesh — Unipoles and Gantries',
    description:
      'Unipole, gantry and building-wrap billboards across Bangladesh, surveyed, fabricated and mounted in-house. Availability and rates on request — call for price.',
    path: 'static-billboards.html',
    namespace: 'static-billboards',
    breadcrumbs: [{ name: 'Billboards', path: 'billboards.html' }],
    service: 'static-billboards',
    priority: 0.85,
  },
  'digital-billboards': {
    title: 'Digital LED Billboards in Bangladesh — 58 Sites',
    description:
      'Digital LED billboards across Bangladesh: 58 sites, sold by the minute per day, same-day creative changes and a played-spot log at close. Call for price.',
    path: 'digital-billboards.html',
    namespace: 'digital-billboards',
    breadcrumbs: [{ name: 'Billboards', path: 'billboards.html' }],
    service: 'digital-billboards',
    priority: 0.85,
  },
  services: {
    title: 'Outdoor Advertising Services in Bangladesh',
    description:
      'Outdoor advertising services in Bangladesh: LED and static billboards, transit and airport branding, activation, printing and fabrication under one roof.',
    path: 'services.html',
    namespace: 'services',
    priority: 0.8,
  },
  clients: {
    title: 'Our Clients — 400+ Brands Advertised in Bangladesh',
    description:
      'The brands that have run out-of-home with us in Bangladesh — telecom, banking, FMCG, automotive, airlines and more, across 2,000+ delivered campaigns.',
    path: 'clients.html',
    namespace: 'clients',
    priority: 0.7,
  },
  about: {
    title: 'About AD PRO — Outdoor Advertising Agency in Dhaka',
    description:
      'AD PRO Communications Limited is an outdoor advertising agency in Dhaka that owns and runs its own LED billboard network, print shop and mounting crews.',
    path: 'about.html',
    namespace: 'about',
    priority: 0.7,
  },
  contact: {
    title: 'Book a Billboard in Bangladesh — Call for Price',
    description:
      'Book a billboard in Bangladesh: send the city and the dates and get a written plan with sites, sizes and an all-in cost inside one working day.',
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
    description: boardMetaDescription(board),
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

// Served by the host's ErrorDocument, so it needs the full shell and its own
// route rather than being a bare HTML file. Marked noindex in the template.
meta['404'] = {
  title: 'Page Not Found',
  description:
    'That page is not on the network. Browse all 58 LED billboard sites across ten Bangladeshi cities, or call for availability.',
  path: '404.html',
  namespace: 'notfound',
  priority: 0.1,
};

meta.faq = {
  title: 'Billboard Advertising in Bangladesh — Questions Answered',
  description: `What billboard advertising costs in Bangladesh, how LED sites are priced, which format does which job and how to book one. ${faqArticles.length} questions answered by the operator.`,
  path: 'faq.html',
  namespace: 'answers',
  faqHub: true,
  priority: 0.9,
};

for (const article of faqArticles) {
  meta[`faq-${article.slug}`] = {
    title: article.question,
    description: article.metaDescription,
    path: faqPath(article.slug),
    namespace: 'answer',
    breadcrumbs: [{ name: 'Answers', path: 'faq.html' }],
    question: article.slug,
    priority: 0.75,
  };
}

meta.news = {
  title: 'Outdoor Advertising News and Analysis — Bangladesh',
  description:
    'Seasonal planning, sector playbooks and what is changing in Bangladeshi out-of-home advertising, written by the operator of a 58-site LED network.',
  path: 'news.html',
  namespace: 'news',
  priority: 0.85,
};

for (const article of articles) {
  meta[`news-${article.slug}`] = {
    title: article.title,
    description: article.metaDescription,
    path: newsPath(article.slug),
    namespace: 'article',
    breadcrumbs: [{ name: 'News', path: 'news.html' }],
    article: article.slug,
    priority: 0.7,
  };
}

for (const group of cityGroups) {
  const sizes = group.boards.map((b) => sizeWords(b));
  meta[`billboards-${group.slug}`] = {
    title: `LED Billboards in ${group.city}`,
    description: `${group.boards.length} digital LED billboard site${
      group.boards.length === 1 ? '' : 's'
    } in ${group.city}, from ${sizes[sizes.length - 1]} to ${sizes[0]}. Photographs, sizes and on-air hours for each — call for price.`,
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
      if (page.question) html = html.replace('<!--@ANSWER-->', buildFaqArticle(page.question));
      if (page.faqHub) html = html.replace('<!--@ANSWERS-->', buildFaqHub());
      if (page.article) html = html.replace('<!--@ARTICLE-->', buildArticle(page.article));
      if (page.namespace === 'news') html = html.replace('<!--@NEWS-->', buildNewsHub());

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
        .replace('<!--@BOARDS_ALL-->', buildBoards())
        // The phone number appears in hand-written templates too. Tokens
        // rather than literals, so it lives in exactly one place.
        .replaceAll('@PHONE_HREF@', company.phoneHref)
        .replaceAll('@PHONE@', company.phone)
        .replaceAll(
          '<!--@CTA-->',
          buildCta(
            'Tell us the city and the dates. We will tell you what is free and what it costs.',
            'Most enquiries get a written plan — sites, sizes, minutes and an all-in cost — inside one working day.',
          ),
        );
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
