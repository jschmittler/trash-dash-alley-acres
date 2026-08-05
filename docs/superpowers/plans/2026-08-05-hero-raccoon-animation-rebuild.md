# Hero Raccoon Animation Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and integrate complete, aligned small- and large-raccoon animation sets while preserving the existing character design and power hierarchy.

**Architecture:** A deterministic Pillow pipeline isolates existing hero poses, normalizes them into 192 by 192 cells, packs one canonical atlas, and emits contact sheets. A focused manifest and pure selector map gameplay state to atlas frames; the canvas renderer consumes that result without raw crop coordinates or animation-priority logic.

**Tech Stack:** React 19, TypeScript, HTML Canvas 2D, JavaScript ES modules, Node test runner, Sharp 0.34, Python 3 with Pillow, Vinext/Vite.

## Global Constraints

- Preserve the current hero face, scarf, belt, tail markings, palette, outline treatment, and personality.
- Use 192 by 192 transparent atlas cells.
- Keep small form unable to attack or glide; keep tail swipe and glide exclusive to large form.
- Use a five-frame tail swipe with active collision only during sweep and impact.
- Hurt completes before shrink, checkpoint reset, paw loss, or game over; pits remain immediate.
- Do not change enemies, environments, audio, level layout, or mobile controls beyond compatibility with the new player state selector.
- Keep the game runnable after every task.

## File Structure

- Create `app/player-animation.mjs`: canonical manifest, animation-state names, priority selector, frame selection, and active attack-window helpers.
- Create `tests/player-animation.test.mjs`: pure selector and committed-sequence behavior tests.
- Create `tests/player-hero-atlas.test.mjs`: atlas dimensions, required frame counts, margins, baselines, and optical-center tolerances.
- Modify `scripts/build-sprite-atlases.py`: extract and normalize hero poses, build `player-hero-motion.png`, and render contact sheets.
- Create `public/assets/generated/player-hero-motion.png`: canonical runtime atlas.
- Create `public/assets/generated/player-hero-contact-sheet.png`: review artifact for all states.
- Modify `app/trash-dash-game.tsx`: load the new atlas, track animation transition data, use the selector, and align tail-swipe collision to active frames.
- Modify `tests/rendered-html.test.mjs`: guard manifest-based rendering and removal of raw player crops.
- Modify `package.json`: include new animation and atlas tests in `npm test`.

---

### Task 1: Canonical Manifest and Pure State Selector

**Files:**
- Create: `app/player-animation.mjs`
- Create: `tests/player-animation.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `PLAYER_ANIMATIONS`, `selectPlayerAnimation(input)`, `animationFrame(animation, elapsed)`, `isTailSwipeActive(frameIndex)`, and `PLAYER_FORM_STATES`.
- Consumes: plain player-state values only; no canvas, DOM, React, or world mutation.

- [ ] **Step 1: Write the failing selector tests**

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
  PLAYER_ANIMATIONS,
  animationFrame,
  isTailSwipeActive,
  selectPlayerAnimation,
} from "../app/player-animation.mjs";

const base = {
  form: "small",
  defeated: false,
  hurt: false,
  shrinking: false,
  victorious: false,
  attacking: false,
  gliding: false,
  grounded: true,
  landing: false,
  skidding: false,
  vx: 0,
  vy: 0,
};

test("priority chooses committed states before locomotion", () => {
  assert.equal(selectPlayerAnimation({ ...base, vx: 320 }), "small_run");
  assert.equal(selectPlayerAnimation({ ...base, vx: 320, hurt: true }), "small_hurt");
  assert.equal(selectPlayerAnimation({ ...base, defeated: true, hurt: true }), "small_defeat");
});

test("power hierarchy gates large-only actions", () => {
  assert.equal(selectPlayerAnimation({ ...base, attacking: true }), "small_idle");
  assert.equal(selectPlayerAnimation({ ...base, form: "large", attacking: true }), "large_tail_swipe");
  assert.equal(selectPlayerAnimation({ ...base, form: "large", grounded: false, gliding: true }), "large_glide");
});

test("tail swipe owns five frames and two active frames", () => {
  assert.equal(PLAYER_ANIMATIONS.large_tail_swipe.frames, 5);
  assert.deepEqual([0, 1, 2, 3, 4].map(isTailSwipeActive), [false, true, true, false, false]);
});

test("one-shot animations clamp and loops wrap", () => {
  assert.equal(animationFrame(PLAYER_ANIMATIONS.large_tail_swipe, 99), 4);
  assert.equal(animationFrame(PLAYER_ANIMATIONS.small_walk, 99), 99 % 6);
});
```

- [ ] **Step 2: Run the selector tests and verify the missing module failure**

Run: `node --test tests/player-animation.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `app/player-animation.mjs`.

- [ ] **Step 3: Implement the manifest and selector**

```js
export const PLAYER_FORM_STATES = {
  small: ["idle", "walk", "run", "jump", "fall", "land", "hurt", "skid", "defeat", "victory"],
  large: ["idle", "walk", "run", "jump", "fall", "land", "tail_swipe", "hurt", "shrink", "glide", "skid", "victory"],
};

const entry = (row, frames, fps, loop, drawWidth, drawHeight, offsetY = 0) => ({
  row, frames, fps, loop, drawWidth, drawHeight, offsetY,
});

export const PLAYER_ANIMATIONS = {
  small_idle: entry(0, 4, 3, true, 84, 84),
  small_walk: entry(1, 6, 8, true, 84, 84),
  small_run: entry(2, 6, 12, true, 88, 84),
  small_jump: entry(3, 2, 8, false, 86, 88),
  small_fall: entry(4, 2, 8, false, 86, 88),
  small_land: entry(5, 2, 10, false, 88, 82),
  small_hurt: entry(6, 3, 8, false, 96, 84),
  small_skid: entry(7, 3, 10, false, 90, 84),
  small_defeat: entry(8, 4, 6, false, 96, 84),
  small_victory: entry(9, 4, 7, true, 88, 88),
  large_idle: entry(10, 4, 3, true, 110, 110),
  large_walk: entry(11, 6, 8, true, 110, 110),
  large_run: entry(12, 6, 12, true, 116, 110),
  large_jump: entry(13, 2, 8, false, 112, 114),
  large_fall: entry(14, 2, 8, false, 112, 114),
  large_land: entry(15, 2, 10, false, 118, 104),
  large_tail_swipe: entry(16, 5, 14, false, 142, 112),
  large_hurt: entry(17, 3, 8, false, 126, 100),
  large_shrink: entry(18, 4, 10, false, 120, 108),
  large_glide: entry(19, 6, 7, true, 140, 140),
  large_skid: entry(20, 3, 10, false, 120, 108),
  large_victory: entry(21, 4, 7, true, 116, 114),
};

export function selectPlayerAnimation(input) {
  const prefix = input.form === "large" ? "large" : "small";
  if (input.defeated) return "small_defeat";
  if (input.hurt) return `${prefix}_hurt`;
  if (input.shrinking && prefix === "large") return "large_shrink";
  if (input.victorious) return `${prefix}_victory`;
  if (input.attacking && prefix === "large") return "large_tail_swipe";
  if (!input.grounded && input.gliding && prefix === "large") return "large_glide";
  if (!input.grounded) return `${prefix}_${input.vy < 0 ? "jump" : "fall"}`;
  if (input.landing) return `${prefix}_land`;
  if (input.skidding) return `${prefix}_skid`;
  if (Math.abs(input.vx) >= 250) return `${prefix}_run`;
  if (Math.abs(input.vx) >= 22) return `${prefix}_walk`;
  return `${prefix}_idle`;
}

export function animationFrame(animation, elapsed) {
  const raw = Math.floor(elapsed * animation.fps);
  return animation.loop ? raw % animation.frames : Math.min(animation.frames - 1, raw);
}

export const isTailSwipeActive = frameIndex => frameIndex === 1 || frameIndex === 2;
```

- [ ] **Step 4: Run the selector tests and add them to the full suite**

Run: `node --test tests/player-animation.test.mjs`

Expected: 4 tests pass.

Modify `package.json` so `npm test` includes `tests/player-animation.test.mjs`.

- [ ] **Step 5: Commit the selector**

```bash
git add app/player-animation.mjs tests/player-animation.test.mjs package.json
git commit -m "feat: define canonical hero animation states"
```

---

### Task 2: Deterministic Hero Atlas and Contact Sheet

**Files:**
- Modify: `scripts/build-sprite-atlases.py`
- Create: `public/assets/generated/player-hero-motion.png`
- Create: `public/assets/generated/player-hero-contact-sheet.png`
- Create: `tests/player-hero-atlas.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `public/assets/player-motion.png`, `public/assets/glider-motion.png`, `public/assets/raccoon-sprites.png`, and `PLAYER_ANIMATIONS` row/frame declarations.
- Produces: a 1152 by 4224 atlas containing 22 rows of six 192-cell columns; unused cells remain transparent.

- [ ] **Step 1: Write failing atlas validation tests**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { PLAYER_ANIMATIONS } from "../app/player-animation.mjs";

const CELL = 192;

test("canonical hero atlas matches manifest dimensions and margins", async () => {
  const file = fileURLToPath(new URL("../public/assets/generated/player-hero-motion.png", import.meta.url));
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, CELL * 6);
  assert.equal(info.height, CELL * 22);

  for (const [state, animation] of Object.entries(PLAYER_ANIMATIONS)) {
    for (let column = 0; column < animation.frames; column += 1) {
      let left = CELL;
      let right = -1;
      let bottom = -1;
      for (let y = 0; y < CELL; y += 1) {
        for (let x = 0; x < CELL; x += 1) {
          const alpha = data[((animation.row * CELL + y) * info.width + column * CELL + x) * 4 + 3];
          if (!alpha) continue;
          left = Math.min(left, x);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
        }
      }
      assert.ok(right >= left, `${state}:${column} is empty`);
      assert.ok(left > 0 && right < CELL - 1 && bottom < CELL - 1, `${state}:${column} clips a cell edge`);
    }
  }
});
```

- [ ] **Step 2: Run the atlas test and verify it fails because the atlas is absent**

Run: `node --test tests/player-hero-atlas.test.mjs`

Expected: FAIL with an input-file error for `player-hero-motion.png`.

- [ ] **Step 3: Extend the Pillow pipeline with hero-frame recipes**

Add `build_player_hero_atlas()` to `scripts/build-sprite-atlases.py`. Use these deterministic sources:

- Small and large idle/walk/run frames: normalized cells from `player-motion.png`; use `[0, 1, 0, 5]` for idle, all six frames for walk, and `[0, 2, 4, 1, 3, 5]` with a two-pixel forward lean for run.
- Jump/fall/land/skid: isolate the existing named raw poses near `smallJump`, `smallFall`, `smallRoll`, `largeJump`, and `largeFall`; create two- or three-frame sequences through controlled nearest-neighbor offsets and rotations of at most two degrees.
- Hurt, defeat, victory, and shrink: isolate complete connected poses from the first four hero rows of `raccoon-sprites.png`; use alpha-component masks so adjacent artwork never enters a frame.
- Tail swipe: isolate five complete large-form poses from the large action row, retain the visible sweep effect only on frames 1 and 2, and place all five around one optical center.
- Glide: normalize all six 256-cell frames from `glider-motion.png` into 192-cell rows without changing pose order.

The builder must place grounded states at `CELL - 8`, place airborne states around a stable optical center, save the atlas with `optimize=True`, and create a labeled contact sheet showing every populated row.

- [ ] **Step 4: Generate twice and prove determinism**

Run:

```bash
PYTHONPATH=/tmp/trash-dash-python-deps python3 scripts/build-sprite-atlases.py
cp public/assets/generated/player-hero-motion.png /tmp/player-hero-motion-first.png
PYTHONPATH=/tmp/trash-dash-python-deps python3 scripts/build-sprite-atlases.py
cmp /tmp/player-hero-motion-first.png public/assets/generated/player-hero-motion.png
```

Expected: `cmp` exits 0.

- [ ] **Step 5: Run the asset validation and inspect the contact sheet**

Run: `node --test tests/player-hero-atlas.test.mjs`

Expected: all populated manifest cells pass dimension, margin, and non-empty checks. Open `public/assets/generated/player-hero-contact-sheet.png` and confirm consistent small/large silhouettes, grounded baselines, and no cross-frame fragments.

- [ ] **Step 6: Add the atlas test to the full suite and commit**

```bash
git add scripts/build-sprite-atlases.py public/assets/generated/player-hero-motion.png public/assets/generated/player-hero-contact-sheet.png tests/player-hero-atlas.test.mjs package.json
git commit -m "feat: build canonical hero sprite atlas"
```

---

### Task 3: Locomotion and Air-State Integration

**Files:**
- Modify: `app/trash-dash-game.tsx`
- Modify: `tests/rendered-html.test.mjs`
- Modify: `tests/player-animation.test.mjs`

**Interfaces:**
- Consumes: `PLAYER_ANIMATIONS`, `selectPlayerAnimation()`, and `animationFrame()` from Task 1; `player-hero-motion.png` from Task 2.
- Produces: explicit `animationName`, `animationElapsed`, `landingTimer`, `airtime`, and `skidTimer` player fields plus manifest-driven canvas rendering.

- [ ] **Step 1: Add failing integration guards**

Add assertions to `tests/rendered-html.test.mjs`:

```js
assert.match(game, /player-hero-motion\.png/);
assert.match(game, /selectPlayerAnimation/);
assert.match(game, /PLAYER_ANIMATIONS/);
assert.match(game, /animationFrame/);
assert.doesNotMatch(game, /const groundedFrames = player\.large \? playerMotion\.large/);
assert.doesNotMatch(game, /sprites\.(?:smallJump|smallFall|largeJump|largeFall)/);
```

- [ ] **Step 2: Run the integration test and verify the new assertions fail**

Run: `node --test tests/rendered-html.test.mjs`

Expected: FAIL because the canonical atlas and selector are not loaded by the component.

- [ ] **Step 3: Add animation transition fields and update them from physics state**

Add to `Player` and `makeWorld()`:

```ts
animationName: string;
animationElapsed: number;
landingTimer: number;
airtime: number;
skidTimer: number;
```

Track prior grounded state and horizontal intent. Set `landingTimer = 0.18` only when airtime exceeded `0.16`. Set `skidTimer = 0.20` when grounded, horizontal intent opposes facing, and `Math.abs(player.vx) >= 180`. Reset `animationElapsed` whenever `selectPlayerAnimation()` returns a different name; otherwise add `dt`.

- [ ] **Step 4: Load and render the canonical atlas**

Load `assets/generated/player-hero-motion.png` into `playerHeroMotionRef`. Replace the current player frame-selection block with:

```ts
const animation = PLAYER_ANIMATIONS[player.animationName];
const frameIndex = animationFrame(animation, player.animationElapsed);
const frame: Frame = [frameIndex * MOTION_CELL, animation.row * MOTION_CELL, MOTION_CELL, MOTION_CELL];
drawSprite(
  frame,
  playerX + player.w / 2 - animation.drawWidth / 2,
  player.y + player.h - animation.drawHeight + animation.offsetY,
  animation.drawWidth,
  animation.drawHeight,
  player.facing < 0,
  player.hurtTimer <= 0 && player.invulnerable > 0 && Math.floor(player.invulnerable * 18) % 2 ? 0.45 : 1,
  playerHeroMotionRef.current,
);
```

- [ ] **Step 5: Run focused and full tests**

Run:

```bash
node --test tests/player-animation.test.mjs tests/rendered-html.test.mjs
npm test
```

Expected: all tests pass and the production build completes.

- [ ] **Step 6: Commit locomotion integration**

```bash
git add app/trash-dash-game.tsx tests/player-animation.test.mjs tests/rendered-html.test.mjs
git commit -m "feat: drive hero locomotion from animation manifest"
```

---

### Task 4: Committed Tail-Swipe, Hurt, Shrink, Victory, and Defeat Sequences

**Files:**
- Modify: `app/trash-dash-game.tsx`
- Modify: `app/player-animation.mjs`
- Modify: `tests/player-animation.test.mjs`
- Modify: `tests/gameplay-animation-state.test.mjs`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: manifest frame index and `isTailSwipeActive()`.
- Produces: frame-aligned attack collision and completed committed visual sequences before gameplay outcomes.

- [ ] **Step 1: Write failing committed-sequence tests**

Add tests showing:

```js
test("tail swipe collision is inactive during wind-up and recovery", () => {
  assert.deepEqual([0, 1, 2, 3, 4].filter(isTailSwipeActive), [1, 2]);
});

test("large hurt selects shrink only after hurt completes", () => {
  assert.equal(selectPlayerAnimation({ ...base, form: "large", hurt: true, shrinking: true }), "large_hurt");
  assert.equal(selectPlayerAnimation({ ...base, form: "large", hurt: false, shrinking: true }), "large_shrink");
});
```

Add integration guards requiring `isTailSwipeActive(frameIndex)` inside enemy collision and forbidding `player.attackTimer > 0.08` as the attack-hit condition.

- [ ] **Step 2: Run focused tests and verify the collision guard fails**

Run: `node --test tests/player-animation.test.mjs tests/rendered-html.test.mjs`

Expected: selector tests pass after Task 1; rendered integration fails until collision uses the manifest frame.

- [ ] **Step 3: Align attack input, rendering, and collision**

Keep the existing 0.32-second committed attack duration. Store the current animation frame index after state selection. Replace the timer-threshold collision condition with:

```ts
const attackAnimation = PLAYER_ANIMATIONS.large_tail_swipe;
const attackFrame = animationFrame(attackAnimation, player.animationElapsed);
if (player.animationName === "large_tail_swipe" && isTailSwipeActive(attackFrame)) {
  // retain the existing directional attack rectangle and attackId de-duplication
}
```

Input during the sequence is ignored until `attackTimer` reaches zero.

- [ ] **Step 4: Complete hurt, shrink, victory, and defeat timing**

Keep `hurtTimer` as the committed three-frame damage window. Add `shrinkTimer = 0.40`, set it after large hurt finishes, and apply `player.large = false` only when shrink completes. Select victory when the existing win condition triggers and delay the result overlay by the four-frame victory duration. Select small defeat before the game-over overlay when the final paw is lost. Continue routing pit falls through immediate paw loss and checkpoint/game-over handling without hurt or shrink.

- [ ] **Step 5: Run state, gameplay, integration, and full tests**

Run:

```bash
node --test tests/player-animation.test.mjs tests/gameplay-animation-state.test.mjs tests/rendered-html.test.mjs
npm test
```

Expected: all tests pass; ordinary damage remains delayed until the animation completes; pits remain immediate.

- [ ] **Step 6: Commit committed sequences**

```bash
git add app/trash-dash-game.tsx app/player-animation.mjs tests/player-animation.test.mjs tests/gameplay-animation-state.test.mjs tests/rendered-html.test.mjs
git commit -m "feat: complete hero action and reaction sequences"
```

---

### Task 5: Production Verification and Local Browser Playtest

**Files:**
- Modify only if verification exposes a defect in the approved scope.

**Interfaces:**
- Consumes: completed atlas, manifest, selector, and gameplay integration.
- Produces: a clean local preview at `http://localhost:3002/` and evidence for every automated gate.

- [ ] **Step 1: Run every automated gate from a clean invocation**

Run:

```bash
npm test
npm run lint
npm run build:pages
npm run test:pages
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 2: Start or refresh the local preview**

Run: `npm run dev -- --port 3002`

Expected: local URL `http://localhost:3002/` loads the title screen and the browser console contains no errors.

- [ ] **Step 3: Walk the visual golden path**

Play through small idle/walk/run/jump/fall/land/skid, collect the taco, repeat large locomotion, perform five tail swipes including rapid input, glide, take ordinary damage and observe hurt then shrink, fall into a pit, reach the boss, land a tail swipe, and finish the level. Confirm no state changes sprite scale, baseline, or optical center unexpectedly.

- [ ] **Step 4: Probe relevant edges**

Repeat direction changes near walk/run thresholds, attack while moving and immediately after landing, take damage during attack recovery, and hold jump while transitioning into glide. Confirm committed states are not restarted and all frames remain inside their cells.

- [ ] **Step 5: Inspect runtime logs and preserve the local server**

Read browser warnings and errors after the walkthrough. Leave the local server running for user testing. If a defect is found, add a focused failing regression test before changing implementation.

- [ ] **Step 6: Commit any verification-only corrections**

If no correction is required, do not create an empty commit. Otherwise stage only the focused correction and its regression test, then commit with `fix: polish canonical hero animations`.
