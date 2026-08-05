#!/usr/bin/env python3
"""Assemble the private dumpster idle and stink sheets into one review atlas."""

from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parent
SHEETS = ROOT / "sheets"
OUTPUT = ROOT / "dumpster-animation-atlas.png"
FRAME_SIZE = 192
ROW_SIZE = FRAME_SIZE * 4


def load_row(name: str) -> Image.Image:
    path = SHEETS / f"{name}.png"
    with Image.open(path) as source:
        row = source.convert("RGBA")
    if row.size != (ROW_SIZE, FRAME_SIZE):
        raise ValueError(f"{path}: expected {ROW_SIZE}x{FRAME_SIZE}, got {row.size}")
    return row


def main() -> None:
    idle = load_row("dumpster-idle")
    stink = load_row("dumpster-stink")

    atlas = Image.new("RGBA", (ROW_SIZE, FRAME_SIZE * 2), (0, 0, 0, 0))
    atlas.paste(idle, (0, 0))
    atlas.paste(stink, (0, FRAME_SIZE))
    atlas.save(OUTPUT, format="PNG")

    with Image.open(OUTPUT) as result:
        if result.size != (ROW_SIZE, FRAME_SIZE * 2) or result.mode != "RGBA":
            raise ValueError(f"atlas validation failed: {result.size} {result.mode}")

    print(f"Wrote {OUTPUT} ({ROW_SIZE}x{FRAME_SIZE * 2} RGBA)")


if __name__ == "__main__":
    main()
