# Animation State and Sprite Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep every ground enemy visually attached to its surface, stabilize enemy orientation, improve the boss walk and hit reaction, sequence ordinary player damage through a complete hurt animation, and make pit falls immediately consume one paw and respawn or end the run.

**Architecture:** Normalize opaque ground-enemy pixels to a shared build-time atlas baseline while leaving collision bodies unchanged. Extract deterministic animation, facing, and damage transition decisions into one small pure JavaScript module, then let the React canvas game own integration effects such as movement, respawning, sounds, and screen changes.

**Tech Stack:** React 19, TypeScript 5.9, Canvas 2D, JavaScript ES modules, Python 3 with Pillow, Sharp 0.34.5, Node 22 test runner, Vite/Vinext builds.

## Global Constraints

- Preserve current checkpoints, power-up rules, controls, level geometry, number of paws, and flying-enemy sine motion.
- Do not redesign enemy AI, replace collision bodies, add enemies, or rebalance level placement.
- Ground frames must use an eight-source-pixel bottom margin inside each 192×192 atlas cell.
- Flying rows must not be baseline-normalized.
- Facing values must always be `-1` or `1`; zero velocity preserves the existing value.
- Ordinary damage must finish the correct hurt pose before shrink, checkpoint respawn, or game over.
- Pit falls must skip hurt animation, consume exactly one paw, reset to small form, and immediately respawn or end the run.
- Keep `.summer/` and `concepts/` untracked and outside every commit.

---

## File structure

- `scripts/build-sprite-atlases.py`: normalize and validate ground-enemy cells during atlas creation.
- `public/assets/generated/enemy-variety-motion.png`: regenerated deterministic runtime atlas.
- `app/gameplay-animation-state.mjs`: pure enemy-facing, boss-frame, player-hurt, and pit-outcome decisions.
- `app/trash-dash-game.tsx`: integrate explicit state with physics, rendering, sound, checkpoints, and screens.
- `tests/sprite-baseline.test.mjs`: inspect atlas alpha pixels with Sharp.
- `tests/gameplay-animation-state.test.mjs`: unit-test facing, animation, hurt, and pit transitions.
- `tests/rendered-html.test.mjs`: guard runtime integration and removal of velocity-derived rendering.
- `package.json` and `package-lock.json`: make Sharp and the new tests part of the repeatable test setup.

### Task 1: Normalize and validate ground-enemy atlas cells

**Files:**
- Modify: `scripts/build-sprite-atlases.py`
- Modify: `public/assets/generated/enemy-variety-motion.png`
- Create: `tests/sprite-baseline.test.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: four-column, 192×192-cell RGBA sheets after key cleanup and nearest-neighbor scaling.
- Produces: `normalize_frame_baseline(sheet: Image.Image, row: int, column: int, margin: int = 8) -> None` and an atlas whose snake, spider, rat, hedgehog, fox, boar, and frog frames have alpha bounding-box bottom `184` inside their cells.

- [ ] **Step 1: Add Sharp as an explicit test dependency**

Run:

```bash
npm install --save-dev sharp@0.34.5
```

Expected: `package.json` and `package-lock.json` record Sharp as a direct development dependency.

- [ ] **Step 2: Write the failing alpha-baseline test**

Create `tests/sprite-baseline.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";

const CELL = 192;
const GROUND_ROWS = [4, 5, 6, 7, 8, 10, 11];

test("generated ground enemies share the eight-pixel foot baseline", async () => {
  const { data, info } = await sharp(
    new URL("../public/assets/generated/enemy-variety-motion.png", import.meta.url),
  ).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  assert.equal(info.width, CELL * 4);
  assert.equal(info.height, CELL * 12);
  for (const row of GROUND_ROWS) {
    for (let column = 0; column < 4; column += 1) {
      let left = CELL;
      let top = CELL;
      let right = -1;
      let bottom = -1;
      for (let y = 0; y < CELL; y += 1) {
        for (let x = 0; x < CELL; x += 1) {
          const pixel = ((row * CELL + y) * info.width + column * CELL + x) * 4;
          if (data[pixel + 3] === 0) continue;
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
        }
      }
      assert.ok(right >= left && bottom >= top, `empty frame ${row}:${column}`);
      assert.equal(bottom + 1, CELL - 8, `bad baseline ${row}:${column}`);
      assert.ok(left > 0 && top > 0 && right < CELL - 1, `clipped frame ${row}:${column}`);
    }
  }
});
```

- [ ] **Step 3: Verify the test exposes current inconsistent margins**

Run: `node --test tests/sprite-baseline.test.mjs`

Expected: FAIL because the current ground frames do not end at source row 184.

- [ ] **Step 4: Add deterministic normalization to the atlas builder**

Add to `scripts/build-sprite-atlases.py`:

```python
BASELINE_MARGIN = 8


def normalize_frame_baseline(sheet, row, column, margin=BASELINE_MARGIN):
    left = column * CELL
    top = row * CELL
    frame = sheet.crop((left, top, left + CELL, top + CELL))
    bounds = frame.getchannel("A").getbbox()
    if not bounds:
        raise ValueError(f"empty enemy frame at {row}:{column}")
    opaque = frame.crop(bounds)
    target_top = CELL - margin - opaque.height
    if target_top <= 0 or bounds[0] <= 0 or bounds[2] >= CELL:
        raise ValueError(f"enemy frame would clip at {row}:{column}")
    normalized = Image.new("RGBA", (CELL, CELL), (0, 0, 0, 0))
    normalized.alpha_composite(opaque, (bounds[0], target_top))
    sheet.paste(normalized, (left, top))


def normalize_enemy_sheet(sheet, rows):
    for row in rows:
        for column in range(4):
            normalize_frame_baseline(sheet, row, column)
    return sheet
```

Change `build_enemy_atlas()` to process these sheet specifications:

```python
sheet_specs = (
    ("enemies-flying-alpha.png", ()),
    ("enemies-ground-alpha.png", (0, 1, 2, 3)),
    ("enemies-woodland-alpha.png", (0, 2, 3)),
)
rows = []
for name, grounded_rows in sheet_specs:
    source = clean_key_fringe(Image.open(TEMP / name).convert("RGBA"))
    sheet = nearest(source, (CELL * 4, CELL * 4))
    rows.append(normalize_enemy_sheet(sheet, grounded_rows))
```

- [ ] **Step 5: Regenerate twice and compare deterministic output**

Run:

```bash
python3 scripts/build-sprite-atlases.py
cp public/assets/generated/enemy-variety-motion.png /tmp/enemy-variety-motion-first.png
python3 scripts/build-sprite-atlases.py
cmp /tmp/enemy-variety-motion-first.png public/assets/generated/enemy-variety-motion.png
```

Expected: both builds use the confirmed source sheets in `/tmp/trash-dash-sprites`, succeed, and `cmp` exits 0.

- [ ] **Step 6: Run the focused baseline test**

Run: `node --test tests/sprite-baseline.test.mjs`

Expected: PASS for all 28 ground-enemy cells.

- [ ] **Step 7: Add the test to `npm test` and commit**

Add `tests/sprite-baseline.test.mjs` to the existing `node --test` command, then run:

```bash
git add package.json package-lock.json scripts/build-sprite-atlases.py tests/sprite-baseline.test.mjs public/assets/generated/enemy-variety-motion.png
git commit -m "fix: normalize ground enemy sprite baselines"
```

### Task 2: Add explicit enemy facing and boss animation states

**Files:**
- Create: `app/gameplay-animation-state.mjs`
- Create: `tests/gameplay-animation-state.test.mjs`
- Modify: `app/trash-dash-game.tsx`
- Modify: `tests/rendered-html.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: enemy kind, positions, current velocity/facing, animation phase, and hit cooldown.
- Produces: `nextEnemyIntent(input) -> { vx: number, facing: -1 | 1 }`, `bossFrameIndex(phase: number) -> number`, and `bossAnimationState(hitCooldown: number) -> "walking" | "hit"`.

- [ ] **Step 1: Write failing facing and boss tests**

Create `tests/gameplay-animation-state.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";
import { bossAnimationState, bossFrameIndex, nextEnemyIntent } from "../app/gameplay-animation-state.mjs";

test("possum preserves facing inside the chase dead zone", () => {
  assert.deepEqual(nextEnemyIntent({
    kind: "possum", enemyX: 100, originX: 100, playerX: 110, vx: -105, facing: -1,
  }), { vx: -105, facing: -1 });
});

test("possum faces a target outside the dead zone", () => {
  assert.deepEqual(nextEnemyIntent({
    kind: "possum", enemyX: 100, originX: 100, playerX: 140, vx: -105, facing: -1,
  }), { vx: 105, facing: 1 });
});

test("zero velocity preserves explicit facing", () => {
  assert.deepEqual(nextEnemyIntent({
    kind: "slime", enemyX: 100, originX: 100, playerX: 500, vx: 0, facing: -1,
  }), { vx: 0, facing: -1 });
});

test("boss walk ping-pongs and hit cooldown owns its state", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(bossFrameIndex), [0, 1, 2, 3, 2, 1]);
  assert.equal(bossAnimationState(0.4), "hit");
  assert.equal(bossAnimationState(0), "walking");
});
```

- [ ] **Step 2: Verify the new module is absent**

Run: `node --test tests/gameplay-animation-state.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement pure enemy decisions**

Create `app/gameplay-animation-state.mjs`:

```js
export const POSSUM_CHASE_RADIUS = 250;
export const POSSUM_FACING_DEAD_ZONE = 18;
export const BOSS_WALK_FRAMES = [0, 1, 2, 3, 2, 1];

const facingFromVelocity = (vx, fallback) => (Math.abs(vx) >= 1 ? (vx < 0 ? -1 : 1) : fallback);

export function nextEnemyIntent({ kind, enemyX, originX, playerX, vx, facing }) {
  let nextVelocity = vx;
  if (kind === "possum") {
    const distance = playerX - enemyX;
    if (Math.abs(distance) > POSSUM_FACING_DEAD_ZONE && Math.abs(distance) < POSSUM_CHASE_RADIUS) {
      nextVelocity = Math.sign(distance) * 105;
    } else if (Math.abs(distance) >= POSSUM_CHASE_RADIUS && Math.abs(enemyX - originX) > 72) {
      nextVelocity = Math.sign(originX - enemyX) * 55;
    }
  }
  return { vx: nextVelocity, facing: facingFromVelocity(nextVelocity, facing) };
}

export function bossFrameIndex(phase) {
  return BOSS_WALK_FRAMES[Math.floor(phase) % BOSS_WALK_FRAMES.length];
}

export function bossAnimationState(hitCooldown) {
  return hitCooldown > 0 ? "hit" : "walking";
}
```

- [ ] **Step 4: Run the focused tests**

Run: `node --test tests/gameplay-animation-state.test.mjs`

Expected: PASS.

- [ ] **Step 5: Integrate explicit enemy state**

In `app/trash-dash-game.tsx`, import the three helpers, add `facing: 1 | -1` and `animationState: "walking" | "hit"` to `Enemy`, and initialize both in `makeEnemy()`. Replace the possum's direct sign mutation with:

```ts
const intent = nextEnemyIntent({
  kind: enemy.kind,
  enemyX: enemy.x,
  originX: enemy.originX,
  playerX: player.x,
  vx: enemy.vx,
  facing: enemy.facing,
});
enemy.vx = intent.vx;
enemy.facing = intent.facing;
```

After each patrol-boundary reversal, assign `enemy.facing = enemy.vx < 0 ? -1 : 1`. Set boss `animationState` from `bossAnimationState(enemy.hitCooldown)` after cooldown advancement, and set it to `"hit"` immediately in `damageEnemy()`.

- [ ] **Step 6: Render from explicit state**

Replace velocity-derived flipping with `enemy.facing < 0`. While the boss state is `"hit"`, render `sprites.boss[0]`; otherwise render `hazardMotion.boss[bossFrameIndex(enemy.phase)]`. Remove hit-cooldown opacity flashing.

- [ ] **Step 7: Add integration guards and standard-suite coverage**

Update `tests/rendered-html.test.mjs` to require `nextEnemyIntent`, `animationState`, `enemy.facing < 0`, and `sprites.boss[0]`, and to reject `const flip = enemy.vx < 0`. Add `tests/gameplay-animation-state.test.mjs` to `npm test`.

- [ ] **Step 8: Run focused verification and commit**

Run:

```bash
node --test tests/gameplay-animation-state.test.mjs
npm run lint
git add app/gameplay-animation-state.mjs app/trash-dash-game.tsx tests/gameplay-animation-state.test.mjs tests/rendered-html.test.mjs package.json
git commit -m "fix: stabilize enemy animation states"
```

Expected: unit tests and lint pass before commit.

### Task 3: Sequence player hurt outcomes and make pits immediately fatal

**Files:**
- Modify: `app/gameplay-animation-state.mjs`
- Modify: `tests/gameplay-animation-state.test.mjs`
- Modify: `app/trash-dash-game.tsx`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: player form, paw count, invulnerability/hurt state, hit direction, and elapsed time.
- Produces: `beginPlayerHurt(input) -> null | { timer, outcome, vx, vy }`, `advanceHurtTimer(timer, dt) -> { timer, complete }`, and `resolvePitFall(lives) -> { lives, outcome }`.

- [ ] **Step 1: Add failing player-transition tests**

Append imports and cases in `tests/gameplay-animation-state.test.mjs`:

```js
import {
  PLAYER_HURT_DURATION, advanceHurtTimer, beginPlayerHurt, resolvePitFall,
} from "../app/gameplay-animation-state.mjs";

test("ordinary large damage queues shrink without applying it", () => {
  assert.deepEqual(beginPlayerHurt({ large: true, lives: 3, invulnerable: 0, hurtTimer: 0, direction: -1 }), {
    timer: PLAYER_HURT_DURATION, outcome: "shrink", vx: -190, vy: -280,
  });
});

test("small damage queues respawn or game over", () => {
  assert.equal(beginPlayerHurt({ large: false, lives: 3, invulnerable: 0, hurtTimer: 0, direction: 1 }).outcome, "respawn");
  assert.equal(beginPlayerHurt({ large: false, lives: 1, invulnerable: 0, hurtTimer: 0, direction: 1 }).outcome, "gameover");
});

test("hurt and invulnerability block repeat damage", () => {
  assert.equal(beginPlayerHurt({ large: false, lives: 3, invulnerable: 0, hurtTimer: 0.2, direction: 1 }), null);
  assert.equal(beginPlayerHurt({ large: false, lives: 3, invulnerable: 0.2, hurtTimer: 0, direction: 1 }), null);
});

test("hurt resolves only after its timer completes", () => {
  assert.deepEqual(advanceHurtTimer(0.05, 0.1), { timer: 0, complete: true });
  assert.equal(advanceHurtTimer(PLAYER_HURT_DURATION, 0.1).complete, false);
});

test("pit fall consumes exactly one paw immediately", () => {
  assert.deepEqual(resolvePitFall(3), { lives: 2, outcome: "respawn" });
  assert.deepEqual(resolvePitFall(1), { lives: 0, outcome: "gameover" });
});
```

- [ ] **Step 2: Verify the new exports are absent**

Run: `node --test tests/gameplay-animation-state.test.mjs`

Expected: FAIL on the missing player-transition exports.

- [ ] **Step 3: Implement the transition helpers**

Append to `app/gameplay-animation-state.mjs`:

```js
export const PLAYER_HURT_DURATION = 0.48;

export function beginPlayerHurt({ large, lives, invulnerable, hurtTimer, direction }) {
  if (lives <= 0 || invulnerable > 0 || hurtTimer > 0) return null;
  return {
    timer: PLAYER_HURT_DURATION,
    outcome: large ? "shrink" : lives > 1 ? "respawn" : "gameover",
    vx: direction * 190,
    vy: -280,
  };
}

export function advanceHurtTimer(timer, dt) {
  const nextTimer = Math.max(0, timer - dt);
  return { timer: nextTimer, complete: timer > 0 && nextTimer === 0 };
}

export function resolvePitFall(lives) {
  const nextLives = Math.max(0, lives - 1);
  return { lives: nextLives, outcome: nextLives > 0 ? "respawn" : "gameover" };
}
```

- [ ] **Step 4: Run transition tests**

Run: `node --test tests/gameplay-animation-state.test.mjs`

Expected: PASS.

- [ ] **Step 5: Add player state and reset invariants**

Add `hurtTimer: number` and `pendingDamage: "shrink" | "respawn" | "gameover" | null` to `Player`, initialize them in `makeWorld()`, and clear them in `respawn()`. Respawn must also clear velocity, glider, attack timer, boost cooldown, and jump buffer.

- [ ] **Step 6: Queue ordinary damage and resolve it after the pose**

Refactor `hurtPlayer()` to call `beginPlayerHurt()` and copy its timer, outcome, and knockback onto the player without immediately changing form, paws, checkpoint, or screen. Add:

```ts
const finishPlayerHurt = (world: World) => {
  const outcome = world.player.pendingDamage;
  world.player.pendingDamage = null;
  if (outcome === "shrink") {
    transformPlayer(world.player, false);
    world.player.invulnerable = 1.8;
    setMessage(world, "Oof — back to small!", 1.6);
  } else if (outcome === "respawn") {
    world.lives -= 1;
    transformPlayer(world.player, false);
    respawn(world);
  } else if (outcome === "gameover") {
    world.lives = Math.max(0, world.lives - 1);
    changeScreen("gameover");
  }
};
```

- [ ] **Step 7: Advance hurt before player input**

At the start of `update()`, call `advanceHurtTimer()`, copy the new timer, and call `finishPlayerHurt()` once when complete. While `hurtTimer > 0`, suppress direction, jump, boost, and attack inputs but continue gravity, knockback, platform collision, enemies, particles, and camera movement. Repeat enemy contact remains harmless because `beginPlayerHurt()` rejects it.

- [ ] **Step 8: Add a separate immediate pit transition**

Create `handlePitFall(world)` that calls `resolvePitFall()`, assigns the returned paw count, transforms the player to small form, clears hurt/pending state, and immediately respawns or shows game over. Replace the pit threshold's `hurtPlayer(world, 0)` call and return from `update()` immediately after handling the fall.

- [ ] **Step 9: Give hurt rendering first priority**

Before glider, attack, airborne, and walk selection, choose `sprites.largeHurt` or `sprites.smallHurt` whenever `player.hurtTimer > 0`. Render it at full opacity; invulnerability flashing starts after the queued outcome completes.

- [ ] **Step 10: Add integration guards, run checks, and commit**

Require `smallHurt`, `largeHurt`, `pendingDamage`, `advanceHurtTimer`, and `resolvePitFall` in `tests/rendered-html.test.mjs`, and reject a pit-threshold call to `hurtPlayer(world, 0)`. Then run:

```bash
node --test tests/gameplay-animation-state.test.mjs
npm run lint
git add app/gameplay-animation-state.mjs app/trash-dash-game.tsx tests/gameplay-animation-state.test.mjs tests/rendered-html.test.mjs
git commit -m "fix: sequence player hurt and pit outcomes"
```

Expected: unit tests and lint pass before commit.

### Task 4: Run regression builds and browser gameplay validation

**Files:**
- Modify only if verification exposes a scoped defect: `app/trash-dash-game.tsx`, `app/gameplay-animation-state.mjs`, `scripts/build-sprite-atlases.py`, or matching tests.

**Interfaces:**
- Consumes: the normalized atlas and explicit states from Tasks 1–3.
- Produces: two passing production targets and a completed manual gameplay check.

- [ ] **Step 1: Run the complete Sites test suite**

Run: `npm test`

Expected: Vinext production build and all Node tests pass.

- [ ] **Step 2: Run the GitHub Pages build and artifact verification**

Run:

```bash
npm run build:pages
npm run test:pages
```

Expected: Vite creates `dist-pages`, base-aware asset paths are retained, and Pages tests pass.

- [ ] **Step 3: Run final repository checks**

Run:

```bash
npm run lint
git diff --check
git status --short
```

Expected: checks pass; status contains only intentional tracked changes plus `.summer/` and `concepts/`.

- [ ] **Step 4: Playtest sprite grounding and enemy direction**

Run the production preview. Inspect snake, spider, rat, hedgehog, fox, boar, and frog on terrain and raised surfaces. Cross a possum slowly in each direction and observe patrol reversals. Pass condition: visible feet stay on their support, possum orientation does not flicker, and every walking enemy faces its movement direction.

- [ ] **Step 5: Playtest boss and ordinary damage**

Reach the boss, observe two walk cycles, and land a hit. Take ordinary damage once while large and once while small. Pass condition: the walk ping-pongs smoothly, the star-impact pose owns recovery, each hurt pose completes before its outcome, and continued contact during hurt causes no extra damage.

- [ ] **Step 6: Playtest pit outcomes**

Fall into a pit while large, while small with multiple paws, and on the final paw. Pass condition: every fall immediately consumes one paw, resets large form, skips hurt, respawns at the checkpoint when possible, and shows game over on the final paw.

- [ ] **Step 7: Commit scoped playtest corrections only if needed**

If Steps 1–6 expose a defect, correct it with a failing automated test where practical, rerun the affected checks, and commit only the explicit files:

```bash
git add app/trash-dash-game.tsx app/gameplay-animation-state.mjs scripts/build-sprite-atlases.py tests/gameplay-animation-state.test.mjs tests/sprite-baseline.test.mjs tests/rendered-html.test.mjs public/assets/generated/enemy-variety-motion.png
git commit -m "test: complete animation state playtest fixes"
```

If no correction is needed, do not create an empty commit.
