/**
 * Scramble: text that resolves out of machine noise.
 *
 * An LED billboard is already a grid of discrete cells, so a heading or a
 * readout that settles character by character is thematically honest rather
 * than decorative. It is the one piece of the old "ASCII layer" that earned
 * its keep; the pointer trail, the shuffling rules and the halftone twin were
 * texture for its own sake and are gone.
 *
 * Three entry points share one glyph set:
 *
 * 1. `initScramble` — `[data-scramble]` elements resolve when they scroll
 *    into view. One rAF loop for every element on the page, and it stops the
 *    moment the last one settles.
 * 2. `initHoverScramble` — small links resolve through noise when the pointer
 *    arrives. Deliberately limited to plain-text links.
 * 3. `scrambleTo` — an imperative version for the hero readouts, which are
 *    rewritten every time the switcher changes site.
 *
 * The whole module is inert under `prefers-reduced-motion`.
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

const noise = (): string => NOISE[(Math.random() * NOISE.length) | 0] ?? '#';

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
      if (state.frame >= (part.settles[i] ?? 0)) {
        out += char;
      } else {
        out += noise();
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

/* --- imperative scramble ------------------------------------------------------
   For the hero readouts: the switcher rewrites them on every site change, so
   the trigger is a call rather than an intersection. Resolves left to right
   over `frames` frames; the returned function cancels and writes the final
   text at once, which is what a fast second switch or a teardown needs. */

export function scrambleTo(el: HTMLElement, text: string, frames = 12): () => void {
  if (prefersReducedMotion() || frames <= 0) {
    el.textContent = text;
    return () => {};
  }

  let frame = 0;
  let raf = 0;

  const tick = (): void => {
    frame += 1;
    if (frame >= frames) {
      el.textContent = text;
      raf = 0;
      return;
    }
    const locked = Math.floor((frame / frames) * text.length);
    let out = '';
    for (let i = 0; i < text.length; i++) {
      const char = text[i] ?? '';
      out += i < locked || char === ' ' ? char : noise();
    }
    el.textContent = out;
    raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);

  return () => {
    if (raf !== 0) cancelAnimationFrame(raf);
    raf = 0;
    el.textContent = text;
  };
}

/* --- hover scramble ---------------------------------------------------------
   Links resolve through noise when the pointer arrives. The restraint here is
   deliberate: only elements whose entire content is a single text node are
   eligible, because scrambling an element with children would destroy the
   markup inside it — which is also why `.btn` (whose text sits in a
   `.btn__label` for the magnetic counter-move) is no longer on the list. */

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

  const targets = qsa<HTMLElement>('.text-link, .nav-link, .filter-btn', scope).filter(
    isPlainText,
  );

  const cancels = new Map<HTMLElement, () => void>();

  const onEnter = (event: Event): void => {
    const el = event.currentTarget as HTMLElement;
    if (cancels.has(el)) return;
    const text = el.textContent ?? '';
    if (!text.trim()) return;
    const cancel = scrambleTo(el, text, HOVER_FRAMES);
    cancels.set(el, cancel);
    window.setTimeout(() => cancels.delete(el), (HOVER_FRAMES + 1) * 17);
  };

  targets.forEach((el) => el.addEventListener('pointerenter', onEnter));

  return {
    destroy: () => {
      targets.forEach((el) => el.removeEventListener('pointerenter', onEnter));
      cancels.forEach((cancel) => cancel());
      cancels.clear();
    },
  };
}
