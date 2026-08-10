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

- Status: PASS
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

- Status: PASS
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
- Corrective review found the first pass still drew the complete 192×256 image
  at 96×208. Runtime now derives 156×208 from one uniform 0.8125 scale.
- Canonical inventory now owns the full source rectangle, actual destination,
  measured 111×248 alpha bounds, grounded anchor, and a dedicated runtime draw
  family. Mutation-sensitive tests compare the actual helper output rather than
  repeating selected constants.
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

- Source→destination aspect, alpha-visible ground contact, emitter, inventory,
  and full-world-placement tests pass. The widened full texture uses its
  measured visible bounds for platform exclusion, and the lamp's grounded
  placement shifts 12px so the visible silhouette clears the poolside ledge.
- Task 10 captured the post-fix moth route in a 1280×720 PNG. The complete fixture is
  grounded, uniformly scaled, unobstructed, and produced no warning/error logs.

Screenshot reference:

- `docs/superpowers/reports/2026-08-09-level1-level2-integrity/after/02-lamp-moth.png`

### VIS-003: Level 1 campsite crate placement

- Status: PASS
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

- Status: INCOMPLETE
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
- Contact sheets and deterministic state routes pass, but uninterrupted live
  action/facing sequences for every implemented state remain CANNOT VERIFY in
  this browser session. The issue therefore remains INCOMPLETE rather than
  being promoted to a game-wide visual PASS.

Screenshot references:

- `docs/superpowers/reports/2026-08-09-level1-level2-integrity/after/04-enemy-interaction.png`
- `docs/superpowers/reports/2026-08-09-level1-level2-integrity/after/05-terrier-frame-0.png`
- `docs/superpowers/reports/2026-08-09-level1-level2-integrity/after/03-brutus-arena-final.png`
- `docs/superpowers/reports/2026-08-09-level1-level2-integrity/after/l1-boss.png`

## Baseline evidence — 2026-08-09 game-wide integrity sweep

- The complete `VISUAL_QA_ROUTES` catalog was re-entered through the title and
  character-selection screens as Trashy in the desktop browser. The session
  did not persist one per-route viewport/DOM ledger, so this is static route
  coverage rather than a uniform 1440×900 claim. The dedicated
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
| Trash Heap Tyrant | 256×256 atlas cell | 166×166 runtime destination | 166×166 |

Verification:

- `node --test tests/visual-contract.test.mjs tests/visual-asset-integrity.test.mjs tests/player-hero-atlas.test.mjs tests/jimothy-player-atlas.test.mjs tests/level-two-props.test.mjs tests/boss-atlas.test.mjs tests/brutus-atlas.test.mjs` passes (39 tests).
- No renderer, asset family, atlas manifest, builder, or runtime draw call
  changed in this repair. Therefore no new localhost route sweep or screenshots
  were required; prior runtime evidence remains historical context, not a claim
  of a newly observed visual result.

### 2026-08-09 — Source-truthful dumpster and legacy-prop follow-up

- Measured the sealed dumpster's nontransparent source bounds as 163×176
  inside its declared 192×192 source crop. The former 220×180 destination
  transformed those bounds to 186.77×165, changing the aspect from 0.93 to
  1.13. `DUMPSTER_DRAW_WIDTH` is now 180, matching the 180-pixel destination
  height and preserving both source axes at the same scale.
- Added the rendered victory dumpster to the canonical inventory with sealed
  and holy source rectangles, state coverage, a bottom-grounded anchor, and
  destination geometry read from the runtime constants. Source rectangles and
  destination geometry are cloned and recursively frozen before publication.
- Split the committed four-row Level 2 prop atlas into body and effect records.
  The live legacy renderer's charge obstacle (84×112), sprinkler-water
  (120×96), and hydrant-body (72×108) destinations remain explicit aspect
  defects against 128×128 source crops. Their repair belongs to the separately
  owned Level 2 prop/runtime work and was not folded into this change.
- Browser route verification is **CANNOT VERIFY**: the available browser
  connector reported `No browser is available`. This audit makes no new
  rendered-route pass claim.

### 2026-08-09 — Controller-verified dumpster victory follow-up

- Controller-run browser QA at 1280×720, DPR 2 visited
  `/?victoryTest=1&visualQa=task2-dumpster-after` through the title screen and
  **Start as Trashy**. The victory scene showed the repaired dumpster grounded
  and uniformly proportioned at its 180×180 destination.
- Browser warnings and errors were checked with `tab.dev.logs(warn/warning/error)`
  and returned `[]`.
- Captured full-frame evidence:
  `docs/superpowers/reports/2026-08-09-level1-level2-integrity/after/task2-dumpster-victory-1280x720.png`.
  The similarly named `task2-dumpster-victory-close.png` is an incorrect crop
  and is deliberately excluded from this audit evidence.

### 2026-08-09 — Complete source-to-runtime mapping follow-up

- RED replaced the prior source-rectangle loop that silently skipped missing
  records. It measured alpha bounds inside every declared source crop, applied
  the actual runtime destination axes, and reproduced the exact state-level
  mismatch allowlist now exported by `MEASURED_RUNTIME_DISTORTION_STATES`.
- GREEN gives every fixed-aspect shipped asset an immutable source-rectangle
  and runtime-destination map. The test fails if a source crop, destination,
  frame count, alpha bounds, or a newly measured distortion is missing or
  unclassified. `visibleSourceSize` is no longer contract authority.
- The draw-family manifest binds decorative sprites, players, both enemy
  families, bosses, pickups, dumpster, legacy props, ordinary bin lid,
  bin-lid source, Brutus can, and procedural paths to inventory records.
  The ordinary lid is truthfully 34×34; the Brutus rolling can is 42×42.

### 2026-08-09 — Frame-complete source-to-runtime follow-up

- RED proved that `bin-lid-source` and `sprinkler-water` declared only one
  crop/destination despite their committed four-frame renderer paths; it also
  showed the generic tiled-surface exemption hiding the two Brutus platform
  sprites. The renderer-family check was extended from a sampled list to an
  exact family manifest, dynamically binding every `LEVEL_TWO.surfaces`
  `visual` record and every asset-backed projectile/effect record.
- GREEN records all four `acorn` source-bin-lid crops at 44×44, all four
  committed `sprinkler-spray` crops at 120×96, and separate
  `brutus-platform-left/right` source cells at their actual 104×96 runtime
  destination. Source/destination mismatches are now compared as immutable
  per-frame identities: record, state, frame index, source rectangle, and
  destination rectangle. A new/vanished/distorted frame cannot pass under a
  state-level allowlist.
- The exact alpha measurements reproduce the four water-frame and two platform
  non-uniform transforms. They are deliberately opened under VIS-007 rather
  than normalized in metadata. No renderer code changed: its props/runtime
  implementation is separate dirty work, so runtime browser QA is not claimed
  for this contract-only update.

### VIS-005: Player animation axis distortion (Task 3)

- Status: INCOMPLETE
- RED source/runtime evidence: every 192×192 player cell was nonempty and inset,
  but Trashy's generated air/victory rows and Jimothy's copied concept rows had
  incompatible alpha bottoms (Jimothy measured 106–179 where the authored
  baseline is 184). The manifests also rendered square source cells through
  unequal destination axes, including Trashy `large_tail_swipe` at 142×112 and
  Jimothy `small_run` at 88×84.
- Root cause: generated runtime atlas registration and manifest destination
  dimensions were state-specific output patches rather than a shared square-cell
  transform. The renderer then added a second grounded-only vertical offset.
- GREEN measured source/destination/anchor result: both deterministic builders
  now translate complete opaque poses to a source baseline of 184 (visible
  bottom 183) inside every used 192×192 cell, preserving each pose's own aspect
  ratio. Every runtime destination is square (82×82 through 140×140, according
  to the form/state), `offsetY` is derived from that same 184 baseline, and the
  bottom-center renderer no longer applies a grounded-only compensation. Right
  is authored and left flips around the unchanged destination center.
- Round-1 source-state repair: four Jimothy-specific, right-authored pixel-art
  strips were generated against a removable chroma key, deterministically
  converted to RGBA, and inspected in the rebuilt contact sheet. The source
  identity manifest gives land, defeat, victory, and large glide distinct
  semantic ownership (small/large land and victory share only their compatible
  named rows); the glide cells show the bamboo canopy, never a jump pose.
  Regression coverage asserts the exact source mapping and alpha-bearing strips
  so these states cannot silently borrow legacy jump, hurt, or idle rows.
- Round-1 pit repair: terminal pit falls still consume exactly one paw without
  hurt, shrink, or respawn, then commit the selected profile's `small_defeat`
  for its four-frame local duration before changing to game over. Pure state
  tests cover both terminal and non-terminal outcomes.
- Round-2 glide identity repair: replaced only Jimothy's `large_glide` source
  with a freshly generated, chroma-removed four-frame row using the Jimothy
  key as identity authority and the existing glider strip only for canopy
  mechanics. Native and generated-row review shows the unclothed gray,
  rounded, bob-tail rider in all four cells. Narrow pixel guards reject
  saturated orange/blue outfit contamination in the rider core and constrain
  the four coherent compact glide silhouettes; generic atlas checks retain
  population, inset, and shared-baseline coverage.
- Round-2 pit lifecycle repair: the live fall threshold, pit result, and end
  timer now use shared pure transitions. Integration coverage proves terminal
  Jimothy loss selects `small_defeat` for `4 / 6` seconds through its clamped
  final frame before gameover; a non-terminal crossing respawns with no defeat
  sequence and preserves the checkpoint.
- Automated verification: the shared reachable-state contract covers all small
  and large states, atlas bounds, one-shot clamping, maximum envelopes, and
  both-facing anchors. The focused player plus visual-contract/asset/inventory
  matrix passed 40/40; the two-build SHA-256 comparison matched all five player
  atlas/contact/selection artifacts. `MEASURED_RUNTIME_DISTORTION_FRAMES` no
  longer contains a `VIS-005` player entry.
- Controller-attributed runtime evidence: at 1280×720 DPR 2, the exact normal
  spawn routes `/?backgroundTest=woodland&visualQa=task3-trashy-spawn&debugVisuals=1`
  and `/?backgroundTest=woodland&visualQa=task3-jimothy-spawn&debugVisuals=1`
  were entered through title and character confirmation. Trashy and Jimothy
  each rendered as visibly grounded `small_idle` inside their debug bounds; the
  controller recorded no warning/error logs. Evidence:
  `docs/superpowers/reports/2026-08-09-level1-level2-integrity/after/task3-trashy-idle-1280x720.png`
  and
  `docs/superpowers/reports/2026-08-09-level1-level2-integrity/after/task3-jimothy-idle-1280x720.png`.
- Controller note: the taco/recovery route briefly hides Jimothy during the
  intended hurt/invulnerability flash, then renders normally; this is not an
  atlas defect.
- Runtime QA required before closure: direct and normal-play routes must still
  exercise both characters through idle, walk/run, skid, ascent/apex/fall/land,
  glide, tail swipe, hurt/shrink, checkpoint recovery, pit defeat, victory, and
  repeated left/right transitions. Keyboard action automation was unavailable,
  so these action and both-facing sequences remain `CANNOT VERIFY`.

### VIS-006: Enemy and boss animation axis distortion (Task 4)

- Status: INCOMPLETE

- **Closed 2026-08-09 (Task 4):** the RED contract measured 86 allowlisted
  Level 1/Level 2 enemy and Trash Heap Tyrant frame mappings with unequal
  source-cell/destination axes. The source atlases were complete, inset, and
  frame-bounded, so a rebuild was not justified.
- Root cause: `drawEnemy`/boss dispatch independently forced width and height.
  Snake, spider, and fox now use 64²/64²/72² transforms; squirrel, terrier,
  skunk, and moth use 76²/82²/78²/82² transforms; every Trash Heap Tyrant
  state uses one 166² transform. Ground actors retain their bottom anchor and
  moth retains its authored center anchor. The complete frame-level visual
  integrity matrix is green and `MEASURED_RUNTIME_DISTORTION_FRAMES` has no
  VIS-006 entry.
- Brutus remains 256×192 → 220×165 (a uniform 0.859375 scale) with its
  frame-audited visible-top weak-point geometry and collision mapping intact.
- Browser route/state input automation is unavailable in this Task 4 session;
  the required squirrel/terrier/skunk/moth/interactions and both boss
  sequences are **CANNOT VERIFY** at runtime. Automated state/atlas/geometry
  coverage is not a substitute for that route evidence.

#### Controller supplemental runtime evidence — 1280×720 DPR 2

- After title → **Start as Trashy** confirmation, the controller entered
  `/?encounterTest=interaction&visualQa=task4-interaction&debugVisuals=1` and
  observed the grounded squirrel and skunk inside their debug bounds:
  `docs/superpowers/reports/2026-08-09-level1-level2-integrity/after/task4-interaction-idle-1280x720.png`.
- `/?encounterTest=terrier&visualQa=task4-terrier&debugVisuals=1` showed a
  grounded, complete terrier. `/?bossTest=1&visualQa=task4-boss1&debugVisuals=1`
  showed the grounded complete Trash Heap Tyrant at idle (partially at the
  arena screen edge by its authored spawn), and
  `/?bossTest=brutus&visualQa=task4-brutus&debugVisuals=1` showed grounded,
  proportional Brutus at walking. Evidence:
  `.../after/task4-trash-heap-idle-1280x720.png` and
  `.../after/task4-brutus-idle-1280x720.png`.
- All four routes returned empty browser warning/error logs. This verifies
  representative grounded idle presentation only; both facings and full
  action/hit/recovery/defeat sequences remain **CANNOT VERIFY**.

### VIS-007: Prop and pickup residual axis distortion (separate prop/runtime pass)

- Status: INCOMPLETE
- Original source/runtime evidence: charge obstacle 128²→84×112; sprinkler
  water 128²→non-square destinations; hydrant body/water 128²→non-square
  destinations; Brutus platform cells 128²→104×96; tires' 224×115→112×58;
  and cap 58×48→50×42.
- Task 7 repaired the Level 2 owner: every complete 128px prop/effect cell now
  uses one uniform runtime scale, charge-obstacle rendering is centralized,
  Brutus platform scale is derived from its authored visible width while its
  alpha top/body cover the collision and meet the arena floor, and the cap now
  renders at 51×42 (within the fixed-aspect tolerance).
- The authoritative inventory now covers every expanded sprinkler and hydrant
  body/effect frame and contains no Level 2 prop distortion allowlist entries.
  Tires remain explicitly allowlisted under VIS-007 for a later decorative
  asset pass.

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

### 2026-08-09 — Task 4 review repair: committed animation truth

- C1 clean archive: Task 4 now commits the complete Level 2 semantic state
  contract and squirrel runtime-release path; focused archive verification is
  83/83 and full archive verification is 205/205. Unrelated Level 2 placement,
  prop, asset, and route changes remain outside these commits.
- I1 state truth: skunk recovery uses its own row-12 follow-through cell;
  moth climb loops its own row-15 flight frames; squirrel throw beats map to
  source row 2 frames 0–3. Reachable states map explicitly; unknown pairs
  throw instead of falling back to locomotion or hit.
- I2 timing: Level 1 actor frames are selected from declared local FPS and
  state elapsed time. A deterministic phase seed only selects an initial frame.
- I3 geometry: Round 2 makes the Trash Heap Tyrant's physical visual bounds
  and placement footprint exactly 166×166, matching its uniform runtime
  destination. Its 96×96 collision remains unchanged; the former 64px side
  and 16px top reserve are explicit composition padding, preserving the
  294×182 expanded arena envelope without claiming invisible geometry as a
  physical footprint.
- I4 campaign migration guard: the runtime scan is again exact-token
  `/\bLEVEL_ONE\b/`, with positive direct-token and negative
  `LEVEL_ONE_ENEMY_ANIMATIONS` fixtures.
- Assets: no rebuild performed—opaque-source and atlas tests confirmed the
  compatible actor cells already existed. Existing controller idle/grounding
  screenshots remain the only browser evidence; full action/facing sequences
  remain **CANNOT VERIFY**.

## Future audit items

### 2026-08-09 — Task 9 existing music integration confirmation

- **Scope:** Level 0 soundtrack decision. No audio was generated, replaced,
  remixed, mastered, rescored, or judged for artistic quality.
- **Track-role truth:** both levels share `raccoon-rush-loop.m4a` for
  exploration and `trash-heap-tyrant-loop.m4a` for bosses. Level 2 has no
  distinct authored exploration or Brutus track.
- **Repaired integration defects:** same-track requests now apply mute/resume
  without creating a second player; deterministic fades are injectable for
  lifecycle coverage; and the pre-activated Brutus fixture starts the boss
  role instead of exploration. Independent review additionally repaired
  browser absolute-URL equivalence and centralized current/pending fade
  ownership so pause, resume, mute, restart, and cancellation are race-safe.
  Re-review then closed the overlapping-switch window by synchronously
  disposing the previously pending source before a newer switch begins. A
  second re-review owner-gated delayed cancellation cleanup so a stale fade can
  no longer overwrite a winning fade's outgoing volume.
- **Automated evidence:** controller/runtime/rendered coverage passes 19/19,
  Pages passes 1/1, and the shared full package suite passes 295/295. Rejected playback is contained,
  previous sources are paused/removed/loaded, and sequential switches leave
  one final player with no listeners.
- **Browser evidence:** user-gesture Level 1 start observed the exploration
  resource; Level 1 arena observed exploration then boss resources; Brutus
  observed the boss resource; pause/mute/resume/restart remained functional;
  sampled warning/error logs were empty.
- **CANNOT VERIFY:** detached audio-element state, audible output, seamless
  loop quality, loudness/SFX balance, forced live autoplay rejection, and
  acoustic overlap. These remain for the explicitly deferred full audio pass.
- Detailed report:
  `docs/superpowers/reports/2026-08-09-audio-integration-confirmation.md`.

- Perform a real-device mobile portrait and landscape visual pass.
- Repeat the complete audit whenever a sprite atlas, platform footprint,
  background layer, player form, enemy state, boss phase, or viewport policy
  changes.
- Add new issues with a stable `VIS-###` identifier, observed route, root cause,
  changed files, automated evidence, and rendered screenshot evidence.

### VIS-009: Short-viewport canvas distortion (Task 8)

- Status: PASS
- Priority: 🟥 Critical
- Locations: shared Level 1/Level 2 cabinet at short desktop and landscape
  viewport heights
- Reproduction: at 1024×640 the stage measured 991×528 (1.877:1); at
  844×390 it measured 817×278 (2.939:1), while the logical canvas remained
  960×540 (16:9). The base shell used `width: 100%` plus `max-height`, so CSS
  clamped only one axis and stretched every rendered frame.
- Fix: the shared base stage now derives width from available `svh`/`dvh`
  height, keeps `height: auto`, and preserves a 16:9 aspect without modifying
  gameplay geometry, sprite scale, or per-screen offsets.
- Verification: browser measurements after the final change are 938.664×527.992
  (1.7778) at 1024×640, 494.219×277.992 (1.7778) at 844×390, and 1280×720
  (1.7778) at 1440×900. In the controller's post-review recapture of Level 1
  park, Level 1 boss, Brutus, and Level 2 victory, every 844×390 route measured
  `x=174.890625`, `y=88`, `width=494.21875`, `height=277.9921875`, ratio
  `1.7778152488547903`; the canvas matched exactly, document scroll dimensions
  were 844×390, and route-scoped warning/error logs were empty. The four
  corrected screenshots are the corresponding
  `task8-{level1,boss1,brutus,victory2}-landscape-844x390.png` files under the
  Task 8 evidence directory. DOM rectangles are the primary aspect-ratio
  evidence because PNG dimensions alone cannot establish the internal stage
  geometry; the screenshots corroborate centering, clipping, and overflow.

### VIS-010: Input retained across pause/fullscreen transitions (Task 8)

- Status: INCOMPLETE
- Priority: 🟥 Critical
- Location: shared keyboard/touch lifecycle
- Reproduction: `changeScreen` changed overlays without clearing held and
  newly pressed input. A touch control could unmount during pause before its
  release event, and the in-app browser demonstrated that fullscreen exit can
  update through the control handler even when the expected event is delayed.
- Fix: every screen transition clears both input sets, and the fullscreen
  control independently applies the same interruption predicate used by the
  browser-experience subscription. Orientation-lock rejection remains
  non-blocking.
- Verification: focused capability/input/shell tests pass. Browser fullscreen
  entry/exit at 1024×640 returned to the same Level 2 run in the paused
  `Snack break` state with empty warning/error logs; resume plus resize retained
  score, time, lives, and active play state.
- Limitation: real multi-touch, safe-area cutouts, native orientation lock,
  browser background/restore, and iOS/Android fullscreen behavior remain
  **CANNOT VERIFY** until the manual device checklist in the Task 8 report is
  completed. Static CSS/desktop-pointer evidence is not promoted to touch PASS.

Spatial validity is not sufficient. Every generated or placed asset must also
pass a visual composition review.

### 2026-08-09 — Task 5 world placement and composition

- **Automated closure:** 45/45 focused relationship, patrol, composition,
  route, and arena checks pass. The complete project suite passes 270/270;
  GitHub Pages build/verification passes 1/1.
- **RED findings repaired:** Level 1 rewards without semantic supports; two
  vertically invalid Level 1 flight envelopes; twelve patrol ranges whose
  largest placement footprints could leave their supports/bands; overlapping
  campsite crates; walking pigeons authored as flight actors; rolling windows
  with more than two encounter introductions; a Level 1 boss checkpoint
  respawn outside its declared ground; and Brutus utility-platform asymmetry.
- **Relationship ledger:** every scenery object, pickup hover envelope,
  checkpoint trigger/respawn, grounded patrol extreme, flight envelope,
  Level 2 environment/boss prop, attached water effect, and boss utility
  platform now has deterministic full-envelope evidence. Water origins remain
  inside both emitter bodies and independent effect rectangles. Opaque-pixel
  measurement proves both Brutus platform tops agree with collision within
  2px, their bases meet the arena floor, and their offsets are symmetric.
- **Composition ledger:** rolling 960px windows at 120px increments include
  expanded scenery, pickup, and encounter footprints; validate route/reward
  references and continuous zone transitions; reject repeated hero props;
  cap ordinary encounter introductions at two; and isolate large encounters.
  Level 2's street squirrel now begins after the terrier recovery boundary.
- **Boss/runway ledger:** both arenas have deterministic runway length,
  grounded boss props, in-bounds spawn/recovery, reachable utility platforms,
  enemy purge, fixed camera/clamp behavior, and defeat-gated release coverage
  in the existing boss-transition/victory suites.
- **Runtime limitation:** the in-app browser connection initialized, but the
  local game navigation did not complete and was abandoned rather than allowed
  to block the task. Full-speed Level 1/Level 2 rolling views, direct route
  screenshots, foreground-occlusion observation, and browser console logs are
  therefore **CANNOT VERIFY** in Task 5. These runtime-only checks remain open
  for the next controllable visual QA session; no screenshot is claimed.
- No generated image or source-art bytes changed in this task, so deterministic
  asset rebuild comparison was not applicable.

#### Task 5 review repair

- Clean-checkout reproducibility is restored: the focused archive matrix passes
  46/46 and the archive's complete package build/suite passes 206/206 without
  borrowing dirty prop/runtime files.
- Production now consumes the canonical full-envelope enemy resolver and
  level-specific scenery inventory. Invalid placements are omitted rather than
  rendered with an unbounded fallback.
- Mutation-sensitive rolling checks now cover off-world pickups and routes,
  support reach, route-boundary landing targets, bypass occupancy, expanded
  density, foreground readability, and large-enemy motion isolation.
- Highway alternate-route metadata now covers both promised bypass encounters;
  the Level 2 terrier's large expanded footprint ends before the squirrel
  introduction.
- Runtime/browser visual observation remains **CANNOT VERIFY**; this repair
  closes the deterministic review findings only.

### 2026-08-09 — Task 6 Level 1 and Trash Heap Tyrant acceptance

### VIS-008: Level 1 boss arena release after defeat

- Status: INCOMPLETE
- Deterministic lifecycle coverage passes and direct boss/victory fixtures are
  visually clean. A continuous player-controlled defeat-to-release sequence
  remains CANNOT VERIFY, so this issue is not promoted to PASS.

- **Baseline:** the required Level 1 definition, route, background, boss-arena,
  boss-transition, and victory matrix passed 27/27 before Task 6 edits. The
  broader deterministic route/lifecycle matrix passed 89/89 and covered both
  playable profiles, damage/shrink, terminal and non-terminal pits, pickups,
  state-local player/enemy/boss animation, parallax transitions, placement,
  boss geometry, the dumpster reveal, and the explicit `YOU WIN!` shell.
- **VIS-008 — Level 1 boss arena did not release after defeat:** static runtime
  investigation reproduced that `finishBossDefeat` marked the Trash Heap
  Tyrant defeated but left `arenaActive` true. The player and camera therefore
  remained arena-locked after the committed defeat sequence instead of being
  released into the reward/exit flow. A RED regression first failed on the
  missing completion contract. `completeBossArena` now clears the arena lock
  and transition while setting `bossDefeated`; the runtime invokes it only
  after the 0.9-second defeat state reaches `finishBossDefeat`. Focused boss,
  transition, animation, dumpster, and victory tests pass 28/28 after repair.
- **Runtime limitation:** localhost could not be started inside the sandbox
  because the development inspector failed with `listen EPERM`; the escalated
  restart did not complete before the approval attempt was aborted. No browser
  session was initialized, and no retry was made after the control path hung.
  Normal Trashy/Jimothy traversal, live movement/action/facing sequences,
  visual parallax motion, boss combat, post-defeat camera release, dumpster
  reveal, and victory presentation are therefore **CANNOT VERIFY** in Task 6.
  Automated evidence is not presented as visual PASS for those conditions.
- No source art, generated asset, atlas, contact sheet, background, scale,
  anchor, support, collision, or encounter coordinate changed in this pass.

## Task 10 release-candidate closure — 2026-08-09

The classifications below are authoritative for the current local release
candidate. PASS means the required automated and rendered evidence was
available. INCOMPLETE means part of the contract passed but a required manual
or live-input observation remains unavailable. CANNOT VERIFY is used only for
the individual unsupported observation, never as a substitute for failure.

| Issue | Final status | Closure evidence / remaining limitation |
| --- | --- | --- |
| VIS-001 | PASS | Fresh Level 2 interaction fixture and emitter/body contracts show grounded hardware and attached water. |
| VIS-002 | PASS | Fresh 1280×720 moth evidence shows a uniformly scaled, grounded lamp; console is clean. |
| VIS-003 | PASS | Separated crates pass composition/support tests and final route inspection. |
| VIS-004 | INCOMPLETE | Contact sheets, manifests, deterministic state routes, and representative boss/enemy frames pass; uninterrupted all-state/all-facing action sequences are CANNOT VERIFY. |
| VIS-005 | INCOMPLETE | Both character atlases, contact sheets, spawn/debug routes, baselines, and destinations pass; full keyboard-driven state and facing traversal is CANNOT VERIFY. |
| VIS-006 | INCOMPLETE | Enemy/boss atlases and representative direct fixtures pass; live attack, hit, recovery, defeat, and both-facing sequences are CANNOT VERIFY. |
| VIS-007 | INCOMPLETE | Level 2 prop/effect runtime repair passes; the separately documented one-pixel decorative tire rounding remains open. |
| VIS-008 | INCOMPLETE | Automated defeat/release contract and direct boss/victory fixtures pass; continuous player-controlled defeat-to-release is CANNOT VERIFY. |
| VIS-009 | PASS | Task 8 DOM geometry plus Task 10 responsive checks establish 16:9 and uncropped rendering at 1440×900, 1024×640, 844×390, and 390×844; the nine corrected 1280×720 PNGs are not used as 1440×900 evidence. |
| VIS-010 | INCOMPLETE | Desktop pause/resume, mute, fullscreen entry/exit, and input clearing pass; real-device touch, safe-area, orientation, and mobile fullscreen are CANNOT VERIFY. |

Canonical route result: PASS for loading and static rendered integrity on all
27 routes, entered through title and character selection as Trashy in the
desktop browser, with zero route-scoped warning/error logs. The sweep did not
retain one per-route viewport ledger. Jimothy's start,
squirrel, Brutus, and victory fixtures also PASS for static rendered integrity.
The optional canvas-locator measurement timed out after the first route; the
route sweep was restarted in a fresh tab without that optional measurement and
completed. This does not convert continuous normal campaign traversal into a
PASS.

Evidence correction: review measured nine `task10-*-1440x900.png` files as
1280×720. They are now named `task10-*-1280x720.png`; the final report records
their route, byte dimensions, and empty logs individually. The in-app browser
was disconnected during correction, so no recapture or inferred DOM rectangle
is claimed.

Required state classification:

- PASS: title/character entry; direct Level 1 and Level 2 start, middle, end,
  boss, and victory fixtures; static power-up/debug state fixtures;
  pause/resume; mute/unmute; desktop fullscreen entry/exit; responsive shell
  geometry; contact-sheet and representative rendered-frame inspection.
- INCOMPLETE: both complete campaign flows, combat timing, damage/checkpoint/
  pit-death presentation, boss defeat transitions, and every action/facing
  sequence. Deterministic tests and direct fixtures pass, but the continuous
  live-input observation remains CANNOT VERIFY.
- CANNOT VERIFY: real-device touch/multi-touch, safe-area cutouts, native
  orientation and mobile fullscreen, audible music quality/loop continuity,
  and acoustic balance. Audio bytes were not changed in this audit.

Complete command, route, viewport, screenshot, contact-sheet, hash, and
worktree-preservation evidence is recorded in
`docs/superpowers/reports/2026-08-09-game-wide-integrity-final.md`.

### 2026-08-09 — Task 7 Level 2 and Brutus acceptance

- **Baseline:** the required eight-suite Level 2 matrix passed 76/76 before
  edits. Direct Trashy fixtures for all five chapters, five authored enemy
  encounters, interaction, Brutus, and Level 2 victory loaded at 1280×720
  with empty browser warning/error logs. Jimothy squirrel, Brutus, and victory
  fixtures also loaded with empty logs.
- **Reproduced repair:** VIS-007 still allowed fixed 128px Level 2 prop atlas
  cells to use unequal destination axes. A narrow RED regression failed before
  the shared charge-obstacle draw contract existed and measured the unequal
  water, hydrant, and platform geometry. The systemic runtime/inventory repair
  makes those destinations uniform and keeps ground, nozzle/emitter, visible
  platform top, collision body, and arena-floor relationships explicit.
- **Browser evidence:** post-fix interaction and Brutus fixtures show complete,
  grounded utility sprites and proportional hydrants/platforms; both fresh-tab
  console results are empty. Evidence is stored in
  `docs/superpowers/reports/2026-08-09-level1-level2-integrity/after/` with the
  `task7-*fixed-1280x720.png` names.
- **Deterministic acceptance:** background plate dimensions/alpha/baselines,
  monotonic transitions, three parallax rates, encounter state contracts,
  support/flight constraints, effect attachment, runway purge/lock, platform
  reach, top-hit geometry, full Brutus phase/defeat/exit lifecycle, and victory
  gating are covered by the Level 2/placement/boss matrices.
- **CANNOT VERIFY:** direct routes and lifecycle tests do not substitute for a
  continuous normal-input playthrough. Full-speed transition feel, player-
  controlled reflection/damage/stomp timing, both facings through every enemy
  action, utility-platform jump feel, and the complete live Brutus combat/exit
  sequence remain manual acceptance items.
- **Review fix round 1:** the review correctly reopened the standalone lamp and
  emitter-effect contracts. The lamp now maps 192×256→156×208 with one scale,
  publishes its measured alpha-visible bounds and dedicated inventory/draw
  family, and retains bottom-center ground contact. Sprinkler and hydrant water
  now publish right/left bounds directly from their runtime draw helpers around
  a named emitter origin, use `FREE_ANCHOR`, and allow only a named emitter
  envelope rather than a walkable surface. Focused tests are mutation-sensitive
  to helper/dimension changes. Post-correction browser appearance remains
  `CANNOT VERIFY` unless separately recorded after this change.

### 2026-08-10 — V2 Task 2 environmental-art remediation

- **Source classification:** the existing Level 2 prop sheet remains the authored
  source for projectile acorns, which are recomposed into a three-piece loose
  pile. No reusable classic residential can existed, so one source was generated
  once with the built-in image generator and committed in the project. The boss
  platforms now reuse the canonical Level 1 decorative-crate renderer directly.
- **RED evidence:** the initial focused run produced 15 passes and 7 expected
  failures for missing pile/can identity, residual lamp components, bespoke boss
  platform art, and stale inventory ownership.
- **Asset inspection:** native atlas/contact-sheet inspection found three
  separated acorns grounded at the common baseline, a round galvanized can with
  an overhanging lid and visible trash, one connected hard-alpha lamp body, and
  empty former utility-platform cells. Gameplay-scale fixtures showed grounded,
  readable props without matte pixels or overlap.
- **Runtime inspection:** fresh squirrel, terrier, moth, and Brutus fixtures
  loaded through the title/character flow with empty warning/error logs. The
  moth fixture preserves its intentional warm radial light while removing the
  accidental purple/cyan fringe; both Brutus platforms use matching 112x85
  wooden crates with reachable one-way collision tops.
- **Determinism:** two consecutive prop/lamp builds produced byte-identical
  atlas and contact-sheet SHA-256 hashes. The focused acceptance matrix passed
  79/79, the exact staged snapshot passed 292/292, and lint completed with zero
  errors. A 293rd test belongs to preserved unrelated work and is not claimed by
  this task.
- **Fix Round 1:** review found the maximum-width entry player intersecting the
  newly canonical left crate. RED contracts reproduced both normal-trigger and
  direct-fixture overlap. The Level 2 lock now expands symmetrically to
  5650..6600 while keeping the crate pair and arena center fixed; the trigger and
  fixture move to x5680, so the 38px player ends six pixels before the crate.
  Mutation tests reject a one-pixel regression. The previously documented
  `npm run build:level2-props` command is now a real package alias for the direct
  builder, and two fresh runs reproduce all four committed hashes. Runtime visual
  inspection is CANNOT VERIFY for this round because browser discovery returned
  no available browser after the local server started; no new screenshot PASS is
  claimed. The focused matrix passed 105/105, the exact staged snapshot passed
  294/294 with a production build, and lint completed with zero errors.
- **Fix Round 2:** movement integration occurs before arena activation, so the
  nominal Round 1 trigger still allowed a 10.89px maximum-frame overshoot. A
  frozen shared entry contract now owns 330px/s speed, 0.033s maximum dt, 38px
  player width, and 6px minimum clearance. It derives the Level 2 trigger at
  x5669 and is consumed by runtime movement, validation, mutation tests, and the
  arena audit. Worst-step entry ends at x5717.89, retaining a measured 6.11px
  gap before the unchanged left crate; a one-pixel trigger mutation fails. The
  focused matrix passed 106/106, and the exact staged production build and
  295/295 tests passed with zero lint errors.
