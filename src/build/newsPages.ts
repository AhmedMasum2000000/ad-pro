/**
 * The news layer: a dated index and one page per article.
 *
 * Shares the FAQ's block renderer and styles, because the two layers are the
 * same object with different intent — an answer is short-form and reached
 * from a query, an article is long-form and reached from a topic. What
 * differs is the furniture: a dateline, a reading time, an author, and
 * Article structured data rather than QAPage.
 *
 * Each article hands off in three directions — to sibling articles, to the
 * questions that go deeper on a point it raised, and into the inventory it
 * describes. That last one is what stops the news section becoming a wing of
 * the site nobody ever leaves for the thing being sold.
 */

import { cityGroups, company } from '../data/site';
import { articleBySlug, articles, articlesByDate, type Article } from '../data/articles';
import { faqBySlug } from '../data/faq';
import { articleHead, buildCta, esc, faqPath, renderBlock } from './faqPages';
import { cityPath } from './seo';

export const newsPath = (slug: string): string => `news-${slug}.html`;
export const NEWS_HUB = 'news.html';

/** 14 January 2026 — long enough to read as an editorial date. */
export function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function dateline(article: Article): string {
  return `
          <p class="dateline">
            <time datetime="${esc(article.published)}">${esc(formatDate(article.published))}</time>
            <span aria-hidden="true">·</span>
            <span>${article.readingMinutes} min read</span>
            <span aria-hidden="true">·</span>
            <span>${esc(article.topic)}</span>
          </p>`;
}

/* --- rails ----------------------------------------------------------------- */

function answersRail(article: Article): string {
  const items = article.answers
    .map((slug) => faqBySlug(slug))
    .filter((a): a is NonNullable<ReturnType<typeof faqBySlug>> => Boolean(a))
    .map(
      (a) => `
          <li class="related-q__item ruled__row" data-reveal-item>
            <a class="related-q__link" href="${esc(faqPath(a.slug))}">
              <span class="related-q__question">${esc(a.question)}</span>
              <span class="related-q__cat eyebrow">${esc(a.category)}</span>
            </a>
          </li>`,
    )
    .join('');

  if (!items) return '';

  return `
        <section class="gl-section gl-padding_lr">
          <header class="section-head" data-reveal>
            <span class="eyebrow">Go deeper</span>
            <h2 data-split="words">Questions this raises</h2>
          </header>
          <ul class="related-q ruled" data-reveal>${items}</ul>
          <div class="btn-wrapper">
            <a class="btn addHover" href="faq.html"><span class="btn__label">All 20 questions</span></a>
          </div>
        </section>`;
}

function moreArticles(article: Article): string {
  const items = article.related
    .map((slug) => articleBySlug(slug))
    .filter((a): a is Article => Boolean(a))
    .map(
      (a) => `
          <li class="news-card" data-reveal-item>
            <a class="news-card__link" href="${esc(newsPath(a.slug))}">
              <span class="news-card__topic">${esc(a.topic)}</span>
              <span class="news-card__title">${esc(a.shortTitle)}</span>
              <span class="news-card__stand">${esc(a.standfirst)}</span>
              <span class="news-card__meta">
                <time datetime="${esc(a.published)}">${esc(formatDate(a.published))}</time>
                · ${a.readingMinutes} min
              </span>
            </a>
          </li>`,
    )
    .join('');

  if (!items) return '';

  return `
        <section class="gl-section gl-padding_lr">
          <header class="section-head" data-reveal>
            <span class="eyebrow">More from the newsroom</span>
            <h2 data-split="words">Keep reading</h2>
          </header>
          <ul class="news-grid" data-reveal>${items}</ul>
        </section>`;
}

function inventoryRail(article: Article): string {
  const slugs = article.cities?.length
    ? article.cities
    : cityGroups.slice(0, 4).map((g) => g.slug);

  const groups = slugs
    .map((slug) => cityGroups.find((g) => g.slug === slug))
    .filter((g): g is (typeof cityGroups)[number] => Boolean(g));

  if (groups.length === 0) return '';

  const links = groups
    .map(
      (g) =>
        `<li><a class="text-link" href="${esc(cityPath(g.slug))}">${esc(g.city)} — ${g.boards.length} site${g.boards.length === 1 ? '' : 's'}</a></li>`,
    )
    .join('');

  return `
        <section class="gl-section gl-padding_lr" data-reveal>
          <div class="css-grid-wrapper">
            <div class="grid-item grid-40 xsm-grid-100">
              <span class="eyebrow">Inventory</span>
              <h2 class="accent-title">The sites behind this</h2>
              <p class="text-muted">
                Every screen has a page with a photograph, the size, the direction it faces and
                the hours it runs.
              </p>
            </div>
            <div class="grid-item grid-60 xsm-grid-100">
              <ul class="city-links">${links}</ul>
              <div class="btn-wrapper">
                <a class="btn addHover" href="billboards.html"><span class="btn__label">Browse all 58 sites</span></a>
              </div>
            </div>
          </div>
        </section>`;
}

/* --- the article page ------------------------------------------------------- */

export function buildArticle(slug: string): string {
  const article = articleBySlug(slug);
  if (!article) throw new Error(`No article with slug "${slug}"`);

  return `
        ${articleHead({
          readout: `NEWS · ${formatDate(article.published).toUpperCase()}`,
          crumbs: [{ label: 'News', href: NEWS_HUB }, { label: article.shortTitle }],
          eyebrow: article.topic,
          title: esc(article.title),
          lede: esc(article.standfirst),
          after: dateline(article),
        })}

        <section class="gl-section gl-padding_lr">
          <article class="article" data-reveal>
            ${article.body.map(renderBlock).join('\n')}
          </article>
        </section>

        ${inventoryRail(article)}
        ${answersRail(article)}
        ${moreArticles(article)}

        ${buildCta(
          'Reading is the easy part. Tell us the city and the dates.',
          `A written plan — sites, sizes, minutes and an all-in cost — inside one working day. Call ${esc(company.phone)}.`,
          article.shortTitle,
        )}`;
}

/* --- the hub ---------------------------------------------------------------- */

export function buildNewsHub(): string {
  const [lead, ...rest] = articlesByDate;

  const leadCard = `
          <article class="news-lead" data-reveal>
            <a class="news-lead__link" href="${esc(newsPath(lead.slug))}">
              <span class="news-lead__topic">${esc(lead.topic)}</span>
              <h2 class="news-lead__title">${esc(lead.title)}</h2>
              <p class="news-lead__stand">${esc(lead.standfirst)}</p>
              <p class="news-lead__meta">
                <time datetime="${esc(lead.published)}">${esc(formatDate(lead.published))}</time>
                · ${lead.readingMinutes} min read
              </p>
              <span class="text-link" aria-hidden="true">Read the piece</span>
            </a>
          </article>`;

  const cards = rest
    .map(
      (a) => `
          <li class="news-card" data-reveal-item>
            <a class="news-card__link" href="${esc(newsPath(a.slug))}">
              <span class="news-card__topic">${esc(a.topic)}</span>
              <span class="news-card__title">${esc(a.shortTitle)}</span>
              <span class="news-card__stand">${esc(a.standfirst)}</span>
              <span class="news-card__meta">
                <time datetime="${esc(a.published)}">${esc(formatDate(a.published))}</time>
                · ${a.readingMinutes} min
              </span>
            </a>
          </li>`,
    )
    .join('');

  return `
        ${articleHead({
          readout: `NEWS · ${String(articles.length).padStart(2, '0')} PIECES`,
          eyebrow: 'News and analysis',
          title: 'The newsroom',
          lede: 'Seasonal planning, sector playbooks and what is actually changing in Bangladeshi out-of-home — written by the people who own and run the screens.',
        })}

        <section class="gl-section gl-padding_lr">
          ${leadCard}
          <ul class="news-grid" data-reveal>${cards}</ul>
        </section>`;
}

export const articleSlugs = articles.map((a) => a.slug);
