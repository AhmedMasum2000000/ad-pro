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

import { accentOf, boardBySlug, cityGroups, company, type Billboard } from '../data/site';
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

/*
  The two contact links that are not a phone call. Both are written here
  rather than imported from partials.ts, which imports this file — a circular
  import would resolve, but build-time code should not have to rely on that.
  The body is the same six lines the contact form produces (brief.ts), so a
  visitor who starts from a button and one who fills in the form send the
  sales desk the same shape of message.
*/
export const BRIEF_BODY = [
  'Cities or areas:',
  'Campaign window:',
  'Format (digital / static / open):',
  'Artwork exists:',
  'Budget range:',
  'Best number:',
].join('\n');

export const ctaMailto = (subjectHint?: string): string =>
  esc(
    `mailto:${company.email}?subject=${encodeURIComponent(
      subjectHint ? `Brief: ${subjectHint}` : 'Brief: [city], [dates]',
    )}&body=${encodeURIComponent(BRIEF_BODY)}`,
  );

export const ctaWhatsApp = (subjectHint?: string): string =>
  esc(
    `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(
      `Hello AD PRO — I'd like to book a billboard${subjectHint ? ` (${subjectHint})` : ''}.\n${BRIEF_BODY}`,
    )}`,
  );

/**
 * The conversion block.
 *
 * `subjectHint` names what the visitor was looking at — a site, a city — and
 * is written into the subject line of the brief, so an email that arrives
 * from a listing page says which listing without anyone typing it.
 */
export function buildCta(line: string, context?: string, subjectHint?: string): string {
  // The block carries its own gutter. It is dropped into hand-written
  // templates through a bare `<!--@CTA-->`, which has no section around it,
  // and a component that only lines up when its caller remembers to wrap it
  // is a component that will eventually not line up.
  return `
        <aside class="cta-block gl-padding_lr" data-reveal>
          <div class="cta-block__inner">
            <div class="cta-block__copy">
              <p class="cta-block__line">${rich(line)}</p>
              ${context ? `<p class="cta-block__context">${rich(context)}</p>` : ''}
            </div>
            <div class="cta-block__act">
              <div class="btn-wrapper">
                <a class="btn btn--primary addHover" href="tel:${esc(company.phoneHref)}"><span class="btn__label">Call ${esc(company.phone).replace('-', '‑')}</span></a>
                <a class="btn addHover" href="${ctaWhatsApp(subjectHint)}" rel="noopener noreferrer" target="_blank"><span class="btn__label">WhatsApp</span></a>
                <a class="btn addHover" href="${ctaMailto(subjectHint)}" data-brief-link><span class="btn__label">Send a brief</span></a>
              </div>
              <ul class="cta-block__trust">
                <li>Written plan within one working day</li>
                <li>All-in cost — production and mounting included</li>
                <li>Proof of play or dated site photographs at close</li>
              </ul>
            </div>
            <i class="cta-block__scan" aria-hidden="true"></i>
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
  // A plate: the caption sits under the photograph, on the ground, ruled.
  return `
          <figure class="plate article-figure" data-reveal="clip" style="--accent:${esc(accentOf(board))}">
            <a class="article-figure__link" href="${esc(boardPath(board))}" data-cursor="media" data-cursor-label="View site">
              <img class="article-figure__img" src="/${esc(board.image)}"
                   alt="${esc(board.title)} LED billboard in ${esc(board.city)}, facing ${esc(board.facing)}"
                   style="object-position:${focus}" sizes="(max-width:767px) 100vw, 62vw"
                   loading="lazy" decoding="async" width="1400" height="933" data-load />
            </a>
            <figcaption class="plate__caption article-figure__caption">
              <span>${rich(caption)}</span>
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
                          : // The column heading rides along on each cell so the
                            // table can stack into labelled rows on a phone.
                            `<td data-label="${esc(b.head[i] ?? '')}">${rich(cell)}</td>`,
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
          <li class="related-q__item ruled__row" data-reveal-item>
            <a class="related-q__link" href="${esc(faqPath(a.slug))}">
              <span class="related-q__question">${esc(a.question)}</span>
              <span class="related-q__cat eyebrow">${esc(a.category)}</span>
            </a>
          </li>`,
    )
    .join('');

  return `
        <section class="gl-section gl-padding_lr">
          <header class="section-head" data-reveal>
            <span class="eyebrow">Keep reading</span>
            <h2 data-split="words">People who asked this also asked</h2>
          </header>
          <ul class="related-q ruled" data-reveal>${items}</ul>
          <div class="btn-wrapper">
            <a class="btn addHover" href="${FAQ_HUB}"><span class="btn__label">All questions</span></a>
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
              <span class="eyebrow">Inventory</span>
              <h2 class="accent-title">See the actual sites</h2>
              <p class="text-muted">
                Every screen has its own page with a photograph, the size, the direction it faces
                and the hours it runs.
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

/* --- the page head ----------------------------------------------------------
   The same shape partials.ts gives the generated pages: one mono readout,
   a breadcrumb, then the title on the left. Written here rather than
   imported because partials.ts imports this file.                         */

interface HeadOptions {
  readout: string;
  crumbs?: { label: string; href?: string }[];
  eyebrow: string;
  title: string;
  lede: string;
  after?: string;
}

export function articleHead(o: HeadOptions): string {
  const crumbs = o.crumbs?.length
    ? `
        <nav class="breadcrumb eyebrow" aria-label="Breadcrumb" data-reveal="fade">
          ${o.crumbs
            .map((c) =>
              c.href
                ? `<a class="text-link" href="${esc(c.href)}">${esc(c.label)}</a>`
                : `<span aria-current="page">${esc(c.label)}</span>`,
            )
            .join('\n          <span aria-hidden="true">/</span>\n          ')}
        </nav>`
    : '';

  return `
        <section class="page-head gl-padding_lr">
          <p class="page-head__readout" aria-hidden="true">[ ${esc(o.readout)} ]</p>${crumbs}
          <div class="css-grid-wrapper">
            <header class="grid-item grid-70 xsm-grid-100 intro-text" data-reveal>
              <span class="eyebrow">${esc(o.eyebrow)}</span>
              <i class="rule" data-reveal="line"></i>
              <h1 data-split="words">${o.title}</h1>
              <p class="lede">${o.lede}</p>
              ${o.after ?? ''}
            </header>
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

  const index = faqArticles.findIndex((a) => a.slug === slug) + 1;

  return `
        ${articleHead({
          readout: `ANSWER ${String(index).padStart(2, '0')} / ${String(faqArticles.length).padStart(2, '0')} · ${article.category.toUpperCase()}`,
          crumbs: [{ label: 'Answers', href: FAQ_HUB }, { label: article.shortTitle }],
          eyebrow: article.category,
          title: esc(article.question),
          lede: rich(article.shortAnswer),
          after: `<div class="btn-wrapper">
                <a class="btn btn--primary addHover" href="tel:${esc(company.phoneHref)}"><span class="btn__label">Call for price</span></a>
                <a class="btn addHover" href="billboards.html"><span class="btn__label">See the sites</span></a>
              </div>`,
        })}

        <section class="gl-section gl-padding_lr">
          <article class="article" data-reveal>
            ${article.body.map(renderBlock).join('\n')}
          </article>
        </section>

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
            <h2 class="answer-group__title" data-split="words">${esc(group.category)}</h2>
            <ul class="answer-list ruled">
              ${group.articles
                .map(
                  (a) => `
                <li class="answer-list__item ruled__row">
                  <a class="answer-list__link" href="${esc(faqPath(a.slug))}">
                    <span class="answer-list__q">${esc(a.question)}</span>
                    <span class="answer-list__a">${esc(a.shortAnswer)}</span>
                  </a>
                </li>`,
                )
                .join('')}
            </ul>
          </section>`,
    )
    .join('');

  return `
        ${articleHead({
          readout: `ANSWERS · ${faqArticles.length} QUESTIONS`,
          eyebrow: `${faqArticles.length} questions answered`,
          title: 'Billboard advertising in Bangladesh, explained',
          lede: 'What it costs, how it is priced, which format does which job, where the good sites are and how to tell whether any of it worked. Written by the people who own and run the screens, which is why there is more detail here than a brochure would carry.',
          after: `<div class="btn-wrapper">
                <a class="btn btn--primary addHover" href="tel:${esc(company.phoneHref)}"><span class="btn__label">Call for price</span></a>
                <a class="btn addHover" href="billboards.html"><span class="btn__label">See the 58 sites</span></a>
              </div>`,
        })}

        <section class="gl-section gl-padding_lr">
          <div class="answer-groups">${groups}</div>
        </section>`;
}

/** Every question, for the sitemap and the footer index. */
export const faqSlugs = faqArticles.map((a) => a.slug);
