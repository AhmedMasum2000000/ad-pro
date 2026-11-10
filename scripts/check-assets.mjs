/**
 * Checks that every site in the inventory has its photograph on disk.
 *
 * A board whose `image` points at a file that is not in public/boards/ ships
 * as a card with a black rectangle where the junction should be. That is
 * what happened to Feni. This runs as part of `prebuild`, before anything is
 * generated, and names every missing file so it is fixed at the source.
 *
 * It warns rather than fails: the build-time helpers in src/build/partials.ts
 * already route around a missing photograph (a city's cover is the best site
 * whose file exists; a card that still fails marks itself `.is-missing`), so
 * one absent JPEG should not stop fifty-seven good pages from publishing.
 * Set CHECK_ASSETS=strict to make it fatal in a deploy pipeline.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const boards = JSON.parse(readFileSync(join(root, 'src/data/boards.json'), 'utf8'));

const missing = boards.filter((b) => !existsSync(join(root, 'public', b.image)));
const strict = process.env.CHECK_ASSETS === 'strict';

if (missing.length === 0) {
  console.log(`check-assets: all ${boards.length} site photographs present`);
} else {
  const label = strict ? 'error' : 'warning';
  console[strict ? 'error' : 'warn'](
    `check-assets: ${label} — ${missing.length} of ${boards.length} site photographs missing:`,
  );
  for (const b of missing) console.warn(`  ${b.slug}  →  public/${b.image}`);
  if (strict) process.exit(1);
}
