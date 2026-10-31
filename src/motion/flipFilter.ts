/**
 * Billboard inventory filter.
 *
 * Hiding cards outright makes the survivors jump to their new grid position.
 * GSAP Flip records where everything was, lets the DOM change, then animates
 * from the recorded positions to the new ones — so the grid reflows visibly
 * and the eye can follow a card that stayed.
 *
 * The bar is sticky under the header. A 1px sentinel just above it tells an
 * IntersectionObserver when it has stuck, which is cheaper and more reliable
 * than reading `scrollY` against a measured offset, and `.is-stuck` draws the
 * hairline that separates it from the cards sliding under.
 */

import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { qs, qsa } from '../lib/dom';
import { prefersReducedMotion } from '../lib/viewport';

gsap.registerPlugin(Flip);

export interface FilterHandle {
  destroy: () => void;
}

export function initFilter(scope: ParentNode = document): FilterHandle {
  const bar = qs<HTMLElement>('[data-filter-bar]', scope);
  const grid = qs<HTMLElement>('.board-grid', scope);
  if (!bar || !grid) return { destroy: () => {} };

  const buttons = qsa<HTMLButtonElement>('.filter-btn[data-filter]', bar);
  const cards = qsa<HTMLElement>('.board-card[data-city]', grid);
  const status = qs<HTMLElement>('#filter_status', scope);
  const count = qs<HTMLElement>('[data-filter-count]', scope);
  const sentinel = qs<HTMLElement>('[data-filter-sentinel]', scope);

  const cleanups: Array<() => void> = [];

  const announce = (shown: number, city: string): void => {
    const where = city === 'all' ? '' : ` in ${city}`;
    const text = `${shown} site${shown === 1 ? '' : 's'} shown${where}`;
    // Announced for screen readers, which get no benefit from the animation,
    // and mirrored visibly beside the chips.
    if (status) status.textContent = `${text}.`;
    if (count) count.textContent = text;
  };

  const apply = (city: string): void => {
    const animate = !prefersReducedMotion();
    const state = animate ? Flip.getState(cards) : null;

    let shown = 0;
    for (const card of cards) {
      const visible = city === 'all' || card.dataset.city === city;
      card.hidden = !visible;
      if (visible) shown += 1;
    }

    buttons.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(btn.dataset.filter === city));
    });

    announce(shown, city);

    if (!state) return;

    Flip.from(state, {
      duration: 0.55,
      ease: 'power2.inOut',
      absolute: true,
      // Cards leaving and arriving cross-fade in place rather than
      // collapsing, which is what keeps the grid from snapping.
      onEnter: (elements) =>
        gsap.fromTo(
          elements,
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
        ),
      onLeave: (elements) =>
        gsap.to(elements, { opacity: 0, scale: 0.96, duration: 0.3, ease: 'power2.in' }),
    });
  };

  const onClick = (event: Event): void => {
    const btn = (event.target as HTMLElement).closest<HTMLButtonElement>('.filter-btn[data-filter]');
    if (!btn || !bar.contains(btn)) return;
    apply(btn.dataset.filter ?? 'all');
  };

  bar.addEventListener('click', onClick);
  cleanups.push(() => bar.removeEventListener('click', onClick));

  // Stuck state: the sentinel sits just above the bar; once it has passed the
  // bar's sticky edge the bar is pinned.
  //
  // The root is extended a long way downward so that "intersecting" simply
  // means "not yet above the sticky edge". A plain observer on a zero-height
  // sentinel misses an instant jump from below the fold to above it — the
  // intersection state is false on both sides of the jump, so it never fires
  // — and anchor links and Barba's scroll-to-top are exactly such jumps.
  if (sentinel) {
    const stickyTop = Math.round(parseFloat(getComputedStyle(bar).top) || 0);
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        bar.classList.toggle('is-stuck', !entry.isIntersecting);
      },
      { rootMargin: `-${stickyTop}px 0px 100000px 0px`, threshold: 0 },
    );
    observer.observe(sentinel);
    cleanups.push(() => {
      observer.disconnect();
      bar.classList.remove('is-stuck');
    });
  }

  return { destroy: () => cleanups.forEach((fn) => fn()) };
}
