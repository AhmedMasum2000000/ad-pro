/**
 * Assembles the company profile into one self-contained file.
 *
 * The profile is what goes to a prospective client — read once, closely,
 * usually printed to PDF and attached to an email. So it carries everything
 * it needs: the three typefaces as data URIs, and every client mark embedded.
 * It renders identically on a machine with no internet and no fonts
 * installed, which a document that leaves your hands has to.
 *
 * Two inputs:
 *
 *   template.html   the document, with <!--@LOGOS--> where the wall goes
 *   logos.json      written by prepare-logos.py from the client archive
 *
 * Run from the project root:
 *
 *     python3 scripts/profile/prepare-logos.py     # once, when logos change
 *     node scripts/profile/build.mjs
 *
 * Writes company-profile.html. logos.json is committed; the raw archive it
 * was built from is not, being several megabytes of unoptimised duplicates.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * The typefaces, inlined.
 *
 * They were first linked from a font CDN, which the artifact host does allow —
 * but a profile that is saved, forwarded and opened on a laptop in a meeting
 * room cannot depend on a network request it might not get. A silent fallback
 * to Georgia would undo the one thing this document is trying to be.
 */
const FACES = [
  ['Fraunces', 'node_modules/@fontsource-variable/fraunces/files/fraunces-latin-opsz-normal.woff2',
   'font-weight:300 700;font-stretch:normal;font-style:normal'],
  ['Inter', 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2',
   'font-weight:300 700;font-style:normal'],
  ['IBM Plex Mono', 'node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2',
   'font-weight:400;font-style:normal'],
  ['IBM Plex Mono', 'node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2',
   'font-weight:500;font-style:normal'],
];

function fontCss() {
  return FACES.map(([family, rel, desc]) => {
    const file = resolve(ROOT, rel);
    if (!existsSync(file)) throw new Error(`missing font: ${rel} — run npm install`);
    const b64 = readFileSync(file).toString('base64');
    return (
      `@font-face{font-family:'${family}';${desc};font-display:swap;` +
      `src:url(data:font/woff2;base64,${b64}) format('woff2');}`
    );
  }).join('\n');
}

const template = readFileSync(resolve(HERE, 'template.html'), 'utf8');

const photosPath = resolve(HERE, 'photos.json');
const photos = existsSync(photosPath) ? JSON.parse(readFileSync(photosPath, 'utf8')) : null;
if (!photos) console.warn('No photos.json — run: python3 scripts/profile/prepare-photos.py');

const logosPath = resolve(HERE, 'logos.json');
if (!existsSync(logosPath)) {
  console.error('No logos.json — run: python3 scripts/profile/prepare-logos.py');
  process.exit(1);
}
const logos = JSON.parse(readFileSync(logosPath, 'utf8'));

const wall = logos
  .map(
    (l) =>
      `<figure><img src="${l.uri}" alt="${escapeHtml(l.name)}" loading="lazy" ` +
      `width="260" height="96" /></figure>`,
  )
  .join('\n');

let out = template.replace('<!--@LOGOS-->', wall);

if (photos) {
  // The cover photograph. It is the first thing anyone sees of a company that
  // sells advertising space, so it is one of that company's screens.
  out = out.replace(
    '<!--@COVER-->',
    photos.cover
      ? `<img src="${photos.cover}" alt="An AD PRO LED billboard at Gulshan 2 Circle, Dhaka" width="2000" height="1250" />`
      : '',
  );

  // The document closes on one more screen, above the phone numbers.
  out = out.replace(
    '<!--@CLOSE-->',
    photos.close
      ? `<img src="${photos.close}" alt="An AD PRO LED billboard at Bijoy Sarani, Dhaka" width="1500" height="643" />`
      : '',
  );

  out = out.replace(
    '<!--@NETWORK-->',
    photos.network?.length
      ? `<div class="net-grid">${photos.network
          .map(
            (n) =>
              `<figure><img src="${n.uri}" alt="${escapeHtml(n.name)}, ${escapeHtml(n.city)}" ` +
              `loading="lazy" width="900" height="600" />` +
              `<figcaption>${escapeHtml(n.name)}<span>${escapeHtml(n.city)}</span></figcaption></figure>`,
          )
          .join('')}</div>`
      : '',
  );

  // Each service card takes the photograph named in its data-photo attribute.
  out = out.replace(/<div class="svc" data-photo="([a-z]+)">/g, (whole, key) => {
    const uri = photos.services?.[key];
    if (!uri) return '<div class="svc">';
    return (
      `<div class="svc"><img class="svc__img" src="${uri}" alt="" loading="lazy" ` +
      `width="560" height="315" />`
    );
  });
}

// The template keeps its faces in one place; if they are not already inlined
// (a freshly edited template may still carry the CDN link), fold them in.
if (!out.includes('@font-face')) {
  out = out.replace('<style>\n', `<style>\n${fontCss()}\n\n`);
}

const dest = resolve(ROOT, 'company-profile.html');
writeFileSync(dest, out);
console.log(`company-profile.html — ${logos.length} marks, ${(out.length / 1024 / 1024).toFixed(2)} MB`);
