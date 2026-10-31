/**
 * Image load state.
 *
 * Every `[data-load]` image gets `.is-loaded` once it has decoded — or
 * failed, which for a placeholder is the same answer: stop shimmering. The
 * board cards show a shimmer in the slot until then, which is what turns a
 * blank card into a card that is visibly on its way.
 *
 * Images that were already complete by the time this runs (cached, or eager
 * and fast) are marked synchronously, so a repeat visit never shimmers at
 * all. The class goes on the `<img>` — the CSS reads it from the media
 * wrapper with `:has()` — and, belt and braces, on the wrapper itself, for
 * any engine without `:has()`.
 */

import { qsa } from '../lib/dom';

export interface ImagesHandle {
  destroy: () => void;
}

const WRAPPER = '[data-pixelate], .board-card__media, .plate, .format-pane__media';

function mark(img: HTMLImageElement): void {
  img.classList.add('is-loaded');
  img.closest<HTMLElement>(WRAPPER)?.classList.add('is-loaded');
}

export function initImages(scope: ParentNode = document): ImagesHandle {
  const images = qsa<HTMLImageElement>('img[data-load]', scope);
  if (images.length === 0) return { destroy: () => {} };

  const bound: HTMLImageElement[] = [];
  const onSettled = (event: Event): void => mark(event.currentTarget as HTMLImageElement);

  for (const img of images) {
    if (img.complete) {
      mark(img);
      continue;
    }
    img.addEventListener('load', onSettled, { once: true });
    img.addEventListener('error', onSettled, { once: true });
    bound.push(img);
  }

  return {
    destroy: () => {
      for (const img of bound) {
        img.removeEventListener('load', onSettled);
        img.removeEventListener('error', onSettled);
      }
    },
  };
}
