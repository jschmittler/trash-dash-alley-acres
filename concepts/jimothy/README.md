# Jimothy animation concept

Source and review material for the playable Jimothy character, based on the supplied references.

## Runtime status

Jimothy is integrated as a selectable playable character. Authoring sources remain under `concepts/jimothy/`; the production atlas and selection preview live under `public/assets/generated/`. Rebuild through `concepts/jimothy/build-atlas.mjs` rather than importing source sheets directly at runtime.

## Atlas format

- File: `jimothy-animation-atlas.png`
- Cell size: 192×192 pixels
- Layout: 4 columns × 12 rows
- Direction: every frame faces right; flip at render time for left-facing movement
- Background: transparent RGBA
- Sampling: nearest-neighbor

| Row | Frames | State |
| ---: | :---: | --- |
| 0 | 0–3 | Idle breathing and ear twitch |
| 1 | 0–3 | Walk |
| 2 | 0–3 | Run |
| 3 | 0–3 | Jump: crouch, takeoff, air, land |
| 4 | 0–3 | Fall / descend |
| 5 | 0–3 | Sniff and forage |
| 6 | 0–3 | Paw-swipe attack |
| 7 | 0–3 | Tuck and roll |
| 8 | 0–3 | Climb / ledge scramble |
| 9 | 0–3 | Eat a snack |
| 10 | 0–3 | Seated grooming |
| 11 | 0–3 | Hurt and recover |

The three normalized component sheets remain in `sheets/`; chroma-key generation sources remain in `source/` for future revisions.
