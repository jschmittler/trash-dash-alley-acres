# Decorative Side-On Asset Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax and are executed task-by-task.

**Goal:** Replace inconsistent decorative props and elevated platform visuals with grounded, side-on, aspect-ratio-safe assets while preserving the current level and gameplay behavior.

**Architecture:** Generate one canonical 3×2 prop source sheet plus separate side-on branch and metal platform tile sources. A compositor will key, trim, normalize, and emit a transparent atlas plus visible-bounds manifest. The Canvas renderer will consume explicit per-prop draw metadata and scalable platform strips instead of inferring geometry from square cells.

**Tech Stack:** Built-in image generation, Sharp/Node asset processing, Python standard-library PNG assembly, Canvas 2D, ESM/TypeScript, Node test runner, Vite Pages build.

## Global Constraints

- Camera is strict side-on orthographic; no three-quarter perspective, top faces, or skewed depth.
- Use polished 16-bit pixel-art-inspired clusters with dark navy outlines.
- Preserve existing world positions, collision rectangles, backgrounds, characters, enemies, dumpster, and game rules.
- Every prop has an explicit visible-contact baseline; transparent atlas padding must not determine placement.
- Preserve each asset’s aspect ratio; only platform middle segments may stretch or repeat horizontally.
- Props remain static; do not add a decorative animation system.

---

### Task 1: Generate canonical side-on decorative source art

**Files:**
- Create: `concepts/decorative/source/decorative-props-key.png`
- Create: `concepts/decorative/source/branch-platform-key.png`
- Create: `concepts/decorative/source/metal-platform-key.png`
- Create: `concepts/decorative/decorative-contact-sheet.png`
- Modify: `concepts/decorative/README.md`
- Modify: `concepts/decorative/PROMPTS.md`

**Interfaces:**
- `decorative-props-key.png`: 3×2 cells in bush/tree/bin/crate/sign/tires order on a flat `#00ff00` key.
- Platform key sheets: left, middle, right segments on a flat key, with a shared top contact edge and no perspective.

- [ ] **Step 1: Record the visual acceptance checklist**

Document side-on orthographic view, palette, outline treatment, baseline, aspect-ratio, and forbidden perspective cues in `PROMPTS.md`.

- [ ] **Step 2: Generate the prop sheet and platform strips**

Use built-in image generation with chroma-key backgrounds. Keep recycle bin/crate faces flat-on, keep bush/tree/tire silhouettes planted, and make branch/metal strips horizontally tileable.

- [ ] **Step 3: Build and inspect a contact sheet**

Place every generated cell on a dark checkerboard review sheet. Reject any cell with a changed camera angle, floating bottom edge, clipped side, or inconsistent outline before compositing.

- [ ] **Step 4: Commit source art**

```bash
git add concepts/decorative
git commit -m "art: create side-on decorative prop sources"
```

### Task 2: Compose atlas and visible-bounds manifest

**Files:**
- Create: `concepts/decorative/build-atlas.py`
- Create: `concepts/decorative/decorative-manifest.mjs`
- Create: `concepts/decorative/decorative-atlas.png`
- Create: `public/assets/generated/decorative-atlas.png`
- Create: `public/assets/generated/branch-platform-strip.png`
- Create: `public/assets/generated/metal-platform-strip.png`
- Create: `tests/decorative-atlas.test.mjs`
- Modify: `package.json`

**Interfaces:**
- `DECORATIVE_PROPS`: frozen metadata keyed by `bush`, `tree`, `bin`, `crate`, `checkpoint`, `tires`; each entry contains `{ frame, sourceWidth, sourceHeight, baseline, shadowOffset }`.
- `platformStrips`: frozen metadata keyed by `branch` and `metal`; each entry contains `{ left, middle, right, height }`.
- Atlas contract: six 256×256 RGBA cells in a 3×2 sheet; no visible pixel touches a cell edge; all prop baselines are measured and stable.

- [ ] **Step 1: Write failing atlas/manifest tests**

Assert atlas dimensions, alpha margins, non-empty cells, baseline metadata, stable prop bounds, and platform strip segment dimensions.

- [ ] **Step 2: Run focused tests and confirm failure**

Run `node --test tests/decorative-atlas.test.mjs`; expect failure because the new atlas and manifest do not exist.

- [ ] **Step 3: Implement chroma-key compositor**

Trim transparent margins, preserve aspect ratio with nearest-neighbor scaling, place each visible bottom at its explicit baseline, and export platform strips without resampling their top edge.

- [ ] **Step 4: Generate private/public artifacts and run focused tests**

Run `python3 concepts/decorative/build-atlas.py`, copy generated files to `public/assets/generated`, then run `node --test tests/decorative-atlas.test.mjs` and expect all assertions to pass.

- [ ] **Step 5: Commit atlas artifacts**

```bash
git add concepts/decorative public/assets/generated/decorative-atlas.png public/assets/generated/branch-platform-strip.png public/assets/generated/metal-platform-strip.png tests/decorative-atlas.test.mjs package.json
git commit -m "feat: add grounded decorative atlas and platform strips"
```

### Task 3: Normalize runtime drawing and scalable platforms

**Files:**
- Create: `app/decorative-render.mjs`
- Modify: `app/trash-dash-game.tsx`
- Create: `tests/decorative-render.test.mjs`

**Interfaces:**
- `decorativeDrawRect(prop, worldX, cameraX, groundY)`: returns an aspect-ratio-preserving `{ x, y, width, height }` rectangle using `DECORATIVE_PROPS`.
- `decorativeShadowRect(prop, drawRect)`: returns the small contact-shadow rectangle.
- `platformStripSegments(kind, x, y, width)`: returns left/middle/right source/destination segments that fill the requested width without gaps.

- [ ] **Step 1: Write failing runtime tests**

Cover crate aspect ratio, baseline alignment for all props, shadow placement, and platform segment coverage for widths smaller and larger than one middle segment.

- [ ] **Step 2: Run focused runtime tests and confirm failure**

Run `node --test tests/decorative-render.test.mjs`; expect missing-module failures.

- [ ] **Step 3: Implement metadata-driven draw helpers**

Use manifest dimensions and baselines to compute draw rectangles. Keep camera subtraction and ground coordinates explicit; never use a square destination rectangle for a non-square prop.

- [ ] **Step 4: Wire the Canvas renderer**

Load `decorative-atlas.png` and both platform strips. Replace `midgroundProps`/`recycleCrates` drawing with metadata-driven props, add subtle shadows, and replace `drawBranchPlatform`/`drawMetalPlatform` with segment rendering. Keep platform collision geometry unchanged.

- [ ] **Step 5: Run focused tests and commit**

Run `node --test tests/decorative-atlas.test.mjs tests/decorative-render.test.mjs tests/boss-transition.test.mjs tests/victory-phase.test.mjs`, then commit:

```bash
git add app/decorative-render.mjs app/trash-dash-game.tsx tests/decorative-render.test.mjs
git commit -m "feat: normalize decorative rendering and scalable platforms"
```

### Task 4: Production verification and visual smoke test

**Files:**
- Modify: `tests/rendered-html.test.mjs`
- Modify: `tests/pages-build.test.mjs`

- [ ] **Step 1: Update asset assertions**

Assert the new atlas, platform strips, and manifest are referenced by the game and copied into the Pages artifact.

- [ ] **Step 2: Run complete checks**

```bash
npm test
npm run lint
npm run build:pages
npm run test:pages
git diff --check
```

- [ ] **Step 3: Smoke-test local decorative placements**

Open `http://localhost:3003/?bossTest=1` and inspect forest props, city props, crates, sign, tires, branch platforms, and metal platforms. Confirm no floating bottoms, squashed crates, clipped ends, or platform gaps.

- [ ] **Step 4: Commit only concrete verification fixes**

If a visual or test defect appears, add a focused regression test, fix the narrow issue, rerun the complete checks, and commit the verification fix. Otherwise record the verified local URL in the handoff.
