# Dumpster Goal Sprite Design

## Purpose

Create an animated pixel-art dumpster concept that can later serve as the stationary end goal revealed after the boss is defeated. This pass produces only a reviewable sprite sheet. It does not add the dumpster to gameplay, public assets, or any shipped build.

## Visual Design

- Three-quarter side view with a broad, readable silhouette.
- Old dark-green steel body with dents, chipped paint, rust, grime, crooked caster wheels, and layered, non-legible graffiti marks.
- Lid forced partly open by overflowing trash.
- Trash contents include recognizable bags, crushed cans, cardboard, paper, and spoiled food shapes.
- One or two flies may orbit the opening as a restrained secondary detail.
- Match the established game style: dark navy contour, three-to-four-value pixel clusters, semi-natural proportions, crisp edges, no gradients, and no anti-aliasing.
- Use additional color for trash and graffiti while keeping the dumpster body visually dominant.

## Sprite Sheet

- Canvas: 768×384 pixels with transparency.
- Grid: four columns by two rows.
- Frame size: 192×192 pixels.
- Consistent footprint, camera angle, scale, and contact point across every frame.
- Row 1: four-frame ambient idle loop with subtle lid creak, trash settling, and restrained fly movement.
- Row 2: four-frame stink loop with curling odor wisps that rise and change shape. Wisps use muted green-brown tones and remain readable against varied backgrounds.

## Deliverables

- Final transparent sprite sheet under `concepts/dumpster/`.
- Chroma-key source retained alongside the concept for revision.
- Short README containing the frame map, timing suggestions, and intended future use.

## Isolation Requirements

- Do not copy the sprite into `public/`.
- Do not reference it from application code, styles, tests, manifests, or production builds.
- Do not implement collision, goal behavior, boss sequencing, or victory logic.

## Acceptance Criteria

- All eight cells contain a coherent frame with the same dumpster design and placement.
- The dumpster reads immediately as old, graffitied, overflowing, and foul-smelling.
- Ambient and stink loops are visibly distinct while remaining subtle enough for a stationary goal prop.
- The final PNG has a valid alpha channel, transparent corners, and no obvious chroma-key fringe.
- A repository scan confirms the concept is not referenced by game or public files.
