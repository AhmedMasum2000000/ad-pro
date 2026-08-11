#!/usr/bin/env python3
"""
Scores how well each photograph survives being cropped to its screen.

The hero on the home page is a wall of lit screens in a dark room, built by
zooming each site photograph onto its own LED panel. That works because of the
crop convention sample-accents.py already depends on: the panel sits across
roughly the middle half of the frame, centred on the stored focus point.

It holds for most of the 58 photographs and not for all of them. A few were
shot from far enough back, or wide enough, that the middle half is street and
sky with the screen off to one side. Those crops put a bus on the wall.

So rather than hand-picking which sites are allowed in the hero — a list that
goes stale the moment a photograph is replaced — each board is scored on how
much lit screen its crop actually contains, and the wall takes the best. Swap
a photograph and rerun; the wall follows.

The score is a contrast: how much more "emitted light" — saturated and bright
at once — sits inside the crop than outside it. Measuring the crop on its own
does not work, because an advertisement with a white background scores the
same as sky, and a photograph of a colourful street scores well everywhere.
Measured as a ratio against the rest of its own frame, a screen stands out by
three to twelve times and a missed crop lands at one, whatever the weather was
on the day the photograph was taken.

Run after changing a photograph:

    python3 scripts/score-crops.py

Requires Pillow. Writes `wallScore` into boards.json — 1.0 means the crop is
no more lit than the street around it. A board without one sorts last rather
than breaking anything.
"""

from __future__ import annotations

import colorsys
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data" / "boards.json"
PUBLIC = ROOT / "public"

# What the hero actually shows: `object-fit: cover` into a 4:3 tile, then a
# 2.05x zoom about the focus point. Mirrored here so the score is computed on
# the pixels the visitor will see rather than on a different crop.
TILE_ASPECT = 4 / 3
ZOOM = 2.05

# A pixel counts as emitted light above both of these at once. Either alone is
# sky, asphalt, or a white wall in sun.
VIVID_SAT = 0.34
VIVID_VAL = 0.42

# Sample every Nth pixel. The score is a ratio of proportions, so full
# resolution buys nothing but seconds.
STEP = 4

# Keeps a frame that is uniformly drab from dividing by nearly zero and
# reporting a spectacular ratio for an unremarkable crop.
FLOOR = 0.02


def crop_box(w: int, h: int, focus: list[float]) -> tuple[int, int, int, int]:
    """The region the CSS will show, in source pixels."""
    vis_w = min(w, TILE_ASPECT * h) / ZOOM
    vis_h = min(h, w / TILE_ASPECT) / ZOOM
    cx, cy = w * focus[0], h * focus[1]
    x0 = max(0, min(w - vis_w, cx - vis_w / 2))
    y0 = max(0, min(h - vis_h, cy - vis_h / 2))
    return int(x0), int(y0), int(x0 + vis_w), int(y0 + vis_h)


def lit_fraction(
    px, x0: int, y0: int, x1: int, y1: int, skip: tuple[int, int, int, int] | None = None
) -> float:
    """Share of sampled pixels that read as emitted light."""
    vivid = 0
    total = 0
    for y in range(y0, y1, STEP):
        for x in range(x0, x1, STEP):
            if skip and skip[0] <= x < skip[2] and skip[1] <= y < skip[3]:
                continue
            r, g, b = px[x, y]
            _, sat, val = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            total += 1
            if sat >= VIVID_SAT and val >= VIVID_VAL:
                vivid += 1
    return vivid / total if total else 0.0


def score(image: Image.Image, focus: list[float]) -> float:
    rgb = image.convert("RGB")
    w, h = rgb.size
    px = rgb.load()
    box = crop_box(w, h, focus)

    inside = lit_fraction(px, *box)
    outside = lit_fraction(px, 0, 0, w, h, skip=box)

    # The ratio, not the raw share. A white advertisement and a white sky look
    # identical in isolation; what separates a screen from the street it is
    # standing on is that the screen is emitting and the street is not.
    return inside / (outside + FLOOR)


def main() -> None:
    boards = json.loads(DATA.read_text())

    for board in boards:
        path = PUBLIC / board["image"]
        if not path.exists():
            board["wallScore"] = 0.0
            print(f"  missing  {board['slug']}")
            continue
        with Image.open(path) as image:
            board["wallScore"] = round(score(image, board.get("focus", [0.5, 0.5])), 2)

    DATA.write_text(json.dumps(boards, indent=2) + "\n")

    ranked = sorted(boards, key=lambda b: b["wallScore"], reverse=True)
    print(f"\n{len(boards)} scored. Best five:")
    for b in ranked[:5]:
        print(f"  {b['wallScore']:.2f}  {b['slug']}")
    print("Worst five:")
    for b in ranked[-5:]:
        print(f"  {b['wallScore']:.2f}  {b['slug']}")


if __name__ == "__main__":
    main()
