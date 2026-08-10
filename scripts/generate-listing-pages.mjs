/**
 * Writes one HTML entry per billboard and per city.
 *
 * Rollup needs a real file on disk for every route, and there are 68 of them
 * — 58 sites and 10 cities. Hand-maintaining that many near-identical files
 * is how they drift, so they are generated here from src/data/boards.json,
 * the same file the TypeScript build reads.
 *
 * The files themselves are deliberately thin: a skeleton with one placeholder.
 * Everything visible is rendered by src/build/partials.ts at build time, so
 * the markup for a listing lives in one place and in one language.
 *
 * Runs as `prebuild`, so `npm run build` cannot forget it.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

/*
  Entry files live in pages/ in the standalone repository and at the project
  root in the copy that deploys under /studio/. Rather than keep two versions
  of this script, it puts the generated routes wherever the hand-written ones
  already are — the same rule vite.config.ts uses to resolve its inputs.
*/
const pagesDir = existsSync(join(root, 'pages')) ? join(root, 'pages') : root;

const boards = JSON.parse(readFileSync(join(root, 'src/data/boards.json'), 'utf8'));
const citySlugs = [...new Set(boards.map((b) => b.citySlug))];

mkdirSync(pagesDir, { recursive: true });

// Clear the previous run first: a site renamed in the deck would otherwise
// leave its old page behind, and a stale route is worse than a missing one.
for (const file of readdirSync(pagesDir)) {
  if (/^(led|billboards)-.+\.html$/.test(file)) unlinkSync(join(pagesDir, file));
}

const skeleton = (namespace, placeholder) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#0e1420" />
    <meta name="color-scheme" content="dark" />
    <!--@HEAD-->
  </head>

  <body class="isLoading" data-barba="wrapper">
    <!--@SHELL-->

    <main class="all-content-wrapper hideOnLoad margin-auto" id="main">
      <div class="page-content" data-barba="container" data-barba-namespace="${namespace}">
        ${placeholder}

        <!--@FOOTER-->
      </div>
    </main>

    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`;

let written = 0;

for (const board of boards) {
  writeFileSync(
    join(pagesDir, `led-${board.slug}.html`),
    skeleton('listing', '<!--@LISTING-->'),
  );
  written += 1;
}

for (const slug of citySlugs) {
  writeFileSync(
    join(pagesDir, `billboards-${slug}.html`),
    skeleton('city', '<!--@CITY-->'),
  );
  written += 1;
}

console.log(
  `generate-listing-pages: ${written} routes (${boards.length} sites, ${citySlugs.length} cities)`,
);
