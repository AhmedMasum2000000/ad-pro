/**
 * The intro curtain, and the gate behind it.
 *
 * Four panels cover the viewport, the wordmark sits on top, and the whole
 * assembly retracts upward in a stagger once the fonts are ready. Waiting on
 * fonts is the point: the first frame the visitor sees should already be set
 * in the real typeface, not swap under them a moment later. The wait is
 * capped — the fonts are preloaded, so 700ms is already generous — because a
 * slow font file must never hold the page.
 *
 * The gate is `pageVisible()`. Nothing above the fold is allowed to animate
 * behind the curtain, where nobody can see it, so the hero, the word reveals
 * and the first reveals all wait on this promise instead of on their own
 * timers. It resolves when the curtain is clear, immediately when there is no
 * curtain, and after three seconds regardless, so a broken timeline can only
 * ever delay the page, never hide it.
 */

import { gsap } from 'gsap';
import { qs, qsa } from '../lib/dom';
import { prefersReducedMotion } from '../lib/viewport';

const SESSION_KEY = 'intro-played';

/** The longest the page is allowed to stay gated, whatever happens. */
const HARD_TIMEOUT_MS = 3000;

/* --- the gate ---------------------------------------------------------------- */

let resolveVisible: (() => void) | null = null;
let visible: Promise<void> = Promise.resolve();

/** Starts a fresh gate. Called on boot and again before every transition. */
function armGate(): void {
  let settled = false;
  visible = new Promise<void>((resolve) => {
    const settle = (): void => {
      if (settled) return;
      settled = true;
      resolve();
    };
    resolveVisible = settle;
    window.setTimeout(settle, HARD_TIMEOUT_MS);
  });
}

/** Opens the current gate. Idempotent. */
function openGate(): void {
  resolveVisible?.();
  resolveVisible = null;
}

/**
 * Resolves once the current page is actually on screen.
 *
 * Per page, not per session: a Barba transition re-arms it in `leave` so the
 * incoming page's modules — mounted before the cover lifts — wait for the
 * cover and not for a promise that resolved on the previous page.
 */
export const pageVisible = (): Promise<void> => visible;

armGate();

/* --- the intro --------------------------------------------------------------- */

/** Resolves once webfonts are ready, or after `timeout` regardless. */
function fontsReady(timeout = 700): Promise<void> {
  const ready = document.fonts?.ready ?? Promise.resolve();
  return Promise.race([
    ready.then(() => undefined),
    new Promise<void>((resolve) => window.setTimeout(resolve, timeout)),
  ]);
}

export async function playIntro(): Promise<void> {
  const cover = qs('.js-fixed__cover');
  const panels = qsa('.curtain-item');
  const logo = qs('#logo_wrapper');

  const finish = (): void => {
    document.body.classList.remove('isLoading');
    cover?.classList.remove('visible');
    sessionStorage.setItem(SESSION_KEY, '1');
    openGate();
  };

  if (!cover || panels.length === 0) {
    finish();
    return;
  }

  // Replayed on every load would make navigating back to the home page feel
  // like starting over, so it runs once per session.
  const alreadyPlayed = sessionStorage.getItem(SESSION_KEY) === '1';

  if (prefersReducedMotion() || alreadyPlayed) {
    finish();
    return;
  }

  await fontsReady();

  await new Promise<void>((resolve) => {
    const tl = gsap.timeline({
      onComplete: () => {
        finish();
        resolve();
      },
    });

    if (logo) {
      tl.to(logo, { opacity: 0, scale: 1.06, duration: 0.4, ease: 'power2.in' }, 0.2);
    }

    // Panels scale from the top edge; the stagger is what gives the wipe a
    // left-to-right direction rather than reading as a single sheet lifting.
    // Four panels at .7s with a .05 stagger end at roughly one second.
    tl.to(
      panels,
      {
        scaleY: 0,
        duration: 0.7,
        ease: 'power3.inOut',
        stagger: 0.05,
        transformOrigin: 'top center',
      },
      0.15,
    );

    // The hero starts while the last panel is still clearing — around 40% of
    // the way through the wipe — so the photograph is already moving as the
    // curtain reveals it rather than sitting still and then starting.
    tl.call(openGate, [], 0.5);
  });
}

/* --- transitions -------------------------------------------------------------- */

/**
 * Covers the viewport for a page transition and resolves once hidden.
 * Reuses the same panels so a transition and the intro read as one language.
 * Re-arms the gate so the incoming page waits for the cover to lift.
 */
export function coverForTransition(): Promise<void> {
  armGate();

  const cover = qs('.js-fixed__cover');
  const panels = qsa('.curtain-item');
  if (!cover || panels.length === 0) return Promise.resolve();

  cover.classList.add('visible');

  if (prefersReducedMotion()) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    gsap.fromTo(
      panels,
      { scaleY: 0, transformOrigin: 'bottom center' },
      {
        scaleY: 1,
        duration: 0.45,
        ease: 'power3.in',
        stagger: 0.04,
        onComplete: () => resolve(),
      },
    );
  });
}

/** Retracts the transition cover once the incoming page is in the DOM. */
export function revealAfterTransition(): Promise<void> {
  const cover = qs('.js-fixed__cover');
  const panels = qsa('.curtain-item');

  const done = (): void => {
    cover?.classList.remove('visible');
    openGate();
  };

  if (!cover || panels.length === 0 || prefersReducedMotion()) {
    done();
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    gsap.to(panels, {
      scaleY: 0,
      duration: 0.55,
      ease: 'power3.out',
      stagger: 0.04,
      transformOrigin: 'top center',
      onComplete: () => {
        done();
        resolve();
      },
    });
  });
}
