/**
 * Viewport plumbing.
 *
 * Mobile browsers report `100vh` as the height with the address bar hidden,
 * which is not the height you get on load. Anything sized in `vh` therefore
 * jumps the first time the bar collapses. Writing the measured height to a
 * custom property instead means the value only changes on a real resize, and
 * a resize is something we can debounce.
 */

const setUnits = (): void => {
  const root = document.documentElement;
  root.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  // `clientWidth` rather than `innerWidth`: it excludes the scrollbar, so a
  // full-width element cannot end up wider than the visible area.
  root.style.setProperty('--vw', `${root.clientWidth * 0.01}px`);
};

export function initViewport(): () => void {
  setUnits();

  let frame = 0;
  const onResize = (): void => {
    // Resize fires continuously while dragging; collapse to one write a frame.
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(setUnits);
  };

  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', onResize, { passive: true });

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('orientationchange', onResize);
  };
}

export const prefersReducedMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Calls back whenever the reduced-motion preference changes mid-session. */
export function onReducedMotionChange(handler: (reduced: boolean) => void): () => void {
  const query = window.matchMedia('(prefers-reduced-motion: reduce)');
  const listener = (event: MediaQueryListEvent): void => handler(event.matches);
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}
