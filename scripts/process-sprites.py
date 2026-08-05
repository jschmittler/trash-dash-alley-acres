#!/usr/bin/env python3
"""Remove the connected gray atlas backdrop while preserving interior grays."""

from collections import deque
from pathlib import Path
import sys

from PIL import Image


def is_background_candidate(pixel: tuple[int, int, int]) -> bool:
    red, green, blue = pixel
    lightness = (red + green + blue) / 3
    chroma = max(pixel) - min(pixel)
    return 108 <= lightness <= 168 and chroma <= 16


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: process-sprites.py SOURCE.png OUTPUT.png")

    source = Path(sys.argv[1])
    output = Path(sys.argv[2])
    image = Image.open(source).convert("RGBA")
    pixels = image.load()
    width, height = image.size

    background = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()

    def enqueue(x: int, y: int) -> None:
        index = y * width + x
        if background[index] or not is_background_candidate(pixels[x, y][:3]):
            return
        background[index] = 1
        queue.append((x, y))

    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)
    for y in range(height):
        enqueue(0, y)
        enqueue(width - 1, y)

    while queue:
        x, y = queue.popleft()
        if x:
            enqueue(x - 1, y)
        if x + 1 < width:
            enqueue(x + 1, y)
        if y:
            enqueue(x, y - 1)
        if y + 1 < height:
            enqueue(x, y + 1)

    for y in range(height):
        for x in range(width):
            if background[y * width + x]:
                red, green, blue, _ = pixels[x, y]
                distance = abs(red - 135) + abs(green - 135) + abs(blue - 136)
                alpha = max(0, min(255, (distance - 8) * 12))
                pixels[x, y] = (red, green, blue, alpha)

    output.parent.mkdir(parents=True, exist_ok=True)
    image.save(output, optimize=True)
    print(f"wrote {output} ({width}x{height}, RGBA)")


if __name__ == "__main__":
    main()
