/** Typed DOM helpers, scoped so they can run against a Barba container. */

export const qs = <T extends Element = HTMLElement>(
  selector: string,
  scope: ParentNode = document,
): T | null => scope.querySelector<T>(selector);

export const qsa = <T extends Element = HTMLElement>(
  selector: string,
  scope: ParentNode = document,
): T[] => Array.from(scope.querySelectorAll<T>(selector));

/** Escapes text destined for `innerHTML`. */
export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Traps Tab within `container`.
 *
 * The overlay menu covers the page but leaves the document behind it in the
 * tab order, so without this a keyboard user tabs straight out of an open
 * menu into links they cannot see.
 */
export function trapFocus(container: HTMLElement): () => void {
  const FOCUSABLE =
    'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

  const onKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return;

    // Queried per keypress rather than cached: the menu staggers its links in,
    // so the set of focusable elements changes while the panel is opening.
    const items = qsa<HTMLElement>(FOCUSABLE, container).filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    );
    if (items.length === 0) return;

    const first = items[0]!;
    const last = items[items.length - 1]!;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  container.addEventListener('keydown', onKeydown);
  return () => container.removeEventListener('keydown', onKeydown);
}
