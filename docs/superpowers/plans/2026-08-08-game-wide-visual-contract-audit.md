# Game-wide Visual Contract Audit — Implementation Plan

**Goal:** Make rendered placement, scale, anchoring, layering, and animation coverage explicit and testable across every implemented Trash Dash level and boss encounter without changing intended gameplay physics.

**Implemented scope:** Level 1, Level 2, Trashy, Jimothy, all enemies and bosses reachable in those levels, pickups, projectiles, hazards, interactive/decorative props, terrain, backgrounds, effects, and viewport UI. Planned Levels 3–5 are documented as not implemented and cannot receive a rendered pass.

## Task 1: Establish the baseline and complete the inventory

- [x] Run the existing full test/build baseline and preserve its output.
- [x] Enumerate campaign definitions, direct QA routes, render stages, assets, manifests, factories, spawns, and state machines.
- [x] Record each renderable's asset, native/rendered size, origin, anchors, bounds, footprint, layer, zones, scale, viewport behavior, and animation requirements.
- [x] Separate verified metadata from fields that must be derived or remain unavailable.

## Task 2: Create the shared visual contract

- [x] Add centralized semantic render layers and viewport/scale policies.
- [x] Add normalized bounds, ground-anchor, placement-footprint, and motion-envelope utilities.
- [x] Add strict contract validation for missing/invalid bounds, anchors, layers, zones, clearances, and scale ranges.
- [x] Extend deterministic placement to reject forbidden geometry and return a deterministic valid candidate or `null`.
- [x] Add RED then GREEN unit coverage for each contract rule.

## Task 3: Integrate contracts with implemented content

- [x] Build a machine-readable inventory for players, enemies, bosses, projectiles, hazards, pickups, props, terrain, backgrounds, effects, and viewport UI.
- [x] Validate grounded entities against authored surfaces and flying entities against authored bands.
- [x] Validate static scenery/platform exclusion, largest-frame clearance, arena bounds, and responsive viewport behavior.
- [x] Centralize renderer stage ordering around semantic layers without changing the established visual stack.
- [x] Add a development-only overlay for visual/collision/footprint bounds, anchors, layer names, states, and frames.

## Task 4: Complete animation coverage and registration checks

- [x] Inventory every gameplay state and its visual mapping for both heroes, Level 1 enemies, Level 2 enemies, both bosses, projectiles, props, and animated effects.
- [x] Validate assets, frame rectangles, order, durations, looping, reachability, transitions, stable registration, facing, and largest-frame envelopes.
- [x] Repair proven missing, stale, or incompatible mappings without inventing animation for static objects.
- [x] Add regression coverage for pause/cull-safe state selection where the current architecture exposes it.

## Task 5: Deterministic visual QA

- [x] Define deterministic QA routes for level starts/middles/ends, enemy encounters, pickups/props, boss arenas/phases, character states, dense scenes, and supported viewports.
- [ ] Run desktop, mobile portrait/landscape, and fullscreen-equivalent rendered checks where the browser environment permits.
- [ ] Capture and inspect representative before/after screenshots and short frame sequences for repaired motion.
- [ ] Rerun affected checks after every shared-system repair.

## Task 6: Permanent safeguards and project knowledge

- [x] Add the new validators to the default test suite.
- [x] Update the existing art director, level, player, enemy, boss, item, and VFX skills with rendered-source-of-truth, placement-contract, platform-exclusion, full-motion-state, largest-frame, stable-registration, regression, no-screenshot-only-fix, and definition-of-done rules.
- [x] Validate all modified skills and rebuild the project skill archive.
- [x] Write the final audit report with inventory, defects/root causes, changed files, validation evidence, unresolved items, screenshots, and a pass/fail matrix.

## Verification gates

- [ ] Focused visual-contract tests pass.
- [ ] Complete `npm test` passes.
- [ ] Lint passes without new errors.
- [ ] GitHub Pages build/test passes.
- [ ] Every implemented level and boss has rendered evidence; anything the environment prevents is marked `CANNOT VERIFY`, never `PASS`.
