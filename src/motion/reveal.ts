/**
 * Scroll-triggered reveals.
 *
 * One IntersectionObserver for the whole page rather than a ScrollTrigger per
 * element: the browser does the intersection maths off the main thread, and
 * elements unobserve themselves once shown, so a long inventory list does not
 * keep hundreds of live callbacks around.
 *
 * Five variants, chosen by the value of `data-reveal`:
 *
 * - (none)   opacity + 24px rise; children marked `data-reveal-item` stagger
 * - `clip`   a plate wipes open from the top, its photograph settling from 1.08
 * - `line`   a rule draws left to right
 * - `words`  a heading's words slide up through masks (see lib/split.ts)
 * - `fade`   opacity only
 *
 * The hidden state is applied by CSS under `html.js` (global.css), never here,
 * so a page whose script fails is simply visible. Three more guards make sure
 * nothing can be left invisible: anything above the fold waits on the curtain
 * gate rather than animating behind it; everything is revealed six seconds
 * after mount regardless of scroll position; and `pagehide` / `beforeprint`
 * reveal everything at once, because a printed page with half its sections
 * at opacity zero is a bug report.
 */

import { gsap } from 'gsap';
import { qsa } from '../lib/dom';
import { splitWords } from '../lib/split';
import { onReducedMotionChange, prefersReducedMotion } from '../lib/viewport';
import { pageVisible } from './curtain';

export interface RevealHandle {
  destroy: () => void;
}

/** Reveal everything that has not shown itself by now. */
const SAFETY_MS = 6000;

/** Stagger is capped so a 58-item list does not take five seconds to finish. */
const MAX_STAGGERED = 12;

type Variant = 'default' | 'clip' | 'line' | 'words' | 'fade';

const variantOf = (el: HTMLElement): Variant => {
  const v = el.dataset.reveal;
  return v === 'clip' || v === 'line' || v === 'words' || v === 'fade' ? v : 'default';
};

/** Inline final state for every variant — the instant, no-motion reveal. */
function show(el: HTMLElement): void {
  el.style.opacity = '1';
  el.style.clipPath = 'none';
  el.style.transform = 'none';
  qsa<HTMLElement>('[data-reveal-item]', el).forEach((item) => {
    item.style.opacity = '1';
    item.style.transform = 'none';
  });
  qsa<HTMLElement>('[data-split="words"]', el).forEach((h) => {
    const words = splitWords(h).words;
    if (words.length) gsap.set(words, { yPercent: 0 });
  });
  if (el.dataset.split === 'words') {
    const words = splitWords(el).words;
    if (words.length) gsap.set(words, { yPercent: 0 });
  }
}

export function initReveals(scope: ParentNode = document): RevealHandle {
  const groups = qsa<HTMLElement>('[data-reveal]', scope);
  // Items without a `[data-reveal]` ancestor trigger themselves — the board
  // grid keeps its reveal state on each card body, not on the 11,000px grid.
  const orphans = qsa<HTMLElement>('[data-reveal-item]', scope).filter(
    (el) => !el.closest('[data-reveal]'),
  );
  // Section headings outside any reveal group still get their word reveal.
  const headings = qsa<HTMLElement>('[data-split="words"]', scope).filter(
    (el) =>
      !el.closest('[data-reveal]') &&
      !el.closest('[data-hero]') &&
      !el.hasAttribute('data-reveal'),
  );

  const targets = [...groups, ...orphans, ...headings];
  if (targets.length === 0) return { destroy: () => {} };

  const pending = new Set<HTMLElement>(targets);

  const showAll = (): void => {
    pending.forEach(show);
    pending.clear();
  };

  // Reduced motion: everything is simply visible. Setting the final state
  // explicitly matters because the hidden state is applied by CSS.
  if (prefersReducedMotion()) {
    showAll();
    return { destroy: () => {} };
  }

  const gate = pageVisible();

  /* --- the animations ----------------------------------------------------- */

  const revealWords = (heading: HTMLElement, delay: number, fast: boolean): void => {
    const words = splitWords(heading).words;
    if (words.length === 0) return;
    gsap.set(words, { yPercent: 110 });
    gsap.to(words, {
      yPercent: 0,
      duration: fast ? 0.7 : 0.9,
      ease: 'expo.out',
      stagger: fast ? 0.04 : 0.06,
      delay,
    });
  };

  const animate = (el: HTMLElement): void => {
    const delay = Number(el.dataset.revealDelay ?? 0) || 0;
    const variant: Variant = el.hasAttribute('data-reveal')
      ? variantOf(el)
      : el.dataset.split === 'words'
        ? 'words'
        : 'default';

    switch (variant) {
      case 'clip': {
        gsap.fromTo(
          el,
          { clipPath: 'inset(0 0 100% 0)' },
          { clipPath: 'inset(0 0 0% 0)', duration: 1, ease: 'expo.out', delay },
        );
        const img = el.querySelector('img');
        if (img) {
          gsap.fromTo(
            img,
            { scale: 1.08 },
            { scale: 1, duration: 1.2, ease: 'expo.out', delay, transformOrigin: 'center' },
          );
        }
        break;
      }
      case 'line': {
        gsap.fromTo(
          el,
          { scaleX: 0, transformOrigin: 'left center' },
          { scaleX: 1, duration: 0.6, ease: 'expo.out', delay },
        );
        break;
      }
      case 'words': {
        el.style.opacity = '1';
        revealWords(el, delay, true);
        break;
      }
      case 'fade': {
        gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power2.out', delay });
        break;
      }
      default: {
        const items = el.hasAttribute('data-reveal')
          ? qsa<HTMLElement>('[data-reveal-item]', el)
          : [];

        if (items.length > 0) {
          // The group itself just appears; its children carry the motion.
          gsap.set(el, { opacity: 1, y: 0 });
          gsap.set(items, { opacity: 0, y: 24 });
          gsap.to(items, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            delay,
            stagger: { each: 0.08, from: 'start' },
            // Past the cap, every remaining item starts together.
            onStart: () => {
              if (items.length > MAX_STAGGERED) {
                gsap.to(items.slice(MAX_STAGGERED), {
                  opacity: 1,
                  y: 0,
                  duration: 0.8,
                  ease: 'power3.out',
                  delay: delay + MAX_STAGGERED * 0.08,
                  overwrite: true,
                });
              }
            },
          });
        } else {
          gsap.fromTo(
            el,
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay },
          );
        }

        // A heading inside the group gets its word reveal on top of the rise.
        qsa<HTMLElement>('[data-split="words"]', el)
          .filter((h) => !h.closest('[data-hero]'))
          .forEach((h) => revealWords(h, delay, !h.matches('h1')));
        break;
      }
    }
  };

  /* --- wiring --------------------------------------------------------------- */

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        observer.unobserve(el);
        if (!pending.has(el)) continue;
        pending.delete(el);
        // Above-the-fold elements intersect immediately, behind the curtain.
        // They wait for the gate; everything further down resolves instantly
        // because the gate is already open by the time it is scrolled to.
        void gate.then(() => {
          if (prefersReducedMotion()) show(el);
          else animate(el);
        });
      }
    },
    {
      // Fires a little before the element reaches the fold, so the motion has
      // finished by the time it is properly in view.
      //
      // The threshold is 0, not a fraction. `threshold` is measured against
      // the target's own height, so an element taller than the viewport can
      // never reach one. The negative bottom margin still holds the trigger
      // back until the element is on screen.
      rootMargin: '0px 0px -10% 0px',
      threshold: 0,
    },
  );

  targets.forEach((el) => observer.observe(el));

  const safety = window.setTimeout(showAll, SAFETY_MS);
  window.addEventListener('pagehide', showAll);
  window.addEventListener('beforeprint', showAll);
  const stopMotionWatch = onReducedMotionChange((reduced) => {
    if (reduced) showAll();
  });

  return {
    destroy: () => {
      observer.disconnect();
      window.clearTimeout(safety);
      window.removeEventListener('pagehide', showAll);
      window.removeEventListener('beforeprint', showAll);
      stopMotionWatch();
      pending.clear();
    },
  };
}
