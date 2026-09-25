#!/usr/bin/env python3
"""Regenerate the BlockSense brand assets from the source artwork.

Run with ``pnpm brand:assets``, or directly:

    python3 scripts/build-brand-assets.py [path/to/logo.png]

The source logo lives outside the repository so it is not duplicated in git.
Set ``BRAND_SOURCE`` or pass a path as the first argument. Every derived file
is committed, so a clean checkout builds and deploys without needing it.

Requires Pillow, which is a local development tool only -- it is deliberately
not a project dependency, because the derived assets are checked in and the
app never needs to process an image at build time.

Favicons are drawn on a square transparent canvas rather than resized to a
square, because the artwork is a wide lockup and squashing it would distort
the letterforms.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:  # pragma: no cover - developer feedback only
    sys.exit("Pillow is required: pip install Pillow")

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "apps/web/public"

# Palette taken from the app's dark theme tokens in apps/web/src/styles/index.css.
OG_BG = (11, 18, 32)
OG_INK = (248, 250, 252)
OG_MUTED = (148, 163, 184)
OG_PRIMARY = (59, 130, 246)
OG_SIZE = (1200, 630)

FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REGULAR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


def source_path() -> Path:
    candidate = (
        sys.argv[1]
        if len(sys.argv) > 1
        else os.environ.get("BRAND_SOURCE") or ROOT.parent / "logo BlockSense.png"
    )
    path = Path(candidate).expanduser()
    if not path.is_file():
        sys.exit(
            f"Brand artwork not found: {path}\n"
            "Set BRAND_SOURCE or pass the image path as the first argument."
        )
    return path


def load_font(path: str, size: int) -> ImageFont.FreeTypeFont:
    try:
        return ImageFont.truetype(path, size)
    except OSError:
        # A minimal Linux install may not ship DejaVu; fall back to Pillow's
        # bitmap font so the script still produces a usable card.
        return ImageFont.load_default()


def fit(image: Image.Image, width: int) -> Image.Image:
    height = max(1, round(image.height * (width / image.width)))
    return image.resize((width, height), Image.LANCZOS)


def square(image: Image.Image, size: int) -> Image.Image:
    """Centre the artwork on a transparent square canvas of ``size``."""
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    inner = fit(image, size)
    canvas.paste(inner, ((size - inner.width) // 2, (size - inner.height) // 2), inner)
    return canvas


def social_card(logo: Image.Image) -> Image.Image:
    width, height = OG_SIZE
    card = Image.new("RGBA", OG_SIZE, OG_BG + (255,))

    # A restrained diagonal wash in the brand colour: enough to match the app,
    # not enough to compete with the artwork.
    wash = Image.new("RGBA", OG_SIZE, (0, 0, 0, 0))
    wash_draw = ImageDraw.Draw(wash)
    for i in range(220):
        alpha = int(26 * (1 - i / 220))
        wash_draw.line(
            [(width * 0.55 + i, 0), (width * 0.95 + i, height)],
            fill=OG_PRIMARY + (alpha,),
            width=2,
        )
    card = Image.alpha_composite(card, wash)

    logo_width = 380
    card.alpha_composite(fit(logo, logo_width), ((width - logo_width) // 2, 92))

    draw = ImageDraw.Draw(card)
    for text, y, font, colour in (
        ("BlockSense", 508, load_font(FONT_BOLD, 62), OG_INK),
        ("See the transaction. Understand the behavior.", 590, load_font(FONT_REGULAR, 27), OG_MUTED),
    ):
        box = draw.textbbox((0, 0), text, font=font)
        draw.text(((width - (box[2] - box[0])) / 2 - box[0], y), text, font=font, fill=colour)

    return card.convert("RGB")


def main() -> None:
    source = source_path()
    OUT.mkdir(parents=True, exist_ok=True)

    # Drop fully transparent margins so the artwork fills its box.
    logo = Image.open(source).convert("RGBA")
    bbox = logo.getchannel("A").getbbox()
    if bbox:
        logo = logo.crop(bbox)

    aspect = logo.width / logo.height
    print(f"Source  {source}")
    print(f"Trimmed {logo.width}x{logo.height} (aspect {aspect:.2f})\n")

    written: list[str] = []

    def write(name: str, image: Image.Image) -> None:
        image.save(OUT / name, **({"quality": 95} if name.endswith(".png") and image.mode == "RGB" else {}))
        written.append(name)

    print("Writing:")
    # One raster only: the trimmed source is already ~419px wide, which is far
    # more than the largest slot it renders into, so a @2x copy would only add
    # weight to the deploy.
    write("logo.png", logo)

    for size in (16, 32, 48, 64, 180, 192, 512):
        raster = square(logo, size)
        name = {180: "apple-touch-icon.png", 192: "icon-192.png", 512: "icon-512.png"}.get(
            size, f"favicon-{size}x{size}.png"
        )
        write(name, raster)
        if size == 64:
            # A multi-size .ico cannot be written by Pillow from a raster
            # without a plugin; browsers needing smaller entries fall back to
            # the PNG links declared in index.html.
            raster.save(OUT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
            written.append("favicon.ico")

    # One social card: Open Graph and Twitter card tags both point at it, so a
    # second copy would be a second copy of the same bytes.
    write("og-image.png", social_card(logo))

    for name in written:
        print(f"  {name}")

    print(
        f"\nUpdate ARTWORK_ASPECT in packages/ui/src/BrandLogo.tsx "
        f"if it is not already {logo.width}/{logo.height}."
    )


if __name__ == "__main__":
    main()
