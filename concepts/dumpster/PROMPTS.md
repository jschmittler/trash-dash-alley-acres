# Dumpster generation prompts

These are the exact prompts for the two source sheets. Both prompts use the same visual reference roles so that the dumpster silhouette and camera remain stable between states.

## Reference roles

- **Game-style reference:** the established Trash Dash pixel-art sheets; use for dark navy outlines, clustered pixel shading, semi-natural proportions, and crisp nearest-neighbor edges.
- **Subject reference:** the approved dumpster goal design described in `docs/superpowers/specs/2026-08-05-dumpster-goal-sprite-design.md`; use for the three-quarter view, dark-green steel body, partly open lid, overflowing trash, graffiti, dents, rust, grime, and crooked caster wheels.
- **Motion reference:** the preceding frame in the same generated sheet; preserve the exact footprint, camera angle, scale, and contact point while changing only the requested animation details.

## Idle source sheet

> Create a 4-frame horizontal pixel-art animation sheet for the Trash Dash post-boss dumpster goal. Use the established Trash Dash sheets as the game-style reference and the approved dumpster goal design as the subject reference. Render exactly four evenly spaced 192×192 frames on one 768×192 canvas with a flat, uniform `#00ff00` chroma-key background. Keep a three-quarter side camera, silhouette, scale, footprint, wheel/contact point, and partly-open lid locked across all frames. Show an old dark-green steel dumpster with dark navy contour pixels, clustered three-to-four-value shading, dents, chipped paint, rust, grime, crooked caster wheels, overflowing bags/cans/cardboard/paper/spoiled-food shapes, and restrained non-legible graffiti. Animate only subtle ambient changes: frame 1 lid creak, frame 2 a small trash settle, frame 3 a restrained fly shift, frame 4 return toward the starting pose. Use hard pixel edges, no gradients, no anti-aliasing, and transparent-style separation from the key background. No text, logos, scenery, ground plane, shadows outside the silhouette, UI, characters, or extra props.

## Stink source sheet

> Create a 4-frame horizontal pixel-art animation sheet for the same Trash Dash post-boss dumpster goal, using the established Trash Dash sheets as the game-style reference, the approved dumpster goal design as the subject reference, and the preceding frame as the motion reference. Render exactly four evenly spaced 192×192 frames on one 768×192 canvas with a flat, uniform `#00ff00` chroma-key background. Lock the dumpster's three-quarter side camera, silhouette, scale, footprint, wheel/contact point, lid angle, trash, graffiti, and palette across every frame. Animate a restrained stink loop: curling muted green-brown odor wisps emerge from the overflowing opening, rise, bend, and change shape across the four frames while remaining readable against varied backgrounds; keep the dumpster itself nearly stationary. Use dark navy contour pixels, clustered three-to-four-value shading, hard pixel edges, no gradients, and no anti-aliasing. No text, logos, scenery, ground plane, external shadows, UI, characters, flies, or any new objects beyond the odor wisps.

## Shared negative constraints

Do not output a full scene, perspective change, extra camera angle, duplicate dumpsters, frame borders, labels, captions, text, logos, UI elements, gradients, blur, anti-aliasing, smooth vector curves, painterly texture, or a background color other than the exact flat `#00ff00` key. Keep all four frames aligned to the same 192×192 cells and leave transparent-ready margin around the locked silhouette.
