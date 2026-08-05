#!/usr/bin/env python3
"""Build Jimothy's private concept atlas. This script does not touch public assets."""

from pathlib import Path

from PIL import Image, ImageDraw


CELL = 192
ROOT = Path(__file__).resolve().parent
SHEETS = ROOT / "sheets"


def clean_key_fringe(image: Image.Image) -> Image.Image:
    pixels = []
    for red, green, blue, alpha in image.getdata():
        if alpha and red > 175 and blue > 165 and green < 105 and red + blue > green * 4:
            pixels.append((red, green, blue, 0))
        else:
            pixels.append((red, green, blue, alpha))
    cleaned = Image.new("RGBA", image.size)
    cleaned.putdata(pixels)
    return cleaned


def normalized_sheet(name: str) -> Image.Image:
    path = SHEETS / name
    source = clean_key_fringe(Image.open(path).convert("RGBA"))
    normalized = source.resize((CELL * 4, CELL * 4), Image.Resampling.NEAREST)
    normalized.save(path, optimize=True)
    return normalized


def place_pose(atlas: Image.Image, source: Image.Image, row: int, column: int) -> None:
    cell = source.crop((column * CELL, (row % 4) * CELL, (column + 1) * CELL, (row % 4 + 1) * CELL))
    box = cell.getchannel("A").getbbox()
    if not box:
        raise ValueError(f"empty Jimothy cell {row}:{column}")
    pose = cell.crop(box)
    scale = min(164 / pose.width, 168 / pose.height)
    frame = pose.resize((round(pose.width * scale), round(pose.height * scale)), Image.Resampling.NEAREST)
    x = column * CELL + (CELL - frame.width) // 2
    y = (row + 1) * CELL - 8 - frame.height
    atlas.alpha_composite(frame, (x, y))


def main() -> None:
    names = ("jimothy-locomotion.png", "jimothy-actions.png", "jimothy-character.png")
    sheets = [normalized_sheet(name) for name in names]
    atlas = Image.new("RGBA", (CELL * 4, CELL * 12), (0, 0, 0, 0))
    for row in range(12):
        for column in range(4):
            place_pose(atlas, sheets[row // 4], row, column)
    atlas.save(ROOT / "jimothy-animation-atlas.png", optimize=True)

    label_width = 130
    contact = Image.new("RGBA", (label_width + atlas.width, atlas.height), (15, 37, 36, 255))
    contact.alpha_composite(atlas, (label_width, 0))
    draw = ImageDraw.Draw(contact)
    names = ("idle", "walk", "run", "jump", "fall", "forage", "paw swipe", "roll", "climb", "eat", "groom", "hurt")
    for row, name in enumerate(names):
        draw.text((8, row * CELL + 86), name, fill=(255, 177, 59, 255))
        baseline = (row + 1) * CELL - 8
        draw.line((label_width, baseline, contact.width, baseline), fill=(255, 177, 59, 100), width=1)
    contact.save(ROOT / "jimothy-animation-contact-sheet.png", optimize=True)


if __name__ == "__main__":
    main()
