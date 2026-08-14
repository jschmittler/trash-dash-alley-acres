# Pit Recovery, Enemy Scale, and Touch Device Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve terminal pit falls visibly, enlarge fox/squirrel/terrier sprites uniformly by 1.5×, and limit the touch deck to touch-capable devices.

**Architecture:** The gameplay state module will make a terminal pit transition immediate instead of retaining an offscreen timed defeat. Enemy draw configuration remains family-owned: Level 1 uses the variety draw-size table and Level 2 uses `LEVEL_TWO_ENEMY_DRAW_GEOMETRY`, with one uniform dimension for each enlarged sprite. Responsive CSS preserves base hidden behavior and moves touch-deck activation exclusively to a `(hover: none) and (pointer: coarse)` media rule.

**Tech Stack:** React 19, TypeScript, CSS, Node.js built-in test runner.

## Global Constraints

- Fox, squirrel, and terrier must use equal width and height scale multipliers with unchanged source rectangles, anchors, collision bounds, patrols, and attack logic.
- Pit falls consume exactly one paw; non-terminal falls respawn at the checkpoint; terminal falls must not retain an offscreen delay.
- Touch controls must remain available on touch devices and unavailable on narrow desktop browsers.
- Run focused non-UI tests and `npm run build` after implementation.
- Do not run automated browser/UI verification until the user reports a completed manual test; after that, perform the specified responsive and gameplay browser checks.

---

### Task 1: Resolve terminal pit falls without an offscreen wait

**Files:**
- Modify: `app/gameplay-animation-state.mjs:67-108`
- Modify: `tests/gameplay-animation-state.test.mjs:111-184`

**Interfaces:**
- Consumes: `resolvePitFall(lives)` and `beginPitFallTransition({ playerY, viewportHeight, lives, defeatAnimation })`.
- Produces: a terminal transition whose `endSequence` and `endTimer` do not preserve the hidden defeat delay.

- [ ] **Step 1: Replace the terminal-pit expectation with the immediate flow contract**

Replace the `actual pit threshold carries Jimothy through defeat's final frame before gameover` test with an assertion that a one-life transition returns this terminal player state:

```js
assert.deepEqual(transition.player, {
  large: false,
  hurtTimer: 0,
  pendingDamage: null,
  attackTimer: 0,
  glider: 0,
  shrinkTimer: 0,
  endSequence: "gameover",
  endTimer: 0,
  animationName: null,
  animationElapsed: 0,
  vx: 0,
  vy: 0,
  grounded: true,
});
assert.equal(transition.duration, 0);
```

- [ ] **Step 2: Run the pit test to verify it fails**

Run: `node --test tests/gameplay-animation-state.test.mjs`

Expected: FAIL because terminal transitions still return `small_defeat` and a non-zero delay.

- [ ] **Step 3: Remove the terminal offscreen delay at its state origin**

Update `presentPitDefeat` so `gameover` receives `animationName: null` and `duration: 0`, then retain `beginPitFallTransition`'s `endSequence: "gameover"` and set its `endTimer` from that zero duration. Do not change `handlePitFall`; the existing next-frame `advanceEndSequence` will move the screen to Game Over.

- [ ] **Step 4: Run the pit test to verify it passes**

Run: `node --test tests/gameplay-animation-state.test.mjs`

Expected: PASS, including the non-terminal checkpoint-respawn contract.

### Task 2: Apply canonical 1.5× enemy presentation scale

**Files:**
- Modify: `app/trash-dash-game.tsx:436-448`
- Modify: `app/level-two-enemies.mjs:24-50`
- Modify: `app/visual-inventory.mjs:232-277`
- Modify: `tests/terrier-animation-integrity.test.mjs:127-135`
- Modify: `tests/level-two-enemies.test.mjs`

**Interfaces:**
- Consumes: `varietyEnemyDrawSizes`, `LEVEL_TWO_ENEMY_DRAW_GEOMETRY`, and `levelTwoEnemyDrawRect`.
- Produces: fox 108×108, squirrel 114×114, and terrier 123×123 runtime destinations with existing anchors and collision boxes.

- [ ] **Step 1: Add failing geometry assertions**

Add focused assertions that inspect exported draw geometry and runtime rectangles:

```js
assert.deepEqual(LEVEL_TWO_ENEMY_DRAW_GEOMETRY.squirrel, { drawWidth: 114, drawHeight: 114, anchor: "ground" });
assert.deepEqual(LEVEL_TWO_ENEMY_DRAW_GEOMETRY.terrier, { drawWidth: 123, drawHeight: 123, anchor: "ground" });
assert.deepEqual(levelTwoEnemyDrawRect({ kind: "terrier", x: 400, y: 426, w: 64, h: 42 }), {
  x: 370.5, y: 351.25, w: 123, h: 123,
});
```

Add a source-contract assertion for the Level 1 renderer that confirms fox uses `[108, 108]` and passes both values to `drawEnemy`.

- [ ] **Step 2: Run focused enemy tests to verify failure**

Run: `node --test tests/level-two-enemies.test.mjs tests/terrier-animation-integrity.test.mjs`

Expected: FAIL because the current Level 2 sizes are 76 and 82, while fox is drawn at 72×72.

- [ ] **Step 3: Change only canonical draw dimensions**

Set `varietyEnemyDrawSizes.fox` to `[108, 108]` and pass its `drawWidth` and `drawHeight` independently to `drawEnemy`. Set squirrel's geometry to 114×114 and terrier's to 123×123. Update visual-inventory's Level 1 fox and Level 2 destination records to the same dimensions. Do not change collision or placement definitions.

- [ ] **Step 4: Run focused enemy tests to verify pass**

Run: `node --test tests/level-two-enemies.test.mjs tests/terrier-animation-integrity.test.mjs tests/visual-inventory.test.mjs`

Expected: PASS with uniform canonical dimensions and unchanged collision contracts.

### Task 3: Restrict the touch deck to touch devices

**Files:**
- Modify: `app/globals.css:780-954`
- Modify: `tests/mobile-experience.test.mjs:190-215`

**Interfaces:**
- Consumes: base `.touch-controls { display: none; }` and device-capability media queries.
- Produces: touch deck display only under `(hover: none) and (pointer: coarse)`.

- [ ] **Step 1: Add a failing media-query contract**

Extend `responsive shell protects browser chrome, safe areas, and touch interaction` with:

```js
assert.doesNotMatch(styles, /@media \(max-width: 760px\) \{[\s\S]*?\.touch-controls \{\s*display: flex;/);
assert.match(styles, /@media \(hover: none\) and \(pointer: coarse\) \{\s*\.touch-controls \{\s*display: flex;/);
```

- [ ] **Step 2: Run the mobile test to verify failure**

Run: `node --test tests/mobile-experience.test.mjs`

Expected: FAIL because the width-based mobile query currently enables the controls.

- [ ] **Step 3: Move activation behind the capability gate**

Remove `display: flex` from the `@media (max-width: 760px)` `.touch-controls` block. Retain its safe-area inset rules. Keep the standalone `(hover: none) and (pointer: coarse)` activation rule as the sole display switch.

- [ ] **Step 4: Run the focused non-UI validation set**

Run: `node --test tests/gameplay-animation-state.test.mjs tests/level-two-enemies.test.mjs tests/terrier-animation-integrity.test.mjs tests/mobile-experience.test.mjs tests/visual-inventory.test.mjs && npm run build`

Expected: all listed suites pass and the production build completes.

- [ ] **Step 5: Wait for manual testing before browser automation**

Tell the user the local build is ready and ask them to test: terminal pit fall, fox/squirrel/terrier scale, desktop no-touch-controls, and touch-device controls. Do not run browser/UI automation until they report the manual result.

- [ ] **Step 6: Run browser visual QA after user approval**

Verify desktop and touch viewports. Capture before/after pit, fox, squirrel, and terrier evidence; confirm all three sprites are grounded and visibly 1.5× larger without distortion; confirm desktop lacks `.touch-controls` and touch shows five controls. Update `docs/visual-audit.md` with the result.

- [ ] **Step 7: Commit the implementation**

```bash
git add app/gameplay-animation-state.mjs app/level-two-enemies.mjs app/globals.css app/trash-dash-game.tsx app/visual-inventory.mjs tests/gameplay-animation-state.test.mjs tests/level-two-enemies.test.mjs tests/terrier-animation-integrity.test.mjs tests/mobile-experience.test.mjs tests/visual-inventory.test.mjs docs/visual-audit.md
git commit -m "fix: recover pits and resize enemy presentation"
```
