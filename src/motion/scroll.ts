/**
 * Smooth scrolling.
 *
 * Lenis interpolates the scroll position and drives it from a single RAF loop
 * that the rest of the motion system shares. Everything that reacts to scroll
 * reads `--scrollY` rather than adding its own listener, so there is one
 * source of truth and one write per frame instead of one per component.
 */

import Lenis from 'lenis';
import { prefersReducedMotion } from '../lib/viewport';

let lenis: Lenis | null = null;
let frame = 0;

export function initScroll(): Lenis | null {
  // Reduced motion means no interpolation at all — native scrolling is what
  // the visitor asked for, and an eased scroll is exactly the sensation the
  // preference exists to avoid.
  if (prefersReducedMotion()) {
    document.documentElement.classList.add('no-smooth-scroll');
    trackScrollProperty();
    return null;
  }

  lenis = new Lenis({
    duration: 1.1,
    easing: (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t)),
    smoothWheel: true,
    // Touch devices have their own momentum; overriding it feels laggy and
    // fights the platform.
    syncTouch: false,
  });

  lenis.on('scroll', ({ scroll }: { scroll: number }) => {
    document.documentElement.style.setProperty('--scrollY', String(Math.round(scroll)));
    markScrolled(scroll);
  });

  const raf = (time: number): void => {
    lenis?.raf(time);
    frame = requestAnimationFrame(raf);
  };
  frame = requestAnimationFrame(raf);

  // A backgrounded tab still fires RAF in some browsers; stopping the loop
  // keeps a hidden page from burning battery.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
    } else {
      frame = requestAnimationFrame(raf);
    }
  });

  return lenis;
}

/**
 * Flags that the page has left the top of the document.
 *
 * The header is transparent over the hero, where a photograph is the
 * background and a scrim is enough. Everywhere below that the page's own
 * background is the same navy as the scrim, so the scrim is invisible and the
 * wordmark ends up printed over body copy. Past the fold the header takes a
 * real background instead.
 */
function markScrolled(scroll: number): void {
  const past = scroll > 24;
  if (past === (document.documentElement.dataset.scrolled === 'true')) return;
  document.documentElement.dataset.scrolled = String(past);
}

/** Fallback --scrollY writer for when Lenis is not running. */
function trackScrollProperty(): void {
  const update = (): void => {
    document.documentElement.style.setProperty('--scrollY', String(Math.round(window.scrollY)));
    markScrolled(window.scrollY);
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
}

export const getLenis = (): Lenis | null => lenis;

export function scrollToTop(): void {
  if (lenis) lenis.scrollTo(0, { immediate: true });
  else window.scrollTo(0, 0);
}

export function stopScroll(): void {
  lenis?.stop();
}

export function startScroll(): void {
  lenis?.start();
}
