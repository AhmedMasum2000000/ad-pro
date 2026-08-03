/**
 * SEO surface, generated from src/data/site.ts.
 *
 * Head tags, JSON-LD, robots.txt and the sitemap all come from the same data
 * the visible page renders from, so what a crawler is told and what a visitor
 * sees cannot drift apart.
 */

import { billboards, company, faqs, services } from '../data/site';

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
    priceRange: 'BDT 25,000 – BDT 300,000 per month',
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
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${service.title} locations`,
      itemListElement: billboards
        .filter((b) => slug.startsWith(b.kind))
        .map((b) => ({
          '@type': 'Offer',
          name: `${b.location}, ${b.city} — ${b.size}`,
          areaServed: b.city,
        })),
    },
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

function faqNode(): Record<string, unknown> {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
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
