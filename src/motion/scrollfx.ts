/**
 * Scroll-driven motion: parallax, section progress, the hero fade, a progress
 * bar, and counters.
 *
 * Everything that reads `scrollY` shares **one** rAF loop and **one**
 * IntersectionObserver, which is the whole design. The naive version of this
 * file is five independent scroll listeners each measuring elements on every
 * frame; that is what makes parallax feel cheap on a desktop and terrible on
 * a phone.
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
 *   depth is halved on coarse pointers and off entirely on a phone, where a
 *   big translation reads as a rendering fault rather than as depth.
 *
 * The counters are GSAP tweens rather than hand-rolled easing so they share
 * the ticker with everything else; the stats band gets a per-digit roll — a
 * column of 0–9 per digit sliding into place like a mechanical counter — and
 * every other `[data-count]` gets a plain snapped number tween.
 */

import { gsap } from 'gsap';
import { onReducedMotionChange, prefersReducedMotion } from '../lib/viewport';
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

interface ProgressItem {
  el: HTMLElement;
  top: number;
}

const clamp = (n: number, min: number, max: number): number =>
  n < min ? min : n > max ? max : n;

/** The hero's scroll variable runs 0→1 over this fraction of the viewport. */
const HERO_RANGE = 0.6;

/** Section progress runs from the section top at 80vh to 30vh. */
const PROGRESS_FROM = 0.8;
const PROGRESS_TO = 0.3;

export function initScrollFx(scope: ParentNode = document): ScrollFxHandle {
  let reduced = prefersReducedMotion();
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const narrow = window.matchMedia('(max-width: 767px)').matches;
  // A phone shows less of a tall element at once, so the same translation
  // reads as a much larger jump. Half depth keeps it as an effect rather than
  // a distraction; below the tablet width it is off altogether.
  const depth = narrow ? 0 : coarse ? 0.5 : 1;

  const parallax: ParallaxItem[] = [];
  const sections: ProgressItem[] = [];
  const counters = new Set<HTMLElement>();
  const hero = scope.querySelector<HTMLElement>('[data-hero]');
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

  const measureSection = (item: ProgressItem): void => {
    item.top = item.el.getBoundingClientRect().top + window.scrollY;
  };

  const measureAll = (): void => {
    parallax.forEach(measure);
    sections.forEach(measureSection);
  };

  /* --- the single loop ----------------------------------------------------- */

  const active = new Set<ParallaxItem>();
  const activeSections = new Set<ProgressItem>();

  // The last scroll position this loop answered. Everything the loop computes
  // is a function of it, so when it stops changing there is nothing left to
  // compute and the loop can end.
  let lastY = -1;

  const frame = (): void => {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const moved = y !== lastY;
    lastY = y;

    if (moved) {
      if (progress) {
        const max = document.documentElement.scrollHeight - vh;
        progress.style.transform = `scaleX(${max > 0 ? clamp(y / max, 0, 1) : 0})`;
      }

      // The hero only ever sits at the top of the document, so its progress
      // is a function of scrollY alone — no measurement needed.
      if (hero && !reduced) {
        hero.style.setProperty('--hero-progress', clamp(y / (vh * HERO_RANGE), 0, 1).toFixed(3));
      }

      for (const item of activeSections) {
        const top = item.top - y;
        const t = (vh * PROGRESS_FROM - top) / (vh * (PROGRESS_FROM - PROGRESS_TO));
        item.el.style.setProperty('--section-progress', clamp(t, 0, 1).toFixed(3));
      }
    }

    for (const item of active) {
      // -1 when the element is entering the bottom of the viewport, +1 when it
      // is leaving the top. Zero at dead centre, which is where it sits at its
      // natural position.
      const centre = item.top + item.height / 2 - (y + vh / 2);
      const t = clamp(centre / (vh + item.height), -1, 1);
      item.el.style.setProperty('--parallax', `${(t * item.speed * depth).toFixed(2)}px`);
    }

    // Stop at rest rather than idling. `start()` is called from every event
    // that can change the answer, so stopping here costs nothing but the
    // frame it takes to restart.
    raf = moved ? requestAnimationFrame(frame) : 0;
  };

  const start = (): void => {
    if (raf === 0) raf = requestAnimationFrame(frame);
  };

  /* --- counters ------------------------------------------------------------ */

  /**
   * "2,000+" and "60%" both have to survive: the digits animate, the
   * punctuation and suffix are put back exactly as written.
   */
  const parse = (
    text: string,
  ): { prefix: string; digits: string; suffix: string; target: number } | null => {
    const match = /^([^\d]*)([\d,]+)(.*)$/.exec(text.trim());
    if (!match) return null;
    const [, prefix = '', digits = '', suffix = ''] = match;
    const target = Number(digits.replace(/,/g, ''));
    if (!Number.isFinite(target) || target === 0) return null;
    return { prefix, digits, suffix, target };
  };

  const runCounter = (el: HTMLElement): void => {
    const text = el.textContent ?? '';
    const parsed = parse(text);
    if (!parsed) return;
    const { prefix, digits, suffix, target } = parsed;
    const grouped = digits.includes(',');
    const state = { value: 0 };

    gsap.to(state, {
      value: target,
      duration: 1.4,
      ease: 'expo.out',
      snap: { value: 1 },
      onUpdate: () => {
        const v = Math.round(state.value);
        el.textContent = `${prefix}${grouped ? v.toLocaleString('en-GB') : v}${suffix}`;
      },
      onComplete: () => {
        el.textContent = text;
      },
    });
  };

  /**
   * Per-digit roll. Each digit becomes a clipped `.digit` holding a
   * `.digit__col` of 0–9; the column slides up to the target digit. Columns
   * stagger from the right, the way a real counter's low digits settle last.
   * The text is restored verbatim at the end so nothing downstream (print,
   * copy, a screen reader re-reading) sees the scaffolding.
   */
  const runRoll = (el: HTMLElement): void => {
    const text = el.textContent ?? '';
    const parsed = parse(text);
    if (!parsed) {
      runCounter(el);
      return;
    }
    const { prefix, digits, suffix } = parsed;

    const frag = document.createDocumentFragment();
    if (prefix) frag.appendChild(document.createTextNode(prefix));

    const cols: { col: HTMLElement; digit: number }[] = [];
    for (const ch of digits) {
      if (!/\d/.test(ch)) {
        frag.appendChild(document.createTextNode(ch));
        continue;
      }
      const digit = document.createElement('span');
      digit.className = 'digit';
      digit.setAttribute('aria-hidden', 'true');
      const col = document.createElement('span');
      col.className = 'digit__col';
      for (let n = 0; n <= 9; n++) {
        const cell = document.createElement('span');
        cell.textContent = String(n);
        col.appendChild(cell);
      }
      digit.appendChild(col);
      frag.appendChild(digit);
      cols.push({ col, digit: Number(ch) });
    }
    if (suffix) frag.appendChild(document.createTextNode(suffix));

    el.setAttribute('aria-label', text.trim());
    el.textContent = '';
    el.appendChild(frag);

    const targets = cols.map((c) => c.col);
    gsap.set(targets, { y: 0 });
    gsap.to(targets, {
      y: (i: number) => `${-(cols[i]?.digit ?? 0)}em`,
      duration: 1.4,
      ease: 'expo.out',
      stagger: { each: 0.06, from: 'end' },
      onComplete: () => {
        el.textContent = text;
        el.removeAttribute('aria-label');
      },
    });
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
            if (el.hasAttribute('data-count-roll')) runRoll(el);
            else runCounter(el);
          }
          continue;
        }

        const section = sections.find((s) => s.el === el);
        if (section) {
          if (entry.isIntersecting) {
            measureSection(section);
            activeSections.add(section);
            lastY = -1;
            start();
          } else {
            activeSections.delete(section);
            // Leaving upward means the line stays drawn; leaving downward
            // means it was never reached.
            section.el.style.setProperty(
              '--section-progress',
              entry.boundingClientRect.top < 0 ? '1' : '0',
            );
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

  const bind = (): void => {
    if (reduced) return;

    if (depth > 0) {
      for (const el of qsa<HTMLElement>('[data-parallax]', scope)) {
        // Headings were parallaxed in an earlier version; a moving heading
        // reads as a layout bug, so they are excluded here whatever the markup.
        if (el.matches('h1, h2, h3')) continue;
        const speed = Number(el.dataset.parallax) || 40;
        parallax.push({ el, speed, top: 0, height: 0 });
        observer.observe(el);
      }
    }

    for (const el of qsa<HTMLElement>('[data-progress]', scope)) {
      sections.push({ el, top: 0 });
      observer.observe(el);
    }

    for (const el of qsa<HTMLElement>('[data-count]', scope)) {
      counters.add(el);
      observer.observe(el);
    }

    start();
  };

  /** The static page: variables at their final values, no observers. */
  const snapStatic = (): void => {
    observer.disconnect();
    cancelAnimationFrame(raf);
    raf = 0;
    progress?.remove();
    progress = null;
    parallax.forEach((p) => p.el.style.removeProperty('--parallax'));
    parallax.length = 0;
    active.clear();
    sections.forEach((s) => s.el.style.setProperty('--section-progress', '1'));
    sections.length = 0;
    activeSections.clear();
    counters.clear();
    hero?.style.setProperty('--hero-progress', '0');
  };

  if (reduced) snapStatic();
  else bind();

  // The loop now ends at rest, so something has to wake it. Lenis scrolls the
  // real document, so the native event fires under smooth scrolling too.
  const onScroll = (): void => start();
  window.addEventListener('scroll', onScroll, { passive: true });

  let resizeFrame = 0;
  const onResize = (): void => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      measureAll();
      lastY = -1;
      start();
    });
  };
  window.addEventListener('resize', onResize, { passive: true });

  const stopMotionWatch = onReducedMotionChange((next) => {
    reduced = next;
    if (next) snapStatic();
  });

  return {
    destroy: () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      cancelAnimationFrame(resizeFrame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      stopMotionWatch();
      progress?.remove();
      parallax.forEach((p) => p.el.style.removeProperty('--parallax'));
      active.clear();
      activeSections.clear();
      counters.clear();
    },
  };
}
