# Dumpster generation prompts

These are the exact prompts for the revised cartoon-style source sheets. Both prompts use the existing hero and enemy atlases as hard style anchors so the dumpster reads as part of the same polished 16-bit cast.

## Reference roles

- **Game-style reference:** `public/assets/generated/player-hero-motion.png` and `public/assets/generated/enemy-variety-motion.png`; use for chunky side-view silhouettes, dark navy outlines, 16-bit pixel clusters, simplified cartoon proportions, and crisp nearest-neighbor edges.
- **Subject reference:** the approved dumpster goal design described in `docs/superpowers/specs/2026-08-05-dumpster-goal-sprite-design.md`; use for the three-quarter view, dark-green steel body, partly open lid, overflowing trash, graffiti, dents, rust, grime, and crooked caster wheels.
- **Motion reference:** the preceding frame in the same generated sheet; preserve the exact footprint, camera angle, scale, and contact point while changing only the requested animation details.

## Idle source sheet

> Create a polished 16-bit 4-frame horizontal sprite sheet for the Trash Dash post-boss dumpster goal. Match the existing raccoon hero and enemy atlases as hard style references: compact side-view silhouettes, chunky dark navy outline, simplified cartoon proportions, three-tone pixel clusters, and bright readable accents. Render exactly four evenly spaced 192×192 frames on one 768×192 canvas with a flat, uniform `#00ff00` chroma-key background. Keep the side-view silhouette, scale, footprint, wheel/contact point, lid angle, and trash pile locked across all frames. Show one old dark-olive dumpster with a big chunky body, partly-open lid, three black trash bags, a few large cans/cardboard/food scraps, two crooked wheels, simple non-legible graffiti squiggles, and one small rust patch. Animate only tiny lid bob and one bag wobble. Use hard pixel edges, no gradients, no anti-aliasing, no realistic metal texture, and no perspective rendering. No text, logos, scenery, ground plane, shadows outside the silhouette, UI, characters, flies, or extra props.

## Stink source sheet

> Create a polished 16-bit 4-frame horizontal stink animation sheet for the same Trash Dash dumpster, using the existing hero and enemy atlases plus the revised idle sheet as hard references. Render exactly four evenly spaced 192×192 frames on one 768×192 canvas with a flat, uniform `#00ff00` chroma-key background. Lock the dumpster's compact side-view silhouette, scale, footprint, wheel/contact point, lid angle, trash, graffiti, and palette across every frame. Animate only chunky muted green-brown odor puffs with dark navy pixel edges: small puff, taller curl, split puff, return puff. Keep the dumpster itself nearly stationary. Use three-tone clustered shading, hard pixel edges, no gradients, no realistic smoke, no anti-aliasing, no text, logos, scenery, ground plane, external shadows, UI, characters, flies, or any new objects beyond the odor puffs.

## Shared negative constraints

Do not output a full scene, perspective change, extra camera angle, duplicate dumpsters, frame borders, labels, captions, text, logos, UI elements, gradients, blur, anti-aliasing, smooth vector curves, painterly texture, or a background color other than the exact flat `#00ff00` key. Keep all four frames aligned to the same 192×192 cells and leave transparent-ready margin around the locked silhouette.
