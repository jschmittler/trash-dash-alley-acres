# Skunk Scale, Squirrel Registration, and Brutus Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring skunk presentation to the approved scale, eliminate squirrel patrol-to-attack size pops, and make Brutus's intended hydrant-crash vulnerability consistently hittable.

**Architecture:** Level 2's canonical draw geometry remains the sole runtime size owner for skunk. The atlas builder will normalize squirrel throw cells against the locomotion visible envelope before they enter their fixed 114×114 runtime destination. Brutus contact evaluation will distinguish a visible top surface from an actually vulnerable `stunned-open` contact region so closed armor cannot consume a stomp while the open state has a larger, reliable target.

**Tech Stack:** Node.js, Sharp, JavaScript modules, TypeScript, HTML Canvas rendering, Node.js built-in test runner.

## Global Constraints

- Skunk runtime destination is exactly 117×117, fixed aspect, with existing ground anchor and collision geometry.
- Squirrel stays at 114×114 for every state; source-frame normalization preserves the baseline, frame order, and acorn release event.
- Brutus only takes damage while `stunned-open`; closed armor must not consume a valid-looking stomp.
- Do not run automated browser/UI checks until the user completes a manual local test and reports the result.
- After manual approval, perform visual QA and update `docs/visual-audit.md`.

---

### Task 1: Scale skunk through shared Level 2 geometry

**Files:**
- Modify: `app/level-two-enemies.mjs:25-36`
- Modify: `app/visual-inventory.mjs:260-277`
- Modify: `tests/level-two-enemies.test.mjs:52-62`
- Modify: `tests/visual-inventory.test.mjs:64-70`

**Interfaces:**
- Consumes: `LEVEL_TWO_ENEMY_DRAW_GEOMETRY.skunk` and `levelTwoEnemyDrawRect`.
- Produces: a 117×117, ground-anchored skunk draw rectangle with unchanged collision dimensions.

- [ ] **Step 1: Write the failing geometry assertions**

Extend the Level 2 geometry test and inventory test:

```js
assert.deepEqual(LEVEL_TWO_ENEMY_DRAW_GEOMETRY.skunk, { drawWidth: 117, drawHeight: 117, anchor: "ground" });
assert.deepEqual(record("skunk").renderedSize, { w: 117, h: 117 });
```

- [ ] **Step 2: Run the focused tests to verify failure**

Run: `node --test tests/level-two-enemies.test.mjs tests/visual-inventory.test.mjs`

Expected: FAIL because skunk is currently 78×78.

- [ ] **Step 3: Update canonical skunk geometry**

Set skunk's `drawWidth` and `drawHeight` to `117` in both `LEVEL_TWO_ENEMY_RENDER` and `LEVEL_TWO_ENEMY_DRAW_GEOMETRY`. Let `levelTwoEnemyDrawRect` retain the existing shared ground-anchor formula. Update the visual inventory through its geometry import path; do not alter skunk collision data.

- [ ] **Step 4: Re-run the focused tests**

Run: `node --test tests/level-two-enemies.test.mjs tests/visual-inventory.test.mjs`

Expected: PASS.

### Task 2: Normalize squirrel attack source envelopes

**Files:**
- Modify: `concepts/level-two/build-atlases.mjs:17-34, 206-292`
- Modify: `tests/level-two-enemies.test.mjs:440-480`
- Modify: `tests/terrier-animation-integrity.test.mjs:250-290` or a dedicated squirrel integrity test
- Regenerate: `public/assets/generated/level2-enemy-motion.png`
- Regenerate: `concepts/level-two/level2-enemy-motion-contact-sheet.png`

**Interfaces:**
- Consumes: squirrel locomotion source cells (atlas row 0), throw source cells (atlas row 2), and the shared 192px-cell baseline at y=175.
- Produces: squirrel throw cells whose visible primary-body envelope matches the locomotion target while the detached acorn remains separately detectable in release frame 1.

- [ ] **Step 1: Add a failing squirrel envelope audit**

Measure visible alpha bounds for rows 0 and 2 of the generated atlas. Assert every squirrel cell keeps bottom `175`, and that attack primary-body widths are within four pixels of the maximum locomotion primary-body width. Preserve the existing assertion that release frame 1 contains a detached warm-brown acorn component.

- [ ] **Step 2: Run the source audit to verify failure**

Run: `node --test tests/level-two-enemies.test.mjs`

Expected: FAIL because current attack widths reach 158px while locomotion widths top out at 84px.

- [ ] **Step 3: Normalize throw frames in the atlas builder**

In `sourceCells("squirrel")`, measure the maximum primary-body width of locomotion cells before replacing row-2 frames. For each throw frame, use one uniform nearest-neighbor scale factor derived from that locomotion reference width and its own primary-body width, resize the complete frame—including its detached acorn—before shared baseline placement. Keep the output row/frame mapping unchanged.

- [ ] **Step 4: Regenerate and re-run the source audit**

Run: `node concepts/level-two/build-atlases.mjs && node --test tests/level-two-enemies.test.mjs`

Expected: regenerated atlas/contact sheet; all squirrel frames share the normalized body envelope, maintain baseline 175, and retain the release acorn.

### Task 3: Make Brutus's open vulnerability reliable

**Files:**
- Modify: `app/brutus-boss.mjs:80-122`
- Modify: `tests/brutus-boss.test.mjs:50-73`
- Modify: `tests/brutus-atlas.test.mjs:151-182`

**Interfaces:**
- Consumes: `brutusTopHitRegion`, `isBrutusTopHit`, `BRUTUS_TOP_SURFACE_ROWS`, and `state.mode`.
- Produces: `isBrutusTopHit` returns true only for `stunned-open`, using a documented wider open-state contact band; closed armor produces no bounce/damage event.

- [ ] **Step 1: Write failing vulnerability-state tests**

Add assertions that the same downward crossing is rejected in `charge` and `recover`, accepted in both `stunned-open` animation frames, and is accepted at each horizontal edge of the expanded open-state band:

```js
assert.equal(isBrutusTopHit(crossing, boss, region.y - 2, { ...state, mode: "charge" }, 0), false);
assert.equal(isBrutusTopHit(crossing, boss, region.y - 2, { ...state, mode: "stunned-open" }, 0), true);
```

- [ ] **Step 2: Run the Brutus tests to verify failure**

Run: `node --test tests/brutus-boss.test.mjs tests/brutus-atlas.test.mjs`

Expected: FAIL because the current helper accepts contact from closed state art and retains the narrow 60×14 band.

- [ ] **Step 3: Separate visible top data from vulnerable stomp contact**

Keep `brutusTopHitRegion` as the atlas-audited visible-surface helper. Make `isBrutusTopHit` return false unless `state.mode === "stunned-open"`, then derive a wider open-state region from that frame's rendered top: use a 76px centered width and 24px height. Preserve downward-crossing and player-width checks; do not change `updateBrutus` damage gating or phase transitions.

- [ ] **Step 4: Run focused behavior and geometry tests**

Run: `node --test tests/brutus-boss.test.mjs tests/brutus-atlas.test.mjs tests/level-two-boss-lifecycle.test.mjs`

Expected: PASS with closed armor rejecting stomps and every open-state frame accepting the full intended region.

### Task 4: Validate non-UI work and pause for manual test

**Files:**
- Modify: `docs/visual-audit.md` after user-approved browser QA only

- [ ] **Step 1: Run focused non-UI validation and build**

Run: `node --test tests/level-two-enemies.test.mjs tests/visual-inventory.test.mjs tests/brutus-boss.test.mjs tests/brutus-atlas.test.mjs tests/level-two-boss-lifecycle.test.mjs && npm run build`

Expected: all listed tests pass and the production build completes.

- [ ] **Step 2: Request manual local testing**

Ask the user to test skunk scale, squirrel patrol-to-throw transition, and repeated Brutus hydrant-crash/stomp cycles. Do not run automated browser/UI tests until the user reports the result.

- [ ] **Step 3: Perform approved browser visual QA**

After the user's manual test, inspect the skunk, consecutive squirrel patrol/throw frames, and every Brutus `stunned-open` frame at normal and zoomed scales. Confirm ground contact, no squirrel size pop, no source clipping, preserved acorn release, and one valid Brutus hit per opening. Capture evidence and update `docs/visual-audit.md`.

- [ ] **Step 4: Commit the implementation**

```bash
git add concepts/level-two/build-atlases.mjs concepts/level-two/level2-enemy-motion-contact-sheet.png public/assets/generated/level2-enemy-motion.png app/brutus-boss.mjs app/level-two-enemies.mjs app/visual-inventory.mjs tests/level-two-enemies.test.mjs tests/terrier-animation-integrity.test.mjs tests/visual-inventory.test.mjs tests/brutus-boss.test.mjs tests/brutus-atlas.test.mjs docs/visual-audit.md
git commit -m "fix: stabilize enemy scale and Brutus openings"
```
