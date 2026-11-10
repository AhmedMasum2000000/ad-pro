/**
 * Smooth scrolling.
 *
 * Lenis interpolates the wheel and drives the real document from a single
 * RAF loop. Everything that reacts to scroll reads `--scrollY` or listens to
 * the native event, so there is one source of truth and one write per frame
 * instead of one per component.
 *
 * Smoothing is for a wheel. A finger already has momentum of its own, so on a
 * coarse pointer Lenis is not created at all — native scrolling, nothing to
 * fight — and the same goes for anyone who asked for reduced motion.
 */

import Lenis from 'lenis';
import { onReducedMotionChange, prefersReducedMotion } from '../lib/viewport';

let lenis: Lenis | null = null;
let frame = 0;
let nativeTracking = false;

export function initScroll(): Lenis | null {
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  if (prefersReducedMotion() || coarse) {
    useNative();
  } else {
    useLenis();
  }

  // Reduced motion switched on mid-session: an eased scroll is exactly the
  // sensation the preference exists to avoid, so Lenis goes at once.
  onReducedMotionChange((reduced) => {
    if (reduced) useNative();
    else if (!coarse) useLenis();
  });

  return lenis;
}

function useLenis(): void {
  if (lenis) return;
  document.documentElement.classList.remove('no-smooth-scroll');

  lenis = new Lenis({
    duration: 1.0,
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
    if (!lenis) return;
    if (document.hidden) {
      cancelAnimationFrame(frame);
    } else {
      frame = requestAnimationFrame(raf);
    }
  });

  markScrolled(window.scrollY);
}

function useNative(): void {
  if (lenis) {
    cancelAnimationFrame(frame);
    lenis.destroy();
    lenis = null;
  }
  document.documentElement.classList.add('no-smooth-scroll');
  trackScrollProperty();
}

/**
 * Flags that the page has left the top of the document.
 *
 * The header is transparent over the hero, where a photograph is the
 * background and a scrim is enough. Everywhere below that the page's own
 * background is the same ink as the scrim, so the scrim is invisible and the
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
  if (nativeTracking) return;
  nativeTracking = true;
  window.addEventListener('scroll', update, { passive: true });
}

export const getLenis = (): Lenis | null => lenis;

/**
 * Jumps to the top at once.
 *
 * `force: true` matters: Barba calls this while Lenis is stopped for the
 * transition, and a stopped Lenis silently ignores `scrollTo` without it, so
 * the new page used to arrive scrolled to wherever the old one was.
 */
export function scrollToTop(): void {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}

export function stopScroll(): void {
  lenis?.stop();
}

export function startScroll(): void {
  lenis?.start();
}
