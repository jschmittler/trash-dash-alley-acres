# Level 1 + Level 2 Visual Integrity Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Levels 1 and 2 read as intentionally composed pixel-art spaces by rebuilding weak animated props, enforcing negative space and grounding through shared contracts, cleaning the Level 2 boss arena, and proving the result in the rendered browser game.

**Architecture:** Keep authored level geometry and gameplay physics separate from art. Extend the existing machine-readable visual contract with placement categories, composition padding, density limits, explicit effect emitters, and preferred scale; use those values from deterministic validators and the Canvas renderer. Rebuild weak source art into the existing Level 2 prop atlas, then validate source crops, runtime destinations, and representative rendered routes.

**Tech Stack:** React/TypeScript Canvas runtime, browser-independent `.mjs` gameplay modules, Sharp-based deterministic atlas generation, Node test runner, Vite/GitHub Pages build, in-app browser visual QA.

## Global Constraints

- Preserve current Level 1 and Level 2 gameplay feel, enemy physics, player physics, and campaign progression unless a visual/gameplay relationship is proven invalid.
- Use nearest-neighbor rendering, hard alpha, stable ground baselines, consistent side-on perspective, and the palette/outline rules in `.summer/pixel-anchor.md`.
- Never repair source-frame or atlas errors with unexplained per-instance scale, offset, crop, or render-layer overrides.
- Spatial validity is not sufficient. Every generated or placed asset must also pass a visual composition review.
- Effects require an explicit emitter object, origin, direction, bounds, scale, and layer.
- Large environmental props require negative space; valid placement slots may remain intentionally empty.
- Preserve unrelated dirty-worktree changes and do not rewrite existing assets outside this plan's scope.

---

### Task 1: Inventory and composition contract

**Files:**
- Modify: `app/visual-contract.mjs`
- Modify: `app/visual-inventory.mjs`
- Modify: `app/world-placement.mjs`
- Modify: `app/world-scenery.mjs`
- Test: `tests/visual-contract.test.mjs`
- Test: `tests/visual-inventory.test.mjs`
- Test: `tests/world-placement.test.mjs`

**Interfaces:**
- Consumes: existing `createVisualContract`, `classifyWorldObjectPlacement`, `IMPLEMENTED_VISUAL_INVENTORY`, and authored Level 1/2 surfaces.
- Produces: `PLACEMENT_SIZE_CLASSES`, `COMPOSITION_GAPS`, `expandedCompositionFootprint(contract)`, `validateCompositionDensity(items, viewport)`, and inventory records with explicit `nativePixelSize`, `referenceWorldHeight`, `preferredScale`, `compositionPadding`, `placementCategory`, and `effectOrigin` where applicable.

- [ ] **Step 1: Write failing contract and density tests**

```js
assert.deepEqual(expandedCompositionFootprint({
  placementFootprint: { x: 10, y: 20, w: 30, h: 40 },
  compositionPadding: { left: 8, right: 12, top: 4, bottom: 2 },
}), { x: 2, y: 16, w: 50, h: 46 });
assert.match(validateCompositionDensity(fourHeroProps, { x: 0, y: 0, w: 960, h: 540 })[0], /hero prop density/);
```

- [ ] **Step 2: Run focused tests and preserve RED output**

Run: `node --test tests/visual-contract.test.mjs tests/visual-inventory.test.mjs tests/world-placement.test.mjs`

Expected: failures for missing composition padding, placement categories, density validation, and preferred-scale fields.

- [ ] **Step 3: Implement shared composition and scale metadata**

```js
export const COMPOSITION_GAPS = Object.freeze({
  small: 12,
  medium: 28,
  large: 52,
  hero: 88,
  interactive: 40,
  bossArena: 72,
});
```

The expanded composition footprint must contain the full largest-frame visual envelope, and the preferred scale must remain between minimum and maximum scale.

- [ ] **Step 4: Add rolling-viewport density validation**

Validate 960-world-pixel windows with separate maxima for hero, large, and medium props. Level-authored open zones must remain legal and empty rather than being backfilled.

- [ ] **Step 5: Run focused tests GREEN**

Run: `node --test tests/visual-contract.test.mjs tests/visual-inventory.test.mjs tests/world-placement.test.mjs`

Expected: all focused assertions pass.

---

### Task 2: Sprinkler body, emitter, and complete spray cycle

**Files:**
- Modify: `concepts/level-two/source/level2-props-reference.png` only if a source repair is required
- Create: `concepts/level-two/source/level2-sprinkler-water-source.png`
- Modify: `scripts/build-level-two-props.mjs`
- Modify: `app/level-two-props.mjs`
- Modify: `app/trash-dash-game.tsx`
- Modify: `public/assets/generated/level2-props.png`
- Modify: `concepts/level-two/level2-props-contact-sheet.png`
- Test: `tests/level-two-props.test.mjs`
- Test: `tests/visual-asset-integrity.test.mjs`

**Interfaces:**
- Consumes: `levelTwoPropFrame`, `LEVEL_TWO_PROP_ATLAS`, and authored sprinkler environment records.
- Produces: `sprinklerVisualState(active, progress)`, `sprinklerBodyDrawRect(item)`, `sprinklerEmitterOrigin(item, direction)`, and `sprinklerWaterDrawRect(origin, direction)` with idle/start/six spray/stop frames.

- [ ] **Step 1: Write RED frame, alpha, and emitter tests**

Assert that every water frame is water-only, contains transparent breakup at the outer edge, begins within two runtime pixels of the nozzle origin, remains inside its atlas cell, and does not contain an opaque rectangular or triangular bounding silhouette.

- [ ] **Step 2: Generate or author the water cycle from one fixed nozzle**

Use eight ordered states: `idle`, `start`, `spray-01` through `spray-06`, and `stop`. Preserve the current body as a separate grounded sprite. Water arcs change progressively and keep a transparent/droplet-broken perimeter.

- [ ] **Step 3: Rebuild the deterministic atlas and contact sheet**

Run: `npm run build:level2-props`

Expected: the generated atlas has hard alpha, fixed cells, no guide-color spill, and the contact sheet shows one body plus detached water-only frames.

- [ ] **Step 4: Integrate explicit state timing and attachment**

Render the body exactly once. Compute the water destination from `sprinklerEmitterOrigin`; never draw a combined body+water frame or use duplicated direction-specific offsets.

- [ ] **Step 5: Verify focused tests and a rendered frame sequence**

Run: `node --test tests/level-two-props.test.mjs tests/visual-asset-integrity.test.mjs`

Browser route: `/?encounterTest=interaction&visualQa=sprinkler-repair`

Capture at least six sequential frames showing continuous nozzle attachment and a smooth start/stop.

---

### Task 3: Grounded street lamp landmark

**Files:**
- Create: `concepts/level-two/source/level2-lamp-post-source.png`
- Modify: `scripts/build-level-two-props.mjs`
- Modify: `app/level-two-props.mjs`
- Modify: `app/level-two-enemies.mjs`
- Modify: `app/visual-inventory.mjs`
- Modify: `app/trash-dash-game.tsx`
- Test: `tests/level-two-props.test.mjs`
- Test: `tests/level-two-enemies.test.mjs`

**Interfaces:**
- Consumes: moth flight-band metadata and the Level 2 prop atlas loader.
- Produces: `lampPostDrawRect(item)`, `lampEmitterOrigin(item)`, `lamp-post` body frame, and optional `lamp-glow` overlay frame.

- [ ] **Step 1: Write RED grounding and source-frame tests**

Assert that the lamp post's visible bottom maps to its named surface Y, its fixture origin lies inside the post silhouette, and the moth target uses the same exported emitter coordinate.

- [ ] **Step 2: Create a complete side-on lamp post source**

The source includes base, full vertical post, support arm, housing, and warm lamp; it uses a dark navy outline, three-to-four-value metal shading, hard alpha, and the existing night palette.

- [ ] **Step 3: Replace `porch-light` with a grounded authored record**

Place the post on `obstacle-lawn`, keep the light origin high enough for the moth orbit band, and remove the structure-attachment exception.

- [ ] **Step 4: Render body and glow on explicit layers**

Render the post once in rear environment and the glow once behind gameplay. The glow remains centered on `lampEmitterOrigin` and never moves independently.

- [ ] **Step 5: Verify tests and rendered moth route**

Run: `node --test tests/level-two-props.test.mjs tests/level-two-enemies.test.mjs tests/visual-inventory.test.mjs`

Browser route: `/?encounterTest=moth&visualQa=lamp-post-repair`

Expected: the full post contacts the lawn, the moth orbits the fixture, and no fixture floats in open space.

---

### Task 4: Level 2 boss arena composition and coherent Brutus rendering

**Files:**
- Modify: `app/level-two.mjs`
- Modify: `app/boss-arena.mjs`
- Modify: `app/brutus-boss.mjs`
- Modify: `app/trash-dash-game.tsx`
- Modify: `app/visual-inventory.mjs`
- Test: `tests/boss-arena.test.mjs`
- Test: `tests/brutus-atlas.test.mjs`
- Test: `tests/level-two-definition.test.mjs`
- Test: `tests/level-two-routes.test.mjs`

**Interfaces:**
- Consumes: `brutusDrawRect`, the Brutus animation manifest, boss platform visuals, hydrant/sprinkler records, and arena clamp helpers.
- Produces: a direct active `bossTest=brutus` route, arena composition constraints, and a single Brutus draw call for the selected state/frame.

- [ ] **Step 1: Write RED route and composition tests**

Assert the direct route starts beyond the trigger with `arenaActive`, both jump platforms are reachable and visually separated from hydrant/sprinklers, Brutus's largest-frame envelope remains inside the arena, and each frame issues one boss-layer draw.

- [ ] **Step 2: Recompose the authored arena**

Keep two one-way utility platforms near the arena sides, move the hydrant and sprinklers into readable lanes with boss-arena category gaps, preserve dodge space, and keep attack emitters unobstructed.

- [ ] **Step 3: Make the test route deterministic**

Start the player inside the locked active arena, keep ordinary enemies purged, expose both platforms, and begin Brutus in an active visible phase without requiring held keyboard input.

- [ ] **Step 4: Audit Brutus frame registration and duplicate rendering**

Confirm every active/damaged/defeat frame shares the audited baseline and centerline. Reject simultaneous state rows, accumulated transforms, and alpha-stacked duplicates.

- [ ] **Step 5: Verify focused tests and rendered arena phases**

Run: `node --test tests/boss-arena.test.mjs tests/brutus-atlas.test.mjs tests/level-two-definition.test.mjs tests/level-two-routes.test.mjs`

Browser route: `/?bossTest=brutus&visualQa=brutus-arena-repair&debugVisuals=1`

Expected: one coherent boss silhouette, readable platforms and hazards, no cropped boss, and no prop collisions.

---

### Task 5: Level-wide placement, density, grounding, and animation regression coverage

**Files:**
- Modify: `app/world-scenery.mjs`
- Modify: `app/visual-inventory.mjs`
- Modify: `tests/visual-spawn-envelope.test.mjs`
- Modify: `tests/enemy-surface.test.mjs`
- Create: `tests/world-composition.test.mjs`
- Modify: `tests/visual-asset-integrity.test.mjs`

**Interfaces:**
- Consumes: completed composition contracts and all Level 1/2 authored objects.
- Produces: deterministic full-level validation for ground anchors, platform exclusion, composition padding, scale ranges, effect origins, animation completeness, repeated-prop spacing, and rolling viewport density.

- [ ] **Step 1: Add deterministic full-level failure fixtures**

Cover prop/platform intersection, two hero props without required negative space, floating anchors, out-of-range scale, a missing animation state, an effect detached from its emitter, and duplicate boss draw ownership.

- [ ] **Step 2: Audit and adjust every authored Level 1/2 scenery placement**

Move only confirmed violations. Preserve dense/medium/open rhythm and ensure Level 1 and Level 2 each include intentional negative-space intervals.

- [ ] **Step 3: Add source-versus-runtime frame validation**

For each major atlas record, verify crop bounds, source dimensions, destination dimensions, aspect ratio, hard alpha, visible bounds, anchor mapping, and semantic render layer.

- [ ] **Step 4: Run all visual/composition tests**

Run: `node --test tests/visual-*.test.mjs tests/world-*.test.mjs tests/enemy-surface.test.mjs`

Expected: no invalid placement, density, anchor, scale, animation, atlas, emitter, or duplicate-owner error.

---

### Task 6: Durable project skills and final rendered walkthrough

**Files:**
- Modify: `.summer/pixel-anchor.md`
- Modify: `skills/game-asset-library/game-art-contract.md`
- Modify: `skills/game-asset-library/game_asset_director_SKILL.md`
- Modify: `skills/game-asset-library/level_creator_SKILL.md`
- Modify: `skills/game-asset-library/item_creator_SKILL.md`
- Modify: `skills/game-asset-library/vfx_creator_SKILL.md`
- Modify: `skills/game-asset-library/boss_creator_SKILL.md`
- Modify: `skills/game-asset-library.zip`
- Create: `docs/superpowers/reports/2026-08-09-level-one-two-visual-integrity.md`

**Interfaces:**
- Consumes: final contracts, tests, rendered screenshots, and before evidence.
- Produces: reusable rules, a validated skill archive, screenshot evidence, and the final root-cause/change/QA report.

- [ ] **Step 1: Add the required durable rules verbatim**

Include explicit anchors, footprints, composition padding, scale policy, render layers, platform exclusion, state manifests, effect origins, source/runtime validation, screenshot evidence, density checks, and the three quoted principles from the task brief.

- [ ] **Step 2: Rebuild and validate the skill archive**

Run: `cd skills && zip -qr game-asset-library.zip game-asset-library && unzip -t game-asset-library.zip`

Expected: archive integrity passes and every edited skill is present.

- [ ] **Step 3: Run code-layer verification**

Run: `npm test`

Run: `npm run lint`

Run: `npm run build:pages && npm run test:pages`

Run: `git diff --check`

Expected: all tests/builds pass, no new lint errors, and no whitespace errors.

- [ ] **Step 4: Walk Level 1 and Level 2 in the rendered browser game**

Inspect starts, major traversal/platform sections, dense scenery, hazards, lamp area, boss approaches, and active boss arenas. Probe pause/resume, culling re-entry, and animation repetition. Read browser console logs after the walkthrough.

- [ ] **Step 5: Capture after screenshots and write the final report**

Save representative images under `docs/superpowers/reports/2026-08-09-level1-level2-integrity/after/`. Report root causes, rebuilt assets, animation changes, placement/composition changes, level-specific fixes, boss changes, skills, tests, visual results, remaining issues, and before/after paths.

## Self-review

- Spec coverage: every phase in the brief maps to Tasks 1–6, including visual inspection and durable skill updates.
- Placeholder scan: no `TBD`, `TODO`, or unspecified implementation step remains.
- Type consistency: the named contract, draw-rect, emitter, visual-state, and density interfaces are defined before their consumers.

