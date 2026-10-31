/**
 * The sites rail.
 *
 * A native scroll-snap strip; the browser owns the scrolling and this module
 * only adds what CSS cannot: a pair of buttons that page it by one card, a
 * counter that reports where you are, and on a phone a "swipe" hint that gets
 * out of the way after the first swipe. No pinning, no velocity tricks — a
 * rail that behaves like every other horizontal list on the web is one that
 * every visitor already knows how to use.
 */

import { qs, qsa } from '../lib/dom';
import { prefersReducedMotion } from '../lib/viewport';

export interface RailHandle {
  destroy: () => void;
}

const pad = (n: number): string => String(n).padStart(2, '0');

function bindRail(rail: HTMLElement): () => void {
  const track = qs<HTMLElement>('[data-rail-track]', rail);
  if (!track) return () => {};

  const items = qsa<HTMLElement>('.rail__item', track);
  const cards = items.filter((li) => !li.querySelector('.rail__card--more'));
  const prev = qs<HTMLButtonElement>('[data-rail-prev]', rail);
  const next = qs<HTMLButtonElement>('[data-rail-next]', rail);
  // The counter may sit in the section head, outside `.rail` itself.
  const counter =
    qs<HTMLElement>('[data-rail-counter]', rail) ??
    qs<HTMLElement>('[data-rail-counter]', rail.closest('section') ?? rail.parentElement ?? rail);

  const cleanups: Array<() => void> = [];

  /** One card plus the gap: the distance from the first card to the second. */
  const stride = (): number => {
    const a = items[0];
    const b = items[1];
    if (a && b) return b.offsetLeft - a.offsetLeft;
    return a?.offsetWidth ?? track.clientWidth;
  };

  const atStart = (): boolean => track.scrollLeft <= 2;
  const atEnd = (): boolean =>
    track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;

  const update = (): void => {
    if (counter && cards.length > 0) {
      // The current card is the first one whose left edge is at or past the
      // scroll position, allowing half a card of slack so a snap that lands a
      // pixel short still counts.
      const x = track.scrollLeft + stride() * 0.5;
      let index = 0;
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        if (card && card.offsetLeft - track.offsetLeft <= x) index = i;
      }
      counter.textContent = `${pad(index + 1)} / ${pad(cards.length)}`;
    }
    prev?.setAttribute('aria-disabled', String(atStart()));
    next?.setAttribute('aria-disabled', String(atEnd()));
  };

  const page = (direction: 1 | -1): void => {
    track.scrollBy({
      left: stride() * direction,
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  };

  const onPrev = (): void => page(-1);
  const onNext = (): void => page(1);
  prev?.addEventListener('click', onPrev);
  next?.addEventListener('click', onNext);
  cleanups.push(() => {
    prev?.removeEventListener('click', onPrev);
    next?.removeEventListener('click', onNext);
  });

  // Throttled to a frame: scroll events arrive faster than they can be drawn.
  let raf = 0;
  const onScroll = (): void => {
    if (raf !== 0) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      update();
    });
  };
  track.addEventListener('scroll', onScroll, { passive: true });
  cleanups.push(() => {
    track.removeEventListener('scroll', onScroll);
    cancelAnimationFrame(raf);
  });

  // The phone hint. Written here rather than in the markup so a desktop never
  // carries a "swipe" it cannot act on; faded after the first real scroll.
  if (window.matchMedia('(max-width: 767px)').matches && cards.length > 1) {
    const hint = document.createElement('span');
    hint.className = 'rail__hint eyebrow';
    hint.setAttribute('aria-hidden', 'true');
    hint.textContent = 'swipe →';
    rail.appendChild(hint);
    const onFirstScroll = (): void => hint.classList.add('is-done');
    track.addEventListener('scroll', onFirstScroll, { once: true, passive: true });
    cleanups.push(() => {
      track.removeEventListener('scroll', onFirstScroll);
      hint.remove();
    });
  }

  const onResize = (): void => update();
  window.addEventListener('resize', onResize, { passive: true });
  cleanups.push(() => window.removeEventListener('resize', onResize));

  update();

  return () => cleanups.forEach((fn) => fn());
}

export function initRails(scope: ParentNode = document): RailHandle {
  const rails = qsa<HTMLElement>('[data-rail]', scope);
  if (rails.length === 0) return { destroy: () => {} };
  const unbinds = rails.map(bindRail);
  return { destroy: () => unbinds.forEach((fn) => fn()) };
}
