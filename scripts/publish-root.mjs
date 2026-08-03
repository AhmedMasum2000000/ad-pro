/**
 * Copies the Vite build into the repository root.
 *
 * GitHub Pages is configured as "Deploy from a branch", which serves the
 * branch contents verbatim with no build step. So the root has to already
 * BE the finished site: the sources live in pages/, src/ and public/, and
 * this promotes dist/ over the top of them.
 *
 * Sources are never overwritten. The one hazard is dist/pages/, which
 * mirrors the source directory name — those files are the *built* pages and
 * are flattened to the root here rather than copied as a directory, which
 * would otherwise land straight on top of the templates they were built
 * from. That case is explicit below and covered by a guard.
 *
 * Run via `npm run build:pages`.
 */
import { cp, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

// Directories at the root that the build owns outright. Replaced wholesale
// each publish so a renamed hashed asset cannot linger and be served
// alongside its replacement. `pages` is deliberately NOT here — it holds
// the source templates.
const GENERATED_DIRS = ['assets', 'images'];

const distExists = await stat(DIST).catch(() => null);
if (!distExists?.isDirectory()) {
  console.error('No dist/ found — run `npm run build` first.');
  process.exit(1);
}

for (const dir of GENERATED_DIRS) {
  await rm(join(ROOT, dir), { recursive: true, force: true });
}

const entries = await readdir(DIST, { withFileTypes: true });
const copied = [];

for (const entry of entries) {
  // Rollup names HTML outputs after their path relative to the project root,
  // so the pages built from pages/*.html arrive as dist/pages/*.html. Lift
  // them to the top level: the deployed URLs must be /x.html, and copying
  // the directory as-is would destroy the templates in ./pages.
  if (entry.isDirectory() && entry.name === 'pages') {
    const built = await readdir(join(DIST, 'pages'), { withFileTypes: true });
    for (const page of built) {
      if (!page.isFile() || !page.name.endsWith('.html')) continue;
      await cp(join(DIST, 'pages', page.name), join(ROOT, page.name));
      copied.push(page.name);
    }
    continue;
  }

  await cp(join(DIST, entry.name), join(ROOT, entry.name), { recursive: true });
  copied.push(entry.isDirectory() ? `${entry.name}/` : entry.name);
}

// Without this, Pages runs the branch through Jekyll, which skips files and
// directories whose names begin with an underscore.
await mkdir(ROOT, { recursive: true });
await writeFile(join(ROOT, '.nojekyll'), '');

console.log(`Published ${copied.length} entries to the repository root:`);
console.log(copied.sort().join('  '));
