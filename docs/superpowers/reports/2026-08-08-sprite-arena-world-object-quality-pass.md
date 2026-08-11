# Sprite Arena & World-Object Quality Pass — Evidence

Date: 2026-08-08  
Scope: sprite/world-object quality changes delivered in Tasks 1–5. Gameplay balance, input, physics, camera behavior, UI, music, score, checkpoints, health, and damage values remain outside this pass.

## Findings

1. **Hydrant scale and grounding:** The previous branches did not share one visible-bounds contract. `hydrantDrawRect()` now gives the central hydrant and both boss variants a canonical `72 × 96` draw rectangle and one baseline at the cul-de-sac floor (`y=468`); `hydrantNozzleOrigin()` is derived from that same rectangle.
2. **Water termination:** Hydrant water is separate VFX rather than an extension of the body/collision rectangle. The burst, sustained, and taper atlas cells use irregular hard-alpha silhouettes with broken far edges. The focused test suite verifies that the two sustained frames retain a stable footprint.
3. **Yellow moth-adjacent object:** The questioned yellow/dark-green object was the unfinished porch-light placeholder, not a projectile or pickup. It is now an atlas sprite attached to the house facade.
4. **Regenerated sprites/assets:** Regenerated Level 2 assets include hydrant body phases, hydrant water phases, porch light, squirrel throw/release art, the Level 2 prop atlas/contact sheet, and enemy-motion atlas/contact sheet. The three editable source sheets are listed below.
5. **Animation states:** Squirrel animation now uses `throw-anticipation`, `throw-release`, `throw-follow-through`, and `throw-recover`. Hydrant rendering uses idle, build/burst, sustained, taper/recover, and stop. Terrier stun/recover timing was also covered by automated checks.
6. **Squirrel release behavior:** `throw-release` emits one `spawnAcorn` transition; `squirrelThrowAttachment()` anchors it at the throwing paw and mirrors by facing. Focused verification preserves the existing `28 × 10`, speed-`140` projectile contract.
7. **Placement contract:** `app/world-placement.mjs` evaluates whole visible bounds with centralized padding. It distinguishes `ON_SURFACE`, `BESIDE`, `BELOW`, `ABOVE_WITH_CLEARANCE`, and `EXPLICITLY_PLATFORM_ATTACHED`; legal candidates are selected or safely skipped.
8. **Level 1 placement corrections:** Scenery was moved to avoid level-specific geometry (trees `1260→1070`, `2860→2912`; recycle bin `3940→4880`). Campsite pigeons now occupy explicit crate-top supports (`x=911`, `x=1005`). Mill/industrial pickups attach to named surfaces.
9. **Level 2 placement corrections:** Scenery positions changed (bush `2050→1940`, recycle bin `3940→4085`, tire stack `4480→4250`); the street cap moved `2500→2450`. Boss hydrants/sprinklers, obstacles, tutorial sprinklers, and the porch light now declare authored relationships.
10. **Automated source/asset review:** PNG metadata confirms the generated prop sheet is `512×768`, enemy sheet is `768×3840`, and their contact sheets are `512×768` and `384×1920`. Offline inspection of both contact sheets found the hydrant/water/porch-light cells and squirrel/moth frames present with transparent margins; this is not a substitute for an in-game render review.
11. **Reusable documentation:** `skills/game-asset-library` contains the shared visual-bound, platform-exclusion, stable-anchor, and visual/collision-separation guidance, with an updated archive.
12. **Unverified interactive views:** No in-app browser backend was available during this task. Therefore no browser screenshots were captured and neither desktop nor mobile-landscape visual inspection was performed. No screenshot or live-browser claim is made by this report.

## Generated and repositioned assets

- New editable source sheets: `concepts/level-two/source/level2-hydrant-water-source.png`, `level2-porch-light-source.png`, `squirrel-throw-source.png`.
- Regenerated production assets: `public/assets/generated/level2-props.png`, `level2-enemy-motion.png`.
- Regenerated review sheets: `concepts/level-two/level2-props-contact-sheet.png`, `level2-enemy-motion-contact-sheet.png`.
- Repositioned/re-attached items: the Level 1/2 scenery, campsite pigeons, named-surface pickups, boss hydrants/sprinklers, and porch light described in findings 8–9.

## Required screenshot and manual-review matrix — unverified

All screenshot paths below are intentionally **missing**. They must be captured only from the in-app preview after a browser backend is available.

| View | Expected path | Desktop | Mobile landscape |
| --- | --- | --- | --- |
| Hydrant idle | `docs/superpowers/reports/2026-08-08-quality-pass-screenshots/01-hydrant-idle.png` | Unverified | Unverified |
| Hydrant spraying | `docs/superpowers/reports/2026-08-08-quality-pass-screenshots/02-hydrant-spraying.png` | Unverified | Unverified |
| Boss arena | `docs/superpowers/reports/2026-08-08-quality-pass-screenshots/03-boss-arena.png` | Unverified | Unverified |
| Corrected platform/object placement | `docs/superpowers/reports/2026-08-08-quality-pass-screenshots/04-platform-placement.png` | Unverified | Unverified |
| Moth/porch-light encounter | `docs/superpowers/reports/2026-08-08-quality-pass-screenshots/05-moth-encounter.png` | Unverified | Unverified |
| Squirrel release frame | `docs/superpowers/reports/2026-08-08-quality-pass-screenshots/06-squirrel-throw.png` | Unverified | Unverified |

When browser access returns, inspect hard edges, pivots, grounding, scale, water termination, sprite bounds, and layer order at both sizes before updating this report.

## Fresh verification results

| Command | Result |
| --- | --- |
| `node --test tests/world-placement.test.mjs tests/level-two-props.test.mjs tests/level-two-enemies.test.mjs tests/brutus-boss.test.mjs tests/level-one-fixture.test.mjs tests/level-two-fixture.test.mjs tests/game-asset-library.test.mjs` | 65 passed, 0 failed (345.969 ms) |
| `npm test` | Build completed; 212 passed, 0 failed (1348.443 ms) |
| `npm run lint` | 0 errors; 1 existing `@next/next/no-img-element` warning at `app/trash-dash-game.tsx:2847:57` |
| `npm run build:pages && npm run test:pages` | Pages build completed; 1 passed, 0 failed (45.566 ms) |
| `git diff --check` | Passed; no whitespace errors |

## Changed paths in this pass

Runtime/data: `app/level-one.mjs`, `app/level-two-enemies.mjs`, `app/level-two-props.mjs`, `app/level-two.mjs`, `app/trash-dash-game.tsx`, `app/world-placement.mjs` (new), `app/world-scenery.mjs` (new).

Asset pipeline/generated artifacts: `concepts/level-two/build-atlases.mjs`, `scripts/build-level-two-props.mjs`, the three new source sheets above, the two contact sheets above, and the two generated assets above.

Tests/config: `package.json`, `tests/game-asset-library.test.mjs` (new), `tests/world-placement.test.mjs` (new), `tests/level-one-definition.test.mjs`, `tests/level-two-enemies.test.mjs`, `tests/level-two-props.test.mjs`, `tests/level-two-routes.test.mjs`, `tests/mobile-experience.test.mjs`, `tests/rendered-html.test.mjs`.

Planning/documentation: `docs/superpowers/plans/2026-08-08-sprite-arena-world-object-quality-pass.md`, this report, and updated `skills/game-asset-library` guidance/archive.

Other dirty worktree entries (`.summer/`, `.superpowers/`, and `concepts/jimothy/`) were preserved; this task did not modify them except the explicitly named task brief/report paths under `.superpowers/`.
