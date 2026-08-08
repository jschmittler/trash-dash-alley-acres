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
