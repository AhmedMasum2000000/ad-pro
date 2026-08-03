# AD PRO Communications Limited

The site for AD PRO Communications Limited — an outdoor advertising agency
headquartered in Dhaka, Bangladesh, operating its own digital and static
billboard network across Dhaka, Chattogram and Sylhet.

```
npm install
npm run dev        # http://localhost:5173
npm run build      # -> dist/
npm run preview    # serve the production build
npm run typecheck
```

---

## What this is

An immersive, motion-driven site built around the same interaction language as
an award-style agency reference: a Canvas ambient field, a GSAP-driven intro
curtain, Barba page transitions, Lenis smooth scroll, a magnetic custom
cursor, an overlay menu with a nested Billboards submenu, and a Flip-animated
inventory filter — deliberately without the heaviest part of that reference
(a WebGL/Pixi renderer), because the brief called for something **super
lightweight and super mobile-friendly** first.

Client marks are rendered as monogram tiles rather than reproduced logos —
those marks belong to the clients, not to this build. Drop approved logo
files into `public/clients/` and set `logo` on the matching entry in
`src/data/site.ts` to switch a tile to the real file. Billboard photography
is a gradient stand-in for the same reason: drop a file named to match a
billboard's `image` field into `public/` to replace it.

---

## Editing the content

**Everything lives in [`src/data/site.ts`](src/data/site.ts)** — company
details, navigation (including the Billboards submenu), the billboard
inventory, services, clients, the process steps, and the FAQ, all typed and
commented.

[`src/build/partials.ts`](src/build/partials.ts) and
[`src/build/seo.ts`](src/build/seo.ts) generate the repeated sections — the
menu, the footer, the inventory grids, the client wall, the FAQ, the
structured data and the sitemap — from those same objects, so the visible
navigation, the crawl-time sitemap and the JSON-LD can never drift from each
other. To rebrand or re-price: edit `site.ts`, then `npm run build`.

---

## Routes

Eight pages, each a real HTML document (Barba needs one per route to
transition between):

| Route | Purpose |
| --- | --- |
| `index.html` | Home — hero, stats, process, client teaser |
| `billboards.html` | Inventory hub — format comparison, every site |
| `static-billboards.html` | Static-only inventory, interlinked from the hub |
| `digital-billboards.html` | Digital-only inventory, interlinked from the hub |
| `services.html` | The six service lines |
| `clients.html` | The full client wall by sector |
| `about.html` | Company, values, leadership, offices |
| `contact.html` | Booking brief and FAQ (also emitted as `FAQPage` JSON-LD) |

The Billboards submenu (Static / Digital) is a real nested nav, generated
from `nav[].links[].children` in `site.ts` — not a dropdown bolted onto the
markup afterwards.

---

## How it is put together

### The motion system

Each module in `src/motion/` owns one behaviour and returns a handle so Barba
can unmount it on navigation — a listener leaked here compounds with every
page change.

| Module | Behaviour |
| --- | --- |
| `curtain.ts` | Intro loader; also supplies the cover used between pages. Runs once per session. |
| `barba.ts` | Page transitions, and the mount/unmount lifecycle for everything below. |
| `scroll.ts` | Lenis, and the single `--scrollY` custom property everything scroll-reactive reads. |
| `menu.ts` | Overlay menu **state** — scroll lock, focus trap, Escape, backdrop click, and the explicit close button. The animation is CSS. |
| `slideshow.ts` | Hero autoplay, pause control, counter. |
| `wgl.ts` | A Canvas 2D ambient field — see "Why not WebGL" below. Entirely decorative and allowed to fail. |
| `cursorFollower.ts` | The custom cursor: follows the pointer, swells over `.addHover` targets, labels itself over media tiles. |
| `reveal.ts` | Scroll reveals via one `IntersectionObserver` that unobserves as it goes. |
| `marquee.ts` | Clones the ticker track to cover the viewport; the animation itself is CSS. |
| `flipFilter.ts` | GSAP Flip for the billboard-city filter, so cards visibly reflow. |
| `cursor.ts` | Magnetic hover on `.addHover` elements, bound only where a pointer can actually hover. |

### Why not WebGL

The reference this motion language is drawn from renders its background field
in PixiJS — a real WebGL pipeline, and a ~486KB dependency, to draw a few soft
blurred circles. `wgl.ts` draws the same composition in Canvas 2D with
`createRadialGradient`, because a gradient is already soft — there was never
anything for a blur filter to do that the primitive doesn't do for free. That
one substitution is most of the difference between this bundle and a typical
WebGL agency site, and it is the reason the brief's "super lightweight, super
mobile-friendly" requirement is actually true rather than asserted.

### Three things worth knowing before you edit the CSS

**The grid must not have a column gap.** `.css-grid-wrapper` is a 100-column
grid so a class name states a percentage directly (`grid-50` is half). A `gap`
applies between every *track*, not between the items you see — 99 gutters at
36px is 3.5k pixels of overflow before any content is placed. Horizontal
gutters come from `padding-inline-end` on the items instead. The tracks are
also `minmax(0, 1fr)`, not `1fr`, so display-sized text cannot force a track
wider than its share.

**`--vh` / `--vw` are written by JS.** Mobile browsers change the viewport
height when the address bar collapses, so anything sized in raw `vh` jumps
mid-scroll. `src/lib/viewport.ts` writes the measured values to custom
properties on a debounced resize instead.

**The menu reveal is CSS, not GSAP.** The panel unfold and the staggered link
reveal (including the nested submenu) are transitions keyed off
`body.menu-open`, with the stagger coming from a `--i` index the shell writes
onto each link. Keeping them in the same mechanism is what stops them
drifting out of step with each other.

### Accessibility

`prefers-reduced-motion` is honoured throughout: Lenis is not started at all
(an eased scroll is the exact sensation the preference exists to avoid), the
curtain resolves immediately, reveals render in their final state, the
ambient field paints one frame and stops, and the slideshow starts paused.
The menu traps focus, closes on Escape, on a backdrop click, and on the
explicit close button, and restores focus on close. The slideshow counter and
the filter's result count are both live regions. The FAQ uses native
`<details>`/`<summary>` rather than a JS accordion, so it works, is keyboard
operable, and is indexable with no script at all.

---

## SEO

Generated by [`src/build/seo.ts`](src/build/seo.ts) from the same page
metadata that builds the pages, so nothing can be added to `vite.config.ts`'s
route list without also appearing in the sitemap:

- Per-page `<title>`, description, canonical URL, Open Graph and Twitter tags.
- One JSON-LD `@graph` per page: a shared `Organization` node, a
  `LocalBusiness` node on the home and contact pages, `BreadcrumbList` on
  every page reached through the Billboards submenu, a `Service` node with an
  `OfferCatalog` of matching sites on the two format pages, and `FAQPage` on
  the contact page.
- `sitemap.xml` and `robots.txt`, emitted at build time from the exact route
  list the site ships.

---

## Repository layout

The repository root holds the **built** site, not the sources. That is
deliberate — read the deploy section below before moving anything.

```
pages/*.html       source templates (carry <!--@SHELL--> placeholders)
src/               TypeScript, styles, data, build-time generators
public/            static assets copied verbatim (favicon, illustrations)
scripts/           publish-root.mjs
—— everything below is generated, do not hand-edit ——
*.html             built pages
assets/            hashed JS, CSS and fonts
images/            illustrations, copied from public/
sitemap.xml  robots.txt  favicon.svg  .nojekyll
```

## Deploying

GitHub Pages for this repository is set to **"Deploy from a branch"**, which
serves the branch contents verbatim — there is no build step on GitHub's
side. The root therefore has to already be the finished site, which is why
the build output is committed alongside the sources.

After changing anything in `pages/`, `src/` or `public/`:

```
npm run build:pages     # builds with BASE_PATH=/ad-pro/, then promotes dist/ to the root
git add -A && git commit && git push
```

`scripts/publish-root.mjs` copies `dist/` over the root, flattening
`dist/pages/*.html` up a level so the deployed URLs are `/x.html`. It never
touches `pages/`, `src/` or `public/`.

**If you prefer CI to build instead:** set Settings → Pages → Source to
"GitHub Actions", then run the `Deploy to GitHub Pages` workflow once from
the Actions tab. From then on it builds and publishes on its own and the
committed root output becomes redundant. Note that a repository whose
Actions token is read-only cannot create a Pages site from a workflow —
that is the failure this layout exists to route around.

For any other static host, build without the base override:

```
npm run build           # -> dist/, root-relative URLs
```

Vite rewrites asset and public-file URLs to the configured base; internal
page links are relative, so they work at any depth without configuration.
