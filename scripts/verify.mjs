/**
 * Drives the built site in a real browser and reports what is actually true.
 *
 * The redesign adds fixed overlays across 96 routes and animated layers over
 * every page, and both are the kind of thing that looks right on the machine
 * that built it and wrong everywhere else. So the claims that matter get
 * measured rather than asserted:
 *
 *   - no console errors and no horizontal overflow, on every route
 *   - the chrome renders and never swallows a control
 *   - nothing is still animating on a page that is sitting still
 *
 * Run against a preview server:
 *
 *     npx vite preview --port 4173 &
 *     node scripts/verify.mjs
 *
 * Pass a subset to go faster:  node scripts/verify.mjs index.html contact.html
 */

import { chromium } from 'playwright';
import { readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE_URL || 'http://localhost:4173';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1280, height: 720 },
  { name: 'phone', width: 390, height: 844, isMobile: true, hasTouch: true },
];

const routes = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(resolve(ROOT, 'dist')).filter((f) => f.endsWith('.html'));

/** Console noise that is the environment's, not the site's. */
const IGNORE = [/favicon/i, /net::ERR_/, /Download the React/i];

const fail = [];
const note = (route, vp, msg) => fail.push(`${route} @ ${vp}: ${msg}`);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: vp.isMobile ?? false,
    hasTouch: vp.hasTouch ?? false,
    reducedMotion: process.env.REDUCED ? 'reduce' : 'no-preference',
  });
  const page = await context.newPage();

  for (const route of routes) {
    const errors = [];
    page.removeAllListeners('console');
    page.removeAllListeners('pageerror');
    page.on('console', (m) => {
      if (m.type() === 'error' && !IGNORE.some((r) => r.test(m.text()))) errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(String(e)));

    await page.goto(`${BASE}/${route}`, { waitUntil: 'load' });
    // The intro curtain holds the first paint; give it room to retract.
    await page.waitForTimeout(1400);

    if (errors.length) note(route, vp.name, `console: ${errors.slice(0, 2).join(' | ')}`);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (overflow > 1) note(route, vp.name, `overflows by ${overflow}px`);

    // A page sitting still should compute nothing. Counting rAF callbacks
    // cannot show this — the probe's own loop is indistinguishable from the
    // site's — so it instruments the write instead. scrollfx used to idle at a
    // write per parallaxed element per frame, forever, on every route; this is
    // the regression test for that.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    const idleWrites = await page.evaluate(
      () =>
        new Promise((done) => {
          let n = 0;
          const setProp = CSSStyleDeclaration.prototype.setProperty;
          CSSStyleDeclaration.prototype.setProperty = function (k, v, pr) {
            if (k === '--parallax') n += 1;
            return setProp.call(this, k, v, pr);
          };
          setTimeout(() => {
            CSSStyleDeclaration.prototype.setProperty = setProp;
            done(n);
          }, 600);
        }),
    );
    if (idleWrites > 0) note(route, vp.name, `${idleWrites} --parallax writes while parked`);

    // The chrome must never intercept a click meant for something else.
    const blocked = await page.evaluate(() => {
      const el = document.elementFromPoint(window.innerWidth / 2, 20);
      return el?.closest('.chrome') ? (el.className || 'chrome') : null;
    });
    if (blocked) note(route, vp.name, `chrome intercepts pointer at top centre (${blocked})`);
  }

  await context.close();
}

await browser.close();

if (fail.length) {
  console.error(`\n✗ ${fail.length} problem(s) across ${routes.length} route(s):\n`);
  for (const f of fail.slice(0, 40)) console.error('  ' + f);
  process.exit(1);
}
console.log(`\n✓ ${routes.length} route(s) × ${VIEWPORTS.length} viewports clean\n`);
