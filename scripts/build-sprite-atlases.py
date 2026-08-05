#!/usr/bin/env python3
"""Normalize generated chroma-key art into fixed 192px sprite cells."""

from pathlib import Path

from PIL import Image


CELL = 192
BASELINE_MARGIN = 8
TEMP = Path("/tmp/trash-dash-sprites")
OUTPUT = Path(__file__).resolve().parents[1] / "public" / "assets" / "generated"


def nearest(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    return image.resize(size, Image.Resampling.NEAREST)


def clean_key_fringe(image: Image.Image) -> Image.Image:
    """Remove saturated magenta remnants left by chroma-key conversion."""
    pixels = []
    for red, green, blue, alpha in image.getdata():
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


def connected_pose_bounds(row_image: Image.Image) -> list[tuple[int, int, int, int]]:
    """Return the four large connected sprite components from one source row."""
    alpha = row_image.getchannel("A")
    width, height = alpha.size
    pixels = alpha.load()
    visited = bytearray(width * height)
    components = []

    for y in range(height):
        for x in range(width):
            start = y * width + x
            if visited[start] or pixels[x, y] == 0:
                continue
            visited[start] = 1
            stack = [start]
            count = 0
            left = right = x
            top = bottom = y

            while stack:
                index = stack.pop()
                point_y, point_x = divmod(index, width)
                count += 1
                left = min(left, point_x)
                right = max(right, point_x)
                top = min(top, point_y)
                bottom = max(bottom, point_y)

                if point_x > 0:
                    neighbors = (index - 1,)
                else:
                    neighbors = ()
                if point_x + 1 < width:
                    neighbors += (index + 1,)
                if point_y > 0:
                    neighbors += (index - width,)
                if point_y + 1 < height:
                    neighbors += (index + width,)

                for neighbor in neighbors:
                    neighbor_y, neighbor_x = divmod(neighbor, width)
                    if not visited[neighbor] and pixels[neighbor_x, neighbor_y] != 0:
                        visited[neighbor] = 1
                        stack.append(neighbor)

            if count >= 64:
                components.append((count, left, top, right + 1, bottom + 1))

    poses = sorted(sorted(components, reverse=True)[:4], key=lambda component: component[1])
    if len(poses) != 4:
        raise ValueError(f"expected four connected poses, found {len(poses)}")
    return [(left, top, right, bottom) for _, left, top, right, bottom in poses]


def isolate_largest_pose(image: Image.Image) -> Image.Image:
    """Keep only the largest connected sprite in a crowded atlas crop."""
    alpha = image.getchannel("A")
    width, height = alpha.size
    pixels = alpha.load()
    visited = bytearray(width * height)
    components: list[list[int]] = []

    for y in range(height):
        for x in range(width):
            start = y * width + x
            if visited[start] or pixels[x, y] == 0:
                continue
            visited[start] = 1
            stack = [start]
            component = []
            while stack:
                index = stack.pop()
                component.append(index)
                point_y, point_x = divmod(index, width)
                neighbors = []
                if point_x > 0:
                    neighbors.append(index - 1)
                if point_x + 1 < width:
                    neighbors.append(index + 1)
                if point_y > 0:
                    neighbors.append(index - width)
                if point_y + 1 < height:
                    neighbors.append(index + width)
                for neighbor in neighbors:
                    neighbor_y, neighbor_x = divmod(neighbor, width)
                    if not visited[neighbor] and pixels[neighbor_x, neighbor_y] != 0:
                        visited[neighbor] = 1
                        stack.append(neighbor)
            components.append(component)

    if not components:
        raise ValueError("attack crop contains no sprite")
    pose_pixels = max(components, key=len)
    isolated = Image.new("RGBA", image.size, (0, 0, 0, 0))
    source_pixels = image.load()
    output_pixels = isolated.load()
    for index in pose_pixels:
        y, x = divmod(index, width)
        output_pixels[x, y] = source_pixels[x, y]
    bounds = isolated.getchannel("A").getbbox()
    if not bounds:
        raise ValueError("isolated attack pose is empty")
    return isolated.crop(bounds)


def normalize_enemy_sheet(source: Image.Image, grounded_rows: tuple[int, ...]) -> Image.Image:
    """Extract complete poses before fitting them to the shared cell baseline."""
    sheet = nearest(source, (CELL * 4, CELL * 4))
    source_scale = (CELL * 4) / source.width

    for row in grounded_rows:
        source_top = round(row * source.height / 4)
        source_bottom = round((row + 1) * source.height / 4)
        source_row = source.crop((0, source_top, source.width, source_bottom))
        poses = connected_pose_bounds(source_row)
        sheet.paste((0, 0, 0, 0), (0, row * CELL, CELL * 4, (row + 1) * CELL))

        for column, bounds in enumerate(poses):
            pose = source_row.crop(bounds)
            scale = min(
                source_scale,
                (CELL - 2) / pose.width,
                (CELL - BASELINE_MARGIN - 1) / pose.height,
            )
            size = (round(pose.width * scale), round(pose.height * scale))
            frame = nearest(pose, size)
            left = column * CELL + (CELL - size[0]) // 2
            top = (row + 1) * CELL - BASELINE_MARGIN - size[1]
            sheet.alpha_composite(frame, (left, top))

    return sheet


def build_enemy_atlas() -> None:
    sheet_specs = (
        ("enemies-flying-alpha.png", ()),
        ("enemies-ground-alpha.png", (0, 1, 2, 3)),
        ("enemies-woodland-alpha.png", (0, 2, 3)),
    )
    rows = []
    for name, grounded_rows in sheet_specs:
        source = clean_key_fringe(Image.open(TEMP / name).convert("RGBA"))
        rows.append(normalize_enemy_sheet(source, grounded_rows))

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


def build_player_attack() -> None:
    source = Image.open(OUTPUT.parent / "raccoon-sprites.png").convert("RGBA")
    crowded_attack = source.crop((600, 310, 720, 410))
    isolate_largest_pose(crowded_attack).save(OUTPUT / "player-attack.png", optimize=True)


if __name__ == "__main__":
    OUTPUT.mkdir(parents=True, exist_ok=True)
    build_enemy_atlas()
    build_pickup_atlas()
    build_taco_strip()
    build_player_attack()
