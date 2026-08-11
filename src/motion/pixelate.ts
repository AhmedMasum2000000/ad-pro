/**
 * The site's one signature move: photographs resolve out of a pixel grid.
 *
 * An LED billboard *is* a grid of pixels. Everything else on this page is an
 * argument that we understand that medium, so the way an image arrives should
 * be an argument too — a photograph that assembles itself from coarse blocks
 * down to full resolution says "screen" before a single word is read.
 *
 * It replaces the scattered ASCII decoration on the large figures. One move,
 * used consistently on the images that matter, reads as design; six different
 * effects sprinkled everywhere read as a demo.
 *
 * Cost is bounded deliberately. The canvas is created when the figure comes
 * into view and thrown away the moment the animation ends, so a 58-card grid
 * never holds more than a handful at once, and the whole effect is skipped
 * under `prefers-reduced-motion` — the real image was already in the document.
 */

import { qsa } from '../lib/dom';
import { prefersReducedMotion } from '../lib/viewport';

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

/** How long each step holds. Seven steps at 70ms is just under half a second,
    which is long enough to read as deliberate and short enough that nobody
    waiting for the photograph feels blocked. */
const STEP_MS = 70;

/** Above this, the effect stops starting new canvases. Scrolling the whole
    inventory grid quickly would otherwise queue dozens of them. */
const MAX_LIVE = 6;

let live = 0;

function pixelate(figure: HTMLElement, image: HTMLImageElement): void {
  if (live >= MAX_LIVE) return;

  const rect = image.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'pixelate-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const context = canvas.getContext('2d');
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

  const finish = (): void => {
    window.clearTimeout(timer);
    canvas.remove();
    figure.classList.remove('is-pixelating');
    live -= 1;
  };

  const draw = (): void => {
    if (step >= STEPS.length) {
      finish();
      return;
    }
    const block = STEPS[step];
    const w = Math.max(1, Math.round(width / block));
    const h = Math.max(1, Math.round(height / block));

    // Down to a tiny buffer and back up with smoothing off: that second draw
    // is what produces square blocks rather than a blur.
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

    step += 1;
    timer = window.setTimeout(draw, STEP_MS);
  };

  // Drawing an image that has not finished decoding produces an empty canvas
  // and a visible flash of nothing where the photograph should be.
  const start = (): void => {
    if (!figure.isConnected) {
      finish();
      return;
    }
    draw();
  };

  if (image.complete && image.naturalWidth > 0) start();
  else image.addEventListener('load', start, { once: true });
}

export function initPixelate(scope: ParentNode = document): PixelateHandle {
  const figures = qsa<HTMLElement>('[data-pixelate]', scope);
  if (figures.length === 0) return { destroy: () => {} };

  // The photograph is in the document either way. Reduced motion means it is
  // simply there, with no assembly in front of it.
  if (prefersReducedMotion()) return { destroy: () => {} };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const figure = entry.target as HTMLElement;
        observer.unobserve(figure);
        const image = figure.querySelector('img');
        if (image) pixelate(figure, image);
      }
    },
    // Zero, not a fraction: a full-bleed figure can be taller than the
    // viewport, and a fractional threshold on one of those is unreachable.
    { rootMargin: '0px 0px -10% 0px', threshold: 0 },
  );

  figures.forEach((figure) => observer.observe(figure));

  return { destroy: () => observer.disconnect() };
}
