#!/usr/bin/env python3
"""Normalize generated chroma-key art into fixed 192px sprite cells."""

from pathlib import Path

from PIL import Image, ImageDraw


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


def cell_pose(sheet: Image.Image, cell_size: int, column: int, row: int = 0) -> Image.Image:
    cell = sheet.crop((column * cell_size, row * cell_size, (column + 1) * cell_size, (row + 1) * cell_size))
    try:
        return isolate_largest_pose(cell)
    except ValueError as error:
        raise ValueError(f"empty player source cell {row}:{column}") from error


def strip_pose(sheet: Image.Image, column: int, count: int) -> Image.Image:
    left = round(column * sheet.width / count)
    right = round((column + 1) * sheet.width / count)
    return isolate_largest_pose(sheet.crop((left, 0, right, sheet.height)))


def adjusted_pose(pose: Image.Image, width_scale: float = 1, height_scale: float = 1) -> Image.Image:
    return nearest(pose, (max(1, round(pose.width * width_scale)), max(1, round(pose.height * height_scale))))


def place_player_pose(
    atlas: Image.Image,
    pose: Image.Image,
    row: int,
    column: int,
    max_size: tuple[int, int],
    grounded: bool = True,
    x_offset: int = 0,
    y_offset: int = 0,
) -> None:
    scale = min(max_size[0] / pose.width, max_size[1] / pose.height)
    size = (max(1, round(pose.width * scale)), max(1, round(pose.height * scale)))
    frame = nearest(pose, size)
    x = column * CELL + (CELL - frame.width) // 2 + x_offset
    if grounded:
        y = (row + 1) * CELL - BASELINE_MARGIN - frame.height + y_offset
    else:
        y = row * CELL + (CELL - frame.height) // 2 + y_offset
    atlas.alpha_composite(frame, (x, y))


def build_player_hero_atlas() -> None:
    motion = Image.open(OUTPUT.parent / "player-motion.png").convert("RGBA")
    glider = Image.open(OUTPUT.parent / "glider-motion.png").convert("RGBA")
    source = Image.open(OUTPUT.parent / "raccoon-sprites.png").convert("RGBA")
    tail_swipe = Image.open(OUTPUT / "player-tail-swipe.png").convert("RGBA")

    small = [cell_pose(motion, CELL, column, 0) for column in range(6)]
    large = [cell_pose(motion, CELL, column, 1) for column in range(6)]
    glides = [cell_pose(glider, 256, column) for column in range(6)]
    small_hurt = source.crop((1307, 100, 1412, 183))
    large_hurt = source.crop((1328, 225, 1428, 308))
    swipe_sources = [strip_pose(tail_swipe, column, 5) for column in range(5)]

    atlas = Image.new("RGBA", (CELL * 6, CELL * 22), (0, 0, 0, 0))

    recipes = {
        0: (small, [0, 1, 0, 5], (100, 100), True),
        1: (small, [0, 1, 2, 3, 4, 5], (100, 100), True),
        2: (small, [0, 2, 4, 1, 3, 5], (104, 100), True),
        3: (small, [2, 3], (102, 104), False),
        4: (small, [3, 4], (102, 104), False),
        5: ([adjusted_pose(small[5], 1.05, .88), small[0]], [0, 1], (104, 92), True),
        6: ([small_hurt, small_hurt, small_hurt], [0, 1, 2], (108, 92), True),
        7: (small, [4, 3, 2], (106, 98), True),
        8: ([small_hurt] * 4, [0, 1, 2, 3], (108, 92), True),
        9: (small, [0, 2, 4, 2], (102, 104), True),
        10: (large, [0, 1, 0, 5], (128, 126), True),
        11: (large, [0, 1, 2, 3, 4, 5], (128, 126), True),
        12: (large, [0, 2, 4, 1, 3, 5], (134, 126), True),
        13: (large, [2, 3], (130, 132), False),
        14: (large, [3, 4], (130, 132), False),
        15: ([adjusted_pose(large[5], 1.06, .88), large[0]], [0, 1], (134, 116), True),
        16: (swipe_sources, [0, 1, 2, 3, 4], (150, 126), True),
        17: ([large_hurt] * 3, [0, 1, 2], (138, 112), True),
        18: ([large_hurt, large_hurt, large_hurt, small[0]], [0, 1, 2, 3], (138, 112), True),
        19: (glides, [0, 1, 2, 3, 4, 5], (164, 150), False),
        20: (large, [4, 3, 2], (136, 124), True),
        21: (large, [0, 2, 4, 2], (132, 132), True),
    }

    for row, (poses, indexes, max_size, grounded) in recipes.items():
        for column, index in enumerate(indexes):
            pose = poses[index]
            x_offset = 0
            y_offset = 0
            if row in (6, 8, 17):
                x_offset = (-2, 0, 2, 0)[column]
            if row in (9, 21):
                y_offset = (0, -5, -9, -4)[column]
            if row == 18:
                scale = (1, .84, .68, .78)[column]
                pose = adjusted_pose(pose, scale, scale)
            place_player_pose(atlas, pose, row, column, max_size, grounded, x_offset, y_offset)

    atlas.save(OUTPUT / "player-hero-motion.png", optimize=True)

    label_width = 128
    contact = Image.new("RGBA", (label_width + atlas.width, atlas.height), (15, 37, 36, 255))
    contact.alpha_composite(atlas, (label_width, 0))
    draw = ImageDraw.Draw(contact)
    names = [
        "small idle", "small walk", "small run", "small jump", "small fall", "small land",
        "small hurt", "small skid", "small defeat", "small victory", "large idle", "large walk",
        "large run", "large jump", "large fall", "large land", "tail swipe", "large hurt",
        "large shrink", "large glide", "large skid", "large victory",
    ]
    for row, name in enumerate(names):
        draw.text((8, row * CELL + 82), name, fill=(255, 177, 59, 255))
        draw.line((label_width, (row + 1) * CELL - BASELINE_MARGIN, contact.width, (row + 1) * CELL - BASELINE_MARGIN), fill=(255, 177, 59, 100), width=1)
    contact.save(OUTPUT / "player-hero-contact-sheet.png", optimize=True)


if __name__ == "__main__":
    OUTPUT.mkdir(parents=True, exist_ok=True)
    build_enemy_atlas()
    build_pickup_atlas()
    build_taco_strip()
    build_player_attack()
    build_player_hero_atlas()
