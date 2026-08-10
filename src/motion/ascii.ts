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
  /** The text nodes inside the element, with their original content. */
  parts: { node: Text; text: string; settles: number[] }[];
  frame: number;
}

/**
 * Collects the text nodes under an element.
 *
 * Scrambling `textContent` destroys markup — a heading written as
 * "Grow your brand<br />like a pro" comes back as "brandlike", which is how
 * this bug announced itself. Walking the text nodes instead means a line
 * break, an `<em>` or a nested span all survive the effect.
 */
function textNodesOf(el: HTMLElement): Text[] {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node = walker.nextNode();
  while (node) {
    if (node.nodeValue && node.nodeValue.trim()) nodes.push(node as Text);
    node = walker.nextNode();
  }
  return nodes;
}

function makeState(el: HTMLElement): ScrambleState {
  // Settle order runs across the element as a whole rather than restarting
  // per node, so a two-line heading still resolves left to right, top to
  // bottom instead of both lines racing each other.
  let offset = 0;
  const parts = textNodesOf(el).map((node) => {
    const text = node.nodeValue ?? '';
    const settles = [...text].map((_, i) =>
      Math.round((offset + i) * 1.6 + Math.random() * 14),
    );
    offset += text.length;
    return { node, text, settles };
  });
  return { el, parts, frame: 0 };
}

function step(state: ScrambleState): boolean {
  let settled = true;

  for (const part of state.parts) {
    let out = '';
    for (let i = 0; i < part.text.length; i++) {
      const char = part.text[i];
      // Whitespace never scrambles; a jumping word gap reads as a layout bug.
      if (char === ' ' || char === '\n') {
        out += char;
        continue;
      }
      if (state.frame >= part.settles[i]) {
        out += char;
      } else {
        out += NOISE[(Math.random() * NOISE.length) | 0];
        settled = false;
      }
    }
    part.node.nodeValue = out;
  }

  state.frame += 1;
  return settled;
}

/** Puts every text node back exactly as it was found. */
function restore(state: ScrambleState): void {
  for (const part of state.parts) part.node.nodeValue = part.text;
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
        restore(state);
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

        // `unobserve` above means this runs once per element, so the text
        // captured here is always the original rather than a scrambled frame.
        const state = makeState(el);
        if (state.parts.length === 0) continue;
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
      for (const state of running) restore(state);
      running.clear();
    },
  };
}

/* --- halftone --------------------------------------------------------------- */

// Darkest to lightest. The ramp is deliberately short: a long ramp produces a
// mushy grey field, where eight steps keep the billboard's edges readable.
const RAMP = '@%#*+=-:. ';

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
 * Gives `[data-ascii]` figures a character-rendered twin.
 *
 * On a pointer device the twin is revealed on hover. On a touch device there
 * is no hover, so the figure gets a **decode button** instead — the effect is
 * the point of the page's character, and hiding it from everyone on a phone
 * would be the wrong trade. What touch does not get is *automatic* building:
 * nothing is rendered until the visitor asks for it.
 *
 * Canvases are budgeted. The inventory pages carry 58 figures and a canvas
 * each would be tens of megabytes of backing store; instead a figure that
 * scrolls well clear of the viewport releases its canvas and rebuilds it if
 * the visitor comes back.
 */
const MAX_LIVE_CANVASES = 12;

export function initHalftone(scope: ParentNode = document): AsciiHandle {
  const figures = qsa<HTMLElement>('[data-ascii]', scope);
  if (figures.length === 0 || prefersReducedMotion()) return { destroy: () => {} };

  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const live = new Set<HTMLElement>();

  const release = (figure: HTMLElement): void => {
    figure.querySelector('.ascii-canvas')?.remove();
    figure.classList.remove('has-ascii', 'is-decoded');
    live.delete(figure);
  };

  const build = (figure: HTMLElement): boolean => {
    if (live.has(figure)) return true;

    const img = figure.querySelector('img');
    if (!(img instanceof HTMLImageElement) || !img.complete || img.naturalWidth === 0) {
      return false;
    }

    // Fewer columns on a small figure: a card at 320px wide cannot show 110
    // characters legibly, and rendering them is work nobody can see.
    const cols = figure.clientWidth > 640 ? 110 : figure.clientWidth > 320 ? 78 : 54;

    const canvas = document.createElement('canvas');
    canvas.className = 'ascii-canvas';
    canvas.setAttribute('aria-hidden', 'true');

    try {
      paintHalftone(img, canvas, cols);
    } catch {
      return false;
    }

    figure.appendChild(canvas);
    figure.classList.add('has-ascii');
    live.add(figure);

    // Oldest first — `Set` preserves insertion order, so this is an LRU by
    // creation without keeping a second structure.
    while (live.size > MAX_LIVE_CANVASES) {
      const oldest = live.values().next().value as HTMLElement | undefined;
      if (!oldest || oldest === figure) break;
      release(oldest);
    }
    return true;
  };

  /** Adds the tap-to-decode control that a touch device needs. */
  const addToggle = (figure: HTMLElement): void => {
    if (figure.querySelector('.ascii-toggle')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'ascii-toggle';
    button.textContent = 'Decode';
    button.setAttribute('aria-pressed', 'false');

    button.addEventListener('click', () => {
      const on = figure.classList.contains('is-decoded');
      if (!on && !build(figure)) return;
      figure.classList.toggle('is-decoded', !on);
      button.setAttribute('aria-pressed', String(!on));
      button.textContent = on ? 'Decode' : 'Photo';
    });

    figure.appendChild(button);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const figure = entry.target as HTMLElement;

        if (entry.isIntersecting) {
          if (canHover) {
            const img = figure.querySelector('img');
            if (img instanceof HTMLImageElement && !img.complete) {
              img.addEventListener('load', () => build(figure), { once: true });
            } else {
              build(figure);
            }
          } else {
            addToggle(figure);
          }
        } else if (canHover) {
          release(figure);
        }
      }
    },
    { rootMargin: '150px' },
  );

  figures.forEach((f) => observer.observe(f));

  return {
    destroy: () => {
      observer.disconnect();
      figures.forEach((f) => {
        release(f);
        f.querySelector('.ascii-toggle')?.remove();
      });
      live.clear();
    },
  };
}

/* --- hover scramble ---------------------------------------------------------
   Links and buttons resolve through noise when the pointer arrives. The
   restraint here is deliberate: only elements whose entire content is a
   single text node are eligible, because scrambling an element with children
   would destroy the markup inside it. */

const HOVER_FRAMES = 12;

function isPlainText(el: Element): boolean {
  return el.childNodes.length === 1 && el.firstChild?.nodeType === Node.TEXT_NODE;
}

export function initHoverScramble(scope: ParentNode = document): AsciiHandle {
  if (prefersReducedMotion()) return { destroy: () => {} };
  // A touch device has no hover; firing this on tap would delay the
  // navigation the tap just started.
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    return { destroy: () => {} };
  }

  const targets = qsa<HTMLElement>(
    '.text-link, .btn, .menu-link, .nav-link, .filter-btn, .answer-list__q, .news-card__title',
    scope,
  ).filter(isPlainText);

  const timers = new Map<HTMLElement, number>();

  const scramble = (el: HTMLElement): void => {
    if (timers.has(el)) return;
    const text = el.textContent ?? '';
    if (!text.trim()) return;

    let frame = 0;
    const tick = (): void => {
      frame += 1;
      if (frame >= HOVER_FRAMES) {
        el.textContent = text;
        timers.delete(el);
        return;
      }
      // Resolves left to right: each character locks once the run has passed
      // it, so the word appears to be read rather than to flicker.
      const locked = Math.floor((frame / HOVER_FRAMES) * text.length);
      let out = '';
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        out +=
          i < locked || char === ' '
            ? char
            : NOISE[(Math.random() * NOISE.length) | 0];
      }
      el.textContent = out;
      timers.set(el, requestAnimationFrame(tick));
    };

    timers.set(el, requestAnimationFrame(tick));
  };

  const onEnter = (event: Event): void => scramble(event.currentTarget as HTMLElement);
  targets.forEach((el) => el.addEventListener('pointerenter', onEnter));

  return {
    destroy: () => {
      targets.forEach((el) => {
        el.removeEventListener('pointerenter', onEnter);
        const id = timers.get(el);
        if (id) cancelAnimationFrame(id);
      });
      timers.clear();
    },
  };
}

/* --- animated rules ---------------------------------------------------------
   A horizontal line made of characters that shuffle slowly. One shared
   interval for every rule on the page, and it only runs while at least one of
   them is on screen. */

const RULE_GLYPHS = '─═━·:+*=';

export function initAsciiRules(scope: ParentNode = document): AsciiHandle {
  const rules = qsa<HTMLElement>('[data-ascii-rule]', scope);
  if (rules.length === 0) return { destroy: () => {} };

  const visible = new Set<HTMLElement>();
  let timer = 0;

  const fill = (el: HTMLElement, animate: boolean): void => {
    // Character count from the element's own width, so the rule spans it
    // exactly rather than overflowing and being clipped.
    const count = Math.max(8, Math.floor(el.clientWidth / 9));
    let out = '';
    for (let i = 0; i < count; i++) {
      out += animate && Math.random() > 0.86
        ? RULE_GLYPHS[(Math.random() * RULE_GLYPHS.length) | 0]
        : '─';
    }
    el.textContent = out;
  };

  const tick = (): void => {
    for (const el of visible) fill(el, true);
  };

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const el = entry.target as HTMLElement;
      if (entry.isIntersecting) {
        fill(el, !prefersReducedMotion());
        visible.add(el);
      } else {
        visible.delete(el);
      }
    }

    // Start and stop with visibility: a rule scrolled past costs nothing.
    if (visible.size > 0 && timer === 0 && !prefersReducedMotion()) {
      timer = window.setInterval(tick, 220);
    } else if (visible.size === 0 && timer !== 0) {
      clearInterval(timer);
      timer = 0;
    }
  });

  rules.forEach((el) => observer.observe(el));

  const onResize = (): void => visible.forEach((el) => fill(el, false));
  window.addEventListener('resize', onResize, { passive: true });

  return {
    destroy: () => {
      observer.disconnect();
      if (timer) clearInterval(timer);
      window.removeEventListener('resize', onResize);
      visible.clear();
    },
  };
}

/* --- pointer trail ----------------------------------------------------------
   Characters shed behind the pointer, fading as they go. Spawned as elements
   with a CSS animation and removed on its end, so the browser composites them
   and no JavaScript runs per frame. */

const TRAIL_GLYPHS = '01#*+=:.';
const TRAIL_EVERY = 55;

export function initPointerTrail(): AsciiHandle {
  if (prefersReducedMotion()) return { destroy: () => {} };
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    return { destroy: () => {} };
  }

  const layer = document.createElement('div');
  layer.className = 'ascii-trail';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);

  let last = 0;

  const onMove = (event: PointerEvent): void => {
    const now = performance.now();
    if (now - last < TRAIL_EVERY) return;
    last = now;

    const span = document.createElement('span');
    span.className = 'ascii-trail__glyph';
    span.textContent = TRAIL_GLYPHS[(Math.random() * TRAIL_GLYPHS.length) | 0];
    span.style.left = `${event.clientX}px`;
    span.style.top = `${event.clientY}px`;
    // A little lateral drift so the trail scatters rather than forming a
    // dotted line exactly along the path.
    span.style.setProperty('--drift', `${(Math.random() - 0.5) * 26}px`);
    layer.appendChild(span);
    span.addEventListener('animationend', () => span.remove(), { once: true });
  };

  window.addEventListener('pointermove', onMove, { passive: true });

  return {
    destroy: () => {
      window.removeEventListener('pointermove', onMove);
      layer.remove();
    },
  };
}
