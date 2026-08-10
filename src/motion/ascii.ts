/**
 * The ASCII layer.
 *
 * Two effects, both built around the same idea: an LED billboard is already a
 * grid of discrete cells, so rendering the site in characters is thematically
 * honest rather than decorative.
 *
 * 1. **Scramble.** A heading resolves out of random glyphs, character by
 *    character, when it comes into view. Cheap — one rAF loop shared by every
 *    heading on the page, and it stops the moment the last one settles.
 *
 * 2. **Halftone.** A photograph is sampled down to a grid of luminance values
 *    and redrawn as characters. This is the expensive one, so it is drawn
 *    once into a canvas and then simply shown or hidden — no per-frame work,
 *    and nothing at all on a touch device.
 *
 * The whole module is inert under `prefers-reduced-motion`: headings render
 * as plain text and the halftone canvas is never built.
 */

import { prefersReducedMotion } from '../lib/viewport';
import { qsa } from '../lib/dom';

export interface AsciiHandle {
  destroy: () => void;
}

/* --- scramble --------------------------------------------------------------- */

// Glyphs chosen to read as machine noise rather than as letters: no vowels,
// nothing that briefly spells a word while it settles.
const NOISE = '▚▞▓▒░#%@*+=-:.<>/\\|_';

interface ScrambleState {
  el: HTMLElement;
  text: string;
  /** Frame index at which each character stops scrambling. */
  settles: number[];
  frame: number;
  done: boolean;
}

function makeState(el: HTMLElement): ScrambleState {
  const text = el.textContent ?? '';
  // Each character settles at a slightly different time, weighted so the line
  // resolves left to right instead of all at once.
  const settles = [...text].map((_, i) => Math.round(i * 1.6 + Math.random() * 14));
  return { el, text, settles, frame: 0, done: false };
}

function step(state: ScrambleState): boolean {
  let out = '';
  let settled = true;

  for (let i = 0; i < state.text.length; i++) {
    const char = state.text[i];
    // Whitespace never scrambles; a jumping word gap reads as a layout bug.
    if (char === ' ' || char === '\n') {
      out += char;
      continue;
    }
    if (state.frame >= state.settles[i]) {
      out += char;
    } else {
      out += NOISE[(Math.random() * NOISE.length) | 0];
      settled = false;
    }
  }

  state.el.textContent = out;
  state.frame += 1;
  return settled;
}

/**
 * Resolves `[data-scramble]` headings when they scroll into view.
 *
 * The original text is stashed on the element before the first frame, so a
 * Barba navigation that re-runs this cannot end up scrambling noise that was
 * itself left over from a previous scramble.
 */
export function initScramble(scope: ParentNode = document): AsciiHandle {
  const targets = qsa<HTMLElement>('[data-scramble]', scope);
  if (targets.length === 0 || prefersReducedMotion()) return { destroy: () => {} };

  const running = new Set<ScrambleState>();
  let raf = 0;

  const tick = (): void => {
    for (const state of running) {
      if (step(state)) {
        state.el.textContent = state.text;
        state.el.classList.add('is-scrambled');
        running.delete(state);
      }
    }
    raf = running.size > 0 ? requestAnimationFrame(tick) : 0;
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        observer.unobserve(el);

        // Stash once, so re-entry never captures a half-scrambled string.
        if (!el.dataset.scrambleText) el.dataset.scrambleText = el.textContent ?? '';
        const state = makeState(el);
        state.text = el.dataset.scrambleText;
        running.add(state);

        if (raf === 0) raf = requestAnimationFrame(tick);
      }
    },
    { threshold: 0.25, rootMargin: '0px 0px -8% 0px' },
  );

  targets.forEach((el) => observer.observe(el));

  return {
    destroy: () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
      // Leave the copy readable if we are torn down mid-flight.
      for (const state of running) state.el.textContent = state.text;
      running.clear();
    },
  };
}

/* --- halftone --------------------------------------------------------------- */

// Darkest to lightest. The ramp is deliberately short: a long ramp produces a
// mushy grey field, where eight steps keep the billboard's edges readable.
const RAMP = '@%#*+=-:. ';

const COLS_DESKTOP = 110;

/**
 * Draws `img` into `canvas` as characters.
 *
 * Sampling is done on a small offscreen canvas — one pixel per output cell —
 * so the cost is the number of characters, not the number of pixels in the
 * source photograph.
 */
function paintHalftone(img: HTMLImageElement, canvas: HTMLCanvasElement, cols: number): void {
  const aspect = img.naturalHeight / img.naturalWidth;
  // Characters are about twice as tall as they are wide, so the row count has
  // to be halved or the picture comes out stretched.
  const rows = Math.max(1, Math.round((cols * aspect) / 2));

  const sampler = document.createElement('canvas');
  sampler.width = cols;
  sampler.height = rows;
  const sctx = sampler.getContext('2d', { willReadFrequently: true });
  if (!sctx) return;
  sctx.drawImage(img, 0, 0, cols, rows);

  let data: Uint8ClampedArray;
  try {
    data = sctx.getImageData(0, 0, cols, rows).data;
  } catch {
    // A cross-origin image taints the canvas. Nothing to do but skip.
    return;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cell = 7;
  const width = cols * cell * 0.6;
  const height = rows * cell;

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.aspectRatio = `${width} / ${height}`;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  ctx.fillStyle = '#0e1420';
  ctx.fillRect(0, 0, width, height);
  ctx.font = `${cell}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.textBaseline = 'top';

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4;
      // Rec. 601 luma — closer to perceived brightness than a flat average,
      // which matters because these photographs are mostly sky and concrete.
      const luma = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
      const char = RAMP[Math.min(RAMP.length - 1, ((1 - luma) * RAMP.length) | 0)];
      if (char === ' ') continue;

      // Brighter cells lean towards the brand blue, so the result reads as a
      // lit screen rather than a photocopy.
      ctx.fillStyle = luma > 0.62 ? '#6ba3e8' : luma > 0.3 ? '#4e84d2' : '#2b3d59';
      ctx.fillText(char, x * cell * 0.6, y * cell);
    }
  }
}

/**
 * Gives `[data-ascii]` figures a character-rendered twin, revealed on hover.
 *
 * Pointer-only and lazy: the canvas is not built until the figure is near the
 * viewport, and never on a touch device, where there is no hover to reveal it
 * and the work would be pure cost.
 */
export function initHalftone(scope: ParentNode = document): AsciiHandle {
  const figures = qsa<HTMLElement>('[data-ascii]', scope);
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (figures.length === 0 || !canHover || prefersReducedMotion()) {
    return { destroy: () => {} };
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const figure = entry.target as HTMLElement;
        observer.unobserve(figure);

        const img = figure.querySelector('img');
        if (!(img instanceof HTMLImageElement)) continue;

        const canvas = document.createElement('canvas');
        canvas.className = 'ascii-canvas';
        canvas.setAttribute('aria-hidden', 'true');

        const draw = (): void => {
          try {
            paintHalftone(img, canvas, COLS_DESKTOP);
            figure.appendChild(canvas);
            figure.classList.add('has-ascii');
          } catch {
            /* A failed decoration is not worth breaking a page over. */
          }
        };

        if (img.complete && img.naturalWidth > 0) draw();
        else img.addEventListener('load', draw, { once: true });
      }
    },
    { rootMargin: '200px' },
  );

  figures.forEach((f) => observer.observe(f));

  return {
    destroy: () => {
      observer.disconnect();
      figures.forEach((f) => {
        f.querySelector('.ascii-canvas')?.remove();
        f.classList.remove('has-ascii');
      });
    },
  };
}
