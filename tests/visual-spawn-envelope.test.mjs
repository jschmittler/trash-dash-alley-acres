import assert from "node:assert/strict";
import test from "node:test";

import { createEnemyPatrol } from "../app/enemy-surface.mjs";
import { LEVEL_ONE } from "../app/level-one.mjs";
import { LEVEL_TWO } from "../app/level-two.mjs";
import { IMPLEMENTED_VISUAL_INVENTORY } from "../app/visual-inventory.mjs";
import { supportedFlightInterval, supportedPatrolInterval } from "../app/world-placement.mjs";

test("every enemy patrol keeps its complete largest visible silhouette inside its authored support or flight band", () => {
  const failures = [];
  for (const level of [LEVEL_ONE, LEVEL_TWO]) {
    for (const spawn of level.encounters.flatMap(({ enemies }) => enemies)) {
      const record = IMPLEMENTED_VISUAL_INVENTORY.find(({ category, id }) => category === "enemy" && id === spawn.kind);
      const collision = record.contract.collisionBounds;
      const visible = record.contract.visualBounds;
      const flying = Boolean(spawn.flightBand);
      const support = level.surfaces.find(({ id }) => id === spawn.surfaceId);
      const band = level.flightBands.find(({ id }) => id === spawn.flightBand);
      const patrol = createEnemyPatrol({
        x: spawn.x,
        width: collision.w,
        surfaceY: support?.y ?? spawn.flightY ?? spawn.y,
        surfaceId: spawn.surfaceId,
        patrolRadius: 105,
        patrolBounds: spawn.patrol,
        grounded: !flying,
      }, level.surfaces);
      const actorCenterOffset = collision.w / 2;
      const visibleLeft = patrol.minX + actorCenterOffset + visible.x;
      const visibleRight = patrol.maxX + actorCenterOffset + visible.x + visible.w;
      const allowedLeft = flying ? band.startX : support.x;
      const allowedRight = flying ? band.endX : support.x + support.w;
      if (visibleLeft < allowedLeft || visibleRight > allowedRight) {
        failures.push(`${level.id}/${spawn.kind}/${spawn.surfaceId ?? spawn.flightBand}: visible ${visibleLeft}..${visibleRight}, allowed ${allowedLeft}..${allowedRight}`);
      }
    }
  }
  assert.deepEqual(failures, []);
});

test("every authored patrol is already clamped to its complete placement footprint", () => {
  const failures = [];
  for (const level of [LEVEL_ONE, LEVEL_TWO]) {
    for (const spawn of level.encounters.flatMap(({ enemies }) => enemies)) {
      const record = IMPLEMENTED_VISUAL_INVENTORY.find(({ category, id }) => category === "enemy" && id === spawn.kind);
      const collisionWidth = record.contract.collisionBounds.w;
      const requested = [Math.min(...spawn.patrol), Math.max(...spawn.patrol)];
      const interval = spawn.flightBand
        ? supportedFlightInterval({
            band: level.flightBands.find(({ id }) => id === spawn.flightBand),
            collisionWidth,
            contract: record.contract,
            requested,
          })
        : supportedPatrolInterval({
            support: level.surfaces.find(({ id }) => id === spawn.surfaceId),
            collisionWidth,
            contract: record.contract,
            requested,
          });
      if (!interval || interval.minX !== requested[0] || interval.maxX !== requested[1]) {
        failures.push(`${level.id}/${spawn.kind}/${spawn.surfaceId ?? spawn.flightBand}: requested ${requested.join("..")} resolved ${interval ? `${interval.minX}..${interval.maxX}` : "OMIT"}`);
      }
    }
  }
  assert.deepEqual(failures, []);
});
