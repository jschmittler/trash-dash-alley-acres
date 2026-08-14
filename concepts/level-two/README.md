# Level 2 semantic parallax backgrounds

Level 2 uses five independently authored far, middle, and close background
sets. The supplied concept scenes are mood, palette, landmark, lighting, and
traversal-silhouette references only; they are not edit targets and no runtime
plate is cut from or flattened from a concept image.

## Runtime contract

- Runtime dimensions: 1320×540 pixels.
- Far plates are fully opaque.
- Middle and close plates have hard object-shaped alpha.
- Source key for middle and close plates: flat `#FF00FF`.
- Runtime middle contact-row target: 500.
- Every substantial middle component ends within two pixels of row 500.
- Close plates retain their authored framing and are not normalized as a strip.
- All resizing uses nearest-neighbor sampling.
- Far runtime RGB uses a deterministic 32-step value ladder (at most nine
  values per channel) so generated sky ramps cannot survive as gradients.
- Final middle/close alpha boundaries receive a two-pixel magenta despill pass
  after resize and middle normalization.

## Semantic ownership

| Stage | Far | Middle | Close |
| --- | --- | --- | --- |
| Backyard | Moon, stars, distant roofs, treeline | Whole houses, fences, shed | Edge trunks, garden plants, porch framing |
| Street | Clouds, distant neighborhood lights | Whole houses, utility poles, parked cars | Hedges, nearby bins, porch edges |
| Obstacle | Moonlit roofs, distant trees | Whole treehouse, fences, patio structures | Close shrubs, pool edge, restrained sprinkler mist |
| Drainage | Downtown skyline, dark hills | Whole culvert, guardrails, utility poles | Reeds, banks, foreground grasses |
| Main street | Downtown towers, night sky | Whole storefronts, laundromat, water tower | Alley walls, awnings, curb framing |

Generated V2 parallax sources live under `concepts/level-two/source-v2/`. Run
`npm run build:level-two-backgrounds` to remove the chroma key, normalize only
substantial middle silhouettes, resize with nearest-neighbor sampling, and
install the 15 runtime plates under `public/assets/backgrounds/`.

The same command also runs `audit-background-motion.mjs`. It renders five
one-viewport forward/reverse camera sweeps and four boundary-stop sequences
with the production parallax rates, tiling, blend math, and Level 2 surface
tops. Review `level2-parallax-motion-audit.png`; its measured offsets, blend
samples, seam visibility, and close-center coverage are recorded in
`level2-parallax-motion-audit.json`.

## Enemy motion atlas

Level 2's four ordinary enemies use `public/assets/generated/level2-enemy-motion.png`.
The atlas is four columns by 21 rows, with 192×192 cells, right-facing source
art, transparent RGBA, and nearest-neighbor runtime sampling. Run
`npm run build:level-two-enemies` to rebuild it and the static
`level2-enemy-motion-contact-sheet.png` audit.

Each enemy was established as one visual anchor before its state variants were
derived. The generated anchors and disciplined 4×4 motion sources live under
`concepts/level-two/source/` as `<kind>-anchor.png` and
`<kind>-motion-source.png`. The build removes the flat `#FF00FF` key, applies a
hard 28/32-color palette without dithering, scales only with nearest-neighbor,
and places every opaque silhouette with cell-edge clearance. Connected-component
cleanup removes small detached key-colored fragments before and after resize,
maps retained purple key fringe to the dark navy contour value, and aligns from
the primary character component. Legitimate detached lids and spray clusters
remain visible but cannot establish a false foot or body anchor.

| Rows | Enemy | Frames 0–3 |
| ---: | --- | --- |
| 0 | Bin-Lid Squirrel | Four-frame hop/locomotion loop |
| 1 | Bin-Lid Squirrel | Overhead-lid telegraph |
| 2 | Bin-Lid Squirrel | Lid throw |
| 3 | Bin-Lid Squirrel | Two-frame hit / flattened hurt |
| 4 | Bin-Lid Squirrel | Embarrassed defeat / retreat |
| 5 | Trash-Day Terrier | Four-frame trot loop |
| 6 | Trash-Day Terrier | Sleep, ears-up, bark tell |
| 7 | Trash-Day Terrier | Committed charge loop |
| 8 | Trash-Day Terrier | Two-frame fence impact / hit |
| 9 | Trash-Day Terrier | Slump, sit, launch, charge recovery |
| 10 | Trash-Day Terrier | Seated defeat / sleep settle |
| 11 | Sprinkler Skunk | Four-frame patrol loop |
| 12 | Sprinkler Skunk | Tail-rise pale-green tell |
| 13 | Sprinkler Skunk | Short hard-cluster spray |
| 14 | Sprinkler Skunk | Two-frame hit / dazed recovery |
| 15 | Sprinkler Skunk | Defeat / retreat |
| 16 | Porch-Light Moth | Four-frame orbit flap loop |
| 17 | Porch-Light Moth | Dive telegraph |
| 18 | Porch-Light Moth | Dive / climb action |
| 19 | Porch-Light Moth | Two-frame hit / vulnerable climb |
| 20 | Porch-Light Moth | Tumbling / folded-wing defeat |

The terrier source master itself is a transparent 4×4 grid of 192×192 cells,
normalized from the existing approved poses; the build does not invent or
runtime-rescale a state. Squirrel, terrier, and skunk opaque feet end at local row 175 in every used
frame. The renderer offsets the atlas's 16-pixel transparent foot inset so the
opaque feet meet the authoritative support surface. Moth frames are centered
on local `(95.5, 95.5)` after normalization, preserving body placement and wing
clearance while runtime motion stays inside its authored flight band.

## Brutus boss atlas and deterministic arena audit

Brutus uses `public/assets/generated/brutus-motion.png`, a four-column by
11-row RGBA atlas with fixed 256×192 cells. The generated visual anchor and
derived active/defeat sources live under `concepts/level-two/source/` as
`brutus-anchor.png`, `brutus-active-motion-source.png`, and
`brutus-defeat-motion-source.png`. Run `npm run build:brutus` to remove the
flat `#FF00FF` key, discard detached key fragments, quantize to a hard limited
palette without dithering, align every opaque foot/pool base to local row 175,
and rebuild the runtime atlas and `brutus-motion-contact-sheet.png`.
Every active/pool/exit runtime cell is one connected silhouette; only authored
cyan shake droplets may remain detached. Recovery frames are scaled from the
active anchor rather than the larger defeat-sheet composition, preventing a
size jump after hit playback while keeping the bin/body center registered.

| Row | State | Frames |
| ---: | --- | --- |
| 0–2 | Idle, sniff, bark | Two authored frames per state |
| 3–5 | Charge, crash, stunned-open | Four charge, one crash, two open frames |
| 6–7 | Hit, recovery | Three hit and two recovery frames |
| 8–10 | Pool slide, shake, exit | Two frames per defeat beat |

The same command writes `brutus-arena-trace.json`. That trace drives the pure
state machine with fixed 0.1-second steps, verifies three hydrant-opened hits,
records phase hazards, proves the arena unlock appears only on `complete`, and
confirms ordinary population is zero at activation. It also records the manual
feel boundary: browser/localhost access was prohibited for Task 7, so input
cadence, camera feel, and audiovisual timing remain a later browser playtest.
