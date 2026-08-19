#!/usr/bin/env python3
"""
Prints the company profile to PDF.

The profile is authored as HTML because that is the form that survives being
edited. What actually gets attached to an email is a PDF, and asking whoever
sends it to open a browser and find the right print settings is asking for a
document that goes out on US Letter with a file:// URL across the footer. So
the settings live here: A4, backgrounds on, no browser furniture, margins
left to the document's own @page rule.

Two passes, because the second one matters more than it sounds. Chromium
stores every image losslessly, which for 19 photographs means a 9 MB file
that some mail servers will bounce and every recipient will resent. The
photographs are re-encoded as JPEG afterwards; the client marks are left
exactly as they are, since JPEG rings around flat colour and hard edges and
a logo is nothing but flat colour and hard edges.

    python3 scripts/profile/pdf.py

Writes company-profile.pdf beside the HTML.
"""

from pathlib import Path
import io
import shutil
import subprocess
import sys

from PIL import Image
from pypdf import PdfReader, PdfWriter

ROOT = Path(__file__).resolve().parent.parent.parent
SRC = ROOT / "company-profile.html"
OUT = ROOT / "company-profile.pdf"

# What separates a photograph from a client mark here: the marks are all
# 260x96, and every photograph is a landscape crop of 16:9 or wider. The
# square logo on the cover fails the second test and keeps its lossless
# encoding, which is what you want for a mark.
PHOTO_WIDTH = 300
PHOTO_RATIO = 1.3
QUALITY = 76


def find_chrome() -> str:
    for c in (
        "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
        shutil.which("chromium"),
        shutil.which("google-chrome"),
    ):
        if c and Path(c).exists():
            return c
    sys.exit("no chromium found")


def render() -> None:
    subprocess.run(
        [
            find_chrome(),
            "--headless",
            "--no-sandbox",
            "--disable-gpu",
            "--disable-dev-shm-usage",
            # Without this the print can start before the last image has been
            # composited, and the page goes out with an empty box on it.
            "--run-all-compositor-stages-before-draw",
            "--virtual-time-budget=30000",
            "--no-pdf-header-footer",
            f"--print-to-pdf={OUT}",
            SRC.as_uri(),
        ],
        check=True,
        capture_output=True,
    )


def shrink() -> tuple[int, int]:
    reader = PdfReader(OUT)
    writer = PdfWriter(clone_from=reader)
    done, seen = 0, set()

    for page in writer.pages:
        for img in page.images:
            ref = img.indirect_reference
            key = ref.idnum if ref else None
            if key in seen:
                continue
            seen.add(key)
            pil = img.image
            if pil is None:
                continue
            if pil.width < PHOTO_WIDTH or pil.width / pil.height < PHOTO_RATIO:
                continue
            img.replace(pil.convert("RGB"), quality=QUALITY, optimize=True)
            done += 1

    buf = io.BytesIO()
    writer.write(buf)
    OUT.write_bytes(buf.getvalue())
    return done, len(writer.pages)


def main() -> None:
    if not SRC.exists():
        sys.exit("no company-profile.html — run: node scripts/profile/build.mjs")
    render()
    before = OUT.stat().st_size
    photos, pages = shrink()
    after = OUT.stat().st_size
    print(
        f"company-profile.pdf — {pages} pages, {photos} photographs recompressed, "
        f"{before / 1024 / 1024:.2f} MB -> {after / 1024 / 1024:.2f} MB"
    )


if __name__ == "__main__":
    main()
