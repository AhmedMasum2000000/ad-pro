/**
 * Page transitions.
 *
 * Barba intercepts same-origin navigation, fetches the target document and
 * swaps only the `[data-barba="container"]` node. The shell — canvas, menu,
 * curtain — survives, which is the whole point: the WebGL context is never
 * torn down and rebuilt between pages.
 *
 * Per-page modules are mounted and unmounted around each swap. Anything that
 * binds a listener or starts a loop must be returned as a handle so it can be
 * destroyed; a leak here compounds with every navigation.
 */

import barba from '@barba/core';
import { coverForTransition, revealAfterTransition } from './curtain';
import { initFilter } from './flipFilter';
import { initMagnetic } from './cursor';
import { initMarquee } from './marquee';
import { initAsciiRules, initHalftone, initHoverScramble, initScramble } from './ascii';
import { initPixelate } from './pixelate';
import { initScrollFx } from './scrollfx';
import { initReveals } from './reveal';
import { initSlideshow } from './slideshow';
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

/** Mounts every per-page module against the freshly-swapped container. */
export function mountPage(scope: ParentNode = document): void {
  unmountPage();
  initMarquee(scope);
  active = [
    initSlideshow(scope),
    initReveals(scope),
    initFilter(scope),
    initMagnetic(scope),
    // Scroll and ASCII effects are page-scoped: their observers point at nodes
    // Barba is about to throw away, so they have to come down with the page.
    initScrollFx(scope),
    initScramble(scope),
    initHalftone(scope),
    initHoverScramble(scope),
    initAsciiRules(scope),
    initPixelate(scope),
  ];
  markCurrentNavLink();
}

export function unmountPage(): void {
  active.forEach((handle) => handle.destroy());
  active = [];
}

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
    // Barba's default prefetch would fetch every link in view; on the projects
    // page that is 35 documents nobody asked for.
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
          scrollToTop();
          mountPage(data.next.container);
          startScroll();
          await revealAfterTransition();
        },
      },
    ],
  });
}
