import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";
import sharp from "sharp";

import {
  classifyWorldObjectPlacement,
  isValidWorldObjectPlacement,
  nearestValidWorldObjectPlacement,
  PLACEMENT_TYPES,
  resolveEnemyWorldPatrol,
  WORLD_PLACEMENT_PADDING,
} from "../app/world-placement.mjs";
import { createLevelRuntime } from "../app/level-runtime.mjs";
import { LEVEL_ONE } from "../app/level-one.mjs";
import { LEVEL_TWO } from "../app/level-two.mjs";
import { IMPLEMENTED_VISUAL_INVENTORY } from "../app/visual-inventory.mjs";
import { sceneryForLevel, sceneryVisualBounds } from "../app/world-scenery.mjs";
import { pickupYAboveSurface } from "../app/pickup-layout.mjs";
import { levelTwoEnvironmentRecords } from "../app/level-two-enemies.mjs";
import {
  hydrantDrawRect,
  hydrantNozzleOrigin,
  hydrantWaterDrawRect,
  lampPostDrawRect,
  LEVEL_TWO_PROP_FRAMES,
  levelTwoPlatformDrawRect,
  sprinklerBodyDrawRect,
  sprinklerEmitterOrigin,
  sprinklerWaterDrawRect,
} from "../app/level-two-props.mjs";

const ledge = Object.freeze({ id: "ledge", x: 100, y: 200, w: 120, h: 40 });

test("placement contract exposes the five semantic relationships and centralized padding", () => {
  assert.deepEqual(Object.values(PLACEMENT_TYPES), [
    "ON_SURFACE", "BESIDE", "BELOW", "ABOVE_WITH_CLEARANCE", "EXPLICITLY_PLATFORM_ATTACHED",
  ]);
  assert.ok(WORLD_PLACEMENT_PADDING.horizontal > 0);
  assert.ok(WORLD_PLACEMENT_PADDING.vertical > 0);
  assert.ok(WORLD_PLACEMENT_PADDING.surfaceTolerance <= 2);
});

test("full visible bounds reject an embedded prop even when its origin is outside", () => {
  const result = classifyWorldObjectPlacement({
    id: "wide-bin",
    bounds: { x: 60, y: 170, w: 80, h: 50 },
    placementType: PLACEMENT_TYPES.BESIDE,
  }, [ledge]);
  assert.equal(result.valid, false);
  assert.deepEqual(result.intersections.map(({ platformId }) => platformId), ["ledge"]);
  assert.equal(isValidWorldObjectPlacement({
    id: "wide-bin",
    bounds: { x: 60, y: 170, w: 80, h: 50 },
    placementType: PLACEMENT_TYPES.BESIDE,
  }, [ledge]), false);
});

test("on-surface props touch the authored top without entering structural pixels", () => {
  const valid = classifyWorldObjectPlacement({
    id: "crate",
    bounds: { x: 132, y: 150, w: 48, h: 50 },
    placementType: PLACEMENT_TYPES.ON_SURFACE,
    surfaceId: "ledge",
  }, [ledge]);
  assert.equal(valid.valid, true);
  assert.equal(valid.support.platformId, "ledge");

  const sunk = classifyWorldObjectPlacement({
    id: "crate",
    bounds: { x: 132, y: 154, w: 48, h: 50 },
    placementType: PLACEMENT_TYPES.ON_SURFACE,
    surfaceId: "ledge",
  }, [ledge]);
  assert.equal(sunk.valid, false);
});

test("beside, below, above-clearance, and explicit attachment remain distinct", () => {
  assert.equal(classifyWorldObjectPlacement({
    id: "sign", bounds: { x: 36, y: 150, w: 48, h: 50 }, placementType: PLACEMENT_TYPES.BESIDE,
  }, [ledge]).valid, true);
  assert.equal(classifyWorldObjectPlacement({
    id: "underpass", bounds: { x: 120, y: 248, w: 48, h: 30 }, placementType: PLACEMENT_TYPES.BELOW,
  }, [ledge]).valid, true);
  assert.equal(classifyWorldObjectPlacement({
    id: "pickup", bounds: { x: 120, y: 130, w: 30, h: 30 }, placementType: PLACEMENT_TYPES.ABOVE_WITH_CLEARANCE,
  }, [ledge]).valid, true);
  assert.equal(classifyWorldObjectPlacement({
    id: "wall-lamp", bounds: { x: 150, y: 190, w: 24, h: 24 }, placementType: PLACEMENT_TYPES.EXPLICITLY_PLATFORM_ATTACHED,
    platformId: "ledge",
  }, [ledge]).valid, true);
});

test("candidate resolver chooses the nearest legal placement or safely skips", () => {
  const object = { id: "bin", placementType: PLACEMENT_TYPES.BESIDE };
  const nearest = nearestValidWorldObjectPlacement(object, [ledge], [
    { x: 92, y: 150, w: 48, h: 50 },
    { x: 36, y: 150, w: 48, h: 50 },
    { x: 250, y: 150, w: 48, h: 50 },
  ], { x: 90, y: 175 });
  assert.deepEqual(nearest, { x: 36, y: 150, w: 48, h: 50 });
  assert.equal(nearestValidWorldObjectPlacement(object, [ledge], [
    { x: 110, y: 170, w: 48, h: 50 },
  ], { x: 110, y: 170 }), null);
});

test("runtime enemy placement clamps complete footprints and safely omits illegal supports", () => {
  const contract = {
    placementFootprint: { x: -40, y: -70, w: 80, h: 70 },
    groundAnchor: { x: 0, y: 0 },
  };
  assert.deepEqual(resolveEnemyWorldPatrol({
    spawn: { x: 95, patrol: [70, 190], surfaceId: "ledge" },
    supports: [ledge],
    flightBands: [],
    collisionWidth: 40,
    contract,
    grounded: true,
    patrolRadius: 105,
  }), { spawnX: 120, minX: 120, maxX: 160, surfaceY: 200, surfaceId: "ledge" });
  assert.equal(resolveEnemyWorldPatrol({
    spawn: { x: 110, patrol: [100, 120], surfaceId: "tiny" },
    supports: [{ id: "tiny", x: 100, y: 200, w: 20, h: 20 }],
    flightBands: [],
    collisionWidth: 40,
    contract,
    grounded: true,
    patrolRadius: 105,
  }), null);

  const runtime = createLevelRuntime({
    surfaces: [ledge], encounters: [{ enemies: [{ id: "legal" }, { id: "illegal" }] }],
    rewards: [], checkpoints: [], boss: {},
  }, {
    makeEnemy: ({ id }) => id === "legal" ? { id } : null,
    makePickup: () => null,
  });
  assert.deepEqual(runtime.enemies, [{ id: "legal" }]);
});

test("production runtime consumes centralized placement and level-specific scenery", () => {
  const source = readFileSync(fileURLToPath(new URL("../app/trash-dash-game.tsx", import.meta.url)), "utf8");
  assert.match(source, /resolveEnemyWorldPatrol/);
  assert.match(source, /sceneryForLevel\(world\.levelId\)/);
  assert.doesNotMatch(source, /const scenery\s*=\s*\[/);
});

test("every current level scenery prop clears every incompatible platform body", () => {
  for (const level of [LEVEL_ONE, LEVEL_TWO]) {
    for (const entry of sceneryForLevel(level.id)) {
      const result = classifyWorldObjectPlacement({
        id: `${level.id}:${entry.prop}:${entry.x}`,
        bounds: sceneryVisualBounds(entry),
        placementType: entry.placementType,
        surfaceId: entry.surfaceId,
      }, level.surfaces);
      assert.equal(result.valid, true, `${level.id} ${entry.prop}@${entry.x}: ${JSON.stringify(result)}`);
    }
  }
});

test("walking pigeons resolve on top of the campsite crates instead of inside them", () => {
  const group = LEVEL_ONE.encounters.find(({ id }) => id === "campsite-overlook-birds");
  assert.ok(group);
  for (const enemy of group.enemies) {
    assert.equal(enemy.kind, "pigeon");
    assert.match(enemy.surfaceId, /^crate-campsite-/);
    assert.equal(enemy.flightBand, undefined);
    const support = LEVEL_ONE.surfaces.find(({ id }) => id === enemy.surfaceId);
    assert.ok(support);
    const bounds = { x: enemy.x - 33, y: support.y - 66, w: 66, h: 66 };
    assert.equal(classifyWorldObjectPlacement({
      id: `pigeon:${enemy.x}`,
      bounds,
      placementType: PLACEMENT_TYPES.ON_SURFACE,
      surfaceId: enemy.surfaceId,
    }, LEVEL_ONE.surfaces).valid, true);
  }
});

test("every current pickup visual clears solid platform bodies through its full hover range", () => {
  const render = {
    trash: { x: -8, y: -12, w: 46, h: 48 },
    taco: { x: -10, y: -14, w: 58, h: 60 },
    cap: { x: -9, y: -9, w: 50, h: 44 },
  };
  for (const level of [LEVEL_ONE, LEVEL_TWO]) {
    for (const reward of level.rewards.filter(({ kind }) => kind !== "checkpoint")) {
      const surfaceY = reward.surfaceY === 0 ? 468 : reward.surfaceY;
      const pickupY = pickupYAboveSurface(reward.kind, surfaceY, 18);
      const metrics = render[reward.kind];
      const bounds = {
        x: reward.x + metrics.x,
        y: pickupY + metrics.y,
        w: metrics.w,
        h: metrics.h,
      };
      const result = classifyWorldObjectPlacement({
        id: reward.id,
        bounds,
        placementType: PLACEMENT_TYPES.ABOVE_WITH_CLEARANCE,
        surfaceId: reward.surfaceId,
      }, level.surfaces);
      assert.equal(result.valid, true, `${level.id} ${reward.id}: ${JSON.stringify(result)}`);
    }
  }
});

test("every pickup owns a named support and its complete hover envelope stays on that support", () => {
  const hoverExcursion = 2;
  const runtime = {
    trash: { collisionWidth: 30, x: -8, y: -10, w: 46, h: 46 },
    taco: { collisionWidth: 38, x: -10, y: -12, w: 58, h: 58 },
    cap: { collisionWidth: 38, x: -9, y: -7, w: 50, h: 42 },
  };
  for (const level of [LEVEL_ONE, LEVEL_TWO]) {
    for (const reward of level.rewards.filter(({ kind }) => kind !== "checkpoint")) {
      assert.ok(reward.surfaceId, `${level.id}/${reward.id} has no semantic support`);
      const support = level.surfaces.find(({ id }) => id === reward.surfaceId);
      assert.ok(support, `${level.id}/${reward.id} references missing support ${reward.surfaceId}`);
      assert.equal(reward.surfaceY, support.y, `${level.id}/${reward.id} uses stale support Y`);
      const visual = runtime[reward.kind];
      const left = reward.x + visual.x;
      const right = left + visual.w;
      assert.ok(left >= support.x && right <= support.x + support.w,
        `${level.id}/${reward.id} visual ${left}..${right} leaves ${support.id} ${support.x}..${support.x + support.w}`);
      const pickupY = pickupYAboveSurface(reward.kind, support.y, 18);
      const bottomAtLowHover = pickupY + visual.y + visual.h + hoverExcursion;
      assert.ok(bottomAtLowHover < support.y,
        `${level.id}/${reward.id} hover envelope reaches support ${support.id}`);
    }
  }
});

test("every checkpoint and checkpoint reward owns a named continuous ground support", () => {
  for (const level of [LEVEL_ONE, LEVEL_TWO]) {
    for (const checkpoint of level.checkpoints) {
      assert.ok(checkpoint.surfaceId, `${level.id}/${checkpoint.id} has no semantic support`);
      const support = level.surfaces.find(({ id }) => id === checkpoint.surfaceId);
      assert.ok(support, `${level.id}/${checkpoint.id} references missing support ${checkpoint.surfaceId}`);
      assert.ok(checkpoint.x >= support.x && checkpoint.x <= support.x + support.w,
        `${level.id}/${checkpoint.id} trigger leaves ${support.id}`);
      assert.ok(checkpoint.respawnX >= support.x && checkpoint.respawnX <= support.x + support.w,
        `${level.id}/${checkpoint.id} respawn leaves ${support.id}`);
    }
    for (const reward of level.rewards.filter(({ kind }) => kind === "checkpoint")) {
      const support = level.surfaces.find(({ id }) => id === reward.surfaceId);
      assert.ok(support, `${level.id}/${reward.id} references missing support ${reward.surfaceId}`);
      assert.equal(reward.surfaceY, support.y, `${level.id}/${reward.id} uses stale support Y`);
      assert.ok(reward.x >= support.x && reward.x <= support.x + support.w,
        `${level.id}/${reward.id} leaves ${support.id}`);
    }
  }
});

test("every flying actor's complete vertical motion envelope remains inside its authored flight band", () => {
  const hoverExcursion = 11;
  const failures = [];
  for (const level of [LEVEL_ONE, LEVEL_TWO]) {
    for (const spawn of level.encounters.flatMap(({ enemies }) => enemies).filter(({ flightBand }) => flightBand)) {
      const record = IMPLEMENTED_VISUAL_INVENTORY.find(({ category, id }) => category === "enemy" && id === spawn.kind);
      const band = level.flightBands.find(({ id }) => id === spawn.flightBand);
      const visual = record.contract.visualBounds;
      if (spawn.movement === "flying") {
        assert.ok(band.endX - band.startX >= record.contract.placementFootprint.w,
          `${level.id}/${spawn.kind}/${band.id} is narrower than its motion footprint`);
        assert.ok(band.maxY - band.minY >= record.contract.placementFootprint.h,
          `${level.id}/${spawn.kind}/${band.id} is shorter than its motion footprint`);
        continue;
      }
      const baselineY = spawn.y;
      const top = baselineY + visual.y - record.contract.groundAnchor.y - hoverExcursion;
      const bottom = baselineY + visual.y + visual.h - record.contract.groundAnchor.y + hoverExcursion;
      if (top < band.minY || bottom > band.maxY) {
        failures.push(`${level.id}/${spawn.kind}/${band.id}: vertical ${top}..${bottom}, allowed ${band.minY}..${band.maxY}`);
      }
    }
  }
  assert.deepEqual(failures, []);
});

test("every Level 2 environment and boss prop uses legal full visual bounds", async () => {
  const atlasPath = fileURLToPath(new URL("../public/assets/generated/level2-props.png", import.meta.url));
  const { data, info } = await sharp(atlasPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const alphaBounds = (name) => {
    const [sourceX, sourceY, width, height] = LEVEL_TWO_PROP_FRAMES[name].frames[0];
    let left = width;
    let top = height;
    let right = -1;
    let bottom = -1;
    for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
      if (data[((sourceY + y) * info.width + sourceX + x) * 4 + 3] === 0) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
    return { left, top, right, bottom };
  };
  const projected = (frameName, draw) => {
    const source = alphaBounds(frameName);
    return {
      x: draw.x + source.left / 128 * draw.w,
      y: draw.y + source.top / 128 * draw.h,
      w: (source.right - source.left) / 128 * draw.w,
      h: (source.bottom - source.top) / 128 * draw.h,
    };
  };
  const visual = (item) => {
    if (item.kind === "bin-lid-source") return projected("acorn", {
      x: item.x + item.w / 2 - 22, y: item.y + item.h / 2 - 22, w: 44, h: 44,
    });
    if (item.kind === "charge-obstacle") return projected("charge-obstacle", {
      x: item.x + item.w / 2 - 42, y: item.y + item.h - 98, w: 84, h: 112,
    });
    if (item.kind === "sprinkler" && item.encounterId !== "brutus") return projected("sprinkler-idle", sprinklerBodyDrawRect(item));
    if (item.kind === "lamp-post") return lampPostDrawRect(item);
    if (item.kind === "porch-light") return item;
    return projected(LEVEL_TWO_PROP_FRAMES["hydrant-idle"] ? "hydrant-idle" : "hydrant", hydrantDrawRect(item));
  };
  const environment = [
    ...levelTwoEnvironmentRecords(),
    { ...LEVEL_TWO.boss.hydrant, kind: "hydrant", encounterId: "brutus" },
    ...LEVEL_TWO.boss.sprinklers.map((item) => ({ ...item, kind: "sprinkler", encounterId: "brutus" })),
  ];
  for (const item of environment) {
    const result = classifyWorldObjectPlacement({
      id: item.id,
      bounds: visual(item),
      placementType: item.placementType,
      surfaceId: item.surfaceId,
      structureId: item.structureId,
    }, LEVEL_TWO.surfaces);
    assert.equal(result.valid, true, `${item.id}: ${JSON.stringify(result)}`);
  }
});

test("boss utility-platform art, collision tops, floor contacts, and symmetry agree", async () => {
  const atlasPath = fileURLToPath(new URL("../public/assets/generated/level2-props.png", import.meta.url));
  const { data, info } = await sharp(atlasPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const platforms = ["brutus-platform-left", "brutus-platform-right"].map((id) => (
    LEVEL_TWO.surfaces.find((surface) => surface.id === id)
  ));
  const arena = LEVEL_TWO.surfaces.find(({ id }) => id === "cul-de-sac");
  for (const platform of platforms) {
    assert.ok(platform);
    const [sourceX, sourceY, width, height] = LEVEL_TWO_PROP_FRAMES[platform.visual].frames[0];
    let left = width;
    let top = height;
    let right = -1;
    let bottom = -1;
    for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
      if (data[((sourceY + y) * info.width + sourceX + x) * 4 + 3] === 0) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
    const draw = levelTwoPlatformDrawRect(platform);
    const visible = {
      x: draw.x + left / width * draw.w,
      y: draw.y + top / height * draw.h,
      w: (right - left + 1) / width * draw.w,
      h: (bottom - top + 1) / height * draw.h,
    };
    assert.ok(Math.abs(visible.y - platform.y) <= 2,
      `${platform.id} opaque top ${visible.y} disagrees with collision ${platform.y}`);
    assert.ok(Math.abs(visible.y + visible.h - arena.y) <= 2,
      `${platform.id} opaque base ${visible.y + visible.h} floats above floor ${arena.y}`);
    assert.ok(visible.x <= platform.x && visible.x + visible.w >= platform.x + platform.w,
      `${platform.id} collision extends beyond its visible body`);
  }
  const arenaCenter = LEVEL_TWO.boss.arenaStartX + (LEVEL_TWO.boss.arenaEndX - LEVEL_TWO.boss.arenaStartX) / 2;
  const leftOffset = arenaCenter - (platforms[0].x + platforms[0].w / 2);
  const rightOffset = platforms[1].x + platforms[1].w / 2 - arenaCenter;
  assert.ok(Math.abs(leftOffset - rightOffset) <= 1, `platform asymmetry ${leftOffset}/${rightOffset}`);
});

test("every water effect remains attached to its named emitter with independent bounds", () => {
  const sprinklers = [
    ...levelTwoEnvironmentRecords().filter(({ kind }) => kind === "sprinkler"),
    ...LEVEL_TWO.boss.sprinklers.map((item) => ({ ...item, kind: "sprinkler", encounterId: "brutus" })),
  ];
  for (const item of sprinklers) {
    for (const direction of [-1, 1]) {
      const bossEffect = item.encounterId === "brutus";
      const body = bossEffect ? hydrantDrawRect(item) : sprinklerBodyDrawRect(item);
      const origin = bossEffect ? hydrantNozzleOrigin(item, direction) : sprinklerEmitterOrigin(item, direction);
      const water = bossEffect ? hydrantWaterDrawRect(origin, direction) : sprinklerWaterDrawRect(origin, direction);
      assert.ok(origin.x >= body.x && origin.x <= body.x + body.w && origin.y >= body.y && origin.y <= body.y + body.h,
        `${item.id} emitter leaves body`);
      assert.ok(origin.x >= water.x && origin.x <= water.x + water.w && origin.y >= water.y && origin.y <= water.y + water.h,
        `${item.id} water detached from emitter`);
      const relationship = classifyWorldObjectPlacement({
        id: `${item.id}:water:${direction}`,
        bounds: water,
        placementType: PLACEMENT_TYPES.EXPLICITLY_PLATFORM_ATTACHED,
        structureId: item.id,
      }, LEVEL_TWO.surfaces);
      assert.equal(relationship.valid, true);
      assert.equal(relationship.support.structureId, item.id);
    }
  }
});
