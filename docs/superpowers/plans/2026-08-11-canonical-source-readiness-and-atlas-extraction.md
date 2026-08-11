# Canonical Source Readiness and Atlas Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create an authoritative readiness ledger for all approved shared and Level 1 references and a deterministic, fail-closed pipeline that emits review-only candidate atlases and contact sheets from explicitly reviewed recipes.

**Architecture:** Keep the imported master bundle immutable under `docs/design/trash-dash/`. Store project-owned readiness metadata, extraction recipes, the Sharp-based builder, and review outputs under `concepts/canonical-import/`. Validate source authority and checksums before extraction, normalize only with explicit integer geometry and uniform nearest-neighbor scaling, and keep all outputs outside `public/assets/` until a later runtime-integration pass.

**Tech Stack:** Node.js 22+, ECMAScript modules, Sharp 0.34.5, Node's built-in test runner, JSON manifests, PNG candidate atlases/contact sheets.

## Global Constraints

- `docs/design/trash-dash/reference/` is authoritative and read-only.
- `docs/design/trash-dash/archive/` is historical and must never be an extraction source.
- This pass covers the 32 approved shared and Level 1 files selected from `manifests/APPROVED_FILES.txt`.
- Candidate atlases are review artifacts under `concepts/canonical-import/generated/`; nothing is written to `public/assets/`.
- Every frame comes from an explicit reviewed integer crop rectangle; no inferred crop becomes authoritative automatically.
- Nonuniform scaling, fractional source rectangles, silent frame substitution, and state-specific scale changes are forbidden.
- Unsafe extraction results are recorded as `blocked` with a concrete reason.
- `runtimeComplete` remains `false`; runtime Visual QA remains `CANNOT VERIFY`.
- Preserve all unrelated dirty-worktree changes and stage only task-owned files in each commit.

---

## File Map

**Create:**

- `concepts/canonical-import/README.md` — authority, workflow, commands, candidate/promotion boundaries.
- `concepts/canonical-import/readiness.json` — 32 source readiness records.
- `concepts/canonical-import/extraction-recipes.json` — explicit extraction and state recipes.
- `concepts/canonical-import/build-candidate-atlases.mjs` — validation, extraction, alpha cleanup, normalization, atlas/contact-sheet generation.
- `concepts/canonical-import/generated/shared/*.png` — shared review outputs.
- `concepts/canonical-import/generated/level-01/*.png` — Level 1 review outputs.
- `tests/canonical-import-readiness.test.mjs` — authority, schema, source, recipe, alpha, geometry, and determinism checks.
- `docs/superpowers/reports/2026-08-11-canonical-source-readiness-and-atlas-extraction.md` — extraction and QA evidence.

**Modify:**

- `package.json` — focused build and test commands; include the focused test in the normal test command.
- `docs/asset-manifest.md` — identify canonical-import outputs as non-runtime review candidates.
- `docs/visual-audit.md` — record static source-to-candidate evidence and runtime `CANNOT VERIFY` boundary.

**Imported prerequisite:**

- `docs/design/trash-dash/` — validated 177-file master import installed before this plan.

---

### Task 1: Version the validated canonical design import

**Files:**

- Add: `docs/design/trash-dash/**`

**Interfaces:**

- Consumes: the already validated local import at `docs/design/trash-dash/`.
- Produces: repository-owned immutable source paths and manifests used by every later task.

- [ ] **Step 1: Re-run the authoritative checksum validation before staging**

Run:

```bash
cd docs/design/trash-dash
sha256sum -c manifests/SHA256SUMS_MASTER.txt
```

Expected: 147 lines ending in `OK` and exit status 0. Do not use the stale legacy `manifests/SHA256SUMS.txt` as the authority.

- [ ] **Step 2: Confirm approval and archive boundaries remain exact**

Run:

```bash
test "$(find reference -type f | wc -l | tr -d ' ')" = "113"
test "$(find archive -type f | wc -l | tr -d ' ')" = "18"
comm -3 <(find reference -type f | sort) <(sort manifests/APPROVED_FILES.txt)
comm -3 <(find archive -type f | sort) <(sort manifests/SUPERSEDED_FILES.txt)
```

Expected: both tests succeed and both `comm` commands print nothing.

- [ ] **Step 3: Stage only the imported design tree and inspect the staged scope**

Run:

```bash
git add docs/design/trash-dash
git diff --cached --stat -- docs/design/trash-dash
git diff --cached --name-only -- docs/design/trash-dash | wc -l
```

Expected: 177 staged files under `docs/design/trash-dash/` and no path outside that directory.

- [ ] **Step 4: Commit the validated import**

```bash
git commit -m "docs: import canonical Trash Dash design sources"
```

---

### Task 2: Add the authoritative readiness ledger and contract tests

**Files:**

- Create: `concepts/canonical-import/readiness.json`
- Create: `tests/canonical-import-readiness.test.mjs`
- Modify: `package.json`

**Interfaces:**

- Consumes: `docs/design/trash-dash/manifests/APPROVED_FILES.txt`, `APPROVAL_STATUS.tsv`, `SHA256SUMS_MASTER.txt`, and `MASTER_ASSET_CATEGORIES.json`.
- Produces: `readiness.json` with stable IDs and `npm run test:canonical-import`.

- [ ] **Step 1: Write the failing ledger-selection test**

Add a test that derives the exact 32-path slice from the approved manifest and compares it with readiness records:

```js
const inFirstSlice = (sourcePath) => [
  /^reference\/characters\/level-01\//,
  /^reference\/environments\/level-01\//,
  /^reference\/foreground-assets\/level-01\//,
  /^reference\/gameplay-tiles\/concepts\/trash_dash_forest_level_blueprint\.png$/,
  /^reference\/items\//,
  /^reference\/level-layouts\/dynamic-approved\/level-01-dynamic-layout-blueprint\.png$/,
  /^reference\/main-characters\//,
  /^reference\/rewards\//,
  /^reference\/ui-powerups\//,
].some((pattern) => pattern.test(sourcePath));

test("readiness ledger covers the exact approved shared and Level 1 slice", async () => {
  const approved = (await readFile(APPROVED_FILES, "utf8")).trim().split("\n").filter(inFirstSlice).sort();
  assert.equal(approved.length, 32);
  assert.deepEqual(readiness.assets.map(({ sourcePath }) => sourcePath).sort(), approved);
});
```

- [ ] **Step 2: Add the focused package command and prove the test fails**

Modify `package.json` scripts:

```json
"test:canonical-import": "node --test tests/canonical-import-readiness.test.mjs"
```

Run:

```bash
npm run test:canonical-import
```

Expected: failure because `concepts/canonical-import/readiness.json` does not exist.

- [ ] **Step 3: Create all 32 ledger records**

Use this exact top-level shape:

```json
{
  "version": 1,
  "scope": "shared-and-level-01",
  "authority": "docs/design/trash-dash/docs/game/APPROVED_ASSET_POLICY.md",
  "runtimeComplete": false,
  "assets": []
}
```

Every asset record must contain:

```json
{
  "id": "trashy-regular-sprite-reference",
  "sourcePath": "reference/main-characters/sprites/trashy-regular-approved.png",
  "sha256": "770aa14d05d0e2db32c1948a58a2db5053500bf6c9a23812a81ecc74d2d764d6",
  "dimensions": { "width": 1086, "height": 1448 },
  "approval": "approved",
  "category": "main_characters",
  "role": "sprite_reference",
  "disposition": "runtime_candidate",
  "readiness": "recipe_required",
  "referenceComplete": true,
  "runtimeComplete": false,
  "recipeId": "trashy-regular",
  "derivedOutputs": [],
  "blockers": [],
  "notes": ["Presentation sheet requires explicit crops and background removal."]
}
```

Copy actual digests from `SHA256SUMS_MASTER.txt`; do not type or recompute replacements. Use `directional_reference` plus `source_verified` for concepts, five environment images, the foreground board, forest gameplay-tile board, and Level 1 layout blueprint. Use `runtime_candidate` plus `recipe_required` for the 15 sprite-reference sheets.

- [ ] **Step 4: Add schema, authority, hash, and dimension tests**

Test stable unique IDs, allowed enum values, `runtimeComplete === false`, exact category ownership, absence of `archive/`, SHA-256 agreement, and Sharp metadata agreement. The hash assertion must use:

```js
const digest = createHash("sha256").update(await readFile(sourceFile(asset.sourcePath))).digest("hex");
assert.equal(digest, asset.sha256, `${asset.id}: source checksum`);
```

- [ ] **Step 5: Run the focused test and verify it passes**

Run:

```bash
npm run test:canonical-import
```

Expected: all ledger tests pass.

- [ ] **Step 6: Commit the readiness baseline**

```bash
git add concepts/canonical-import/readiness.json tests/canonical-import-readiness.test.mjs package.json
git commit -m "test: establish canonical asset readiness ledger"
```

---

### Task 3: Implement fail-closed extraction recipe validation and builder primitives

**Files:**

- Create: `concepts/canonical-import/extraction-recipes.json`
- Create: `concepts/canonical-import/build-candidate-atlases.mjs`
- Modify: `tests/canonical-import-readiness.test.mjs`
- Modify: `package.json`

**Interfaces:**

- Consumes: readiness records plus explicit recipe data.
- Produces: `validateManifest()`, `validateRecipe()`, `alphaBounds()`, `removeEdgeConnectedBackground()`, `normalizeFrame()`, `buildRecipe()`, and the command `npm run build:canonical-candidates`.

- [ ] **Step 1: Write failing recipe-contract tests**

Assert that recipe IDs are unique, every recipe points to a `runtime_candidate`, crop coordinates are positive integers within source dimensions, cells are positive integers, destination coordinates are unique, grounded actors declare `FEET` and an integer baseline, and directional references have no recipes.

Use this recipe shape in the assertions:

```json
{
  "id": "trashy-regular",
  "sourceId": "trashy-regular-sprite-reference",
  "outputGroup": "shared",
  "cell": { "width": 192, "height": 192 },
  "columns": 6,
  "canonicalFacing": "right",
  "anchor": "FEET",
  "baseline": 176,
  "background": {
    "method": "edge_connected",
    "localDifferenceThreshold": 24,
    "seedDifferenceThreshold": 72,
    "featherPixels": 0
  },
  "effectPolicy": "separate_when_timing_or_bounds_differ",
  "requiredStates": ["idle", "walk", "run", "jump-start", "rise", "fall", "land", "skid", "hurt", "defeat", "victory", "glide"],
  "missingStates": [],
  "states": []
}
```

- [ ] **Step 2: Prove recipe tests fail**

Run:

```bash
npm run test:canonical-import
```

Expected: failure because recipes and builder exports do not exist.

- [ ] **Step 3: Implement validation and immutable loading**

The builder must export its pure helpers and execute the CLI only when `import.meta.url === pathToFileURL(process.argv[1]).href`. Use `Object.freeze` on loaded manifest structures after validation. Throw errors prefixed by source and state, for example `spider:attack:2 crop exceeds 1536x1024`.

- [ ] **Step 4: Implement edge-connected background removal**

Operate on raw RGBA pixels. Seed from all crop-edge pixels; flood only to neighboring pixels whose color distance from the current background pixel and nearest edge seed are both within the recipe thresholds. Set accepted background alpha to zero, preserve non-background RGB values, and emit binary alpha unless the recipe explicitly marks the frame as a soft effect. This operation is deterministic and recipe-controlled; it must never search for or choose a crop.

- [ ] **Step 5: Implement alpha bounds and uniform normalization**

`normalizeFrame()` must:

```js
const scale = Math.min(1, usableWidth / bounds.width, usableHeight / bounds.height);
const width = Math.max(1, Math.round(bounds.width * scale));
const height = Math.max(1, Math.round(bounds.height * scale));
```

Resize with `{ kernel: "nearest" }`, place grounded sprites at `baseline - height + 1`, center them horizontally, and reject output touching the outer four-pixel safety margin. `LOGICAL_CENTER` frames center both axes. Never calculate independent X/Y scales.

- [ ] **Step 6: Implement deterministic atlas and contact-sheet emission**

Atlas rows follow recipe state order; columns follow frame order. Unused cells remain transparent. Contact sheets use nearest-neighbor 1x or 2x presentation, a separate label gutter, and labels outside atlas cells. Write atomically through a sibling `.tmp` file and rename to the final known output path.

- [ ] **Step 7: Add CLI and package commands**

Add:

```json
"build:canonical-candidates": "node concepts/canonical-import/build-candidate-atlases.mjs",
"validate:canonical-candidates": "node concepts/canonical-import/build-candidate-atlases.mjs --validate-only"
```

Support `--validate-only`, `--source-id trashy-regular-sprite-reference`, and `--write-grid-overlay trashy-regular-sprite-reference`; the parser must accept any declared source ID in those two value positions. Grid overlays are authoring aids written under `concepts/canonical-import/generated/overlays/` and never become recipe data automatically.

- [ ] **Step 8: Run focused validation tests**

Run:

```bash
npm run validate:canonical-candidates
npm run test:canonical-import
```

Expected: recipe schema and builder primitive tests pass with an empty recipe list; no candidate PNG is emitted yet.

- [ ] **Step 9: Commit the pipeline foundation**

```bash
git add concepts/canonical-import/extraction-recipes.json concepts/canonical-import/build-candidate-atlases.mjs tests/canonical-import-readiness.test.mjs package.json
git commit -m "feat: add fail-closed canonical atlas builder"
```

---

### Task 4: Author and verify shared hero candidate recipes

**Files:**

- Modify: `concepts/canonical-import/extraction-recipes.json`
- Modify: `concepts/canonical-import/readiness.json`
- Create: `concepts/canonical-import/generated/shared/trashy-regular-*.png`
- Create: `concepts/canonical-import/generated/shared/trashy-powered-*.png`
- Create: `concepts/canonical-import/generated/shared/jimothy-regular-*.png`
- Create: `concepts/canonical-import/generated/shared/jimothy-powered-*.png`
- Modify: `tests/canonical-import-readiness.test.mjs`

**Interfaces:**

- Consumes: four approved hero sprite-reference sheets and builder primitives.
- Produces: four review candidate atlases, four contact sheets, exact state recipes, and readiness evidence.

- [ ] **Step 1: Generate coordinate overlays for all four hero sheets**

Run:

```bash
npm run build:canonical-candidates -- --write-grid-overlay trashy-regular-sprite-reference
npm run build:canonical-candidates -- --write-grid-overlay trashy-powered-sprite-reference
npm run build:canonical-candidates -- --write-grid-overlay jimothy-regular-sprite-reference
npm run build:canonical-candidates -- --write-grid-overlay jimothy-powered-sprite-reference
```

Inspect each overlay against the original at native resolution. Record one integer rectangle per visible source pose; exclude titles, row labels, borders, and presentation graphics.

- [ ] **Step 2: Add explicit hero state recipes**

Use 192×192 cells and baseline 176 for regular forms. Use 256×256 cells and baseline 236 for powered forms when the full powered silhouette cannot preserve a four-pixel margin at 192×192. State names must follow the sheet labels while mapping to the canonical vocabulary: `idle`, `walk`, `run`, `jump-start`, `rise`, `fall`, `land`, `skid`, `crouch` when present, `hurt`, `defeat`, `victory`, `glide`, and form-specific attack/special states.

Each frame entry must contain an inspected integer `crop` object (`left`, `top`, `width`, `height`), an inspected logical `anchor` point (`x`, `y`) measured inside that crop, `kind: "body"` or `kind: "effect"`, and an `events` array. The recipe-contract test rejects crops smaller than 8×8, anchors outside the crop, and duplicate destination cells, so only overlay-measured source geometry can pass.

- [ ] **Step 3: Build one hero at a time and resolve unsafe crops explicitly**

Run `--source-id` for each hero. If background removal damages markings, accessories, tails, kite rigging, or expressions, adjust only that recipe's declared background thresholds or mark the affected state in `missingStates` and the asset `blocked`. Do not repaint, substitute, or borrow a frame from another form.

- [ ] **Step 4: Add hero atlas tests**

For every emitted hero cell, assert nonempty alpha, four-pixel safety margins, bottom alignment to its recipe baseline, one invariant cell size per form, no output under `public/assets/`, and state/frame counts matching the recipe. Assert glide cells retain both character and kite components and that regular and powered forms do not share the same output bytes.

- [ ] **Step 5: Perform contact-sheet review**

Inspect all four contact sheets at native scale and 200–400% zoom. Record source-to-candidate observations in readiness notes. Set `candidate_extracted` only for complete clean candidates; use `blocked` for any sheet that cannot produce safe transparency.

- [ ] **Step 6: Verify deterministic hero output**

Run twice and compare hashes:

```bash
npm run build:canonical-candidates
find concepts/canonical-import/generated/shared -name '*trashy*' -o -name '*jimothy*' | sort | xargs sha256sum > /tmp/trash-dash-hero-hashes-1.txt
npm run build:canonical-candidates
find concepts/canonical-import/generated/shared -name '*trashy*' -o -name '*jimothy*' | sort | xargs sha256sum > /tmp/trash-dash-hero-hashes-2.txt
diff -u /tmp/trash-dash-hero-hashes-1.txt /tmp/trash-dash-hero-hashes-2.txt
npm run test:canonical-import
```

Expected: no hash diff and all focused tests pass.

- [ ] **Step 7: Commit hero candidates and recipes**

```bash
git add concepts/canonical-import/extraction-recipes.json concepts/canonical-import/readiness.json concepts/canonical-import/generated/shared tests/canonical-import-readiness.test.mjs
git commit -m "feat: extract canonical hero candidates"
```

---

### Task 5: Author and verify shared item, power-up, splash, and reward recipes

**Files:**

- Modify: `concepts/canonical-import/extraction-recipes.json`
- Modify: `concepts/canonical-import/readiness.json`
- Create: `concepts/canonical-import/generated/shared/collectibles-*.png`
- Create: `concepts/canonical-import/generated/shared/powerups-*.png`
- Create: `concepts/canonical-import/generated/shared/taco-power-splash-*.png`
- Create: `concepts/canonical-import/generated/shared/kite-power-splash-*.png`
- Create: `concepts/canonical-import/generated/shared/dumpster-reward-*.png`
- Modify: `tests/canonical-import-readiness.test.mjs`

**Interfaces:**

- Consumes: five approved shared item/UI/reward sprite-reference sheets.
- Produces: review candidates or explicit blockers for each sheet.

- [ ] **Step 1: Generate and inspect coordinate overlays**

Run `--write-grid-overlay` for the collectible, power-up, two splash, and dumpster source IDs. Confirm exact frame groupings from the labels: ten collectible families, Taco and Kite power-ups, eight ordered splash frames per power-up, and dumpster states `locked`, `locked-pulse`, `unlock`, `active-glow`, and `celebration`.

- [ ] **Step 2: Author explicit shared-object recipes**

Use 128×128 logical-center cells for collectibles and pickup power-ups unless the largest inspected pose requires 192×192 to preserve the four-pixel margin. Use one fixed cell size across all states in each atlas. Use `BOTTOM_CENTER` for the dumpster and a cell large enough for the full celebration envelope. Splash frames use fixed equal cells derived from the eight interior panels; panel numbers, captions, and borders stay outside every crop.

- [ ] **Step 3: Separate effects by ownership**

Mark sparkle, burst, wind, debris, and glow as `effect` only when their timing or bounds are independent. Preserve intended soft alpha for splash/glow effects. Do not force effects into hard binary alpha and do not duplicate the base pickup or dumpster body in effect-only cells.

- [ ] **Step 4: Build and classify each source**

Emit a candidate only when all intended frames are clean. A splash sheet with inseparable baked presentation text or a dumpster frame whose glow cannot be separated safely is marked `blocked`, retaining exact source/crop evidence and no compromised output.

- [ ] **Step 5: Add object-specific tests**

Assert ten collectible state groups, two power-up groups, eight ordered frames for each emitted splash candidate, and dumpster group counts of 4/4/6/6/4 when extraction succeeds. Assert intended soft effects may use partial alpha while body-only pickup frames use the recipe-declared alpha policy.

- [ ] **Step 6: Run deterministic build and focused tests**

Run:

```bash
npm run build:canonical-candidates
npm run test:canonical-import
```

Expected: emitted candidates pass; blocked candidates have nonempty blocker arrays and no derived output paths.

- [ ] **Step 7: Commit shared object candidates**

```bash
git add concepts/canonical-import/extraction-recipes.json concepts/canonical-import/readiness.json concepts/canonical-import/generated/shared tests/canonical-import-readiness.test.mjs
git commit -m "feat: extract canonical shared object candidates"
```

---

### Task 6: Author and verify Level 1 enemy and boss recipes

**Files:**

- Modify: `concepts/canonical-import/extraction-recipes.json`
- Modify: `concepts/canonical-import/readiness.json`
- Create: `concepts/canonical-import/generated/level-01/spider-*.png`
- Create: `concepts/canonical-import/generated/level-01/pigeon-*.png`
- Create: `concepts/canonical-import/generated/level-01/mosquito-*.png`
- Create: `concepts/canonical-import/generated/level-01/opossum-pilfer-*.png`
- Create: `concepts/canonical-import/generated/level-01/snake-*.png`
- Create: `concepts/canonical-import/generated/level-01/boss-trash-dash-*.png`
- Modify: `tests/canonical-import-readiness.test.mjs`

**Interfaces:**

- Consumes: six Level 1 approved sprite-reference sheets and the canonical enemy guide.
- Produces: six review candidates or explicit blockers, with state coverage and effect ownership.

- [ ] **Step 1: Generate coordinate overlays and inventory source-labeled states**

Run `--write-grid-overlay` for all six source IDs. Map actual source labels to the canonical enemy/boss vocabulary. Standard enemies require intentional idle/patrol or flight, telegraph, committed attack, recovery, hit, and defeat coverage where present. The boss requires idle, locomotion, anticipation, charge, roar, slam, ooze spit, jump slam, hit, stunned, get-up, enraged, power slam, defeat, emerge, and retreat coverage where present.

- [ ] **Step 2: Author explicit standard-enemy recipes**

Use 192×192 cells. Ground Spider, Pigeon, Pilfer/Opossum, and Snake with `FEET` and baseline 176. Use `LOGICAL_CENTER` for Mosquito flight. Separate web, venom, dust, impact, and debris cells when effect timing or bounds differ. Preserve one canonical scale per entity across all body states.

- [ ] **Step 3: Author the boss recipe**

Use 256×256 cells and a shared bottom baseline that fits the largest complete non-effect boss pose. Put ooze spit, puddle, slam impact, dust/debris, and warning telegraph into separately identified effect states. Do not include the sheet's title, character-info panel, color guide, frame numbers, or section labels.

- [ ] **Step 4: Build candidates and reject contaminated frames**

Run each source independently. Inspect every attack extreme for clipping and every frame boundary for presentation remnants. If a required state cannot be isolated from its gray/purple backdrop without damaging the silhouette, mark the exact state missing and the candidate blocked.

- [ ] **Step 5: Add Level 1 state, anchor, and effect tests**

Assert grounded baseline stability, Mosquito logical-center stability, fixed entity cell geometry, distinct telegraph/action/recovery order, and no duplicate body in effect-only cells. Assert boss effects may extend beyond body bounds but remain within their own candidate cells.

- [ ] **Step 6: Run deterministic extraction verification**

Run the builder twice, hash `generated/level-01/`, compare hashes, and run `npm run test:canonical-import`. Expected: identical bytes and passing focused tests.

- [ ] **Step 7: Commit Level 1 candidates and recipes**

```bash
git add concepts/canonical-import/extraction-recipes.json concepts/canonical-import/readiness.json concepts/canonical-import/generated/level-01 tests/canonical-import-readiness.test.mjs
git commit -m "feat: extract canonical Level 1 candidates"
```

---

### Task 7: Document the pipeline, record QA evidence, and integrate verification

**Files:**

- Create: `concepts/canonical-import/README.md`
- Create: `docs/superpowers/reports/2026-08-11-canonical-source-readiness-and-atlas-extraction.md`
- Modify: `docs/asset-manifest.md`
- Modify: `docs/visual-audit.md`
- Modify: `package.json`

**Interfaces:**

- Consumes: final readiness states, recipes, output hashes, focused test output, and contact-sheet observations.
- Produces: operator documentation, extraction report, Visual QA boundary, and normal-suite integration.

- [ ] **Step 1: Write the operator README**

Document:

```text
npm run validate:canonical-candidates
npm run build:canonical-candidates
npm run test:canonical-import
```

Explain the immutable source root, explicit crop workflow, coordinate overlays, candidate output boundary, blocker policy, state/anchor conventions, and promotion gate into `public/assets/`.

- [ ] **Step 2: Update the project asset manifest**

Add a `Canonical import review candidates` section stating that `concepts/canonical-import/generated/` is derived review material, is not served by the game, and must not replace current runtime atlases until a separate integration pass completes running-game QA.

- [ ] **Step 3: Write the extraction report**

Report all 32 records by category, every emitted atlas/contact sheet, each blocked source/state and reason, source and output dimensions, alpha policy, anchor/baseline strategy, deterministic hash result, and remaining runtime gaps.

- [ ] **Step 4: Update Visual QA accurately**

Add an entry recording native source inspection, contact-sheet inspection, automated checks, and static source-to-candidate findings. Record runtime routes, animation transitions, collisions, scale, and gameplay rendering as `CANNOT VERIFY` because no runtime consumer changed.

- [ ] **Step 5: Add focused test to the normal suite**

Insert `tests/canonical-import-readiness.test.mjs` into the existing `test` script after `tests/visual-asset-integrity.test.mjs`. Do not alter or remove existing test entries.

- [ ] **Step 6: Run complete verification**

Run:

```bash
npm run validate:skills
npm run validate:canonical-candidates
npm run build:canonical-candidates
npm run test:canonical-import
npm test
npm run lint
git diff --check
```

Expected: all commands exit 0. If unrelated pre-existing changes break a broad command, record the exact failure and prove the focused canonical-import commands still pass.

- [ ] **Step 7: Confirm production boundaries**

Run:

```bash
git status --short
git diff --name-only a0ac709..HEAD | rg '^(app/|public/assets/)'
```

Expected: no task-owned change under `app/` or `public/assets/`. Existing unrelated changes remain identifiable and untouched.

- [ ] **Step 8: Commit documentation and suite integration**

```bash
git add concepts/canonical-import/README.md docs/asset-manifest.md docs/visual-audit.md docs/superpowers/reports/2026-08-11-canonical-source-readiness-and-atlas-extraction.md package.json
git commit -m "docs: record canonical extraction readiness"
```

---

## Completion Evidence

The implementation is complete only when:

1. The validated 177-file import is versioned without modification.
2. The exact 32-file first slice has readiness records with matching approved hashes and dimensions.
3. Every emitted frame has an explicit reviewed crop, state, anchor, and alpha policy.
4. Unsafe sources are blocked instead of approximated.
5. Candidate outputs rebuild byte-for-byte identically.
6. Focused tests, the normal test suite, lint, and skill validation pass or any unrelated baseline failure is isolated with evidence.
7. No gameplay or production asset path is changed.
8. Static QA is reported separately from runtime `CANNOT VERIFY` status.
