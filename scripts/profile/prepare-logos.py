#!/usr/bin/env python3
"""
Turns the supplied logo archive into a set fit to print.

The archive is 105 files collected over time rather than a curated set: a few
duplicates of the same brand, several with filenames that carry no name at all,
and every one at a different size, padding and background. Dropped straight
into a grid they read as a scrapbook.

So each mark is trimmed to its own ink, scaled to a consistent optical weight
rather than a consistent pixel box — a wide wordmark and a square emblem need
different heights to look the same size — and flattened onto the page colour so
the ones that arrived with a white block do not sit in a visible tile.

Files whose names cannot yield a brand are set aside rather than guessed at.
"""

from pathlib import Path
import base64
import io
import json
import re

import numpy as np
from PIL import Image

import os

# The raw archive is not in the repository — it is ~5 MB of unoptimised
# duplicates, and logos.json beside this script is the useful form of it.
# Set ADPRO_LOGO_DIR to wherever the supplied archive is unpacked when marks
# need adding or replacing.
SRC = Path(os.environ.get("ADPRO_LOGO_DIR", "./client-logos"))
OUT = Path(__file__).resolve().parent
OUT.mkdir(exist_ok=True)

PAGE = (255, 255, 255)          # the profile's paper colour
INK = (30, 58, 99)              # brand navy — the chip a white-on-dark mark gets
BOX_W, BOX_H = 260, 118         # the cell each mark is fitted into

# 118 rather than 96 because 96 was clipping the scale of sixty-nine of the
# hundred and five marks: everything square or round — an emblem, a seal, a
# roundel — wants to be about 110px tall at this optical weight, and was being
# shrunk to fit a cell built for logotypes. The U.S. Embassy seal was the one
# that made it obvious.
TARGET_AREA = 260 * 46          # optical weight: area, not height
EVEN_MIN, EVEN_MAX = 0.86, 1.45  # how far a mark may be moved to even the wall

# Every supplied file is a client mark. Several arrived with hashes or
# placeholder filenames, so they are identified by eye and named below rather
# than dropped — an earlier filename filter discarded thirteen real brands.

# Where the filename is not the brand's actual name.
RENAME = {
    # Supplied with hashes or placeholder filenames; identified from the mark.
    "1211": "Bangladesh Ansar & VDP",
    "273032559_434142691762419_7700235327177270037_n": "Sena Cement",
    "3475997dba0375d159566c4bcfd68b31ca3fe25a7101c941": "Ministry of Planning",
    "470921090d45c1f75879bdb88e05b630": "Praava Health",
    "benchmark-stikar": "Benchmark Consulting",
    "blogo": "Polar Ice Cream",
    "ex1lqlovuqympbcsircsikfvkvj8rzixs6plerea": "Sailor",
    "image-2-1024x542": "Solasta",
    "logog": "Radio Foorti 88.0 FM",
    "media_1694165084": "CEMS",
    "mmkmkmkmk": "Dekko Foods",
    "thumbnail_287dc576-76f8-4ed7-8c2d-820113f5b325": "Best Tycoon (BD) Enterprise",
    "apple-icon-27": "Client",
    "logo": "Client",

    "aci-group-logo-png_seeklogo-342185": "ACI Group",
    "apex-shoes-logo-png_seeklogo-289498": "Apex",
    "bangladesh-army-logo-f4d432f6c3-seeklogo.com": "Bangladesh Army",
    "banglalink-logo-bl-sim-company-icon-transparent-background-free-png": "Banglalink",
    "batik-air-logo-png_seeklogo-349755": "Batik Air",
    "castrol-logo-png_seeklogo-307500": "Castrol",
    "directorate-general-of-health-services-dghs-logo-fd258ba2a8-seeklogo.com": "DGHS",
    "malaysia-airlines-logo-png_seeklogo-87686": "Malaysia Airlines",
    "malaysia-airlines-logo-1": "Malaysia Airlines",
    "ministry-of-finance-bangladesh-logo-png_seeklogo-494759": "Ministry of Finance",
    "nagorik-tv-logo-png_seeklogo-630898": "Nagorik TV",
    "prothom-alo-logo-png_seeklogo-357794": "Prothom Alo",
    "royal-enfield-logo-png_seeklogo-425859": "Royal Enfield",
    "seven-rings-cement-logo-b2a94464f4-seeklogo.com": "Seven Rings Cement",
    "shark-tank-bangladesh-logo-png_seeklogo-520323": "Shark Tank Bangladesh",
    "singer-bangladesh-logo-png_seeklogo-432372": "Singer",
    "undp-logo-png_seeklogo-322648": "UNDP",
    "turaag-logo-full-png_white-removebg-preview": "Turaag",
    "uttara_logo_bgwhite": "Uttara Motors",
    "uttora motord": "Uttara Motors",
    "u.s.-embassy-seal-dhaka": "U.S. Embassy Dhaka",
    "logo_of_hamdard_(bangladesh).svg": "Hamdard",
    "coca-cola_logo.svg": "Coca-Cola",
    "kfc_logo.svg": "KFC",
    "emirates_logo.svg": "Emirates",
    "emirates-logo": "Emirates",
    "bmw_logo_(gray).svg": "BMW",
    "petronas_logo.svg": "Petronas",
    "t_sports_logo.svg": "T Sports",
    "pepsi-logo.wine": "Pepsi",
    "awrora specailist haspital ltd": "Aurora Specialised Hospital",
    "aziz-company-ltd.-logo": "Aziz Company",
    "birth-logo-in-colours-01-copy-800x249": "Birth",
    "mumtaz-herbal-products-logo-eng": "Mumtaz Herbal",
    "mugnee_white_final": "Mugnee",
    "mgh_cmyk_400x400": "MGH Group",
    "msc-primary-logo": "MSC",
    "square logo": "Square",
    "beacon pharma": "Beacon Pharmaceuticals",
    "sea pearl": "Sea Pearl",
    "le reve": "Le Reve",
    "uni mart": "Unimart",
    "waltoon logo": "Walton",
    "walton": "Walton",
    "x-ceramics": "X Ceramics",
    "dabur logo png": "Dabur",
    "hp logo": "HP",
    "casio logo": "Casio",
    "api": "API",
    "aug medix": "AugMedix",
    "cg": "CG",
    "dc office manikganj": "DC Office Manikganj",
    "matsha odhidoptor": "Department of Fisheries",
    "bashundhara logo": "Bashundhara",
    "elephant brand cement": "Elephant Brand Cement",
    "fortune telecom": "Fortune Telecom",
    "ismartu technology bd ltd": "iSmartu",
    "kazi food": "Kazi Food Industries",
    "transcom media": "Transcom",
    "twelve clothing": "Twelve",
    "watermark group": "Watermark Group",
    "mega builders": "Mega Builders",
    "top of mind": "Top of Mind",
    "aga khan academy": "Aga Khan Academy",
    "bangladesh airforce": "Bangladesh Air Force",
    "carl care": "Carl Care",
    "dekko isho": "Dekko Isho",
    "uepsl": "UEPSL",
    "zanzeelogo": "ZanZee",
    "fillup": "FillUp",
    "aaran": "Aarong",
    "exprerssions": "Expressions",
    "hikari": "Hikari",
    "hsbc": "HSBC",
    "kia": "KIA",
    "jui": "Jui",
    "spellbound": "Spellbound",
    "sencillo": "Sencillo",
    "obhai": "Obhai",
    "intercloud": "Intercloud",
    "milvik": "Milvik",
    "pathao": "Pathao",
    "hatil": "Hatil",
    "গ্রামীণ_ব্যাংকের_লোগো": "Grameen Bank",
}


def display_name(stem: str) -> str | None:
    key = stem.strip().lower()
    if key in RENAME:
        return RENAME[key]
    name = re.sub(r"[-_]+", " ", stem)
    name = re.sub(r"\s*\b(logo|png|final|copy|full|primary|svg|bgwhite|white)\b\s*", " ", name, flags=re.I)
    name = re.sub(r"\s+", " ", name).strip(" .-")
    return name.title() if 2 <= len(name) <= 34 else None


def flatten(img: Image.Image, ground: tuple = PAGE) -> Image.Image:
    """Composite onto a solid ground so no mark carries its own tile."""
    img = img.convert("RGBA")
    bg = Image.new("RGBA", img.size, ground + (255,))
    return Image.alpha_composite(bg, img).convert("RGB")


def trim(img: Image.Image) -> Image.Image:
    """
    Crop to the mark's own ink, ignoring the padding it was saved with.

    The reference is the image's own corner rather than the page colour: a few
    of these were exported onto a black or coloured block, and measuring
    against white leaves that block untrimmed and the mark floating inside a
    tile. Where the block is genuinely part of the logo, trimming against it
    only removes the surplus around it, which is the same right answer.
    """
    import PIL.ImageChops as chops

    w, h = img.size
    corners = [img.getpixel(p) for p in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1))]
    ref = max(set(corners), key=corners.count)

    diff = chops.difference(img, Image.new("RGB", img.size, ref)).convert("L")
    box = diff.point(lambda p: 255 if p > 18 else 0).getbbox()
    return img.crop(box) if box else img


def is_white_mark(path: Path) -> bool:
    """
    True when the file is a white logo drawn for a dark ground.

    A few of these were supplied that way, and flattened onto paper they
    vanish. The test has to look only at the pixels the mark actually
    occupies: measuring the whole bounding box calls almost every logo
    "light", because for any mark the box is mostly background.

    So it reads the alpha channel and asks how bright the opaque pixels are.
    A file with no transparency carries its own ground already and is left
    alone.
    """
    with Image.open(path) as im:
        im = im.convert("RGBA")
        if im.getchannel("A").getextrema()[0] == 255:   # fully opaque
            return False
        im.thumbnail((72, 72))
        lum = im.convert("L")
        alpha = im.getchannel("A")
        ink = [lum.getpixel((x, y))
               for y in range(im.height)
               for x in range(im.width)
               if alpha.getpixel((x, y)) > 140]
        if len(ink) < 24:
            return False

        # Brightness alone is not enough. A pale-but-legible mark on a mostly
        # opaque canvas reads as bright too — Carl Care averages 236 and is
        # perfectly readable on paper. What separates a true white-on-dark
        # wordmark is that it is bright *and* sparse: only the letterforms are
        # opaque, so coverage is a small fraction of the box.
        coverage = len(ink) / (im.width * im.height)
        return sum(ink) / len(ink) > 215 and coverage < 0.35


def render(img: Image.Image, ground: tuple[int, int, int], even: float) -> Image.Image:
    """Place one mark in its cell at the area-normalised size times `even`."""
    w, h = img.size
    scale = even * (TARGET_AREA / (w * h)) ** 0.5
    scale = min(scale, BOX_W / w, BOX_H / h)
    sized = img.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)
    cell = Image.new("RGB", (BOX_W, BOX_H), ground)
    cell.paste(sized, ((BOX_W - sized.width) // 2, (BOX_H - sized.height) // 2))
    return cell


def ink_mass(cell: Image.Image, ground: tuple[int, int, int]) -> float:
    """How much the mark darkens (or lightens) its cell, in pixels of full ink.

    This is the number that decides whether a mark reads as loud or quiet on
    the page, and it is not the same as how big its bounding box is. A solid
    logotype fills its box; an outline seal is mostly paper showing through
    the middle of a circle. Measured against the cell's own ground so a white
    mark on the navy chip counts its own strokes rather than the chip.
    """
    a = np.asarray(cell.convert("L"), dtype=np.float32)
    g = Image.new("RGB", (1, 1), ground).convert("L").getpixel((0, 0))
    return float(np.abs(a - g).sum() / 255.0)


def main() -> None:
    seen: dict[str, str] = {}
    skipped: list[str] = []
    out: list[dict] = []
    marks: list[dict] = []

    for path in sorted(SRC.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp"}:
            continue

        name = display_name(path.stem)
        if not name:
            skipped.append(path.name)
            continue
        key = path.stem.lower() if name == "Client" else name.lower()
        if key in seen:                     # one mark per brand
            continue

        try:
            img = trim(flatten(Image.open(path)))
        except Exception as exc:                      # noqa: BLE001
            skipped.append(f"{path.name} ({exc})")
            continue

        w, h = img.size
        if w < 12 or h < 12:
            skipped.append(path.name)
            continue

        ground = INK if is_white_mark(path) else PAGE
        if ground == INK:
            # Re-flatten against the chip so the mark's own edges antialias
            # into the dark rather than into a white halo.
            img = trim(flatten(Image.open(path), INK))

        seen[key] = name
        marks.append({"name": name, "img": img, "ground": ground})

    # Pass one at the area-normalised size, to find out what each mark weighs.
    for m in marks:
        m["cell"] = render(m["img"], m["ground"], 1.0)
        m["mass"] = ink_mass(m["cell"], m["ground"])

    # Pass two: nudge each toward the middle of the set. Area-normalising alone
    # leaves an outline seal a third lighter than the logotype beside it, and
    # a wall where some marks whisper reads as a wall assembled carelessly.
    target = float(np.median([m["mass"] for m in marks]))
    for m in marks:
        even = min(max((target / m["mass"]) ** 0.5, EVEN_MIN), EVEN_MAX)
        cell = render(m["img"], m["ground"], even)
        buf = io.BytesIO()
        cell.save(buf, "WEBP", quality=88, method=6)
        out.append({
            "name": m["name"],
            "uri": "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode(),
        })

    out.sort(key=lambda d: d["name"].lower())
    (OUT / "logos.json").write_text(json.dumps(out))

    total = sum(len(d["uri"]) for d in out)
    print(f"kept {len(out)} marks, {total/1024/1024:.2f} MB of data URIs")
    print(f"skipped {len(skipped)}: {', '.join(skipped[:12])}{'…' if len(skipped) > 12 else ''}")
    print("\nnames:", ", ".join(d["name"] for d in out))


if __name__ == "__main__":
    main()
