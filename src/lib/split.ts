/**
 * Word splitting for masked reveals.
 *
 * Hand-rolled rather than SplitText: the only thing the reveals need is each
 * word in its own `overflow: hidden` mask, so a heading can slide up into view
 * line by line. The split walks text nodes rather than rewriting `innerHTML`,
 * which means a `<br>`, an `<em>` or a link inside the heading survives with
 * its markup — and its listeners — intact.
 *
 * Accessibility is handled here, once, so no caller can forget it: a screen
 * reader is given the original sentence as `aria-label` on the heading and the
 * word spans are hidden from it, because a heading read out as twenty separate
 * one-word elements is a worse experience than no animation at all.
 */

export interface SplitHandle {
  /** The inner spans, in document order — the things to animate. */
  words: HTMLElement[];
  /** Puts the original text nodes back and clears the aria attributes. */
  revert: () => void;
}

interface Replacement {
  original: Text;
  inserted: Node[];
}

const splits = new WeakMap<HTMLElement, SplitHandle>();

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

function wrapWord(word: string): HTMLElement {
  const mask = document.createElement('span');
  mask.className = 'w';
  const inner = document.createElement('span');
  inner.className = 'w__in';
  inner.textContent = word;
  mask.appendChild(inner);
  return mask;
}

/**
 * Splits the words of `el` into `.w > .w__in` masks.
 *
 * Idempotent: a heading that is split twice — Barba re-mounting a page that
 * was not torn down cleanly, a reveal and a hero both claiming the same h1 —
 * gets the existing handle back rather than nested masks.
 */
export function splitWords(el: HTMLElement): SplitHandle {
  const existing = splits.get(el);
  if (existing) return existing;

  const label = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
  const replacements: Replacement[] = [];
  const words: HTMLElement[] = [];

  for (const original of textNodesOf(el)) {
    const parent = original.parentNode;
    if (!parent) continue;

    // Split on runs of whitespace but keep them: the gap between two words is
    // still a text node, so the browser wraps lines exactly where it would
    // have wrapped the plain sentence.
    const pieces = (original.nodeValue ?? '').split(/(\s+)/);
    const inserted: Node[] = [];

    for (const piece of pieces) {
      if (piece === '') continue;
      if (/^\s+$/.test(piece)) {
        inserted.push(document.createTextNode(' '));
        continue;
      }
      const mask = wrapWord(piece);
      mask.setAttribute('aria-hidden', 'true');
      words.push(mask.firstElementChild as HTMLElement);
      inserted.push(mask);
    }

    for (const node of inserted) parent.insertBefore(node, original);
    parent.removeChild(original);
    replacements.push({ original, inserted });
  }

  if (label) el.setAttribute('aria-label', label);
  el.dataset.split = el.dataset.split ?? 'words';

  const handle: SplitHandle = {
    words,
    revert: () => {
      for (const { original, inserted } of replacements) {
        const first = inserted[0];
        const parent = first?.parentNode;
        if (!parent) continue;
        parent.insertBefore(original, first);
        for (const node of inserted) node.parentNode?.removeChild(node);
      }
      el.removeAttribute('aria-label');
      splits.delete(el);
    },
  };

  splits.set(el, handle);
  return handle;
}

/** The handle for an element that was already split, if any. */
export const getSplit = (el: HTMLElement): SplitHandle | undefined => splits.get(el);
