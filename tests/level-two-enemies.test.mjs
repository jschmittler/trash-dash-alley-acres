import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { LEVEL_TWO } from "../app/level-two.mjs";
import {
  ATTACK_TELL_MIN,
  ATTACK_TELL_MAX,
  ATTACK_TELLS,
  advanceLevelTwoEnemyPlayback,
  applyLevelTwoBehaviorTransition,
  beginLevelTwoEnemyHit,
  enemyAnimationFrame,
  facingFromVelocity,
  LEVEL_TWO_ENEMY_ANIMATIONS,
  LEVEL_TWO_ENEMY_COLLISION,
  levelTwoEnemyAnimation,
  levelTwoEnemyCanContactDamage,
  levelTwoEnemyCanReceiveAttack,
  MOTH_STATES,
  reflectBinLidFromTail,
  selectChargeObstacle,
  SKUNK_STATES,
  SQUIRREL_THROW,
  SQUIRREL_STATES,
  squirrelThrowAttachment,
  TERRIER_STATES,
  selectEncounterTestRoute,
  updateBinLid,
  updateMoth,
  updateLevelTwoEnemy,
  updateSkunk,
  updateSquirrel,
  updateTerrier,
} from "../app/level-two-enemies.mjs";

test("exports the authored state sets", () => {
  assert.deepEqual(SQUIRREL_STATES, [
    "idle", "throw-anticipation", "throw-release", "throw-follow-through", "throw-recover", "defeated",
  ]);
  assert.deepEqual(TERRIER_STATES, ["sleep", "wake", "charge", "impact", "recover", "defeated"]);
  assert.deepEqual(SKUNK_STATES, ["patrol", "telegraph", "spray", "recover", "defeated"]);
  assert.deepEqual(MOTH_STATES, ["orbit", "telegraph", "dive", "climb", "defeated"]);
});

test("every authored attack tell stays within the readability contract", () => {
  for (const duration of Object.values(ATTACK_TELLS)) {
    assert.ok(duration >= ATTACK_TELL_MIN && duration <= ATTACK_TELL_MAX);
  }
});

test("tail swipe reflects a squirrel lid once", () => {
  const lid = { vx: -140, reflected: false, ownerId: "s1" };
  assert.deepEqual(updateBinLid(lid, { tailSwipeHit: true }), {
    vx: 190, reflected: true, ownerId: "s1",
  });
  assert.deepEqual(
    updateBinLid({ vx: 190, reflected: true, ownerId: "s1" }, { tailSwipeHit: true }),
    { vx: 190, reflected: true, ownerId: "s1" },
  );
});

test("runtime reflection applies direction only on the false-to-true transition", () => {
  const first = reflectBinLidFromTail(
    { vx: -140, reflected: false, ownerId: "s1" },
    { tailSwipeHit: true, playerFacing: 1 },
  );
  assert.deepEqual(first, { vx: 190, reflected: true, ownerId: "s1" });
  assert.deepEqual(
    reflectBinLidFromTail(first, { tailSwipeHit: true, playerFacing: -1 }),
    first,
  );
});

test("squirrel uses anticipation, one release, follow-through, and recovery", () => {
  const telegraph = updateSquirrel({ state: "idle", timer: 0 }, {
    dt: 0.1, playerInRange: true, defeated: false,
  });
  assert.equal(telegraph.state, "throw-anticipation");
  assert.ok(telegraph.timer >= ATTACK_TELL_MIN);
  const release = updateSquirrel({ ...telegraph, timer: 0.01 }, {
    dt: 0.02, playerInRange: true, defeated: false,
  });
  assert.equal(release.state, "throw-release");
  assert.equal(release.spawnAcorn, true);
  const heldRelease = updateSquirrel({ ...release, timer: SQUIRREL_THROW.release }, {
    dt: 0.01, playerInRange: true, defeated: false,
  });
  assert.equal(heldRelease.spawnAcorn, false);
  const follow = updateSquirrel({ ...heldRelease, timer: 0.01 }, {
    dt: 0.02, playerInRange: true, defeated: false,
  });
  assert.equal(follow.state, "throw-follow-through");
  const recover = updateSquirrel({ ...follow, timer: 0.01 }, {
    dt: 0.02, playerInRange: true, defeated: false,
  });
  assert.equal(recover.state, "throw-recover");
  const idle = updateSquirrel({ ...recover, timer: 0.01, facing: 1 }, {
    dt: 0.02, playerInRange: false, defeated: false,
  });
  assert.equal(idle.state, "idle");
});

test("acorn release attachment mirrors from the throwing paw without changing projectile balance", () => {
  const squirrel = { x: 800, y: 296, w: 50, h: 36 };
  const right = squirrelThrowAttachment(squirrel, 1);
  const left = squirrelThrowAttachment(squirrel, -1);
  assert.equal(right.y, left.y);
  assert.equal(right.x + left.x, (squirrel.x + squirrel.w / 2) * 2);
  assert.deepEqual(SQUIRREL_THROW.projectile, { w: 28, h: 10, speed: 140 });
  assert.ok(right.x > squirrel.x + squirrel.w);
});

test("terrier stops at its surface edge and enters impact recovery", () => {
  const next = updateTerrier({ state: "charge", x: 590, vx: 420 }, {
    dt: 0.1, patrolMinX: 200, patrolMaxX: 600, obstacleHit: true,
  });
  assert.equal(next.x, 600);
  assert.equal(next.state, "impact");
  assert.equal(next.vx, 0);
});

test("terrier charge remains committed before an edge or obstacle", () => {
  const next = updateTerrier({ state: "charge", x: 300, vx: 420, facing: 1 }, {
    dt: 0.1, patrolMinX: 200, patrolMaxX: 600, obstacleHit: false,
    playerX: 50,
  });
  assert.equal(next.state, "charge");
  assert.equal(next.x, 342);
  assert.equal(next.facing, 1);
});

test("terrier resolves its full authored width to the obstacle contact edge", () => {
  const obstacle = selectEncounterTestRoute(LEVEL_TWO, "terrier").environment.find(
    ({ kind }) => kind === "residential-trash-can",
  );
  assert.ok(obstacle);
  const [width, height] = LEVEL_TWO_ENEMY_COLLISION.terrier;
  const terrier = { state: "charge", x: 1670, y: 468 - height, w: width, h: height, vx: 420, facing: 1 };
  assert.equal(selectChargeObstacle(terrier, [obstacle], 0.1), obstacle);
  const next = updateTerrier(terrier, {
    dt: 0.1, patrolMinX: 1420, patrolMaxX: 2480, obstacle,
  });
  assert.equal(next.x, obstacle.x - terrier.w);
  assert.equal(next.x + terrier.w, obstacle.x);
  assert.equal(next.state, "impact");
});

test("vulnerable recovery windows disable contact but still receive attacks", () => {
  assert.equal(levelTwoEnemyCanContactDamage("terrier", "impact"), false);
  assert.equal(levelTwoEnemyCanContactDamage("terrier", "recover"), false);
  assert.equal(levelTwoEnemyCanContactDamage("moth", "climb"), false);
  assert.equal(levelTwoEnemyCanContactDamage("terrier", "charge"), true);
  assert.equal(levelTwoEnemyCanReceiveAttack("terrier", "impact"), true);
  assert.equal(levelTwoEnemyCanReceiveAttack("terrier", "recover"), true);
  assert.equal(levelTwoEnemyCanReceiveAttack("moth", "climb"), true);
});

test("skunk telegraphs before a short authored spray", () => {
  const telegraph = updateSkunk({ state: "patrol", timer: 0, x: 320, vx: 42 }, {
    dt: 0.1, playerInRange: true, patrolMinX: 200, patrolMaxX: 600,
  });
  assert.equal(telegraph.state, "telegraph");
  assert.ok(telegraph.timer >= ATTACK_TELL_MIN);
  const spraying = updateSkunk({ ...telegraph, timer: 0.01 }, {
    dt: 0.02, playerInRange: true, patrolMinX: 200, patrolMaxX: 600,
  });
  assert.equal(spraying.state, "spray");
  assert.equal(spraying.sprayActive, true);
});

test("moth returns to its authored light after a dive", () => {
  const next = updateMoth({ state: "climb", x: 800, y: 250 }, {
    dt: 1, lightX: 800, flightY: 180,
  });
  assert.equal(next.state, "orbit");
  assert.equal(next.x, 800);
  assert.equal(next.y, 180);
});

test("moth orbit stays inside its authored light band", () => {
  const next = updateMoth({ state: "orbit", x: 800, y: 180, phase: 0 }, {
    dt: 1, lightX: 800, flightY: 180, bandMinX: 760, bandMaxX: 840,
    bandMinY: 150, bandMaxY: 210, playerInRange: false,
  });
  assert.ok(next.x >= 760 && next.x <= 840);
  assert.ok(next.y >= 150 && next.y <= 210);
});

test("moth clamps its full visible silhouette and reports committed motion", () => {
  const flightBand = { startX: 760, endX: 900, minY: 150, maxY: 280 };
  const diving = updateMoth({
    state: "dive", x: 800, y: 190, w: 50, h: 34, vx: 150, vy: 240, timer: 0.5,
  }, {
    dt: 1, lightX: 800, flightY: 180, flightBand, playerX: 900, playerY: 500,
  });
  assert.ok(diving.x >= flightBand.startX);
  assert.ok(diving.x + 50 <= flightBand.endX);
  assert.ok(diving.y >= flightBand.minY);
  assert.ok(diving.y + 34 <= flightBand.maxY);
  assert.ok(diving.x - 17 >= flightBand.startX);
  assert.ok(diving.x + 50 + 17 <= flightBand.endX);
  assert.ok(diving.y - 24 >= flightBand.minY);
  assert.ok(diving.y + 34 + 24 <= flightBand.maxY);

  const orbiting = updateMoth({ state: "orbit", x: 800, y: 180, w: 50, h: 34, phase: 0 }, {
    dt: 0.1, lightX: 800, flightY: 180, flightBand, playerInRange: false,
  });
  assert.equal(orbiting.vx, (orbiting.x - 800) / 0.1);
  const climbing = updateMoth({ state: "climb", x: 760, y: 220, w: 50, h: 34 }, {
    dt: 0.1, lightX: 800, flightY: 180, flightBand,
  });
  assert.equal(climbing.vx, (climbing.x - 760) / 0.1);
  assert.equal(facingFromVelocity(climbing.vx, -1), 1);
  assert.equal(facingFromVelocity(5, -1), -1);
});

test("authored animation playback exposes key frames and clamps one-shots", () => {
  for (const [kind, animations] of Object.entries(LEVEL_TWO_ENEMY_ANIMATIONS)) {
    assert.equal(animations.locomotion.frames, 4, `${kind} locomotion`);
    assert.equal(animations.telegraph.frames, 4, `${kind} telegraph`);
    assert.equal(animations.attack.frames, 4, `${kind} attack`);
    assert.equal(animations.hit.frames, 2, `${kind} hit`);
    assert.equal(animations.telegraph.loop, false);
    assert.equal(animations.hit.loop, false);
    assert.equal(enemyAnimationFrame(animations.telegraph, 0), 0);
    assert.equal(enemyAnimationFrame(animations.telegraph, 99), 3);
  }
  assert.equal(enemyAnimationFrame(LEVEL_TWO_ENEMY_ANIMATIONS.squirrel.attack, 0.16), 3);
  assert.equal(enemyAnimationFrame(levelTwoEnemyAnimation("squirrel", "throw-anticipation"), 99), 0);
  assert.equal(enemyAnimationFrame(levelTwoEnemyAnimation("squirrel", "throw-release"), 99), 1);
  assert.equal(enemyAnimationFrame(levelTwoEnemyAnimation("squirrel", "throw-follow-through"), 99), 2);
  assert.equal(enemyAnimationFrame(levelTwoEnemyAnimation("squirrel", "throw-recover"), 99), 3);
  assert.equal(enemyAnimationFrame(LEVEL_TWO_ENEMY_ANIMATIONS.skunk.attack, 0.26), 3);
  assert.equal(enemyAnimationFrame(LEVEL_TWO_ENEMY_ANIMATIONS.terrier.sleep, 99), 0);
});

test("terrier pause playback uses a short ordered impact then a stable grounded settle", () => {
  const impact = levelTwoEnemyAnimation("terrier", "impact");
  const recover = levelTwoEnemyAnimation("terrier", "recover");
  assert.equal(impact.row, LEVEL_TWO_ENEMY_ANIMATIONS.terrier.hit.row);
  assert.deepEqual([
    enemyAnimationFrame(impact, 0),
    enemyAnimationFrame(impact, 0.2),
    enemyAnimationFrame(impact, 9),
  ], [0, 1, 1]);
  assert.deepEqual([
    enemyAnimationFrame(recover, 0),
    enemyAnimationFrame(recover, 0.2),
    enemyAnimationFrame(recover, 9),
  ], [0, 1, 3]);
  assert.notEqual(impact.row, recover.row);
  assert.equal(impact.loop, false);
  assert.equal(recover.loop, false);
});

test("every Level 2 enemy enters reachable local hit playback before defeat", () => {
  for (const kind of ["squirrel", "terrier", "skunk", "moth"]) {
    const next = beginLevelTwoEnemyHit({ kind, behaviorState: "idle", stateElapsed: 4 });
    assert.equal(next.visualState, "hit");
    assert.ok(next.visualTimer > 0);
    assert.equal(next.stateElapsed, 0);
    assert.equal(enemyAnimationFrame(LEVEL_TWO_ENEMY_ANIMATIONS[kind].hit, next.stateElapsed), 0);
  }
});

test("runtime playback advances locally, resets on transitions, and reveals defeat after hit", () => {
  const advanced = advanceLevelTwoEnemyPlayback({
    behaviorState: "telegraph", visualState: null, visualTimer: 0, stateElapsed: 0,
  }, 0.1);
  assert.equal(advanced.stateElapsed, 0.1);
  assert.equal(
    applyLevelTwoBehaviorTransition(advanced, "telegraph").stateElapsed,
    0.1,
  );
  assert.equal(
    applyLevelTwoBehaviorTransition(advanced, "throw").stateElapsed,
    0,
  );

  const hit = beginLevelTwoEnemyHit({ kind: "squirrel", behaviorState: "idle", stateElapsed: 3 });
  const afterHit = advanceLevelTwoEnemyPlayback(hit, hit.visualTimer);
  assert.equal(afterHit.visualState, null);
  assert.equal(afterHit.behaviorState, "defeated");
  assert.equal(afterHit.stateElapsed, 0);
});

test("active behavior dispatch is explicit by enemy kind", () => {
  const next = updateLevelTwoEnemy({ kind: "terrier", state: "sleep", x: 300, vx: 0 }, {
    dt: 0.1, patrolMinX: 200, patrolMaxX: 600, playerInRange: true,
  });
  assert.equal(next.state, "wake");
  assert.throws(
    () => updateLevelTwoEnemy({ kind: "possum", state: "idle" }, { dt: 0.1 }),
    /unknown level 2 enemy kind/i,
  );
});

test("encounter test routes select one exact authored group and environment", () => {
  const expected = {
    squirrel: ["backyard-squirrel-tutorial", true],
    terrier: ["street-terrier-tutorial", true],
    skunk: ["obstacle-skunk-tutorial", false],
    moth: ["porch-light-moth-introduction", true],
    interaction: ["obstacle-interaction-test", true],
  };
  for (const [route, [encounterId, hasEnvironment]] of Object.entries(expected)) {
    const selected = selectEncounterTestRoute(LEVEL_TWO, route);
    assert.equal(selected.encounter.id, encounterId);
    assert.equal(selected.encounters.length, 1);
    assert.equal(selected.environment.length > 0, hasEnvironment, `${route} environment contract`);
    assert.ok(LEVEL_TWO.surfaces.some(({ id }) => id === selected.playerSurfaceId));
  }
});

test("encounter routes reject unknown names and drifted metadata", () => {
  assert.throws(() => selectEncounterTestRoute(LEVEL_TWO, "unknown"), /unknown encounter test/i);
  assert.throws(
    () => selectEncounterTestRoute({ ...LEVEL_TWO, encounters: [] }, "squirrel"),
    /missing authored encounter/i,
  );
});

test("compact atlas metadata and pixels obey stable anchors", async () => {
  await access(new URL("../concepts/level-two/source/squirrel-throw-source.png", import.meta.url));
  const atlasPath = fileURLToPath(new URL(
    "../public/assets/generated/level2-enemy-motion.png",
    import.meta.url,
  ));
  const { data, info } = await sharp(atlasPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, 192 * 4);
  assert.equal(info.height, 192 * 21);
  const colors = new Set();
  const alphaValues = new Set();
  for (let offset = 0; offset < data.length; offset += 4) {
    alphaValues.add(data[offset + 3]);
    if (data[offset + 3] > 0) {
      colors.add(`${data[offset]},${data[offset + 1]},${data[offset + 2]}`);
      const purpleBiased = (data[offset] + data[offset + 2]) / 2 > data[offset + 1] * 1.45
        && data[offset + 2] > 65;
      assert.equal(purpleBiased, false, `opaque chroma-key fringe at pixel ${offset / 4}`);
    }
  }
  assert.deepEqual([...alphaValues].sort((left, right) => left - right), [0, 255]);
  assert.ok(colors.size >= 12 && colors.size <= 32, `unexpected palette size ${colors.size}`);

  for (const [kind, animations] of Object.entries(LEVEL_TWO_ENEMY_ANIMATIONS)) {
    const boxes = [];
    for (const animation of Object.values(animations)) {
      assert.ok(animation.frames >= 1 && animation.frames <= 4);
      for (let column = 0; column < animation.frames; column += 1) {
        let left = 192;
        let top = 192;
        let right = -1;
        let bottom = -1;
        for (let y = 0; y < 192; y += 1) {
          for (let x = 0; x < 192; x += 1) {
            const pixel = ((animation.row * 192 + y) * info.width + column * 192 + x) * 4;
            if (data[pixel + 3] === 0) continue;
            left = Math.min(left, x);
            top = Math.min(top, y);
            right = Math.max(right, x);
            bottom = Math.max(bottom, y);
          }
        }
        assert.ok(right >= left && bottom >= top, `${kind}/${animation.row}:${column} is empty`);
        assert.ok(left > 0 && top > 0 && right < 191 && bottom < 191, `${kind} frame clips`);
        boxes.push({ left, top, right, bottom });
      }
    }
    if (kind === "moth") {
      const centers = boxes.map(({ left, right, top, bottom }) => ({
        x: (left + right) / 2,
        y: (top + bottom) / 2,
      }));
      assert.ok(Math.max(...centers.map(({ x }) => x)) - Math.min(...centers.map(({ x }) => x)) <= 4);
      assert.ok(Math.max(...centers.map(({ y }) => y)) - Math.min(...centers.map(({ y }) => y)) <= 4);
    } else {
      assert.equal(new Set(boxes.map(({ bottom }) => bottom)).size, 1, `${kind} feet drift`);
    }
  }

  const componentStats = (row, column) => {
    const seen = new Uint8Array(192 * 192);
    const components = [];
    for (let y = 0; y < 192; y += 1) {
      for (let x = 0; x < 192; x += 1) {
        const start = y * 192 + x;
        const source = ((row * 192 + y) * info.width + column * 192 + x) * 4;
        if (seen[start] || data[source + 3] === 0) continue;
        const stack = [start];
        seen[start] = 1;
        let area = 0;
        let red = 0;
        let green = 0;
        let blue = 0;
        while (stack.length > 0) {
          const point = stack.pop();
          const pointX = point % 192;
          const pointY = (point - pointX) / 192;
          const pixel = ((row * 192 + pointY) * info.width + column * 192 + pointX) * 4;
          area += 1;
          red += data[pixel];
          green += data[pixel + 1];
          blue += data[pixel + 2];
          for (let dy = -1; dy <= 1; dy += 1) {
            for (let dx = -1; dx <= 1; dx += 1) {
              const nextX = pointX + dx;
              const nextY = pointY + dy;
              if (nextX < 0 || nextX >= 192 || nextY < 0 || nextY >= 192) continue;
              const next = nextY * 192 + nextX;
              const nextPixel = ((row * 192 + nextY) * info.width + column * 192 + nextX) * 4;
              if (!seen[next] && data[nextPixel + 3] > 0) {
                seen[next] = 1;
                stack.push(next);
              }
            }
          }
        }
        components.push({ area, red: red / area, green: green / area, blue: blue / area });
      }
    }
    return components.sort((left, right) => right.area - left.area);
  };

  for (let row = 0; row < 21; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      const components = componentStats(row, column);
      const primaryArea = components[0].area;
      for (const component of components.slice(1)) {
        const purpleBiased = (component.red + component.blue) / 2 > component.green * 1.35;
        assert.equal(
          component.area < primaryArea * 0.02 && purpleBiased,
          false,
          `detached key fragment ${row}:${column} area=${component.area}`,
        );
      }
    }
  }

  const releaseComponents = componentStats(
    LEVEL_TWO_ENEMY_ANIMATIONS.squirrel.attack.row,
    1,
  );
  assert.ok(
    releaseComponents.some(({ area, red, green, blue }) => (
      area >= 8 && area <= 450 && red > green * 1.05 && green > blue * 1.05
    )),
    "squirrel release frame needs a detached warm-brown acorn component",
  );
});
