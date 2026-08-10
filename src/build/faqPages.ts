/**
 * The FAQ layer: a hub and one page per question.
 *
 * Each answer page is built to do three jobs at once, which is unusual but
 * not contradictory:
 *
 * - **Search.** The question is the H1 and the title, the fifty-word answer
 *   sits immediately under it in the shape a featured snippet wants, and the
 *   page carries QAPage structured data with that answer as the accepted one.
 * - **Reading.** Tables, real site photographs and short sections, because
 *   somebody who genuinely wants to understand pixel pitch deserves better
 *   than three sentences and a phone number.
 * - **Conversion.** A call to action at the point of decision rather than
 *   only at the bottom, and links straight into the inventory the answer is
 *   about — so curiosity has somewhere to go.
 *
 * The interlinking is deliberate and dense: every answer links to four
 * sibling questions, up to the hub, and out to the city pages or listings it
 * mentions. No page in the set is a dead end, which is the same rule the
 * billboard listings follow.
 */

import { boardBySlug, cityGroups, company, type Billboard } from '../data/site';
import {
  faqArticles,
  faqBySlug,
  faqGroups,
  type FaqArticle,
  type FaqBlock,
} from '../data/faq';
import { boardPath, cityPath } from './seo';

export const esc = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Copy in the FAQ data carries deliberate inline markup — `<strong>` for the
 * lead of a list item, `<em>` for emphasis. Escaping it wholesale would print
 * the tags, so the small set that is allowed is escaped and then restored.
 * Anything else an author writes still comes out as literal text.
 */
export const rich = (value: string): string =>
  esc(value)
    .replace(/&lt;(\/?)(strong|em)&gt;/g, '<$1$2>')
    .replace(/&lt;br \/&gt;/g, '<br />');

export const faqPath = (slug: string): string => `faq-${slug}.html`;
export const FAQ_HUB = 'faq.html';

/* --- the conversion block --------------------------------------------------
   One component, used at the foot of every answer and on the core pages. The
   phone is the primary action because it is the one that actually converts
   here: availability is a conversation, and a form makes the visitor wait for
   a reply they could have had in ninety seconds.                           */

export function buildCta(line: string, context?: string): string {
  // The block carries its own gutter. It is dropped into hand-written
  // templates through a bare `<!--@CTA-->`, which has no section around it,
  // and a component that only lines up when its caller remembers to wrap it
  // is a component that will eventually not line up.
  return `
        <aside class="cta-block gl-padding_lr" data-reveal>
          <div class="cta-block__inner">
            <p class="cta-block__line">${rich(line)}</p>
            ${context ? `<p class="cta-block__context">${rich(context)}</p>` : ''}
            <div class="btn-wrapper">
              <a class="btn btn--primary addHover" href="tel:${esc(company.phoneHref)}">Call ${esc(company.phone)}</a>
              <a class="btn addHover" href="contact.html">Send a brief</a>
            </div>
            <ul class="cta-block__trust">
              <li>Written plan within one working day</li>
              <li>All-in cost — production and mounting included</li>
              <li>Proof of play or dated site photographs at close</li>
            </ul>
          </div>
        </aside>`;
}

/* --- blocks ---------------------------------------------------------------- */

function photoBlock(slug: string, caption: string): string {
  const board: Billboard | undefined = boardBySlug(slug);
  if (!board) throw new Error(`FAQ references unknown billboard "${slug}"`);

  const focus = `${(board.focus[0] * 100).toFixed(1)}% ${(board.focus[1] * 100).toFixed(1)}%`;

  // The photograph links to the site it shows. An illustration in an article
  // that turns out to be bookable is a better call to action than a button.
  return `
          <figure class="article-figure" data-ascii>
            <a class="article-figure__link" href="${esc(boardPath(board))}">
              <img class="article-figure__img" src="/${esc(board.image)}"
                   alt="${esc(board.title)} LED billboard in ${esc(board.city)}, facing ${esc(board.facing)}"
                   style="object-position:${focus}"
                   loading="lazy" decoding="async" width="1400" height="933" />
            </a>
            <figcaption class="article-figure__caption">
              ${rich(caption)}
              <a class="text-link" href="${esc(boardPath(board))}">See this site</a>
            </figcaption>
          </figure>`;
}

export function renderBlock(b: FaqBlock): string {
  switch (b.kind) {
    case 'h2':
      return `<h2 class="article-h2">${rich(b.text)}</h2>`;
    case 'p':
      return `<p>${rich(b.text)}</p>`;
    case 'ul':
      return `<ul class="article-list">${b.items.map((i) => `<li>${rich(i)}</li>`).join('')}</ul>`;
    case 'ol':
      return `<ol class="article-list article-list--numbered">${b.items
        .map((i) => `<li>${rich(i)}</li>`)
        .join('')}</ol>`;
    case 'note':
      return `<aside class="article-note"><p>${rich(b.text)}</p></aside>`;
    case 'photo':
      return photoBlock(b.board, b.caption);
    case 'cta':
      return buildCta(b.text);
    case 'table':
      return `
          <div class="table-scroll">
            <table class="compare-table">
              <caption class="visually-hidden">${esc(b.caption)}</caption>
              <thead><tr>${b.head.map((h) => `<th scope="col">${rich(h)}</th>`).join('')}</tr></thead>
              <tbody>${b.rows
                .map(
                  (row) =>
                    `<tr>${row
                      .map((cell, i) =>
                        i === 0
                          ? `<th scope="row">${rich(cell)}</th>`
                          : `<td>${rich(cell)}</td>`,
                      )
                      .join('')}</tr>`,
                )
                .join('')}</tbody>
            </table>
            <p class="table-caption">${esc(b.caption)}</p>
          </div>`;
  }
}

/* --- rails ----------------------------------------------------------------- */

function relatedRail(article: FaqArticle): string {
  const items = article.related
    .map((slug) => faqBySlug(slug))
    .filter((a): a is FaqArticle => Boolean(a))
    .map(
      (a) => `
          <li class="related-q__item" data-reveal-item>
            <a class="related-q__link" href="${esc(faqPath(a.slug))}">
              <span class="related-q__question">${esc(a.question)}</span>
              <span class="related-q__cat">${esc(a.category)}</span>
            </a>
          </li>`,
    )
    .join('');

  return `
        <section class="gl-section gl-padding_lr">
          <div class="intro-text" data-reveal>
            <span class="sub-text">Keep reading</span>
            <h2 class="mtitle">People who asked this also asked</h2>
          </div>
          <ul class="related-q" data-reveal>${items}</ul>
          <div class="btn-wrapper">
            <a class="btn addHover" href="${FAQ_HUB}">All questions</a>
          </div>
        </section>`;
}

/** Links into the actual inventory the answer talks about. */
function inventoryRail(article: FaqArticle): string {
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
              <h2 class="accent-title">See the actual sites</h2>
              <p class="text-muted">
                Every screen has its own page with a photograph, the size, the direction it faces
                and the hours it runs.
              </p>
            </div>
            <div class="grid-item grid-60 xsm-grid-100">
              <ul class="city-links">${links}</ul>
              <div class="btn-wrapper">
                <a class="btn addHover" href="billboards.html">Browse all 58 sites</a>
              </div>
            </div>
          </div>
        </section>`;
}

/* --- the answer page -------------------------------------------------------- */

export function buildFaqArticle(slug: string): string {
  const article = faqBySlug(slug);
  if (!article) throw new Error(`No FAQ article with slug "${slug}"`);

  const keywords = article.keywords
    .map((k) => `<li class="keyword-rail__item">${esc(k)}</li>`)
    .join('');

  return `
        <nav class="breadcrumb gl-padding_lr" aria-label="Breadcrumb" data-reveal>
          <a class="text-link" href="${FAQ_HUB}">Answers</a>
          <span aria-hidden="true">/</span>
          <span>${esc(article.shortTitle)}</span>
        </nav>

        <section class="intro-text-wrapper gl-padding_lr">
          <header class="intro-text" data-reveal>
            <span class="sub-text">${esc(article.category)}</span>
            <h1 class="listing-title" data-scramble>${esc(article.question)}</h1>
            <p class="answer-lede">${rich(article.shortAnswer)}</p>
            <div class="btn-wrapper">
              <a class="btn btn--primary addHover" href="tel:${esc(company.phoneHref)}">Call for price</a>
              <a class="btn addHover" href="billboards.html">See the sites</a>
            </div>
          </header>
        </section>

        <section class="gl-section gl-padding_lr">
          <article class="article" data-reveal>
            ${article.body.map(renderBlock).join('\n')}
          </article>
        </section>

        <!--@MARQUEE-->

        ${inventoryRail(article)}
        ${relatedRail(article)}

        <section class="gl-section gl-padding_lr" data-reveal>
          <ul class="keyword-rail" aria-label="Topics covered on this page">${keywords}</ul>
        </section>`;
}

/* --- the hub ---------------------------------------------------------------- */

export function buildFaqHub(): string {
  const groups = faqGroups
    .map(
      (group) => `
          <section class="answer-group" data-reveal>
            <h2 class="answer-group__title">${esc(group.category)}</h2>
            <ul class="answer-list">
              ${group.articles
                .map(
                  (a) => `
                <li class="answer-list__item">
                  <a class="answer-list__link" href="${esc(faqPath(a.slug))}">
                    <span class="answer-list__q">${esc(a.question)}</span>
                    <span class="answer-list__a">${esc(a.shortAnswer)}</span>
                    <span class="text-link" aria-hidden="true">Read the answer</span>
                  </a>
                </li>`,
                )
                .join('')}
            </ul>
          </section>`,
    )
    .join('');

  return `
        <section class="intro-text-wrapper gl-padding_lr">
          <header class="intro-text" data-reveal>
            <span class="sub-text">${faqArticles.length} questions answered</span>
            <h1 data-scramble>Billboard advertising in Bangladesh, explained</h1>
            <p class="h1-em">
              What it costs, how it is priced, which format does which job, where the good sites
              are and how to tell whether any of it worked. Written by the people who own and run
              the screens, which is why there is more detail here than a brochure would carry.
            </p>
            <div class="btn-wrapper">
              <a class="btn btn--primary addHover" href="tel:${esc(company.phoneHref)}">Call for price</a>
              <a class="btn addHover" href="billboards.html">See the 58 sites</a>
            </div>
          </header>
        </section>

        <!--@MARQUEE-->

        <section class="gl-section gl-padding_lr">
          <div class="answer-groups">${groups}</div>
        </section>`;
}

/** Every question, for the sitemap and the footer index. */
export const faqSlugs = faqArticles.map((a) => a.slug);
