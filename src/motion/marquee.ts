/**
 * Infinite marquee.
 *
 * The animation itself is CSS (see components.css) so it keeps running on the
 * compositor without JS. This module only duplicates the track enough times
 * to cover the viewport — a single copy leaves a gap on a wide screen, and
 * hard-coding the number of copies breaks at some window size.
 */

import { qsa } from '../lib/dom';

export function initMarquee(scope: ParentNode = document): void {
  const marquees = qsa('.marquee', scope);

  for (const marquee of marquees) {
    const track = marquee.querySelector<HTMLElement>('.marquee__track');
    if (!track || track.dataset.cloned === '1') continue;

    const single = track.innerHTML;
    const width = track.scrollWidth;
    if (width === 0) continue;

    // Two viewports' worth guarantees a copy is always entering as another
    // leaves, whatever the ratio of track width to screen width.
    const copies = Math.max(2, Math.ceil((window.innerWidth * 2) / width));
    track.innerHTML = single.repeat(copies);
    track.dataset.cloned = '1';

    // Duplicates are decoration; one reading of the list is enough.
    track.setAttribute('aria-hidden', 'true');
  }
}
