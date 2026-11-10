/**
 * Page transitions.
 *
 * Barba intercepts same-origin navigation, fetches the target document and
 * swaps only the `[data-barba="container"]` node. The shell — header, menu,
 * cursor, curtain — survives, so the instrument does not blink out and
 * rebuild on every click.
 *
 * Per-page modules are mounted and unmounted around each swap. Anything that
 * binds a listener or starts a loop must be returned as a handle so it can be
 * destroyed; a leak here compounds with every navigation. The hero's switcher
 * interval is the one that bites hardest — left running, it keeps cutting
 * between slides on a page that no longer exists.
 *
 * The first mount is scoped to the container too, never to `document`: a
 * module that bound the shell's buttons on the first page would have them
 * torn down with the first page. Shell-level bindings belong in main.ts.
 */

import barba from '@barba/core';
import { qs } from '../lib/dom';
import { initBrief } from './brief';
import { coverForTransition, revealAfterTransition } from './curtain';
import { initFilter } from './flipFilter';
import { initHero } from './hero';
import { initImages } from './images';
import { initMagnetic } from './cursor';
import { initMarquee } from './marquee';
import { initNetIndex } from './netIndex';
import { initHoverScramble, initScramble } from './ascii';
import { initPixelate } from './pixelate';
import { initRails } from './rail';
import { initScrollFx } from './scrollfx';
import { initReveals } from './reveal';
import { scrollToTop, startScroll, stopScroll } from './scroll';

type Handle = { destroy: () => void };

/**
 * Only the part of Barba's transition data these hooks touch.
 *
 * The package's own `ITransitionData` lives behind a deep `dist/` path that
 * its `types` field does not point at correctly, so depending on it would
 * couple this file to that package's build layout. A structural type of the
 * two fields actually used is both safer and enough.
 */
interface TransitionData {
  current: { container: HTMLElement };
  next: { container: HTMLElement };
}

let active: Handle[] = [];

/**
 * Mounts every per-page module against the freshly-swapped container.
 *
 * Order matters a little: images first so a cached photograph is marked
 * loaded before the shimmer is ever painted; reveals and the hero next so
 * their hidden states are set before anything scrolls; the marquee last
 * because it measures the track and wants the layout settled.
 */
export function mountPage(scope: ParentNode): void {
  unmountPage();
  active = [
    initImages(scope),
    initReveals(scope),
    initHero(scope),
    initScrollFx(scope),
    initFilter(scope),
    initMagnetic(scope),
    initScramble(scope),
    initHoverScramble(scope),
    initPixelate(scope),
    initRails(scope),
    initNetIndex(scope),
    initBrief(scope),
  ];
  initMarquee(scope);
  markCurrentNavLink();
}

export function unmountPage(): void {
  active.forEach((handle) => handle.destroy());
  active = [];
}

/** The page container on first load, falling back to the document. */
export const pageContainer = (): ParentNode =>
  qs<HTMLElement>('[data-barba="container"]') ?? document;

/** Keeps `aria-current` truthful — the shell nav outlives the page swap. */
function markCurrentNavLink(): void {
  const here = window.location.pathname.replace(/index\.html$/, '') || '/';
  document.querySelectorAll<HTMLAnchorElement>('.menu-link, .nav-link').forEach((link) => {
    const target = new URL(link.href, window.location.origin).pathname.replace(
      /index\.html$/,
      '',
    );
    if (target === here) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

export function initBarba(): void {
  barba.init({
    // Barba's default prefetch would fetch every link in view; on the
    // inventory page that is 58 documents nobody asked for.
    prefetchIgnore: true,
    debug: false,
    transitions: [
      {
        name: 'curtain',

        async leave(data: TransitionData) {
          // Scroll stays locked across the swap so the outgoing page cannot be
          // scrolled while it is behind the cover.
          stopScroll();
          await coverForTransition();
          unmountPage();
          data.current.container.remove();
        },

        async enter(data: TransitionData) {
          // Before the mount, so every module measures the new page from the
          // top; `scrollToTop` forces through the stopped Lenis.
          scrollToTop();
          mountPage(data.next.container);
          startScroll();
          await revealAfterTransition();
        },
      },
    ],
  });
}
