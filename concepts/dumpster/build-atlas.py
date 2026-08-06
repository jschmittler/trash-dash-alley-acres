#!/usr/bin/env python3
"""Assemble the sealed and holy dumpster sheets into one runtime atlas.

The compositor intentionally uses only the Python standard library so the
review asset can be rebuilt from a clean checkout without installing Pillow.
It supports the 8-bit RGBA PNG sheets produced by the generation pipeline.
"""

import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SHEETS = ROOT / "sheets"
OUTPUT = ROOT / "dumpster-holy-atlas.png"
FRAME_SIZE = 192
ROW_SIZE = FRAME_SIZE * 4
STINK_SCALE_X = 1.0
TARGET_CONTACT_Y = 183


PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"


def read_png(path: Path, expected_width: int = ROW_SIZE, expected_height: int = FRAME_SIZE) -> tuple[int, int, bytearray]:
    """Decode an 8-bit RGBA, non-interlaced PNG into packed RGBA pixels."""
    raw = path.read_bytes()
    if not raw.startswith(PNG_SIGNATURE):
        raise ValueError(f"{path}: not a PNG")
    cursor = len(PNG_SIGNATURE)
    width = height = None
    bit_depth = color_type = interlace = None
    compressed = bytearray()
    while cursor < len(raw):
        length = struct.unpack("!I", raw[cursor : cursor + 4])[0]
        chunk_type = raw[cursor + 4 : cursor + 8]
        chunk = raw[cursor + 8 : cursor + 8 + length]
        cursor += 12 + length
        if chunk_type == b"IHDR":
            width, height, bit_depth, color_type, _, _, interlace = struct.unpack("!IIBBBBB", chunk)
        elif chunk_type == b"IDAT":
            compressed.extend(chunk)
        elif chunk_type == b"IEND":
            break
    if (width, height, bit_depth, color_type, interlace) != (expected_width, expected_height, 8, 6, 0):
        raise ValueError(f"{path}: expected {expected_width}x{expected_height} 8-bit RGBA PNG")

    scanlines = zlib.decompress(compressed)
    stride = width * 4
    expected = height * (stride + 1)
    if len(scanlines) != expected:
        raise ValueError(f"{path}: unexpected decompressed data length")
    pixels = bytearray(height * stride)
    previous = bytearray(stride)
    offset = 0
    for y in range(height):
        filter_type = scanlines[offset]
        encoded = scanlines[offset + 1 : offset + 1 + stride]
        offset += stride + 1
        row = bytearray(stride)
        for x, value in enumerate(encoded):
            left = row[x - 4] if x >= 4 else 0
            up = previous[x]
            upper_left = previous[x - 4] if x >= 4 else 0
            if filter_type == 0:
                predictor = 0
            elif filter_type == 1:
                predictor = left
            elif filter_type == 2:
                predictor = up
            elif filter_type == 3:
                predictor = (left + up) // 2
            elif filter_type == 4:
                estimate = left + up - upper_left
                distances = (abs(estimate - left), abs(estimate - up), abs(estimate - upper_left))
                predictor = (left, up, upper_left)[distances.index(min(distances))]
            else:
                raise ValueError(f"{path}: unsupported PNG filter {filter_type}")
            row[x] = (value + predictor) & 0xFF
        pixels[y * stride : (y + 1) * stride] = row
        previous = row
    return width, height, pixels


def write_png(path: Path, width: int, height: int, pixels: bytes) -> None:
    def chunk(kind: bytes, payload: bytes) -> bytes:
        return struct.pack("!I", len(payload)) + kind + payload + struct.pack("!I", zlib.crc32(kind + payload) & 0xFFFFFFFF)

    stride = width * 4
    scanlines = b"".join(b"\x00" + pixels[y * stride : (y + 1) * stride] for y in range(height))
    header = struct.pack("!IIBBBBB", width, height, 8, 6, 0, 0, 0)
    path.write_bytes(PNG_SIGNATURE + chunk(b"IHDR", header) + chunk(b"IDAT", zlib.compress(scanlines, 9)) + chunk(b"IEND", b""))


def load_row(name: str) -> bytearray:
    path = SHEETS / f"{name}.png"
    _, _, pixels = read_png(path)
    return pixels


def normalize_row(pixels: bytearray) -> bytearray:
    """Align each frame's contact baseline without scaling its silhouette."""
    normalized = bytearray(len(pixels))
    scaled_width = round(FRAME_SIZE * STINK_SCALE_X)
    x_offset = (FRAME_SIZE - scaled_width) // 2
    for cell in range(4):
        cell_start = cell * FRAME_SIZE * 4
        contact_y = max(
            source_y
            for source_y in range(FRAME_SIZE)
            for source_x in range(FRAME_SIZE)
            if pixels[source_y * ROW_SIZE * 4 + cell_start + source_x * 4 + 3]
        )
        shift_y = TARGET_CONTACT_Y - contact_y
        for source_y in range(FRAME_SIZE):
            target_y = source_y + shift_y
            if not 0 <= target_y < FRAME_SIZE:
                continue
            for source_x in range(FRAME_SIZE):
                source_offset = (source_y * ROW_SIZE * 4 + cell * FRAME_SIZE * 4 + source_x * 4)
                if pixels[source_offset + 3] == 0:
                    continue
                target_x = x_offset + round(source_x * STINK_SCALE_X)
                if not 0 <= target_x < FRAME_SIZE:
                    continue
                target_offset = (target_y * ROW_SIZE * 4 + cell * FRAME_SIZE * 4 + target_x * 4)
                normalized[target_offset : target_offset + 4] = pixels[source_offset : source_offset + 4]
    return normalized


def main() -> None:
    sealed = normalize_row(load_row("dumpster-sealed"))
    holy = normalize_row(load_row("dumpster-holy"))

    atlas = sealed + holy
    write_png(OUTPUT, ROW_SIZE, FRAME_SIZE * 2, atlas)

    width, height, pixels = read_png(OUTPUT, ROW_SIZE, FRAME_SIZE * 2)
    if (width, height) != (ROW_SIZE, FRAME_SIZE * 2) or len(pixels) != ROW_SIZE * FRAME_SIZE * 2 * 4:
        raise ValueError(f"atlas validation failed: {width}x{height}")

    print(f"Wrote {OUTPUT} ({ROW_SIZE}x{FRAME_SIZE * 2} RGBA)")


if __name__ == "__main__":
    main()
