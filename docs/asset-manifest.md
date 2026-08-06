# Trash Dash Asset Manifest

This is the ownership map for the game's visual and audio assets. Files under
`concepts/` are authoring/review material. Files under `public/assets/` are
runtime assets served by the browser. Generated runtime atlases have one
canonical copy in `public/assets/generated/`.

## Runtime families

| Runtime output | Source of truth | Consumer |
| --- | --- | --- |
| `generated/player-hero-motion.png` and `generated/player-hero-contact-sheet.png` | `scripts/build-sprite-atlases.py` plus hero source rows | Trashy player states |
| `generated/jimothy-hero-motion.png` and `generated/jimothy-hero-contact-sheet.png` | `concepts/jimothy/sheets/`, `concepts/jimothy/build-atlas.mjs` | Jimothy player states |
| `generated/boss-motion.png` | `scripts/build-sprite-atlases.py` plus boss source rows | Trash-heap tyrant |
| `generated/enemy-variety-motion.png` | `scripts/build-sprite-atlases.py` plus enemy source rows | Level-one enemies |
| `generated/decorative-atlas.png` | `concepts/decorative/source/`, `concepts/decorative/build-atlas.py` | Bushes, trees, signs, tires, recycling props |
| `generated/branch-platform-strip.png` | `concepts/decorative/source/branch-platform-key.png` | Branch platforms |
| `generated/metal-platform-strip.png` | `concepts/decorative/source/metal-platform-key.png` | Metal platforms |
| `generated/dumpster-holy-atlas.png` | `concepts/dumpster/source/`, `concepts/dumpster/build-sheets.mjs`, `concepts/dumpster/build-atlas.py` | Sealed and victorious dumpster |
| `generated/taco-power-motion.png` | `scripts/build-sprite-atlases.py` plus taco source | Taco power-up |
| `generated/trash-pickups-motion.png` | `scripts/build-sprite-atlases.py` plus pickup source | Collectable trash |
| `backgrounds/*.png` | Approved background art | Parallax scenery |
| `ground-seamless.png` | Approved tile source | Solid ground |
| `audio/*.m4a` | Approved music tracks | Gameplay and boss music |

## Rules

1. Do not add generated runtime atlases to `concepts/`; keep review sheets and
   source art there instead.
2. New source art needs a short README entry describing its frame layout,
   baseline, and intended runtime consumer.
3. Before removing an asset, search `app/`, `tests/`, `scripts/`, `README.md`,
   and `docs/` for its basename and update all references in the same change.
4. Build output (`dist/`, `dist-pages/`, `.vinext/`, and `.wrangler/`) is
   disposable and must remain ignored.

## Rebuild commands

```bash
python3 scripts/build-sprite-atlases.py
python3 concepts/decorative/build-atlas.py
node concepts/dumpster/build-sheets.mjs
python3 concepts/dumpster/build-atlas.py
node concepts/jimothy/build-atlas.mjs
```

The normal verification path remains:

```bash
npm test
npm run lint
npm run build:pages
npm run test:pages
```
