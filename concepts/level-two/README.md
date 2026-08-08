# Level 2 semantic parallax backgrounds

Level 2 uses five independently authored far, middle, and close background
sets. The supplied concept scenes are mood, palette, landmark, lighting, and
traversal-silhouette references only; they are not edit targets and no runtime
plate is cut from or flattened from a concept image.

## Runtime contract

- Runtime dimensions: 2048×716 pixels.
- Far plates are fully opaque.
- Middle and close plates have hard object-shaped alpha.
- Source key for middle and close plates: flat `#FF00FF`.
- Prompted source middle contact-row target: 610.
- Runtime middle contact row: 603.
- Every substantial middle component ends within two pixels of row 603.
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

Generated sources live under `concepts/level-two/source/`. Run
`npm run build:level-two-backgrounds` to remove the chroma key, normalize only
substantial middle silhouettes, resize with nearest-neighbor sampling, and
install the 15 runtime plates under `public/assets/backgrounds/`.

The same command also runs `audit-background-motion.mjs`. It renders five
one-viewport forward/reverse camera sweeps and four boundary-stop sequences
with the production parallax rates, tiling, blend math, and Level 2 surface
tops. Review `level2-parallax-motion-audit.png`; its measured offsets, blend
samples, seam visibility, and close-center coverage are recorded in
`level2-parallax-motion-audit.json`.
