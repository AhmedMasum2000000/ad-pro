/**
 * The intro curtain.
 *
 * Four panels cover the viewport, the wordmark sits on top, and the whole
 * assembly retracts upward in a stagger once the fonts are ready. Waiting on
 * fonts is the point: the first frame the visitor sees should already be set
 * in the real typeface, not swap under them a moment later.
 */

import { gsap } from 'gsap';
import { qs, qsa } from '../lib/dom';
import { prefersReducedMotion } from '../lib/viewport';

const SESSION_KEY = 'intro-played';

/** Resolves once webfonts are ready, or after `timeout` regardless. */
function fontsReady(timeout = 2000): Promise<void> {
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
    sessionStorage.setItem(SESSION_KEY, '1');
    return;
  }

  await fontsReady();

  await new Promise<void>((resolve) => {
    const tl = gsap.timeline({
      onComplete: () => {
        finish();
        sessionStorage.setItem(SESSION_KEY, '1');
        resolve();
      },
    });

    if (logo) {
      tl.to(logo, { opacity: 0, scale: 1.08, duration: 0.5, ease: 'power2.in' }, 0.35);
    }

    // Panels scale from the top edge; the stagger is what gives the wipe a
    // left-to-right direction rather than reading as a single sheet lifting.
    tl.to(
      panels,
      {
        scaleY: 0,
        duration: 0.9,
        ease: 'power3.inOut',
        stagger: 0.07,
        transformOrigin: 'top center',
      },
      0.6,
    );
  });
}

/**
 * Covers the viewport for a page transition and resolves once hidden.
 * Reuses the same panels so a transition and the intro read as one language.
 */
export function coverForTransition(): Promise<void> {
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
        duration: 0.5,
        ease: 'power3.in',
        stagger: 0.05,
        onComplete: () => resolve(),
      },
    );
  });
}

/** Retracts the transition cover once the incoming page is in the DOM. */
export function revealAfterTransition(): Promise<void> {
  const cover = qs('.js-fixed__cover');
  const panels = qsa('.curtain-item');
  if (!cover || panels.length === 0) return Promise.resolve();

  const done = (): void => cover.classList.remove('visible');

  if (prefersReducedMotion()) {
    done();
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    gsap.to(panels, {
      scaleY: 0,
      duration: 0.65,
      ease: 'power3.out',
      stagger: 0.05,
      transformOrigin: 'top center',
      onComplete: () => {
        done();
        resolve();
      },
    });
  });
}
