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


def portrait_path() -> Path:
    """Where to look for the developer portrait.

    Optional, and outside the repository like the logo. The about page falls
    back to initials when it is absent, so publishing the site is never blocked
    on having a photo.
    """
    override = os.environ.get("PORTRAIT_SOURCE")
    if override:
        return Path(override).expanduser()

    for candidate in sorted(ROOT.parent.glob("*.png")) + sorted(ROOT.parent.glob("*.jpg")):
        if "logo" not in candidate.name.lower() and "developer" in candidate.name.lower():
            return candidate
    return ROOT.parent / "developer photo.png"


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


def emblem(logo: Image.Image) -> Image.Image:
    """Cut the emblem out of a lockup, discarding the letterforms.

    The emblem is the largest connected blob: in a lockup the mark dwarfs the
    individual letters, so size is a reliable way to tell them apart without
    needing to know what the wordmark says.
    """
    alpha = logo.getchannel("A").point(lambda v: 255 if v > 60 else 0)
    labels, boxes = _components(alpha)
    if not boxes:
        return logo

    biggest = max(range(len(boxes)), key=lambda i: boxes[i][4])
    x0, y0, x1, y1 = boxes[biggest][:4]
    # A little breathing room, since the mark should not sit flush against
    # whatever it is next to.
    pad = max(x1 - x0, y1 - y0) // 14
    box = (
        max(0, x0 - pad),
        max(0, y0 - pad),
        min(logo.width, x1 + 1 + pad),
        min(logo.height, y1 + 1 + pad),
    )
    return logo.crop(box)


def _components(mask: Image.Image):
    """Label 8-connected regions, returning (count, boxes) with pixel areas."""
    import numpy as np
    from collections import deque

    grid = np.array(mask) > 0
    height, width = grid.shape
    seen = np.zeros_like(grid, dtype=bool)
    boxes = []
    for y in range(height):
        for x in range(width):
            if not grid[y, x] or seen[y, x]:
                continue
            queue = deque([(y, x)])
            seen[y, x] = True
            area = 0
            min_y = max_y = y
            min_x = max_x = x
            while queue:
                cy, cx = queue.popleft()
                area += 1
                min_y, max_y = min(min_y, cy), max(max_y, cy)
                min_x, max_x = min(min_x, cx), max(max_x, cx)
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < height and 0 <= nx < width and grid[ny, nx] and not seen[ny, nx]:
                            seen[ny, nx] = True
                            queue.append((ny, nx))
            boxes.append((min_x, min_y, max_x, max_y, area))
    return len(boxes), boxes


def square(image: Image.Image, size: int) -> Image.Image:
    """Centre the artwork on a transparent square canvas of ``size``."""
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    inner = fit(image, size)
    canvas.paste(inner, ((size - inner.width) // 2, (size - inner.height) // 2), inner)
    return canvas


def social_card(mark: Image.Image) -> Image.Image:
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
    # The emblem, not the lockup. The card already spells the name out in text,
    # and the lockup contains it too, so using the full artwork showed the name
    # twice.
    emblem_height = 150
    mark_img = fit(mark, round(emblem_height * mark.width / mark.height))
    card.alpha_composite(mark_img, ((width - mark_img.width) // 2, 96))

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

    # The supplied artwork is a *vertical* lockup: an emblem above a row of ten
    # letterforms. Scaled to a 28px header that puts each letter under three
    # pixels wide, so the raster wordmark is illegible at any UI size — and
    # rendering the artwork next to styled text would also show the name twice.
    #
    # So the emblem is cut out and used as the mark, and the wordmark stays
    # real, selectable, themeable text. Only the emblem is a raster.
    mark = emblem(logo)
    write("logo-mark.png", mark)

    for size in (16, 32, 48, 64, 180, 192, 512):
        raster = square(mark, size)
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
    write("og-image.png", social_card(mark))

    for name in written:
        print(f"  {name}")

    print(
        f"\nUpdate MARK_ASPECT in packages/ui/src/BrandLogo.tsx "
        f"if it is not already {mark.width}/{mark.height}."
    )

    portrait_src = portrait_path()
    if portrait_src.is_file():
        # Square-cropped and downscaled rather than published raw: the source is
        # a high-resolution portrait that would add about a megabyte to the
        # deploy for a 128-pixel avatar.
        portrait = Image.open(portrait_src).convert("RGB")
        side = min(portrait.size)
        left = (portrait.width - side) // 2
        top = max(0, (portrait.height - side) // 3)  # bias upward, toward the face
        portrait = portrait.crop((left, top, left + side, top + side)).resize((320, 320), Image.LANCZOS)
        write("developer.jpg", portrait)
        print(f"\nDeveloper portrait published from {portrait_src}")
    else:
        print(f"\nNo developer portrait at {portrait_src}; the about page shows initials.")


if __name__ == "__main__":
    main()
