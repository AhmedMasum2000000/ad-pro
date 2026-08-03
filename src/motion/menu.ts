/**
 * The fullscreen overlay menu.
 *
 * This module owns state, not motion: it toggles `body.menu-open`, locks
 * scroll, traps focus and restores it on close. The panel unfold and the
 * staggered link reveal are both CSS transitions keyed off that one class, so
 * they cannot drift out of step with each other.
 */

import { qs, qsa, trapFocus } from '../lib/dom';
import { startScroll, stopScroll } from './scroll';

interface MenuHandle {
  close: () => void;
  destroy: () => void;
}

export function initMenu(): MenuHandle {
  const wrapper = qs('#menu_wrapper');
  const toggle = qs<HTMLButtonElement>('#menu_toggle');
  const closeBtn = qs<HTMLButtonElement>('#menu_close');
  const panel = qs('.js-main-navigation');
  // Top-level links and their submenu items both close the menu on click —
  // a submenu link navigates just like a top-level one.
  const links = qsa('.menu-link, .menu-sublink');

  const noop: MenuHandle = { close: () => {}, destroy: () => {} };
  if (!wrapper || !toggle || !panel) return noop;

  let open = false;
  let releaseFocus: (() => void) | null = null;
  let lastFocused: HTMLElement | null = null;

  const setOpen = (next: boolean): void => {
    if (next === open) return;
    open = next;

    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    wrapper.setAttribute('aria-hidden', String(!open));

    if (open) {
      lastFocused = document.activeElement as HTMLElement | null;
      stopScroll();
      releaseFocus = trapFocus(panel);

      // The link reveal is CSS, keyed off `body.menu-open` — see the
      // `.menu-link` rules. Nothing to drive from here.

      // Focus the panel itself rather than the first link: announcing the
      // region before its contents is less abrupt for a screen reader.
      panel.setAttribute('tabindex', '-1');
      (panel as HTMLElement).focus({ preventScroll: true });
    } else {
      startScroll();
      releaseFocus?.();
      releaseFocus = null;
      lastFocused?.focus({ preventScroll: true });
    }
  };

  const onToggle = (): void => setOpen(!open);
  const onClose = (): void => setOpen(false);

  const onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
    }
  };

  // Clicking the backdrop — anywhere in the panel that isn't a link, the
  // close button, or the brand mark — closes it too, same as tapping outside
  // a modal.
  const onBackdropClick = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    if (target === panel) setOpen(false);
  };

  // A link click during a Barba navigation must close the menu, otherwise the
  // panel stays over the page that just loaded.
  const onLinkClick = (): void => setOpen(false);

  toggle.addEventListener('click', onToggle);
  closeBtn?.addEventListener('click', onClose);
  document.addEventListener('keydown', onKeydown);
  panel.addEventListener('click', onBackdropClick);
  links.forEach((link) => link.addEventListener('click', onLinkClick));

  return {
    close: () => setOpen(false),
    destroy: () => {
      toggle.removeEventListener('click', onToggle);
      closeBtn?.removeEventListener('click', onClose);
      document.removeEventListener('keydown', onKeydown);
      panel.removeEventListener('click', onBackdropClick);
      links.forEach((link) => link.removeEventListener('click', onLinkClick));
      releaseFocus?.();
    },
  };
}
