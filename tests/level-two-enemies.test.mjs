import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import { LEVEL_TWO } from "../app/level-two.mjs";
import {
  ATTACK_TELL_MIN,
  ATTACK_TELL_MAX,
  ATTACK_TELLS,
  LEVEL_TWO_ENEMY_ANIMATIONS,
  MOTH_STATES,
  SKUNK_STATES,
  SQUIRREL_STATES,
  TERRIER_STATES,
  selectEncounterTestRoute,
  updateBinLid,
  updateMoth,
  updateLevelTwoEnemy,
  updateSkunk,
  updateSprinkler,
  updateSquirrel,
  updateTerrier,
} from "../app/level-two-enemies.mjs";

test("exports the authored state sets", () => {
  assert.deepEqual(SQUIRREL_STATES, ["idle", "telegraph", "throw", "recover", "defeated"]);
  assert.deepEqual(TERRIER_STATES, ["sleep", "wake", "charge", "stunned", "recover", "defeated"]);
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

test("squirrel uses a readable tell before throwing one lid", () => {
  const telegraph = updateSquirrel({ state: "idle", timer: 0 }, {
    dt: 0.1, playerInRange: true, defeated: false,
  });
  assert.equal(telegraph.state, "telegraph");
  assert.ok(telegraph.timer >= ATTACK_TELL_MIN);
  const throwing = updateSquirrel({ ...telegraph, timer: 0.01 }, {
    dt: 0.02, playerInRange: true, defeated: false,
  });
  assert.equal(throwing.state, "throw");
  assert.equal(throwing.spawnLid, true);
});

test("terrier stops at its surface edge and enters stunned recovery", () => {
  const next = updateTerrier({ state: "charge", x: 590, vx: 420 }, {
    dt: 0.1, patrolMinX: 200, patrolMaxX: 600, obstacleHit: true,
  });
  assert.equal(next.x, 600);
  assert.equal(next.state, "stunned");
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

test("sprinkler push redirects reflected lids and lightweight rolling objects", () => {
  assert.deepEqual(
    updateSprinkler({ vx: -90, lightweight: true, reflected: true }, { active: true, direction: 1 }),
    { vx: 150, lightweight: true, reflected: true },
  );
  assert.deepEqual(
    updateSprinkler({ vx: -90, lightweight: false, reflected: true }, { active: true, direction: 1 }),
    { vx: 150, lightweight: false, reflected: true },
  );
  assert.deepEqual(
    updateSprinkler({ vx: -90, lightweight: false, reflected: false }, { active: true, direction: 1 }),
    { vx: -90, lightweight: false, reflected: false },
  );
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
    squirrel: "backyard-squirrel-tutorial",
    terrier: "street-terrier-tutorial",
    skunk: "obstacle-skunk-tutorial",
    moth: "porch-light-moth-introduction",
    interaction: "obstacle-interaction-test",
  };
  for (const [route, encounterId] of Object.entries(expected)) {
    const selected = selectEncounterTestRoute(LEVEL_TWO, route);
    assert.equal(selected.encounter.id, encounterId);
    assert.equal(selected.encounters.length, 1);
    assert.ok(selected.environment.length > 0, `${route} needs nearby environment`);
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
  const atlasPath = fileURLToPath(new URL(
    "../public/assets/generated/level2-enemy-motion.png",
    import.meta.url,
  ));
  const { data, info } = await sharp(atlasPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, 192 * 4);
  assert.equal(info.height, 192 * 20);
  const colors = new Set();
  const alphaValues = new Set();
  for (let offset = 0; offset < data.length; offset += 4) {
    alphaValues.add(data[offset + 3]);
    if (data[offset + 3] > 0) colors.add(`${data[offset]},${data[offset + 1]},${data[offset + 2]}`);
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
});
