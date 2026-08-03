/**
 * Cookie notice.
 *
 * Purely a dismissible bar — this template sets no cookies and loads no
 * third-party scripts, so there is nothing to gate behind consent. It exists
 * because the layout has a slot for it; wire it to a real consent store
 * before shipping anything that actually tracks.
 */

import { qs } from '../lib/dom';

const STORAGE_KEY = 'cookie-notice-dismissed';

export function initCookieNotice(): void {
  const wrapper = qs('#cookie-alert-wrapper');
  const button = qs<HTMLButtonElement>('#hide-alert');
  if (!wrapper || !button) return;

  // localStorage throws in private mode in some browsers; a notice that
  // reappears is a smaller problem than a boot sequence that dies here.
  let dismissed = false;
  try {
    dismissed = localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    dismissed = false;
  }

  if (dismissed) {
    wrapper.hidden = true;
    return;
  }

  wrapper.hidden = false;

  button.addEventListener('click', () => {
    wrapper.classList.add('is-dismissed');
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* nothing to do — the notice simply returns next visit */
    }
    // Removed from the layout only after the fade, so it does not vanish
    // mid-transition.
    window.setTimeout(() => {
      wrapper.hidden = true;
    }, 700);
  });
}
