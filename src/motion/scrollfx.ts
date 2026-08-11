/**
 * Scroll-driven motion: parallax, a progress bar, and counters.
 *
 * All three share **one** rAF loop and **one** IntersectionObserver, which is
 * the whole design. The naive version of this file is three independent
 * scroll listeners each measuring elements on every frame; that is what makes
 * parallax feel cheap on a desktop and terrible on a phone.
 *
 * Instead:
 *
 * - Geometry is measured when an element enters the viewport and cached, then
 *   re-measured only on resize. Reading `getBoundingClientRect()` per element
 *   per frame is the layout thrash that costs the frame budget.
 * - Only elements currently in view are in the active set. Everything else
 *   costs nothing.
 * - The loop stops itself the moment the scroll position stops changing, and
 *   the next scroll or resize restarts it, so a parked page runs no animation
 *   at all. Everything the loop computes is a function of `scrollY`; once that
 *   holds still there is no further answer to produce.
 * - Nothing moves for a visitor who asked for reduced motion, and parallax
 *   depth is halved on coarse pointers, where a big translation reads as a
 *   rendering fault rather than as depth.
 */

import { prefersReducedMotion } from '../lib/viewport';
import { qsa } from '../lib/dom';

export interface ScrollFxHandle {
  destroy: () => void;
}

interface ParallaxItem {
  el: HTMLElement;
  /** Positive drifts slower than the page, negative drifts faster. */
  speed: number;
  top: number;
  height: number;
}

const clamp = (n: number, min: number, max: number): number =>
  n < min ? min : n > max ? max : n;

export function initScrollFx(scope: ParentNode = document): ScrollFxHandle {
  const reduced = prefersReducedMotion();
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  // A phone shows less of a tall element at once, so the same translation
  // reads as a much larger jump. Half depth keeps it as an effect rather than
  // a distraction.
  const depth = coarse ? 0.5 : 1;

  const parallax: ParallaxItem[] = [];
  const counters = new Set<HTMLElement>();
  let raf = 0;
  let progress: HTMLElement | null = null;

  /* --- progress bar -------------------------------------------------------- */

  if (!reduced) {
    progress = document.createElement('div');
    progress.className = 'scroll-progress';
    progress.setAttribute('aria-hidden', 'true');
    document.body.appendChild(progress);
  }

  /* --- measurement --------------------------------------------------------- */

  const measure = (item: ParallaxItem): void => {
    const rect = item.el.getBoundingClientRect();
    item.top = rect.top + window.scrollY;
    item.height = rect.height;
  };

  const measureAll = (): void => parallax.forEach(measure);

  /* --- the single loop ----------------------------------------------------- */

  const active = new Set<ParallaxItem>();

  // The last scroll position this loop answered. Everything the loop computes
  // is a function of it, so when it stops changing there is nothing left to
  // compute and the loop can end.
  let lastY = -1;

  const frame = (): void => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const moved = y !== lastY;
    lastY = y;

    if (progress && moved) {
      const max = document.documentElement.scrollHeight - vh;
      progress.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1) : 0})`;
    }

    for (const item of active) {
      // -1 when the element is entering the bottom of the viewport, +1 when it
      // is leaving the top. Zero at dead centre, which is where it sits at its
      // natural position.
      const centre = item.top + item.height / 2 - (y + vh / 2);
      const t = clamp(centre / (vh + item.height), -1, 1);
      item.el.style.setProperty('--parallax', `${(t * item.speed * depth).toFixed(2)}px`);
    }

    // Stop at rest rather than idling. A parked page with a screen wall on it
    // would otherwise burn a style invalidation per tile per frame forever;
    // `start()` is called from every event that can change the answer, so
    // stopping here costs nothing but the frame it takes to restart.
    raf = moved ? requestAnimationFrame(frame) : 0;
  };

  const start = (): void => {
    if (raf === 0) raf = requestAnimationFrame(frame);
  };

  /* --- counters ------------------------------------------------------------ */

  const runCounter = (el: HTMLElement): void => {
    const text = el.textContent ?? '';
    // "2,000+" and "60%" both have to survive: the digits animate, the
    // punctuation and suffix are put back exactly as written.
    const match = /^([^\d]*)([\d,]+)(.*)$/.exec(text.trim());
    if (!match) return;

    const [, prefix, digits, suffix] = match;
    const target = Number(digits.replace(/,/g, ''));
    if (!Number.isFinite(target) || target === 0) return;

    const grouped = digits.includes(',');
    const duration = 1100;
    const started = performance.now();

    const tick = (now: number): void => {
      const p = clamp((now - started) / duration, 0, 1);
      // Ease out cubic: fast at first, so the number is legible early and the
      // last few frames are the ones that settle it.
      const eased = 1 - Math.pow(1 - p, 3);
      const value = Math.round(target * eased);
      el.textContent = `${prefix}${grouped ? value.toLocaleString('en-GB') : value}${suffix}`;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = text;
    };

    requestAnimationFrame(tick);
  };

  /* --- wiring -------------------------------------------------------------- */

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;

        if (counters.has(el)) {
          if (entry.isIntersecting) {
            observer.unobserve(el);
            counters.delete(el);
            runCounter(el);
          }
          continue;
        }

        const item = parallax.find((p) => p.el === el);
        if (!item) continue;

        if (entry.isIntersecting) {
          measure(item);
          active.add(item);
          start();
        } else {
          active.delete(item);
          item.el.style.removeProperty('--parallax');
        }
      }
    },
    { rootMargin: '10% 0px' },
  );

  if (!reduced) {
    for (const el of qsa<HTMLElement>('[data-parallax]', scope)) {
      const speed = Number(el.dataset.parallax) || 40;
      parallax.push({ el, speed, top: 0, height: 0 });
      observer.observe(el);
    }

    for (const el of qsa<HTMLElement>('[data-count]', scope)) {
      counters.add(el);
      observer.observe(el);
    }

    start();
  }

  // The loop now ends at rest, so something has to wake it. Lenis scrolls the
  // real document, so the native event fires under smooth scrolling too.
  const onScroll = (): void => start();
  if (!reduced) window.addEventListener('scroll', onScroll, { passive: true });

  let resizeFrame = 0;
  const onResize = (): void => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      measureAll();
      start();
    });
  };
  window.addEventListener('resize', onResize, { passive: true });

  return {
    destroy: () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      cancelAnimationFrame(resizeFrame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      progress?.remove();
      parallax.forEach((p) => p.el.style.removeProperty('--parallax'));
      active.clear();
      counters.clear();
    },
  };
}
