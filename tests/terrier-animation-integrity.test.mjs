import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import * as enemies from "../app/level-two-enemies.mjs";

const CELL = 192;
const SOURCE = fileURLToPath(new URL("../concepts/level-two/source/terrier-motion-source.png", import.meta.url));
const ATLAS = fileURLToPath(new URL("../public/assets/generated/level2-enemy-motion.png", import.meta.url));
const GAME_SOURCE = fileURLToPath(new URL("../app/trash-dash-game.tsx", import.meta.url));

async function alphaBoundsByCell(path, rows, columns = 4) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, columns * CELL);
  assert.equal(info.height, rows * CELL);
  const bounds = [];
  for (let row = 0; row < rows; row += 1) {
    bounds[row] = [];
    for (let column = 0; column < columns; column += 1) {
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
      assert.ok(right >= left && bottom >= top, `empty cell ${row}:${column}`);
      bounds[row][column] = {
        left,
        top,
        right,
        bottom,
        width: right - left + 1,
        height: bottom - top + 1,
        centerX: (left + right) / 2,
      };
    }
  }
  return bounds;
}

test("terrier source master is a transparent, registered 4x4 grid of 192px cells", async () => {
  const metadata = await sharp(SOURCE).metadata();
  assert.deepEqual(
    { width: metadata.width, height: metadata.height, channels: metadata.channels },
    { width: CELL * 4, height: CELL * 4, channels: 4 },
  );
  const rows = await alphaBoundsByCell(SOURCE, 4);
  for (const [row, cells] of rows.entries()) {
    for (const [column, bounds] of cells.entries()) {
      assert.equal(bounds.bottom, 175, `source ${row}:${column} foot baseline`);
      assert.ok(Math.abs(bounds.centerX - CELL / 2) <= 1, `source ${row}:${column} bottom-center registration`);
      assert.ok(bounds.left > 0 && bounds.top > 0 && bounds.right < CELL - 1, `source ${row}:${column} safe margin`);
    }
  }
});

test("terrier states own bounded cells and recovery never borrows impact cells", () => {
  const { terrier } = enemies.LEVEL_TWO_ENEMY_ANIMATIONS;
  assert.deepEqual(enemies.TERRIER_STATES, ["sleep", "wake", "charge", "impact", "recover", "defeated"]);
  assert.deepEqual(
    {
      sleep: [terrier.sleep.row, terrier.sleep.startFrame, terrier.sleep.frames],
      wake: [terrier.wake.row, terrier.wake.startFrame, terrier.wake.frames],
      charge: [terrier.charge.row, terrier.charge.startFrame, terrier.charge.frames],
      impact: [terrier.impact.row, terrier.impact.startFrame, terrier.impact.frames],
      recover: [terrier.recover.row, terrier.recover.startFrame, terrier.recover.frames],
      hit: [terrier.hit.row, terrier.hit.startFrame, terrier.hit.frames],
      defeat: [terrier.defeat.row, terrier.defeat.startFrame, terrier.defeat.frames],
    },
    {
      sleep: [6, 0, 1],
      wake: [6, 0, 4],
      charge: [7, 0, 4],
      impact: [8, 0, 2],
      recover: [9, 0, 4],
      hit: [8, 0, 2],
      defeat: [10, 0, 2],
    },
  );
  const impactCells = new Set(Array.from({ length: terrier.impact.frames }, (_, frame) => `${terrier.impact.row}:${terrier.impact.startFrame + frame}`));
  const recoveryCells = Array.from({ length: terrier.recover.frames }, (_, frame) => `${terrier.recover.row}:${terrier.recover.startFrame + frame}`);
  assert.ok(recoveryCells.every((cell) => !impactCells.has(cell)));
});

test("terrier atlas uses one 192px canvas, canonical baseline, and safe body envelope", async () => {
  const rows = await alphaBoundsByCell(ATLAS, 21);
  const measured = [
    [[18, 59, 157, 117], [25, 60, 143, 116], [19, 57, 155, 119], [17, 59, 158, 117]],
    [[21, 96, 150, 80], [19, 40, 155, 136], [26, 53, 141, 123], [26, 74, 140, 102]],
    [[14, 83, 165, 93], [15, 91, 162, 85], [12, 92, 168, 84], [14, 82, 164, 94]],
    [[27, 35, 138, 141], [29, 72, 135, 104], [27, 35, 138, 141], [29, 72, 135, 104]],
    [[29, 72, 135, 104], [36, 38, 120, 138], [17, 65, 158, 111], [14, 83, 165, 93]],
    [[36, 38, 120, 138], [21, 96, 150, 80], [36, 38, 120, 138], [21, 96, 150, 80]],
  ];
  for (let row = 5; row <= 10; row += 1) {
    for (const [column, bounds] of rows[row].entries()) {
      assert.equal(bounds.bottom, 175, `atlas ${row}:${column} foot baseline`);
      assert.ok(Math.abs(bounds.centerX - CELL / 2) <= 1, `atlas ${row}:${column} bottom-center registration`);
      assert.deepEqual(
        [bounds.left, bounds.top, bounds.width, bounds.height],
        measured[row - 5][column],
        `atlas ${row}:${column} measured body envelope`,
      );
    }
  }
});

test("terrier runtime draw geometry is invariant across state and facing", () => {
  assert.equal(typeof enemies.levelTwoEnemyDrawRect, "function");
  const actor = { kind: "terrier", x: 400, y: 426, w: 64, h: 42 };
  const expected = { x: 391, y: 392.8333333333333, w: 82, h: 82 };
  for (const state of enemies.TERRIER_STATES) {
    assert.deepEqual(enemies.levelTwoEnemyDrawRect({ ...actor, behaviorState: state, facing: 1 }), expected);
    assert.deepEqual(enemies.levelTwoEnemyDrawRect({ ...actor, behaviorState: state, facing: -1 }), expected);
  }
});

test("every terrier one-shot is clamped and owns its exact declared duration", () => {
  const { terrier } = enemies.LEVEL_TWO_ENEMY_ANIMATIONS;
  for (const state of [terrier.wake, terrier.impact, terrier.recover, terrier.hit, terrier.defeat]) {
    assert.equal(state.loop, false);
    assert.equal(
      enemies.enemyAnimationFrame(state, 99),
      (state.startFrame ?? 0) + state.frames - 1,
    );
  }
  assert.equal(enemies.TERRIER_SEQUENCE_DURATIONS.wake, terrier.wake.frames / terrier.wake.fps);
  assert.equal(enemies.TERRIER_SEQUENCE_DURATIONS.impact, terrier.impact.frames / terrier.impact.fps);
  assert.equal(enemies.TERRIER_SEQUENCE_DURATIONS.recover, terrier.recover.frames / terrier.recover.fps);
});

test("production damage playback completes hit then defeat without truncating either one-shot", () => {
  for (const kind of ["squirrel", "terrier", "skunk", "moth"]) {
    const hitAnimation = enemies.LEVEL_TWO_ENEMY_ANIMATIONS[kind].hit;
    const defeatAnimation = enemies.LEVEL_TWO_ENEMY_ANIMATIONS[kind].defeat;
    const hitDuration = hitAnimation.frames / hitAnimation.fps;
    const defeatDuration = defeatAnimation.frames / defeatAnimation.fps;
    const epsilon = 1e-6;

    let actor = enemies.beginLevelTwoEnemyHit({
      kind,
      behaviorState: "idle",
      stateElapsed: 99,
      actionTimer: 0,
    });
    assert.equal(actor.visualTimer, hitDuration, `${kind} hit timer`);
    assert.equal(actor.actionTimer, hitDuration + defeatDuration, `${kind} complete reaction budget`);

    actor = enemies.advanceLevelTwoEnemyPlayback(actor, hitDuration - epsilon);
    assert.equal(actor.visualState, "hit", `${kind} holds hit until its exact end`);
    assert.equal(
      enemies.enemyAnimationFrame(hitAnimation, actor.stateElapsed),
      hitAnimation.frames - 1,
      `${kind} reaches the final hit cell`,
    );

    actor = enemies.advanceLevelTwoEnemyPlayback(actor, epsilon);
    assert.equal(actor.visualState, null, `${kind} reveals defeat at the hit boundary`);
    assert.equal(actor.stateElapsed, 0, `${kind} defeat owns a fresh local timer`);
    assert.equal(actor.actionTimer, defeatDuration, `${kind} retains the full defeat duration`);

    actor = enemies.advanceLevelTwoEnemyPlayback(actor, defeatDuration - epsilon);
    assert.ok(actor.actionTimer > 0, `${kind} remains active through the last defeat cell`);
    assert.equal(
      enemies.enemyAnimationFrame(defeatAnimation, actor.stateElapsed),
      defeatAnimation.frames - 1,
      `${kind} reaches the final defeat cell`,
    );

    actor = enemies.advanceLevelTwoEnemyPlayback(actor, epsilon);
    assert.equal(actor.actionTimer, 0, `${kind} completes at the exact authored boundary`);
  }
});

test("skunk spray wake uses the canonical transition owner and resets stale elapsed time", async () => {
  const sleeping = {
    kind: "terrier",
    behaviorState: "sleep",
    actionTimer: 0,
    stateElapsed: 99,
    visualState: null,
  };
  const waking = enemies.beginLevelTwoTerrierWake(sleeping);
  assert.equal(waking.behaviorState, "wake");
  assert.equal(waking.actionTimer, enemies.TERRIER_SEQUENCE_DURATIONS.wake);
  assert.equal(waking.stateElapsed, 0);

  const source = await readFile(GAME_SOURCE, "utf8");
  assert.match(source, /Object\.assign\(other, beginLevelTwoTerrierWake\(other\)\)/);
  assert.doesNotMatch(source, /other\.behaviorState\s*=\s*["']wake["']/);
  assert.doesNotMatch(source, /other\.actionTimer\s*=\s*0\.5/);
});

test("debug renderer distinguishes the 82px destination from terrier collision", async () => {
  const source = await readFile(GAME_SOURCE, "utf8");
  const debugBranch = source.slice(source.indexOf("if (debugVisuals)"));
  assert.match(debugBranch, /const renderBounds = levelTwoEnemyDrawRect\(enemy, x\)/);
  assert.match(debugBranch, /strokeRect\(renderBounds\.x, renderBounds\.y, renderBounds\.w, renderBounds\.h\)/);
  assert.match(debugBranch, /render:\$\{renderBounds\.w\}x\$\{renderBounds\.h\}/);
  assert.match(debugBranch, /collision:\$\{enemy\.w\}x\$\{enemy\.h\}/);
});

test("terrier completes three sleep-wake-charge-impact-recover-charge cycles across both facings", () => {
  const context = { patrolMinX: 200, patrolMaxX: 600, playerInRange: true, playerX: 900 };
  let terrier = { state: "sleep", x: 300, y: 426, w: 64, h: 42, vx: 0, facing: 1, timer: 0 };
  const transitions = [];
  const step = (dt, extra = {}) => {
    const before = terrier.state;
    terrier = enemies.updateTerrier(terrier, { ...context, dt, ...extra });
    if (terrier.state !== before) transitions.push(`${before}->${terrier.state}`);
  };

  step(0.01);
  step(enemies.TERRIER_SEQUENCE_DURATIONS.wake);
  for (let cycle = 0; cycle < 3; cycle += 1) {
    step(2, { obstacleHit: true });
    step(enemies.TERRIER_SEQUENCE_DURATIONS.impact);
    step(enemies.TERRIER_SEQUENCE_DURATIONS.recover);
  }

  assert.deepEqual(transitions, [
    "sleep->wake", "wake->charge",
    "charge->impact", "impact->recover", "recover->charge",
    "charge->impact", "impact->recover", "recover->charge",
    "charge->impact", "impact->recover", "recover->charge",
  ]);
  assert.equal(terrier.state, "charge");
  assert.deepEqual(
    transitions.filter((transition) => transition === "recover->charge").length,
    3,
  );
  assert.equal(terrier.facing, -1);
  assert.equal(Math.sign(terrier.vx), -1);
});
