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

- Status: 🟨 Automated repair complete; running-game verification `CANNOT VERIFY`
  because the browser backend was unavailable in this execution.
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

- Observed source/runtime evidence: charge obstacle 128²→84×112; all four
  sprinkler-water cells 128²→120×96; hydrant body 128²→72×108; both Brutus
  platform cells 128²→104×96; tires' rounded 224×115→112×58 destination; and
  cap 58×48→50×42 destination are exact frame-allowlisted mismatches.
- The Level 2 prop entries remain owned by the separate prop/runtime pass. Cap
  shares the dirty gameplay renderer; the tires deviation is a one-pixel
  rounding decision. Neither runtime change is staged in Task 2. The platform
  and water records narrow the issue to their actual renderer draws rather
  than obscuring them behind a tiled-surface exemption.

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

- Perform a real-device mobile portrait and landscape visual pass.
- Repeat the complete audit whenever a sprite atlas, platform footprint,
  background layer, player form, enemy state, boss phase, or viewport policy
  changes.
- Add new issues with a stable `VIS-###` identifier, observed route, root cause,
  changed files, automated evidence, and rendered screenshot evidence.

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
