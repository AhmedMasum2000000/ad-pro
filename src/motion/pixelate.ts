/**
 * The site's one signature move: photographs resolve out of a pixel grid.
 *
 * An LED billboard *is* a grid of pixels. Everything else on this page is an
 * argument that we understand that medium, so the way an image arrives should
 * be an argument too — a photograph that assembles itself from coarse blocks
 * down to full resolution says "screen" before a single word is read.
 *
 * Cost is bounded deliberately. The canvas is created when the figure comes
 * into view and thrown away the moment the animation ends, so a 58-card grid
 * never holds more than a handful at once, and the whole effect is skipped
 * under `prefers-reduced-motion` or Save-Data — the real image was already in
 * the document.
 *
 * The one rule above all others: the canvas never covers an image that has
 * not decoded. A blank canvas over a blank image is the "empty card" bug, so
 * nothing starts until `img.complete` is true, and a watchdog removes any
 * canvas still standing after 1.2 seconds whatever happened to its timer.
 */

import { qsa } from '../lib/dom';
import { onReducedMotionChange, prefersReducedMotion } from '../lib/viewport';

export interface PixelateHandle {
  destroy: () => void;
}

/**
 * Block sizes, in source pixels, from coarsest to finest.
 *
 * Geometric rather than linear: perceived change between 64px and 48px blocks
 * is far smaller than between 6px and 4px, so even steps would spend most of
 * the animation on differences nobody can see and then snap into focus at the
 * end.
 */
const STEPS = [56, 34, 20, 12, 7, 4, 2];

/** How long each step holds. Seven steps at 60ms is just under half a second,
    which is long enough to read as deliberate and short enough that nobody
    waiting for the photograph feels blocked. */
const STEP_MS = 60;

/** Whatever happens, the overlay is gone by this point. */
const FALLBACK_MS = 1200;

/** Above this, the effect stops starting new canvases. Scrolling the whole
    inventory grid quickly would otherwise queue dozens of them. A phone gets
    half the budget: its GPU has less to spend and its viewport shows fewer. */
const MAX_LIVE_FINE = 6;
const MAX_LIVE_COARSE = 3;

let live = 0;

/** Every running animation's `finish`, so a teardown can clear them all. */
const running = new Set<() => void>();

function saveData(): boolean {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
  return nav.connection?.saveData === true;
}

function pixelate(figure: HTMLElement, image: HTMLImageElement, maxLive: number): void {
  if (live >= maxLive) return;
  if (!figure.isConnected || !image.complete || image.naturalWidth === 0) return;

  const rect = image.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'pixelate-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  // Every step reads the buffer back; the hint keeps the canvas on the CPU
  // path where that is cheap instead of round-tripping the GPU seven times.
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return;

  // Device pixels are wasted here — the whole point is that it is coarse — and
  // capping the buffer keeps the per-step redraw cheap on a phone.
  const width = Math.min(Math.round(rect.width), 900);
  const height = Math.round((width / rect.width) * rect.height);
  canvas.width = width;
  canvas.height = height;

  live += 1;
  figure.classList.add('is-pixelating');
  figure.appendChild(canvas);

  let step = 0;
  let timer = 0;
  let done = false;

  const finish = (): void => {
    if (done) return;
    done = true;
    window.clearTimeout(timer);
    window.clearTimeout(watchdog);
    canvas.remove();
    figure.classList.remove('is-pixelating');
    running.delete(finish);
    live -= 1;
  };
  running.add(finish);
  const watchdog = window.setTimeout(finish, FALLBACK_MS);

  const draw = (): void => {
    if (done) return;
    if (step >= STEPS.length) {
      finish();
      return;
    }
    const block = STEPS[step] ?? 2;
    const w = Math.max(1, Math.round(width / block));
    const h = Math.max(1, Math.round(height / block));

    try {
      // Down to a tiny buffer and back up with smoothing off: that second
      // draw is what produces square blocks rather than a blur.
      context.imageSmoothingEnabled = true;
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0, w, h);
      const small = context.getImageData(0, 0, w, h);

      const buffer = document.createElement('canvas');
      buffer.width = w;
      buffer.height = h;
      buffer.getContext('2d')?.putImageData(small, 0, 0);

      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, width, height);
      context.drawImage(buffer, 0, 0, width, height);
    } catch {
      // A cross-origin image taints the canvas; the photograph is underneath
      // regardless, so the right move is to get out of its way.
      finish();
      return;
    }

    step += 1;
    timer = window.setTimeout(draw, STEP_MS);
  };

  draw();
}

export function initPixelate(scope: ParentNode = document): PixelateHandle {
  const figures = qsa<HTMLElement>('[data-pixelate]', scope);
  if (figures.length === 0) return { destroy: () => {} };

  // The photograph is in the document either way. Reduced motion or a data
  // saver means it is simply there, with no assembly in front of it.
  if (prefersReducedMotion() || saveData()) return { destroy: () => {} };

  const maxLive = window.matchMedia('(pointer: coarse)').matches
    ? MAX_LIVE_COARSE
    : MAX_LIVE_FINE;

  const pendingLoads = new Map<HTMLImageElement, () => void>();

  const begin = (figure: HTMLElement): void => {
    const image = figure.querySelector('img');
    if (!image) return;

    if (image.complete && image.naturalWidth > 0) {
      pixelate(figure, image, maxLive);
      return;
    }
    if (image.complete) return; // Broken image: nothing to resolve.

    // Not decoded yet: wait, and only then start. The canvas must never be the
    // first thing to appear in the slot.
    const onLoad = (): void => {
      pendingLoads.delete(image);
      pixelate(figure, image, maxLive);
    };
    pendingLoads.set(image, onLoad);
    image.addEventListener('load', onLoad, { once: true });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const figure = entry.target as HTMLElement;
        observer.unobserve(figure);
        begin(figure);
      }
    },
    // Zero, not a fraction: a full-bleed figure can be taller than the
    // viewport, and a fractional threshold on one of those is unreachable.
    { rootMargin: '0px 0px -10% 0px', threshold: 0 },
  );

  figures.forEach((figure) => observer.observe(figure));

  const teardown = (): void => {
    observer.disconnect();
    pendingLoads.forEach((fn, img) => img.removeEventListener('load', fn));
    pendingLoads.clear();
    // Any canvas still drawing comes off now; the photograph is underneath.
    [...running].forEach((finish) => finish());
  };

  const stopMotionWatch = onReducedMotionChange((reduced) => {
    if (reduced) teardown();
  });

  return {
    destroy: () => {
      teardown();
      stopMotionWatch();
    },
  };
}
