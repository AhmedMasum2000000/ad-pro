/**
 * SEO surface, generated from src/data/site.ts.
 *
 * Head tags, JSON-LD, robots.txt and the sitemap all come from the same data
 * the visible page renders from, so what a crawler is told and what a visitor
 * sees cannot drift apart.
 */

import {
  billboards,
  boardBySlug,
  cityGroups,
  company,
  faqs,
  services,
  type Billboard,
} from '../data/site';
import { boardFaqs, boardSummary } from './boardCopy';
import { faqArticles, faqBySlug } from '../data/faq';
import { articleBySlug } from '../data/articles';

export interface PageMeta {
  title: string;
  description: string;
  /** Path relative to the site root, e.g. "billboards.html". "" is the home page. */
  path: string;
  namespace: string;
  /** Breadcrumb trail above this page, nearest ancestor last. */
  breadcrumbs?: { name: string; path: string }[];
  /** Emit the FAQPage block on this page. */
  faq?: boolean;
  /** Emit a Service block for the named service slug. */
  service?: string;
  /** Priority hint for the sitemap. */
  priority?: number;
  /** Slug of the single billboard this page is about. */
  board?: string;
  /** Slug of the city whose inventory this page lists. */
  citySlug?: string;
  /** Slug of the single question this page answers. */
  question?: string;
  /** Emit the index of every question — the answers hub. */
  faqHub?: boolean;
  /** Slug of the news article this page carries. */
  article?: string;
}

const root = company.siteUrl.replace(/\/$/, '');
const abs = (path: string): string => (path ? `${root}/${path.replace(/^\//, '')}` : `${root}/`);

const ORG_ID = `${root}/#organization`;

/** Shared identity node. Everything else points at it rather than repeating it. */
function organisation(): Record<string, unknown> {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: company.name,
    alternateName: company.shortName,
    url: `${root}/`,
    email: company.email,
    telephone: company.phone,
    foundingDate: String(company.founded),
    description: `${company.name} is an ${company.descriptor.toLowerCase()} operating digital and static billboard networks across Dhaka, Chattogram and Sylhet.`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: company.corporateAddress,
      addressLocality: company.city,
      addressCountry: 'BD',
    },
    areaServed: { '@type': 'Country', name: company.country },
  };
}

function localBusiness(): Record<string, unknown> {
  return {
    '@type': 'LocalBusiness',
    '@id': `${root}/#localbusiness`,
    name: company.name,
    parentOrganization: { '@id': ORG_ID },
    url: `${root}/`,
    telephone: company.phone,
    email: company.email,
    // There is deliberately no priceRange. Screen time is quoted per site and
    // the rates move; a band invented for structured data would be a claim
    // nobody could stand behind.
    address: {
      '@type': 'PostalAddress',
      streetAddress: company.corporateAddress,
      addressLocality: company.city,
      addressCountry: 'BD',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      opens: '09:00',
      closes: '18:00',
    },
  };
}

function serviceNode(slug: string): Record<string, unknown> | null {
  const service = services.find((s) => s.slug === slug);
  if (!service) return null;

  return {
    '@type': 'Service',
    name: service.title,
    serviceType: service.title,
    description: service.body,
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'Country', name: company.country },
    // The inventory doubles as the offer catalogue for billboard services.
    // Every site in it is an LED screen, so only the digital service carries
    // the catalogue; the static page describes a format we build to order.
    hasOfferCatalog:
      slug === 'digital-billboards'
        ? {
            '@type': 'OfferCatalog',
            name: `${service.title} locations`,
            itemListElement: billboards.map((b) => ({
              '@type': 'Offer',
              name: `${b.name}, ${b.city} — ${b.dimension}`,
              areaServed: b.city,
              url: abs(boardPath(b)),
              availability: 'https://schema.org/InStock',
            })),
          }
        : undefined,
  };
}

/* --- listings ---------------------------------------------------------------
   A single screen is modelled as a Place with an Offer attached rather than a
   Product: what is sold is time on a fixed structure at a fixed address, and
   `Place` is what carries the geography a local search actually runs on.

   The Offer states availability and nothing else. Schema.org would take a
   `price`, but an invented one is worse than none, so it is left out and the
   description says where a real number comes from.                         */

export const boardPath = (board: Billboard): string => `led-${board.slug}.html`;
export const cityPath = (slug: string): string => `billboards-${slug}.html`;

function boardNode(board: Billboard): Record<string, unknown> {
  return {
    '@type': 'Place',
    '@id': `${abs(boardPath(board))}#site`,
    name: `${board.title} LED billboard`,
    description: boardSummary(board),
    address: {
      '@type': 'PostalAddress',
      addressLocality: board.city,
      addressCountry: 'BD',
    },
    photo: abs(board.image),
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Screen size', value: board.dimension },
      { '@type': 'PropertyValue', name: 'Facing', value: board.facing },
      { '@type': 'PropertyValue', name: 'Resolution', value: board.resolution },
      board.ledModel
        ? { '@type': 'PropertyValue', name: 'LED pitch', value: board.ledModel }
        : null,
      board.hours
        ? { '@type': 'PropertyValue', name: 'Daily on-air hours', value: board.hours }
        : null,
    ].filter(Boolean),
    makesOffer: {
      '@type': 'Offer',
      name: `Screen time on ${board.title}`,
      availability: 'https://schema.org/InStock',
      areaServed: board.city,
      seller: { '@id': ORG_ID },
      url: abs(boardPath(board)),
      // No price and no priceSpecification. Screen time is quoted per site,
      // so any figure here would be invented, and a currency band with no
      // amount behind it tells a crawler nothing it can use.
      description: 'Screen time quoted on request — call for price.',
    },
  };
}

function cityNode(slug: string): Record<string, unknown> | null {
  const group = cityGroups.find((g) => g.slug === slug);
  if (!group) return null;

  return {
    '@type': 'ItemList',
    '@id': `${abs(cityPath(slug))}#inventory`,
    name: `LED billboard sites in ${group.city}`,
    numberOfItems: group.boards.length,
    itemListElement: group.boards.map((b, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: b.title,
      url: abs(boardPath(b)),
    })),
  };
}

/*
   A page that answers one question is a QAPage, not a FAQPage — FAQPage is
   for a list of them. Getting this right is the difference between being
   eligible for a rich result and being quietly ignored.                    */
function questionNode(slug: string): Record<string, unknown> | null {
  const article = faqBySlug(slug);
  if (!article) return null;

  return {
    '@type': 'QAPage',
    '@id': `${abs(`faq-${slug}.html`)}#qa`,
    mainEntity: {
      '@type': 'Question',
      name: article.question,
      text: article.question,
      answerCount: 1,
      acceptedAnswer: {
        '@type': 'Answer',
        text: article.shortAnswer,
        url: abs(`faq-${slug}.html`),
        author: { '@id': ORG_ID },
      },
    },
    about: article.keywords.map((k) => ({ '@type': 'Thing', name: k })),
    author: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
  };
}

/* An article is an Article: dated, bylined and about a subject rather than a
   question. `datePublished` is the field that makes it eligible to be treated
   as news rather than an undated page.                                     */
function articleNode(slug: string): Record<string, unknown> | null {
  const article = articleBySlug(slug);
  if (!article) return null;

  return {
    '@type': 'Article',
    '@id': `${abs(`news-${slug}.html`)}#article`,
    headline: article.title,
    description: article.standfirst,
    datePublished: article.published,
    dateModified: article.published,
    author: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    inLanguage: 'en',
    articleSection: article.topic,
    keywords: article.keywords.join(', '),
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${abs(`news-${slug}.html`)}#webpage` },
  };
}

function breadcrumbs(meta: PageMeta): Record<string, unknown> | null {
  if (!meta.breadcrumbs?.length) return null;

  const trail = [{ name: 'Home', path: '' }, ...meta.breadcrumbs, {
    name: meta.title,
    path: meta.path,
  }];

  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: abs(item.path),
    })),
  };
}

function faqNode(entries: { q: string; a: string }[] = faqs): Record<string, unknown> {
  return {
    '@type': 'FAQPage',
    mainEntity: entries.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

/** One `@graph` per page — nodes reference the shared organisation by id. */
export function buildJsonLd(meta: PageMeta): string {
  const graph: Record<string, unknown>[] = [organisation()];

  if (meta.path === '' || meta.namespace === 'contact') graph.push(localBusiness());

  const crumbs = breadcrumbs(meta);
  if (crumbs) graph.push(crumbs);

  if (meta.service) {
    const node = serviceNode(meta.service);
    if (node) graph.push(node);
  }

  const board = meta.board ? boardBySlug(meta.board) : undefined;
  if (board) {
    graph.push(boardNode(board));
    // Each listing answers its own questions from its own specs, so the FAQ
    // block is unique per page rather than the site-wide set repeated 58 times.
    graph.push(faqNode(boardFaqs(board)));
  }

  if (meta.citySlug) {
    const node = cityNode(meta.citySlug);
    if (node) graph.push(node);
  }

  if (meta.question) {
    const node = questionNode(meta.question);
    if (node) graph.push(node);
  }

  if (meta.article) {
    const node = articleNode(meta.article);
    if (node) graph.push(node);
  }

  // The hub is the one page where every short answer belongs in a single
  // FAQPage block, because that is exactly what it is.
  if (meta.faqHub) {
    graph.push(
      faqNode(faqArticles.map((a) => ({ q: a.question, a: a.shortAnswer }))),
    );
  }

  if (meta.faq) graph.push(faqNode());

  graph.push({
    '@type': 'WebPage',
    '@id': `${abs(meta.path)}#webpage`,
    url: abs(meta.path),
    name: meta.title,
    description: meta.description,
    isPartOf: { '@id': ORG_ID },
    inLanguage: 'en',
  });

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
}

/* --- crawl files ---------------------------------------------------------- */

export function buildSitemap(pages: PageMeta[]): string {
  const today = new Date().toISOString().slice(0, 10);

  const urls = pages
    .map(
      (p) => `  <url>
    <loc>${abs(p.path)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.path === '' ? 'weekly' : 'monthly'}</changefreq>
    <priority>${(p.priority ?? 0.6).toFixed(1)}</priority>
  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export function buildRobots(): string {
  return `User-agent: *
Allow: /

Sitemap: ${root}/sitemap.xml
`;
}
