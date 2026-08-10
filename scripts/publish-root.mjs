/**
 * Copies the Vite build into the repository root.
 *
 * GitHub Pages is configured as "Deploy from a branch", which serves the
 * branch contents verbatim with no build step. So the root has to already
 * BE the finished site: the sources live in pages/, src/ and public/, and
 * this promotes dist/ over the top of them.
 *
 * Files the build no longer produces are pruned. Without that a renamed or
 * deleted asset lingers at the root and keeps being served — which is exactly
 * what happened when the drawn logo-mark.svg was replaced by the real PNG:
 * the old file stayed published and the verification suite kept finding it.
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
const GENERATED_DIRS = ['assets', 'images', 'boards'];

/*
  Root files the build owns. Anything at the root with one of these
  extensions was published by a previous run, so if this run does not produce
  it, it is stale and goes. Extensions rather than a manifest because the set
  is small, the sources all live in subdirectories, and a manifest is one more
  thing that can fall out of step with reality.
*/
const OWNED_EXTENSIONS = ['.html', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.webmanifest', '.xml', '.txt'];
const NEVER_PRUNE = new Set(['README.md', 'LICENSE', '.nojekyll']);

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

// Prune what this run did not publish. Only root-level files, only the
// extensions the build owns, and never a source directory.
const published = new Set(copied);
const rootEntries = await readdir(ROOT, { withFileTypes: true });
const pruned = [];

for (const entry of rootEntries) {
  if (!entry.isFile() || NEVER_PRUNE.has(entry.name)) continue;
  if (!OWNED_EXTENSIONS.some((ext) => entry.name.endsWith(ext))) continue;
  if (published.has(entry.name)) continue;
  await rm(join(ROOT, entry.name), { force: true });
  pruned.push(entry.name);
}

// Without this, Pages runs the branch through Jekyll, which skips files and
// directories whose names begin with an underscore.
await mkdir(ROOT, { recursive: true });
await writeFile(join(ROOT, '.nojekyll'), '');

console.log(`Published ${copied.length} entries to the repository root:`);
console.log(copied.sort().join('  '));
if (pruned.length) {
  console.log(`Pruned ${pruned.length} stale file(s): ${pruned.sort().join('  ')}`);
}
