/**
 * Infinite marquees.
 *
 * The animation itself is CSS (translateX 0→−50%, see components.css) so it
 * keeps running on the compositor without JS. This module only duplicates the
 * track enough times to cover the viewport — a single copy leaves a gap on a
 * wide screen, and hard-coding the number of copies breaks at some window
 * size — and it does so by cloning *after* the first full copy, so the track
 * starts on a whole item rather than mid-word.
 *
 * Two tracks use it: the slim `.marquee__track` strip above the footer and
 * the two `.client-marquee__row`s on the home page. The copy count is always
 * even so the −50% keyframe lands on a seam.
 */

import { qsa } from '../lib/dom';

const TRACKS = '.marquee__track, .client-marquee__row[data-marquee-row]';

export function initMarquee(scope: ParentNode = document): void {
  for (const track of qsa<HTMLElement>(TRACKS, scope)) {
    if (track.dataset.cloned === '1') continue;

    const originals = Array.from(track.children);
    const width = track.scrollWidth;
    if (originals.length === 0 || width === 0) continue;

    // Two viewports' worth guarantees a copy is always entering as another
    // leaves, whatever the ratio of track width to screen width. Rounded up
    // to an even number so the halfway point of the loop is a clean seam.
    let copies = Math.max(2, Math.ceil((window.innerWidth * 2) / width));
    if (copies % 2 === 1) copies += 1;

    for (let i = 1; i < copies; i++) {
      for (const node of originals) {
        const clone = node.cloneNode(true) as HTMLElement;
        // Duplicates are decoration; one reading of the list is enough.
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      }
    }

    track.dataset.cloned = '1';
  }
}
