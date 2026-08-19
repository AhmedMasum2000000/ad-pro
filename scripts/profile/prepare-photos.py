#!/usr/bin/env python3
"""
Assembles the photography for the company profile.

Two sources, for two different jobs.

The billboard photographs come from public/boards — 58 real sites, full
resolution, already cleaned of the annotation marks the sales deck carried.
They are the best material this company has and they carry the network
sections.

Everything else — buses, vans, vehicle wraps, events, shopfronts, packaging —
exists only inside the old deck, where each slide was flattened into a single
1280x720 image. Those are cut back out by coordinate, which is why the crops
are modest in size: there is no higher-resolution original to go back to.
Anything that arrives sharper later should simply replace them.

    python3 scripts/profile/prepare-photos.py

Writes photos.json beside this script.
"""

from pathlib import Path
import base64
import io
import json
import os

from PIL import Image, ImageChops

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
BOARDS = ROOT / "public" / "boards"
SLIDES = Path(os.environ.get("ADPRO_SLIDE_DIR", HERE / "slides"))

# Board photographs for the network grid: one per city where the city has a
# strong frame, chosen for showing the site in its street rather than for the
# screen content alone.
NETWORK = [
    ("dhaka-gulshan-circle-2-east-side-rob-super-market", "Gulshan 2 Circle", "Dhaka"),
    ("dhaka-karwan-bazar", "Karwan Bazar", "Dhaka"),
    ("dhaka-sks-tower-flyover-view-mohakhali", "SKS Tower, Mohakhali", "Dhaka"),
    ("dhaka-mirpur-10-circle-4-screens", "Mirpur 10 Circle", "Dhaka"),
    ("chattogram-agrabad-circle-chittagong", "Agrabad Circle", "Chattogram"),
    ("sylhet-sylhet-surma-point", "Surma Point", "Sylhet"),
    ("coxs-bazar-dolphin-moor-coxs-bazar", "Dolphin Moor", "Cox's Bazar"),
    ("rajshahi-rajshahi-shaheb-bazar-2-screens-both-side", "Shaheb Bazar", "Rajshahi"),
]

LEAD = "dhaka-gulshan-circle-2-east-side-rob-super-market"

# Work photographs, as regions of the slide they were flattened into.
# (slide stem, x0, y0, x1, y1) in fractions of the slide.
SERVICE_CROPS = {
    "bus": ("11", 0.10, 0.67, 0.52, 0.97),
    "van": ("14", 0.36, 0.57, 0.62, 0.99),
    "car": ("12", 0.56, 0.60, 0.99, 0.93),
    "trade": ("19", 0.55, 0.13, 0.99, 0.97),
    "digital": ("21", 0.08, 0.67, 0.53, 0.98),
    "outdoor": ("20", 0.34, 0.60, 0.60, 0.99),
    "events": ("18", 0.53, 0.10, 0.99, 0.55),
    "packaging": ("09", 0.79, 0.54, 0.99, 0.99),
    "static": ("17", 0.47, 0.02, 0.99, 0.98),
}


def trim(img: Image.Image, tol: int = 14) -> Image.Image:
    """Drop the slide's own margin from around a crop."""
    rgb = img.convert("RGB")
    w, h = rgb.size
    corners = [rgb.getpixel(p) for p in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1))]
    ref = max(set(corners), key=corners.count)
    diff = ImageChops.difference(rgb, Image.new("RGB", rgb.size, ref)).convert("L")
    box = diff.point(lambda p: 255 if p > tol else 0).getbbox()
    return rgb.crop(box) if box else rgb


def encode(img: Image.Image, width: int, quality: int = 80) -> str:
    if img.width > width:
        img = img.resize((width, round(img.height * width / img.width)), Image.LANCZOS)
    buf = io.BytesIO()
    img.convert("RGB").save(buf, "WEBP", quality=quality, method=6)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()


def cover(img: Image.Image, ratio: float) -> Image.Image:
    """Centre-crop to an aspect ratio, so a row of photographs lines up."""
    w, h = img.size
    if w / h > ratio:
        new_w = int(h * ratio)
        return img.crop(((w - new_w) // 2, 0, (w + new_w) // 2, h))
    new_h = int(w / ratio)
    return img.crop((0, (h - new_h) // 2, w, (h + new_h) // 2))


def main() -> None:
    out: dict = {"lead": None, "network": [], "services": {}}

    lead_path = BOARDS / f"{LEAD}.jpg"
    if lead_path.exists():
        out["lead"] = encode(cover(Image.open(lead_path), 21 / 9), 1500, 78)

    for slug, name, city in NETWORK:
        p = BOARDS / f"{slug}.jpg"
        if not p.exists():
            print(f"  missing board {slug}")
            continue
        out["network"].append(
            {"name": name, "city": city, "uri": encode(cover(Image.open(p), 3 / 2), 700)}
        )

    led = BOARDS / "dhaka-karwan-bazar.jpg"
    if led.exists():
        out["services"]["led"] = encode(cover(Image.open(led), 16 / 9), 560, 82)

    for key, (slide, x0, y0, x1, y1) in SERVICE_CROPS.items():
        hits = sorted(SLIDES.glob(f"{slide}_*.jpg"))
        if not hits:
            print(f"  missing slide {slide} for {key}")
            continue
        im = Image.open(hits[0])
        w, h = im.size
        crop = trim(im.crop((int(w * x0), int(h * y0), int(w * x1), int(h * y1))))
        out["services"][key] = encode(cover(crop, 16 / 9), 560, 82)

    (HERE / "photos.json").write_text(json.dumps(out))

    total = len(out["lead"] or "") + sum(len(n["uri"]) for n in out["network"]) + sum(
        len(v) for v in out["services"].values()
    )
    print(f"lead: {'yes' if out['lead'] else 'no'}, network: {len(out['network'])}, "
          f"services: {len(out['services'])} — {total / 1024 / 1024:.2f} MB")


if __name__ == "__main__":
    main()
