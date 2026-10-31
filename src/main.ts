/**
 * Boot sequence.
 *
 * Order matters: the `js` class first, because the reveal styles hide nothing
 * until it is there; viewport units before anything measures; scroll before
 * the curtain (which locks it); then the shell-level modules, which live for
 * the session, and finally the first page mount — scoped to the Barba
 * container, exactly as every later mount will be, so the shell never has
 * its bindings torn down with a page.
 */

import '@fontsource/bebas-neue/400.css';
import '@fontsource-variable/inter';
// Two weights only. The mono face carries specifications — dimensions,
// resolutions, on-air windows — where a figure has to line up with the figure
// above it, and where the register should read as technical rather than
// promotional. It is not used for prose anywhere.
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';

import './styles/tokens.css';
import './styles/grid.css';
import './styles/typography.css';
import './styles/global.css';
import './styles/components.css';
// The viewfinder sits over the composition rather than inside it, so it loads
// after the components it frames.
import './styles/chrome.css';
// Last, so the small-screen layer overrides the composition above it.
import './styles/mobile.css';

import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { qs } from './lib/dom';
import { initViewport } from './lib/viewport';
import { initHoverScramble } from './motion/ascii';
import { initBarba, mountPage, pageContainer } from './motion/barba';
import { initMagnetic } from './motion/cursor';
import { initCursorFollower } from './motion/cursorFollower';
import { playIntro } from './motion/curtain';
import { initHud } from './motion/hud';
import { initMenu } from './motion/menu';
import { initScroll } from './motion/scroll';
import { initCookieNotice } from './ui/cookieNotice';

// Registered once, here, so no module has to wonder whether another did.
gsap.registerPlugin(Flip);

/** Everything outside the Barba container that carries `.addHover`. */
const SHELL_SCOPES = ['.main-nav-wrapper', '#menu_wrapper', '.js-fixed__cover'];

function boot(): void {
  // Declares that the script is running. The reveal initial states in
  // global.css are gated on this class, so a page whose script never ran —
  // or a crawler — gets the fully visible site.
  document.documentElement.classList.add('js');

  initViewport();
  initScroll();

  // Shell-level modules live for the session; only page modules are remounted
  // by Barba.
  initMenu();
  // The viewfinder's live readouts. Shell-level: the clock does not blink out
  // and restart on every navigation, which is the point of it.
  initHud();
  initCursorFollower();
  initCookieNotice();

  // The shell's own interactive elements — menu toggle and close, nav links,
  // the call button — are bound here, once. Page mounts are scoped to the
  // container, so they never see these and never tear them down.
  for (const selector of SHELL_SCOPES) {
    const scope = qs<HTMLElement>(selector);
    if (!scope) continue;
    initMagnetic(scope);
    initHoverScramble(scope);
  }

  initBarba();
  mountPage(pageContainer());

  void playIntro();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
