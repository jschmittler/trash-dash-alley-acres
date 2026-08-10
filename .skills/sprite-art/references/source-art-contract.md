# Source Art Contract

## Project profile

- Engine/presentation: HTML5 Canvas at a 960×540 logical stage, responsive 16:9 cabinet, nearest-neighbor rendering.
- Style: polished late-16-bit pixel art; side-on orthographic-feeling gameplay plane.
- Contours: consistent dark navy or blue-gray, not thick pure-black stickers.
- Shading: three-to-four-value clusters with material-specific texture; no smooth gradients or antialiasing.
- Lighting: match the active level and nearby approved assets; preserve one coherent light direction per scene.
- Characters: semi-natural compact anatomy, readable directional eyes, restrained expressions, and established accessories/proportions.
- Base animation cell: normally 192×192 unless a documented family manifest declares otherwise.
- Runtime sampling: nearest-neighbor; no fractional resampling of source art.

## Source integrity

Preserve approved identity, silhouette, anatomy, markings, clothing, equipment, perspective, palette, and gameplay scale unless the user explicitly requests a redesign. Store authoring sources under `concepts/` and runtime outputs under `public/assets/` according to `docs/asset-manifest.md`. Record source layout, baseline, frame order, and intended consumer in a nearby source README.

Every generated sheet must state cell size, rows, columns, read order, canonical facing, baseline/attachment contract, key color if used, and whether detached pixels are intentional. Keep source, processed, runtime, and contact-sheet artifacts distinct.

## Completeness and animation-state coverage

Inventory mechanics before art. Where applicable, provide:

- Players: true idle, walk, run, skid/turn, jump anticipation, ascent, apex, descent, land, hit, defeat, victory, attack, glide/fly, transformation, and form/equipment states.
- Enemies: idle/sleep, patrol/move, turn/alert, tell, attack/action, recovery, jump/fall/land, hit, stunned/vulnerable, defeat, spawn/despawn, and specials.
- Bosses: intro, idle, locomotion, primary/secondary/special attacks, hit, stunned/open, phase transition, enraged/final, defeat, and exit.
- Items: idle/hover, spawn, pickup, activate/use, cooldown, equipped, depleted, locked/unlocked, or destroyed.
- NPCs: idle, ambient, notice, greet/talk/gesture, move, interact, give/receive, react, flee, sleep, and exit when their role needs them.
- Animated objects/platforms: idle, startup/anticipation, active motion, impact, recovery/stop, damage/break, and reset.
- Effects: anticipation, connected active peak, impact, taper/dissipation, and end.

Only create states that the game uses, but every used state needs intentional artwork. Dangerous actions require a readable tell. Non-loop reactions need complete visible endings.

## Frame construction

- Keep the complete silhouette inside safe cell margins at every motion extreme.
- Use one canonical facing when clean runtime flipping is valid.
- Lock logical feet, body center, or attachment socket across frames; transparent padding is not registration data.
- Keep emitted effects out of body-only cells. Effect-only cells must not contain a duplicate body.
- Use hard alpha for pixel art. Preserve intentional soft/semi-transparent water, smoke, light, and glow only when the effect design requires it.
- Inspect contact sheets at native size and 200–400% zoom for edge spill, crop contamination, missing parts, unrelated neighboring art, and scale drift.

## Acceptance

Reject incomplete sheets, mixed viewpoints, inconsistent pixel density, squeezed anatomy, clipped motion, key-color spill, accidental backgrounds, unreadable silhouettes, arbitrary per-frame scale changes, duplicate bodies, or source art that cannot pass the canonical rendering pipeline without a one-off correction.
