/**
 * Packs the built home page into one self-contained file.
 *
 * The live site publishes from the ad-pro repository's main branch, and that
 * push deploys to a real commercial domain. An unfinished redesign has no
 * business going there, so this exists to make an in-progress state
 * shareable without touching anything that is serving customers.
 *
 * Everything the page needs is folded in: stylesheet, modules, fonts and the
 * site photographs, all as data URIs. The result opens from a file:// URL, an
 * artifact host, or an email attachment, and makes no network requests.
 *
 *     npm run build && node scripts/inline-preview.mjs
 *
 * Writes preview.html. Links to other routes will not resolve — this is one
 * page, not the site.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');

const MIME = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

const seen = new Map();

/** A dist-absolute path ("/boards/x.jpg") as a data: URI, memoised. */
function dataUri(urlPath) {
  const clean = urlPath.split('?')[0].split('#')[0];
  if (seen.has(clean)) return seen.get(clean);

  const file = resolve(DIST, clean.replace(/^\//, ''));
  if (!existsSync(file)) {
    seen.set(clean, null);
    return null;
  }
  const mime = MIME[extname(clean).toLowerCase()];
  if (!mime) {
    seen.set(clean, null);
    return null;
  }
  const uri = `data:${mime};base64,${readFileSync(file).toString('base64')}`;
  seen.set(clean, uri);
  return uri;
}

/** Replace every url(...) in a stylesheet with its inlined equivalent. */
function inlineCssUrls(css) {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (whole, quote, url) => {
    if (url.startsWith('data:')) return whole;
    const uri = dataUri(url.startsWith('/') ? url : `/${url}`);
    return uri ? `url(${uri})` : whole;
  });
}

let html = readFileSync(resolve(DIST, 'index.html'), 'utf8');

// --- stylesheets -------------------------------------------------------------
html = html.replace(
  /<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/g,
  (whole, href) => {
    const file = resolve(DIST, href.replace(/^\//, ''));
    if (!existsSync(file)) return whole;
    return `<style>${inlineCssUrls(readFileSync(file, 'utf8'))}</style>`;
  },
);

// --- modules -----------------------------------------------------------------
// Rollup emits the entry and the shared motion chunk as two sibling script
// tags, and the entry imports the chunk by URL. Only the entry is inlined —
// its import is rewritten to a data: URI, which pulls the chunk in with it.
// Emitting the chunk's own tag as well would embed those 127KB twice.
html = html.replace(
  /<script[^>]*\btype=["']module["'][^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>\s*/g,
  (whole, src) => {
    const file = resolve(DIST, src.replace(/^\//, ''));
    if (!existsSync(file)) return whole;
    if (!/\/main-[^/]*\.js$/.test(src)) return '';

    // Rollup writes the sibling chunk as a relative specifier ("./motion-*.js"),
    // not as the site-absolute path the HTML uses, so both forms are matched.
    const entryDir = dirname(file);
    const js = readFileSync(file, 'utf8').replace(
      /(["'])((?:\.\/|\/assets\/)[^"']+\.js)\1/g,
      (m, quote, chunk) => {
        const chunkFile = chunk.startsWith('./')
          ? resolve(entryDir, chunk)
          : resolve(DIST, chunk.replace(/^\//, ''));
        if (!existsSync(chunkFile)) return m;
        const b64 = Buffer.from(readFileSync(chunkFile, 'utf8')).toString('base64');
        return `${quote}data:text/javascript;base64,${b64}${quote}`;
      },
    );

    return `<script type="module">${js}</script>`;
  },
);

// Preload hints point at files that no longer exist as files.
html = html.replace(/<link[^>]+rel=["'](?:module)?preload["'][^>]*>/g, '');

// --- images ------------------------------------------------------------------
html = html.replace(/(<img\b[^>]*\bsrc=["'])([^"']+)(["'])/g, (whole, pre, src, post) => {
  const uri = dataUri(src.startsWith('/') ? src : `/${src}`);
  return uri ? pre + uri + post : whole;
});

// Media cards carry their photograph as a custom property in an inline style
// attribute rather than as an <img>, so the same substitution has to run over
// those too — two of the home page's photographs are only reachable this way.
// The attribute is double-quoted and the url() inside it is single-quoted, so
// the value has to be matched by its own delimiter rather than by "anything
// that is not a quote".
html = html.replace(/\bstyle="([^"]*)"/g, (whole, css) => {
  if (!css.includes('url(')) return whole;
  const inlined = inlineCssUrls(css);
  return inlined === css ? whole : `style="${inlined}"`;
});

// --- unwrap ------------------------------------------------------------------
// The artifact host supplies its own doctype, head and body, so this returns
// the page's contents rather than a whole document. The two classes the body
// carried have to be reapplied, because the curtain and the shell both key
// off them.
const bodyOpen = html.match(/<body([^>]*)>/i);
const bodyAttrs = bodyOpen ? bodyOpen[1] : '';
const classMatch = bodyAttrs.match(/class=["']([^"']*)["']/);
const bodyClass = classMatch ? classMatch[1] : '';

const head = (html.match(/<head[^>]*>([\s\S]*?)<\/head>/i) || [, ''])[1];
const body = (html.match(/<body[^>]*>([\s\S]*?)<\/body>/i) || [, ''])[1];

// Only the parts of <head> that still mean something once inlined — the
// stylesheet and the entry module. Vite puts the bundled script in the head,
// so filtering to <style> alone silently drops every line of behaviour and
// leaves a page that looks right and does nothing.
const keep = [
  ...(head.match(/<style>[\s\S]*?<\/style>/g) || []),
  ...(head.match(/<script type="module">[\s\S]*?<\/script>/g) || []),
].join('\n');
const title = (head.match(/<title>([\s\S]*?)<\/title>/i) || [, 'AD PRO'])[1];

/*
  The Barba wrapper becomes a div rather than the body.

  The host supplies the body element, so the attribute the transition layer
  looks for cannot be authored onto it — and setting it from a script is too
  late, because module scripts are deferred and run before DOMContentLoaded
  fires. Barba accepts any element as its wrapper, so one is provided.

  The body classes are deliberately not reapplied. An earlier attempt assigned
  `body.className` on DOMContentLoaded and silently wiped the class the HUD had
  already added, taking the whole viewfinder with it. The only class that
  mattered was the one hiding the page under the intro curtain, and the
  curtain covers the viewport anyway.
*/
const out = `<title>${title}</title>
<meta name="description" content="Preview of the AD PRO screen-wall redesign — the home page, self-contained." />
${keep}
<div data-barba="wrapper">
${body}
</div>
`;

void bodyClass;

writeFileSync(resolve(ROOT, 'preview.html'), out);

const mb = (Buffer.byteLength(out) / 1024 / 1024).toFixed(2);
const inlined = [...seen.values()].filter(Boolean).length;
console.log(`preview.html — ${mb} MB, ${inlined} assets inlined`);
