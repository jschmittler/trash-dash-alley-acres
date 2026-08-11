# Game-wide Visual Contract Audit

Date: 2026-08-08  
Implemented scope: Levels 1 and 2, their boss encounters, both playable characters, every reachable enemy, pickups, projectiles, hazards, props, terrain, backgrounds, effects, and gameplay-viewport UI. Planned Levels 3–5 are not implemented and therefore cannot be rendered or audited as playable content.

## Outcome

The audit replaced implicit visual assumptions with a shared contract, a complete machine-readable inventory, deterministic placement validation, largest-frame spawn checks, centralized semantic layers, animation/frame validation, and a development-only bounds overlay. Automated and static asset evidence passes. Localhost rendered QA was subsequently performed on 2026-08-09; most inspected views pass, while the player-state route fails and the active Brutus/reaction-state routes remain incomplete.

The project must not be called fully visually approved until the deterministic route defects listed in the 2026-08-09 addendum are repaired and the missing active states are rendered.

## Inventory

`app/visual-inventory.mjs` is the source of truth and contains 111 implemented records:

| Category | Records |
| --- | ---: |
| Background | 30 |
| Terrain | 15 |
| Platform | 33 |
| Decorative prop | 5 |
| Interactive prop | 4 |
| Hazard | 2 |
| Pickup | 3 |
| Projectile | 2 |
| Effect | 1 |
| Viewport UI | 1 |
| Player | 2 |
| Enemy | 11 |
| Boss | 2 |

Players: Trashy (`raccoon`) and Jimothy. Enemies: fox, mosquito, moth, pigeon, possum, skunk, snake, spider, squirrel, terrier, and wasp. Bosses: Trash Heap Tyrant and Brutus Bin Hound.

Each record declares or derives its asset source, native/rendered dimensions, origin/facing behavior, required and available animation states, visual bounds, collision bounds, placement footprint, ground anchor, semantic render layer, allowed/forbidden zones, minimum clearance, scale policy, and viewport behavior.

## Systems inspected

- Canvas renderer, camera transform, pixel smoothing, responsive canvas sizing, touch-safe-area layout, and semantic draw stages.
- Level 1 and Level 2 definitions, authored supports, gaps, patrol ranges, flight bands, scenery, pickups, boss runways, and boss arenas.
- Trashy and Jimothy atlases/state mappings; Level 1 and Level 2 enemy atlases/state machines; both boss atlases/state machines.
- Level 2 prop/effect atlas including acorn, utility boxes, sprinklers/water, hydrants/water, and porch light.
- Generated backgrounds, decorative sprites, terrain/platform assets, projectiles, pickups, particles, and HUD.
- Asset-building scripts, frame manifests, encounter/boss test routes, deterministic placement helpers, and project visual-production skills.

## Defects and repairs

### Systemic

| Defect | Root cause | Repair |
| --- | --- | --- |
| No uniform visual placement metadata | Renderer and level definitions relied on implicit per-branch conventions | Added `app/visual-contract.mjs` and the 111-record inventory. |
| Draw order was descriptive rather than centralized | Layer order existed in renderer flow but had no reusable semantic contract | Added nine ordered `RENDER_LAYERS` and integrated them with the renderer/debug overlay. |
| Deterministic fallback depended on candidate input order | Equal-distance candidates were not totally ordered | Added stable distance/x/y/w/h tie-breaking and invalid-result rejection. |
| Collision rectangles were being used as a proxy for full art clearance | Spawn checks covered gameplay collision but not transparent-trimmed visible silhouettes or large frames | Added visual/motion envelopes and full-silhouette patrol tests. |
| Asset metadata could silently point at the wrong strip | One platform record described a nonexistent box strip while runtime used the decorative atlas | Corrected the inventory and added source/native-size/frame-rectangle integrity tests. |

### Level 1

- Right-crate pigeon could exceed its supporting surface at a patrol extreme.
- Creek wasp and mosquito could exceed authored flight/support regions with their full visible silhouettes.
- Highway possum and mosquito had the same largest-frame overhang risk.
- Patrol ranges were narrowed to keep the full art envelope inside the intended support/band without changing collision dimensions or behavior.

### Level 2

- Backyard, street, and treehouse squirrels could overhang their authored platforms at patrol extremes.
- All three moth encounters clamped only a `50×34` collision rectangle, not the rendered `84×82` silhouette.
- Squirrel patrols were narrowed. Moth movement now clamps its full visible envelope inside the flight band and uses a safe orbit/climb target.
- Existing authored fixes for placeholder primitives, terrier stun/recovery playback, boss utility platforms, Brutus visible-top stomp alignment, and water-only sprinkler overlays remain covered by regression tests and static contact-sheet review; those changes predate this audit pass and are not claimed as newly discovered here.

### Animation and registration

- The inventory and validators now reject missing gameplay-state mappings, empty/invalid sequences, invalid rectangles, invalid durations, unknown layers, missing anchors, and malformed scale policies.
- Static inspection of both hero sheets, both boss sheets, Level 2 enemy motion, Level 2 props/effects, backgrounds, and decorative art found consistent baseline guides/registration and no obvious clipping or unrelated frames.
- Runtime pause/resume, culling re-entry, character switching, and viewport-resize motion still require the blocked played walkthrough.

## Changed implementation and knowledge files

Audit runtime/data: `app/visual-contract.mjs`, `app/visual-inventory.mjs`, `app/world-placement.mjs`, `app/level-one.mjs`, `app/level-two.mjs`, `app/level-two-enemies.mjs`, and `app/trash-dash-game.tsx`.

Audit tests/config: `tests/visual-contract.test.mjs`, `tests/visual-inventory.test.mjs`, `tests/visual-asset-integrity.test.mjs`, `tests/visual-spawn-envelope.test.mjs`, `tests/world-placement.test.mjs`, `tests/enemy-surface.test.mjs`, `tests/level-two-enemies.test.mjs`, `tests/game-asset-library.test.mjs`, and `package.json`.

Skills: `skills/game-asset-library/game-art-contract.md`, `game_asset_director_SKILL.md`, `level_creator_SKILL.md`, `player_character_creator_SKILL.md`, `enemy_creator_SKILL.md`, `boss_creator_SKILL.md`, `item_creator_SKILL.md`, `vfx_creator_SKILL.md`, and rebuilt `skills/game-asset-library.zip`.

Other dirty worktree changes from earlier Level 2/Jimothy work were preserved and are not reattributed to this audit.

## Visual evidence

Representative before evidence supplied by the user:

- [Level 2 placeholder oval](/Users/jamesschmittler/Desktop/leveltwofix/Screenshot%202026-08-08%20at%2011.40.06%E2%80%AFAM.png)
- [Level 2 placeholder utility box](/Users/jamesschmittler/Desktop/leveltwofix/Screenshot%202026-08-08%20at%2011.40.27%E2%80%AFAM.png)
- [Level 2 placeholder sprinklers](/Users/jamesschmittler/Desktop/leveltwofix/Screenshot%202026-08-08%20at%2011.40.36%E2%80%AFAM.png)
- [Level 2 placeholder hydrant](/Users/jamesschmittler/Desktop/leveltwofix/Screenshot%202026-08-08%20at%2011.41.10%E2%80%AFAM.png)

Static after evidence inspected in this pass:

- `concepts/level-two/level2-props-contact-sheet.png`
- `concepts/level-two/level2-enemy-motion-contact-sheet.png`
- `concepts/level-two/level2-backgrounds-contact-sheet.png`
- `public/assets/generated/player-hero-contact-sheet.png`
- `public/assets/generated/jimothy-hero-contact-sheet.png`
- `public/assets/generated/boss-contact-sheet.png`
- `concepts/level-two/brutus-motion-contact-sheet.png`
- `concepts/decorative/source/decorative-contact-sheet.png`

These contact sheets prove shipped frames and registration, not final in-game composition. No runtime after screenshot exists because localhost navigation was denied.

## Verification

| Check | Result |
| --- | --- |
| Baseline `npm test` before audit changes | PASS — build plus 213/213 tests |
| Fresh final `npm test` | PASS — production build completed; 226/226 tests passed in 1359.983 ms |
| Fresh final `npm run lint` | PASS — 0 errors; 1 pre-existing `@next/next/no-img-element` warning at `app/trash-dash-game.tsx:2894` |
| Fresh final `npm run build:pages && npm run test:pages` | PASS — Pages build completed; 1/1 artifact test passed in 45.267 ms |
| Skill archive integrity | PASS — all 10 files validated by `unzip -t` |
| Static contact-sheet inspection | PASS for the eight sheets listed above |
| Browser desktop/mobile/fullscreen walkthrough | PARTIAL — inspected routes captured on 2026-08-09; see rendered QA addendum |
| `git diff --check` | PASS — no whitespace errors |

## Final status matrix

`PASS (automated)` means contract/asset/placement/state assertions passed; it does not imply a played visual pass.

| Scope | Automated/static | Rendered gameplay | Overall |
| --- | --- | --- | --- |
| Level 1 start/middle/end | PASS | PASS | PASS |
| Level 1 boss — Trash Heap Tyrant | PASS | PASS | PASS |
| Level 2 start/middle/end | PASS | PASS | PASS |
| Level 2 boss — Brutus Bin Hound | PASS | PARTIAL — runway/post-boss only | INCOMPLETE |
| Desktop viewport | PASS | PASS | PASS |
| Mobile landscape | PASS | PASS | PASS |
| Mobile portrait | PASS | PASS | PASS |
| Fullscreen-equivalent responsive layout | PASS | PASS | PASS |
| Players | PASS | FAIL — taco route; other sampled states pass | FAIL |
| Standard enemies | PASS | PARTIAL — sampled motion only | INCOMPLETE |
| Bosses | PASS | PARTIAL — Level 1 pass, active Brutus missing | INCOMPLETE |
| Projectiles, hazards, pickups, props, and effects | PASS | PASS in sampled routes | PASS |
| Backgrounds, terrain, platforms, and viewport UI | PASS | PASS | PASS |
| Planned Levels 3–5 | NOT IMPLEMENTED | NOT IMPLEMENTED | NOT IMPLEMENTED |

## Required manual closeout

The initial localhost blocker was resolved on 2026-08-09. The remaining closeout work is to repair the deterministic taco/player-state route, add an active-Brutus route, add forced reaction-state routes, and rerun those views with `?debugVisuals=1` where applicable.

## Rendered QA addendum — 2026-08-09

Localhost browser access was restored and the GitHub Pages/Vite build was served at `http://127.0.0.1:3003/trash-dash-alley-acres/`. The following checkpoints were opened, played where the route allowed it, visually inspected, and captured under `docs/superpowers/reports/2026-08-09-visual-qa-screenshots/`:

- Level 1 woodland start, highway middle, park/mobile-landscape end, boss runway, and active Trash Heap Tyrant arena.
- Level 2 backyard/mobile-portrait start, obstacle-course middle, main-street/mobile-landscape end, Brutus runway, and Level 2 post-boss victory.
- Trashy, Jimothy, interaction, terrier, and moth views.
- Fullscreen, pause/resume, and live desktop-to-portrait resize behavior.

No browser console warning or error was recorded on any inspected route.

### Rendered passes

- Level 1 and Level 2 inspected scenery, terrain, platforms, pickups, and enemies were grounded and layered correctly. No placeholder vectors, floating props, embedded scenery, or cropped silhouettes were visible in these checkpoints.
- The active Trash Heap Tyrant arena displayed the complete boss silhouette and stable grounding. Two paused captures taken 650 ms apart were byte-identical; resume continued without a stale or corrupt frame.
- Desktop, mobile landscape, mobile portrait, and fullscreen layouts stayed within the viewport. Touch controls remained reachable in portrait. A live portrait resize paused gameplay instead of continuing with held input.
- Jimothy's clean gameplay render matches his intentionally squat, rounded source silhouette. The apparent rectangle in the debug capture was the bounds overlay surrounding a very broad body, not a clipped sprite.
- Terrier locomotion and moth flight rendered with intact silhouettes and stable ground/flight registration in sampled frames.

### Rendered failures and incomplete routes

1. **Player-state QA route — FAIL.** `?powerupTest=taco&visualQa=player-states` reproducibly spawns Trashy into immediate enemy contact. Paws fall from 3 to 2 and the route displays the hurt/respawn sequence instead of the intended taco-power state. Evidence: `24-powerup-route-damage-repro.png`.
2. **Brutus active arena route — INCOMPLETE.** `?bossTest=brutus` starts at `x=5650`, while the Level 2 boss trigger is `x=5750`. It validates the runway but does not deterministically activate Brutus, show both new arena platforms, or expose all combat phases. Unlike Level 1's `?bossTest=arena`, no direct active-Brutus route exists.
3. **Forced enemy reaction coverage — INCOMPLETE.** Encounter routes show the entities and normal motion, but the terrier route starts small Trashy and does not expose a deterministic stun/recovery trigger. The full reaction sequence therefore remains automated/static evidence rather than a rendered pass.

### Updated rendered status

| Scope | Rendered result | Evidence |
| --- | --- | --- |
| Level 1 start/middle/end | PASS | `01`, `02`, `03` screenshots |
| Trash Heap Tyrant arena | PASS | `04`–`07`; pause stability checked |
| Level 2 start/middle/end | PASS | `08`–`10` screenshots |
| Brutus runway/post-boss | PASS | `11`, `25` screenshots |
| Brutus active fight/phases/platforms | INCOMPLETE | Direct route stops before trigger |
| Desktop | PASS | Level and boss captures |
| Mobile landscape | PASS | `03`, `10` |
| Mobile portrait | PASS | `08`, `23` |
| Fullscreen | PASS | `20` |
| Trashy general runtime | PASS | Level/boss captures |
| Jimothy idle runtime | PASS | `18`, clean capture `19` |
| Taco/player-state route | FAIL | Immediate damage in `24` |
| Standard enemy sampled motion | PASS | `09`, `13`–`17`, `21`–`22` |
| Every enemy reaction state | INCOMPLETE | Routes do not force every reaction |

The original strict completion gate remains open until the two deterministic route defects are repaired and the active Brutus phases plus forced reaction states are rendered and reviewed.
