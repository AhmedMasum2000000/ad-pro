#!/usr/bin/env python3
"""
Gives every site its own accent colour, taken from the light it is emitting.

The problem this solves is that 58 listing pages built from one template look
like 58 copies of one page. The usual answer is to invent a palette and assign
colours arbitrarily, which is decoration. The better answer was already in the
photographs: each screen is showing something, and what it is showing is the
only colour on an otherwise dark page.

So the accent is measured, not chosen. For each site the screen's own region
of its photograph is sampled, the dominant hue is found, and that hue is
normalised into something that can carry a rule, a figure or a hover state on
the near-black background. Gulshan-1 comes out green because it was running a
cement ad; Bogura comes out magenta; Cumilla comes out warm tan. Nothing is
assigned by hand, and if a photograph is replaced the colour follows it.

Run after changing a photograph:

    python3 scripts/sample-accents.py

Requires Pillow. Writes the `accent` field back into src/data/boards.json;
a board without one falls back to the brand blue in CSS, so a missing value
degrades rather than breaking.
"""

from __future__ import annotations

import colorsys
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "src" / "data" / "boards.json"
PUBLIC = ROOT / "public"

# The crop places the screen across roughly the middle half of the frame, so
# sampling a slightly smaller window around the focal point stays on the
# screen and off the sky and shopfronts either side of it.
WINDOW = 0.46
HUE_BINS = 36

# Below this share of coloured pixels the screen is showing something white,
# off, or blown out, and any hue found would be noise.
MIN_COLOURED = 0.06

FALLBACK = "#6ba3e8"  # --brand-sky

# What a sampled colour has to become to work as an accent on #0e1420: bright
# enough to read as emitted light, saturated enough not to look like a mistake,
# and short of neon.
SAT_RANGE = (0.55, 0.92)
VAL_RANGE = (0.66, 0.98)


def dominant_hue(image: Image.Image, focus: list[float]) -> tuple[float, float, float] | None:
    """Hue, saturation and value of the screen's strongest colour."""
    w, h = image.size
    half_w, half_h = w * WINDOW / 2, h * WINDOW / 2
    cx, cy = w * focus[0], h * focus[1]
    box = (
        max(0, int(cx - half_w)), max(0, int(cy - half_h)),
        min(w, int(cx + half_w)), min(h, int(cy + half_h)),
    )
    region = image.crop(box)
    # Downsampling first is not just speed: it averages away the LED pixel
    # grid and the JPEG noise, both of which would otherwise spread one colour
    # across several hue bins.
    region = region.resize((120, 80), Image.LANCZOS)

    weights = [0.0] * HUE_BINS
    members: list[list[tuple[float, float, float]]] = [[] for _ in range(HUE_BINS)]
    coloured = 0
    total = 0

    for r, g, b in region.get_flattened_data() if hasattr(region, "get_flattened_data") else region.getdata():
        total += 1
        hue, light, sat = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
        value = max(r, g, b) / 255
        chroma = sat * (1 - abs(2 * light - 1))
        # Grey, black and blown-out white carry no usable hue.
        if chroma < 0.18 or value < 0.22 or light > 0.94:
            continue
        coloured += 1
        index = min(HUE_BINS - 1, int(hue * HUE_BINS))
        weight = chroma * value
        weights[index] += weight
        members[index].append((hue, chroma, value))

    if total == 0 or coloured / total < MIN_COLOURED:
        return None

    peak = max(range(HUE_BINS), key=lambda i: weights[i])
    # Include the neighbouring bins: a hue sitting on a boundary would
    # otherwise be split in half and lose to a weaker but better-centred one.
    pool = members[(peak - 1) % HUE_BINS] + members[peak] + members[(peak + 1) % HUE_BINS]
    if not pool:
        return None

    # Hues are angles, so they are averaged on the circle. A straight mean of
    # 359° and 1° is 180° — the opposite colour.
    import math

    x = sum(math.cos(hue * 2 * math.pi) * weight for hue, weight, _ in pool)
    y = sum(math.sin(hue * 2 * math.pi) * weight for hue, weight, _ in pool)
    hue = (math.atan2(y, x) / (2 * math.pi)) % 1.0
    chroma = sum(c for _, c, _ in pool) / len(pool)
    value = sum(v for _, _, v in pool) / len(pool)
    return hue, chroma, value


def _relative_luminance(r: float, g: float, b: float) -> float:
    def channel(c: float) -> float:
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)


# The page background, and the contrast the accent has to reach against it.
# The accent carries hairlines, figures and hover states, so it has to be
# readable, not merely present. A deep blue sampled straight off a screen
# lands around 2.4:1 on this background — visible on a calibrated monitor in a
# dark room and invisible on a phone in daylight.
BACKGROUND = (0x0E / 255, 0x14 / 255, 0x20 / 255)
MIN_CONTRAST = 3.5


def to_accent(hue: float, chroma: float, value: float) -> str:
    sat = min(max(chroma * 1.35, SAT_RANGE[0]), SAT_RANGE[1])
    val = min(max(value * 1.15, VAL_RANGE[0]), VAL_RANGE[1])

    bg = _relative_luminance(*BACKGROUND)
    # Lift the colour until it clears the contrast floor, trading saturation
    # away only once brightness alone has run out. Blues need this most: they
    # are the darkest hues at a given saturation.
    for _ in range(40):
        r, g, b = colorsys.hsv_to_rgb(hue, sat, val)
        if (_relative_luminance(r, g, b) + 0.05) / (bg + 0.05) >= MIN_CONTRAST:
            break
        if val < 0.995:
            val = min(0.995, val + 0.03)
        else:
            sat = max(0.2, sat - 0.05)

    r, g, b = colorsys.hsv_to_rgb(hue, sat, val)
    return "#{:02x}{:02x}{:02x}".format(round(r * 255), round(g * 255), round(b * 255))


def main() -> None:
    boards = json.loads(DATA.read_text())
    sampled = 0
    fallbacks = []

    for board in boards:
        path = PUBLIC / board["image"]
        if not path.exists():
            fallbacks.append(board["slug"])
            board["accent"] = FALLBACK
            continue
        image = Image.open(path).convert("RGB")
        found = dominant_hue(image, board.get("focus", [0.5, 0.5]))
        if found is None:
            board["accent"] = FALLBACK
            fallbacks.append(board["slug"])
            continue
        board["accent"] = to_accent(*found)
        sampled += 1

    DATA.write_text(json.dumps(boards, indent=2, ensure_ascii=False) + "\n")

    print(f"{sampled} of {len(boards)} accents sampled from the screen")
    if fallbacks:
        print(f"{len(fallbacks)} fell back to the brand blue (screen white, off or blown out):")
        for slug in fallbacks:
            print(f"   {slug}")

    spread: dict[str, int] = {}
    for board in boards:
        spread[board["accent"]] = spread.get(board["accent"], 0) + 1
    print(f"{len(spread)} distinct accents across {len(boards)} sites")


if __name__ == "__main__":
    main()
