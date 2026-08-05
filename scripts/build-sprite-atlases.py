#!/usr/bin/env python3
"""Normalize generated chroma-key art into fixed 192px sprite cells."""

from pathlib import Path

from PIL import Image


CELL = 192
TEMP = Path("/tmp/trash-dash-sprites")
OUTPUT = Path(__file__).resolve().parents[1] / "public" / "assets" / "generated"


def nearest(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    return image.resize(size, Image.Resampling.NEAREST)


def clean_key_fringe(image: Image.Image) -> Image.Image:
    """Remove saturated magenta remnants left by chroma-key conversion."""
    pixels = []
    for red, green, blue, alpha in image.get_flattened_data():
        is_key_magenta = (
            alpha
            and red > 45
            and blue > 65
            and green < 90
            and red + blue > green * 3
            and abs(red - blue) < 100
        )
        if is_key_magenta:
            pixels.append((red, green, blue, 0))
        else:
            pixels.append((red, green, blue, alpha))
    cleaned = Image.new("RGBA", image.size)
    cleaned.putdata(pixels)
    return cleaned


def build_enemy_atlas() -> None:
    rows = []
    for name in ("enemies-flying-alpha.png", "enemies-ground-alpha.png", "enemies-woodland-alpha.png"):
        source = clean_key_fringe(Image.open(TEMP / name).convert("RGBA"))
        rows.append(nearest(source, (CELL * 4, CELL * 4)))

    atlas = Image.new("RGBA", (CELL * 4, CELL * 12), (0, 0, 0, 0))
    for index, sheet in enumerate(rows):
        atlas.alpha_composite(sheet, (0, index * CELL * 4))
    atlas.save(OUTPUT / "enemy-variety-motion.png", optimize=True)


def build_pickup_atlas() -> None:
    source = clean_key_fringe(Image.open(TEMP / "pickups-alpha.png").convert("RGBA"))
    nearest(source, (CELL * 4, CELL * 4)).save(OUTPUT / "trash-pickups-motion.png", optimize=True)


def build_taco_strip() -> None:
    source = clean_key_fringe(Image.open(TEMP / "taco-alpha.png").convert("RGBA"))
    width, height = source.size
    cells = []

    for index in range(4):
        left = round(index * width / 4)
        right = round((index + 1) * width / 4)
        cell = source.crop((left, 0, right, height))
        cells.append(cell)

    strip = Image.new("RGBA", (CELL * 4, CELL), (0, 0, 0, 0))
    bounce_y = (42, 58, 24, 42)
    for index, cell in enumerate(cells):
        box = cell.getchannel("A").getbbox()
        if not box:
            continue
        cropped = cell.crop(box)
        scale = min(168 / cropped.width, 122 / cropped.height)
        target_size = (round(cropped.width * scale), round(cropped.height * scale))
        frame = nearest(cropped, target_size)
        x = index * CELL + (CELL - target_size[0]) // 2
        y = bounce_y[index]
        strip.alpha_composite(frame, (x, y))
    strip.save(OUTPUT / "taco-power-motion.png", optimize=True)


if __name__ == "__main__":
    OUTPUT.mkdir(parents=True, exist_ok=True)
    build_enemy_atlas()
    build_pickup_atlas()
    build_taco_strip()
