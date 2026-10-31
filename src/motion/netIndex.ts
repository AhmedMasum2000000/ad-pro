/**
 * The network index preview.
 *
 * Ten city rows, one floating photograph. Hovering or tabbing to a row swaps
 * the lead board of that city into the preview and slides it in; leaving the
 * list slides it away. Fine pointers only — on a phone the preview is hidden
 * by CSS and the rows are simply links — and the motion itself is a CSS
 * transition on `.is-on`, so this module only writes a `src` and a class.
 */

import { qs, qsa } from '../lib/dom';
import { prefersReducedMotion } from '../lib/viewport';

export interface NetIndexHandle {
  destroy: () => void;
}

export function initNetIndex(scope: ParentNode = document): NetIndexHandle {
  const preview = qs<HTMLElement>('[data-net-preview]', scope);
  const links = qsa<HTMLElement>('.net-index__link[data-preview]', scope);
  if (!preview || links.length === 0) return { destroy: () => {} };
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    return { destroy: () => {} };
  }

  const img = qs<HTMLImageElement>('img', preview);
  const list = links[0]?.closest<HTMLElement>('.net-index') ?? preview.parentElement;

  let hideTimer = 0;

  const showFor = (link: HTMLElement): void => {
    const src = link.dataset.preview;
    if (!src) return;
    window.clearTimeout(hideTimer);
    if (img && img.getAttribute('src') !== src) img.src = src;
    if (prefersReducedMotion()) {
      preview.classList.remove('is-on');
      return;
    }
    preview.classList.add('is-on');
  };

  const hide = (): void => {
    // A beat of grace so moving between two rows does not flicker the panel.
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => preview.classList.remove('is-on'), 80);
  };

  const onEnter = (event: Event): void => showFor(event.currentTarget as HTMLElement);
  const onFocus = (event: FocusEvent): void => {
    const link = (event.target as HTMLElement).closest<HTMLElement>('.net-index__link[data-preview]');
    if (link) showFor(link);
  };
  const onFocusOut = (event: FocusEvent): void => {
    const to = event.relatedTarget as HTMLElement | null;
    if (!to || !list?.contains(to)) hide();
  };

  links.forEach((link) => link.addEventListener('pointerenter', onEnter));
  list?.addEventListener('pointerleave', hide);
  list?.addEventListener('focusin', onFocus);
  list?.addEventListener('focusout', onFocusOut);

  return {
    destroy: () => {
      window.clearTimeout(hideTimer);
      links.forEach((link) => link.removeEventListener('pointerenter', onEnter));
      list?.removeEventListener('pointerleave', hide);
      list?.removeEventListener('focusin', onFocus);
      list?.removeEventListener('focusout', onFocusOut);
      preview.classList.remove('is-on');
    },
  };
}
