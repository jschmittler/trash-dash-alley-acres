# Trash Dash Visual Audit

## Purpose

This living document tracks visual, rendering, animation, placement, and asset
quality across Trash Dash. The standard is a commercially presentable pixel-art
experience: diagnose root causes, make systemic repairs, verify the source and
runtime result, and inspect the change in the running game.

## Audit status

- Last updated: 2026-08-09
- Audited by: Codex with automated contract checks and localhost browser review
- Current scope: Levels 1 and 2

Legend:

- 🟥 Critical — blocks quality or gameplay
- 🟧 High — noticeable visual defect
- 🟨 Medium — needs improvement
- 🟩 Complete — verified fixed

## Known issues

### VIS-001: Sprinkler rendering

- Status: 🟩 Complete
- Original priority: 🟥 Critical
- Location: Level 2 obstacle course and Brutus arena

Problem:

- The old spray appeared as a rigid blue wedge.
- The effect could look detached from its source.
- Effect cells contained inappropriate source-body pixels.
- The body/effect relationship lacked an explicit emitter contract.

Root cause:

- The runtime treated a poorly bounded combined crop as the animation instead
  of composing one grounded body with water-only frames.
- Start, active, taper, and stop states were incomplete.

Fix applied:

- Rebuilt the Level 2 prop atlas.
- Rendered the sprinkler body once.
- Added water-only start, six-frame spray, and stop cells.
- Added explicit body bounds, nozzle origin, effect bounds, direction, scale,
  and layer metadata.
- Added hard-alpha, frame-bound, body-duplication, and emitter-attachment tests.

Files changed:

- `app/level-two-props.mjs`
- `app/trash-dash-game.tsx`
- `scripts/build-level-two-props.mjs`
- `public/assets/generated/level2-props.png`
- `concepts/level-two/level2-props-contact-sheet.png`
- `tests/level-two-props.test.mjs`

Verification:

- Automated atlas/effect tests pass.
- Local browser sequence shows grounded hardware and water connected to the
  nozzle without a wedge or duplicate body.

Screenshot references:

- `docs/superpowers/reports/2026-08-09-level1-level2-integrity/before/01-sprinkler-gameplay.png`
- `docs/superpowers/reports/2026-08-09-level1-level2-integrity/after/01-sprinkler-frame-1.png`
- Frames 1–7 are available in the same `after` folder.

### VIS-002: Lamp-post scaling and grounding

- Status: 🟩 Complete
- Original priority: 🟧 High
- Location: Level 2 moth encounter

Problem:

- The old fixture floated in open space.
- Its support, base, and ground relationship were not believable.
- The moth target and glow did not share a structural origin.

Root cause:

- The source was a hanging fixture used as a freestanding world prop.
- Runtime placement described only a small light rectangle rather than a full
  grounded object.

Fix applied:

- Created a full-height 192×256 pixel-art lamp post with a grounded base,
  vertical support, arm, housing, and compatible perspective.
- Preserved aspect ratio through a single declared render policy.
- Attached glow and moth behavior to the fixture emitter.

Files changed:

- `concepts/level-two/source/level2-lamp-post-source.png`
- `public/assets/generated/level2-lamp-post.png`
- `concepts/level-two/level2-lamp-post-contact-sheet.png`
- `app/level-two-props.mjs`
- `app/level-two-enemies.mjs`
- `app/trash-dash-game.tsx`
- `tests/level-two-props.test.mjs`

Verification:

- Asset dimensions, aspect ratio, baseline, and emitter tests pass.
- Local browser review confirms the base meets the terrain and the moth/glow
  align with the housing.

Screenshot reference:

- `docs/superpowers/reports/2026-08-09-level1-level2-integrity/after/02-lamp-moth.png`

### VIS-003: Level 1 campsite crate placement

- Status: 🟩 Complete
- Original priority: 🟥 Critical
- Location: Level 1 opening campsite

Problem:

- Two 112-pixel-wide crate platforms were authored only 60 pixels apart, so
  their visual and collision footprints overlapped by 52 pixels.
- The second walking pigeon inherited the invalid support arrangement.

Root cause:

- Platform metadata and runtime crate placement duplicated the same overlapping
  coordinates. Existing grounding checks validated each support independently
  but did not assert separation between sibling platforms.

Fix applied:

- Moved the right crate to a distinct non-overlapping support.
- Re-authored its pigeon spawn/patrol within the new complete visible bounds.
- Added a deterministic regression that rejects overlapping campsite crates.

Files changed:

- `app/level-one.mjs`
- `app/trash-dash-game.tsx`
- `tests/world-composition.test.mjs`

Verification:

- Placement, grounding, enemy support, Level 1 definition, and composition
  tests pass.
- Local browser screenshot confirms two clearly separated crates.

Screenshot reference:

- `docs/superpowers/reports/2026-08-09-level1-level2-integrity/after/l1-crates-separated.png`

### VIS-004: Character and boss animation quality

- Status: 🟩 Complete for implemented Level 1 and Level 2 states
- Original priority: 🟥 Critical
- Characters reviewed: Trashy, Jimothy, Level 1 enemies, Level 2 enemies,
  Trash Heap Tyrant, Brutus
- States reviewed where applicable: idle, walk/run, jump/fall/land, attack,
  anticipation/release/recovery, hit/stunned, defeat, glide, victory

Problems found:

- State fallback previously reused visibly incompatible rows.
- One-shot playback could use global modulo timing.
- Some visible tops, feet, emitters, and collision regions did not share the
  same authored frame metadata.
- The active Brutus arena also rendered a post-victory dumpster layer.

Root cause:

- Visual state, gameplay state, and atlas registration were not consistently
  connected through one explicit manifest.
- The victory goal had no Level 2 active-arena visibility gate.

Fix applied:

- Added explicit animation manifests, local state timers, stable baselines,
  visible-top data, effect origins, and reachable hit/defeat states.
- Kept enemy patrol silhouettes inside named supports and flight bands.
- Gated the Level 2 victory dumpster until Brutus is defeated.
- Added explicit Brutus spawn/recovery metadata and preserved charge cadence.

Verification:

- Animation, atlas, baseline, state reachability, collision, boss, and encounter
  tests pass.
- Browser sequences confirm stable terrier recovery, coherent boss silhouettes,
  and a clean active Brutus arena.

Screenshot references:

- `docs/superpowers/reports/2026-08-09-level1-level2-integrity/after/04-enemy-interaction.png`
- `docs/superpowers/reports/2026-08-09-level1-level2-integrity/after/05-terrier-frame-0.png`
- `docs/superpowers/reports/2026-08-09-level1-level2-integrity/after/03-brutus-arena-final.png`
- `docs/superpowers/reports/2026-08-09-level1-level2-integrity/after/l1-boss.png`

## Baseline evidence — 2026-08-09 game-wide integrity sweep

- The complete `VISUAL_QA_ROUTES` catalog was re-entered through the title and
  character-selection screens as Trashy at 1440×900. The dedicated
  `l1-park` and `l2-main-street` samples were repeated at 844×390.
- No new visible defect was reproduced, so no `VIS-###` record was opened and
  no `before/` screenshot was created. This preserves the evidence rule that
  baseline frames are captured only for a visible defect.
- Fresh runtime observations reconfirm the sprinkler renders one grounded body
  with an attached water effect; the lamp post preserves its full-height aspect
  ratio and meets the ground; the Level 1 opening crates remain distinct; and
  both boss fixtures render without an observed duplicate body, crop, or
  detached arena prop.
- Browser diagnostics recorded after the post-entry sweep contained no warning
  or error entries. Direct state fixtures showed reachable idle/walk and
  encounter presentation, but player-driven enemy hit/recovery sequences were
  not deterministically forced by this baseline pass; they remain a focused
  Task 4 verification condition, not an opened issue.
- Full route/viewport/interaction evidence is recorded in
  `docs/superpowers/reports/2026-08-09-game-wide-integrity-baseline.md`.
- Review follow-up: catalog entries now freeze each route object and assert
  their exact immutable metadata. The corrected per-URL console and dedicated
  landscape/portrait recheck remains explicitly pending because the in-app
  browser backend became unavailable after the baseline session finalized.
- Controller correction: the 27 exact URLs were subsequently entered at
  1280×720 DPR 2, each producing `[]` warning/error diagnostics, including
  `l1-start`. Only the corrected aliases' exact 844×390/390×844 responsive
  reruns remain unverified.

## Asset quality checklist

Every new or modified asset must pass all applicable checks before approval.

### Rendering

- [x] Correct aspect ratio
- [x] Declared native, preferred, minimum, and maximum scale
- [x] Nearest-neighbor pixel rendering with no filtering artifacts
- [x] Clean hard transparency where pixel art requires it
- [x] No key-color spill, neighboring-frame bleed, or leftover edge pixels
- [x] Runtime frame matches intended source crop
- [x] Exactly one owner renders each body/state layer

### Placement

- [x] Explicit visual, collision, and placement footprints
- [x] Explicit bottom-center ground or attachment anchor
- [x] Ground anchor resolves to a named terrain/platform surface
- [x] Correct semantic depth layer
- [x] Full visible bounds clear forbidden platform geometry
- [x] Category-aware composition padding and repeated-asset spacing
- [x] Large/hero props preserve negative space

### Animation

- [x] Consistent frame dimensions and stable registration
- [x] Explicit applicable-state manifest
- [x] Smooth state transitions with local playback timing
- [x] No sprite shifting, clipping, or unexplained size changes
- [x] Anticipation, active, event, recovery, hit, and defeat frames align with
  gameplay timing where applicable
- [x] Effects remain attached to named emitter origins in both directions

### Verification

- [x] Contact sheet inspected
- [x] Automated asset, placement, animation, and composition tests pass
- [x] Affected desktop routes inspected in the running game
- [x] Representative before/after screenshot evidence captured
- [ ] Real-device mobile visual pass completed

## Completed fixes

### 2026-08-09 — Shared render-aspect and visible-anchor contract

Applicable canonical skills declared and applied:

- Rendering / Asset Integrity
- Sprite / Art Asset
- Animation / Motion Sprites
- Environment Placement / Z-Order
- Overlap Prevention / Spatial QA
- Visual QA

Contract repair:

- Added pure fixed-aspect and visible-ground-anchor validators. Fixed-aspect
  comparisons use a `0.01` tolerance; ground contact uses the same 2-pixel
  tolerance as world placement.
- Completed source-geometry declarations for fixed-aspect inventory families,
  rather than treating square atlas cells and transparent padding as their
  visible source shape. Tiled/nine-slice and viewport-cover records continue
  to validate their declared policy but are intentionally not aspect-compared.
- Marked grounded records explicitly and corrected Jimothy's inventory visible
  envelope to exclude the transparent baseline inset. Its visible bottom now
  meets the shared ground anchor, without moving the runtime character.

Measured contract evidence (source geometry → rendered geometry):

| Audited record/family | Source/native frame | Declared visible geometry | Rendered geometry |
| --- | --- | --- | --- |
| Decorative tires | 256×256 atlas cell | 112×58 normalized visible frame | 112×58 |
| Charge obstacle | 128×128 atlas cell | 84×112 visible frame | 84×112 |
| Sprinkler water envelope | 128×128 atlas cell | 132×96 independent effect envelope | 132×96 |
| Hydrant water envelope | 128×128 atlas cell | 144×96 independent effect envelope | 144×96 |
| Lamp post | 192×256 PNG | 96×208 grounded visible frame | 96×208 |
| Player maximum envelopes | 192×192 atlas cells | Trashy 142×140; Jimothy 142×134 | same |
| Level 1 / Level 2 enemy families | 192×192 atlas cells | declared per-family visible frames | same per-family rendered dimensions |
| Trash Heap Tyrant | 256×256 atlas cell | 184×170 maximum visible frame | 184×170 |

Verification:

- `node --test tests/visual-contract.test.mjs tests/visual-asset-integrity.test.mjs tests/player-hero-atlas.test.mjs tests/jimothy-player-atlas.test.mjs tests/level-two-props.test.mjs tests/boss-atlas.test.mjs tests/brutus-atlas.test.mjs` passes (39 tests).
- No renderer, asset family, atlas manifest, builder, or runtime draw call
  changed in this repair. Therefore no new localhost route sweep or screenshots
  were required; prior runtime evidence remains historical context, not a claim
  of a newly observed visual result.

### 2026-08-09 — Post-normalization visual verification

Applicable canonical skills declared and applied:

- Rendering / Asset Integrity
- Sprite / Art
- Animation
- Environment Placement
- Overlap Prevention
- Visual QA

Automated evidence:

- `npm run validate:skills` passes for all seven canonical skills and their
  repository-local reference graph.
- The focused rendering, inventory, atlas, spawn-envelope, placement, and
  composition matrix passes at 75/75.
- The canonical skill-system regression suite passes at 11/11.

Running-game evidence at a 1440×900 desktop viewport:

- Level 1 creek route: layered background, supports, enemies, pickups, and
  platforms render with stable proportions and legal grounding.
- Level 1 boss route: boss baseline, health bar, collision silhouette, hero,
  and foreground terrain remain coherent.
- Level 2 terrier and squirrel routes: state changes preserve ground anchors;
  projectile, hit, and recovery artwork stays inside authored envelopes.
- Level 2 obstacle/interaction routes: utility props, skunk interaction,
  effect origin, platforms, and foreground composition show no primitive
  fallback, duplicate body, or transparency debris.
- Brutus route: body, armor, hydrants, utility boxes, health bar, and the two
  one-way arena platforms remain aligned; sampled motion frames do not shift
  scale or baseline.

Responsive evidence at an 844×390 mobile-landscape viewport:

- Level 2 main-street/runway and Brutus routes fit the viewport without
  canvas clipping, stretched sprites, or HUD overlap.
- This is a browser viewport simulation, not the still-required real-device
  touch, safe-area, fullscreen, and orientation pass.

Browser diagnostics:

- No warning or error console entries were present after the representative
  route sequence.
- No new visual-integrity issue was opened from this sample.

### 2026-08-09 — Level 1 and Level 2 integrity pass

- Assets: sprinkler, lamp post, Level 2 props, campsite crates, moth encounter,
  terrier playback, Brutus arena, victory dumpster visibility
- Resolution: rebuilt source/runtime assets and added systemic visual contracts,
  platform exclusion, grounding, scale, density, and source-runtime validation
- Verification: full suite passes at 236/236, including the crate-separation and
  complete enemy motion-envelope regressions.
- Detailed report:
  `docs/superpowers/reports/2026-08-09-level-one-two-visual-integrity.md`

## Future audit items

- Perform a real-device mobile portrait and landscape visual pass.
- Repeat the complete audit whenever a sprite atlas, platform footprint,
  background layer, player form, enemy state, boss phase, or viewport policy
  changes.
- Add new issues with a stable `VIS-###` identifier, observed route, root cause,
  changed files, automated evidence, and rendered screenshot evidence.

Spatial validity is not sufficient. Every generated or placed asset must also
pass a visual composition review.
