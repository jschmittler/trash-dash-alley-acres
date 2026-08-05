# Dumpster Cartoon Style Revision Design

## Goal

Replace the current dumpster concept art with a compact, side-view 16-bit cartoon prop that visually belongs beside the existing raccoon hero and enemy sprites.

## Style Anchor

- Match the hero/enemy sprite atlas: chunky readable silhouette, dark navy contour, crisp pixel clusters, limited value steps, and bright accent colors.
- Use semi-natural cartoon proportions rather than realistic perspective or fine surface rendering.
- Prefer large readable rust, graffiti, trash, and odor shapes over tiny texture marks.
- Keep the dumpster body visually close in scale and baseline to the existing 192×192 sprite cells.

## Animation Sheet

- Preserve the existing private 768×384 atlas layout: four columns by two rows, 192×192 per frame.
- Row 0: four-frame idle loop with only subtle lid/trash settling.
- Row 1: four-frame stink loop with chunky green-brown odor puffs; no realistic smoke rendering.
- Keep body footprint, baseline, camera angle, and silhouette consistent across all eight cells.

## Content

- Side-view old dark-green dumpster with a partly open lid.
- Simple, readable graffiti marks, dents, rust patches, and crooked wheels.
- Overflowing bags, cans, cardboard, and spoiled food shapes.
- No face, eyes, character limbs, photorealistic lighting, gradients, or detailed 3D perspective.

## Isolation

- Replace only the private concept files under `concepts/dumpster/`.
- Do not add any asset to `public/`, application code, tests, or production output.

## Acceptance Criteria

- At a glance, the dumpster shares the same polished 16-bit language as the hero and enemies.
- The silhouette and baseline remain stable across all eight frames.
- Idle and stink motion are readable at game scale without fine-detail noise.
- Final atlas remains RGBA 768×384 with eight populated 192×192 cells and transparent corners.
