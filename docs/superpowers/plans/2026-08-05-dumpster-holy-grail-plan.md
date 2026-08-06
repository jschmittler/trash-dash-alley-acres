# Dumpster Holy-Grail Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current dumpster runtime art with a grounded side-on sealed state and a bright holy-grail reveal state that preserves one stable silhouette and baseline.

**Architecture:** Generate one canonical side-on dumpster body and two effect states, then compose them into a transparent 192px atlas with explicit baseline metadata. A focused dumpster-render module owns state selection, geometry, transition timing, and frame selection; the Canvas renderer consumes that module without inferring dimensions from source pixels.

**Tech Stack:** Image generation for pixel-art source sheets, Sharp/Node asset processing, Python standard-library atlas assembly, Canvas 2D, ESM modules, Node test runner, Next/Vite Pages build.

## Global Constraints

- Use a side-on silhouette with no three-quarter camera angle or perspective shift.
- Keep the body, lid, wheels, trash load, and contact point identical between states.
- Pre-boss sealed state is dark, motionless, and grounded.
- Post-boss holy-grail state restores brightness and uses a slow aura/sparkle loop.
- Use transparent 192×192 cells with explicit baseline metadata; no frame may touch a cell edge.
- The public runtime references only the rebuilt dumpster atlas.
- Do not change level geometry, boss behavior, or player animation systems.

---

### Task 1: Generate the canonical side-on dumpster source art

**Files:**
- Create: `concepts/dumpster/source/dumpster-sealed-key.png`
- Create: `concepts/dumpster/source/dumpster-holy-key.png`
- Create: `concepts/dumpster/dumpster-source-contact-sheet.png`
- Modify: `concepts/dumpster/README.md`
- Modify: `concepts/dumpster/PROMPTS.md`

**Interfaces:**
- `dumpster-sealed-key.png` contains four identical or near-identical side-on sealed frames with the same footprint.
- `dumpster-holy-key.png` contains four side-on holy-grail frames whose body geometry matches the sealed row while aura/sparkles vary.

- [ ] **Step 1: Write the asset acceptance checklist**

Record the exact visual requirements in `PROMPTS.md`: side-on view, 16-bit pixel clusters, dark navy outline, dark sealed palette, stable wheels/contact point, and post-boss golden aura without perspective or scene background.

- [ ] **Step 2: Generate the two source rows**

Use the image-generation workflow to create transparent-ready chroma-key rows at the existing 1774×887 source format, keeping the body footprint locked across all four panels.

- [ ] **Step 3: Inspect the source contact sheet**

Verify that the lid, wheels, trash load, body width, and ground contact remain aligned and that the holy row changes only brightness/effects. Reject any frame with a changed camera angle or floating body before continuing.

- [ ] **Step 4: Commit the approved source assets**

```bash
git add concepts/dumpster/source/dumpster-sealed-key.png concepts/dumpster/source/dumpster-holy-key.png concepts/dumpster/dumpster-source-contact-sheet.png concepts/dumpster/README.md concepts/dumpster/PROMPTS.md
git commit -m "art: create sealed and holy dumpster source rows"
```

### Task 2: Build and validate the new runtime atlas

**Files:**
- Modify: `concepts/dumpster/build-sheets.mjs`
- Modify: `concepts/dumpster/build-atlas.py`
- Create: `concepts/dumpster/dumpster-holy-atlas.png`
- Create: `public/assets/generated/dumpster-holy-atlas.png`
- Create: `tests/dumpster-holy-atlas.test.mjs`
- Modify: `package.json`

**Interfaces:**
- `build-sheets.mjs` outputs normalized `dumpster-sealed.png` and `dumpster-holy.png` rows.
- `build-atlas.py` outputs a 768×384 RGBA atlas with row 0 sealed and row 1 holy.
- Every cell has baseline metadata `183` (bottom pixel index) and no edge clipping.

- [ ] **Step 1: Write failing atlas tests**

Test the 4×2 dimensions, non-empty alpha bounds, edge margins, equal body baselines across rows, and stable body footprint between sealed and holy frames.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `node --test tests/dumpster-holy-atlas.test.mjs`

Expected: FAIL because the new source files and public atlas do not exist.

- [ ] **Step 3: Implement the source-to-atlas compositor**

Key the green background, trim transparent margins, preserve aspect ratio with nearest-neighbor scaling, place the body bottom at pixel 183, and allow holy effects to extend upward without changing the body placement.

- [ ] **Step 4: Generate the private and public atlas**

Run:

```bash
node concepts/dumpster/build-sheets.mjs
python3 concepts/dumpster/build-atlas.py
cp concepts/dumpster/dumpster-holy-atlas.png public/assets/generated/dumpster-holy-atlas.png
```

- [ ] **Step 5: Run focused asset tests**

Run: `node --test tests/dumpster-holy-atlas.test.mjs`

Expected: PASS with every sealed and holy frame grounded and unclipped.

- [ ] **Step 6: Commit**

```bash
git add concepts/dumpster/build-sheets.mjs concepts/dumpster/build-atlas.py concepts/dumpster/dumpster-holy-atlas.png public/assets/generated/dumpster-holy-atlas.png tests/dumpster-holy-atlas.test.mjs package.json
git commit -m "feat: build grounded holy dumpster atlas"
```

### Task 3: Add explicit sealed/holy runtime rendering

**Files:**
- Create or replace: `app/dumpster-render.mjs`
- Modify: `app/trash-dash-game.tsx`
- Create: `tests/dumpster-render-state.test.mjs`

**Interfaces:**
- `DUMPSTER_STATES = { sealed: { row: 0, loop: false }, holy: { row: 1, loop: true } }`.
- `selectDumpsterState(bossDefeated: boolean): "sealed" | "holy"`.
- `dumpsterFrameIndex(elapsed: number, state: "sealed" | "holy"): number`.
- `dumpsterDrawRect(worldX: number, cameraX: number, groundY: number): { x, y, width, height }`.
- `dumpsterRevealProgress(elapsedSinceDefeat: number): number`.

- [ ] **Step 1: Write failing runtime-state tests**

Cover static sealed frame selection, slow holy looping, state selection from boss defeat, geometry preservation, grounded draw rectangle, and an eased reveal progress from 0 to 1.

- [ ] **Step 2: Run focused tests to verify they fail**

Run: `node --test tests/dumpster-render-state.test.mjs`

Expected: FAIL because the new sealed/holy state contract is not implemented.

- [ ] **Step 3: Implement the renderer module**

Use one explicit destination rectangle for both states. Keep sealed frame index 0 at all elapsed times. Advance holy effects slowly and calculate a short crossfade/eased reveal progress without changing x, y, width, or height.

- [ ] **Step 4: Wire the Canvas renderer**

Load `dumpster-holy-atlas.png`, select row 0/1 through the module, draw the body at the ground baseline, and apply palette/effect alpha during the boss-defeat transition. Remove references to the previous dumpster atlas and old animation constants.

- [ ] **Step 5: Run focused runtime tests and existing regressions**

Run: `node --test tests/dumpster-render-state.test.mjs tests/dumpster-holy-atlas.test.mjs tests/boss-transition.test.mjs tests/victory-phase.test.mjs`

Expected: PASS with boss and victory logic unchanged.

- [ ] **Step 6: Commit**

```bash
git add app/dumpster-render.mjs app/trash-dash-game.tsx tests/dumpster-render-state.test.mjs
git commit -m "feat: add sealed and holy dumpster runtime states"
```

### Task 4: Verify runway, reveal, and production artifacts

**Files:**
- Modify: `tests/rendered-html.test.mjs` if the public asset marker changes.
- Modify: `tests/pages-build.test.mjs` if the new asset needs an explicit Pages artifact assertion.

- [ ] **Step 1: Run complete checks**

Run:

```bash
npm test
npm run lint
npm run build:pages
npm run test:pages
git diff --check
```

Expected: all commands exit successfully; only the existing image optimization warning may remain.

- [ ] **Step 2: Run the boss runway debug link**

Open `http://localhost:3003/?bossTest=1`, start a run, and verify the sealed dumpster is dark, static, side-on, and grounded.

- [ ] **Step 3: Run the victory debug link**

Open `http://localhost:3003/?victoryTest=1`, start a run, and verify the same dumpster geometry brightens into a slow golden aura/sparkle reveal.

- [ ] **Step 4: Verify reload behavior**

Reload the victory debug link and confirm the holy state appears immediately without a geometry jump.

- [ ] **Step 5: Commit only concrete verification fixes**

If a defect appears, add a focused regression test, fix it, rerun the complete checks, and commit the narrow fix. Otherwise record the verified local URLs in the handoff.

## Self-review checklist

- The approved B+C visual direction is represented in source assets and runtime states.
- Sealed and holy states share one body silhouette and baseline.
- The source compositor preserves aspect ratio and transparent margins.
- The runtime no longer references older dumpster versions.
- Boss runway and victory reload behavior are explicitly tested.
