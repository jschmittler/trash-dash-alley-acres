import assert from "node:assert/strict";
import test from "node:test";

import { LEVEL_ONE } from "../app/level-one.mjs";

const routesById = new Map(LEVEL_ONE.routeChoices.map((route) => [route.id, route]));
const rewardsById = new Map(LEVEL_ONE.rewards.map((reward) => [reward.id, reward]));
const encountersById = new Map(LEVEL_ONE.encounters.map((encounter) => [encounter.id, encounter]));

test("all four Level 1 alternate routes are optional and cover the approved rewards", () => {
  assert.deepEqual([...routesById.keys()], [
    "campsite-upper-route",
    "mill-glider-route",
    "highway-culvert-route",
    "industrial-container-route",
  ]);

  for (const route of routesById.values()) {
    assert.equal(route.optional, true, `${route.id} must remain optional`);
    assert.ok(route.endX > route.startX, `${route.id} must have a positive span`);
    assert.ok(route.rewardIds.length > 0, `${route.id} must advertise at least one reward`);
    for (const rewardId of route.rewardIds) {
      const reward = rewardsById.get(rewardId);
      assert.ok(reward, `${route.id} references an unknown reward: ${rewardId}`);
      assert.equal(reward.optional, true, `${rewardId} must be optional when route-gated`);
      assert.equal(reward.gate, route.id, `${rewardId} must use its route as the gate`);
    }
  }
});

test("route bypass metadata points only at encounters in the same Level 1 definition", () => {
  const expectedBypassRoutes = {
    "highway-culvert-route": ["highway-main-lane-opossum", "highway-fox-spike"],
    "industrial-container-route": ["industrial-rail-yard-layers"],
  };

  for (const [routeId, encounterIds] of Object.entries(expectedBypassRoutes)) {
    const route = routesById.get(routeId);
    assert.deepEqual(route.bypassEncounterIds, encounterIds);
    for (const encounterId of route.bypassEncounterIds) {
      const encounter = encountersById.get(encounterId);
      assert.ok(encounter, `${routeId} references an unknown encounter: ${encounterId}`);
      assert.equal(encounter.bypass, routeId, `${encounterId} must point back to ${routeId}`);
    }
  }

  assert.equal(routesById.get("campsite-upper-route").bypassEncounterIds, undefined);
  assert.equal(routesById.get("mill-glider-route").bypassEncounterIds, undefined);
});

test("Level 1 checkpoints are ordered and respawn before their trigger positions", () => {
  assert.deepEqual(LEVEL_ONE.checkpoints.map(({ id, x, respawnX, label }) => ({ id, x, respawnX, label })), [
    { id: "creek-checkpoint", x: 1130, respawnX: 1080, label: "Creek checkpoint" },
    { id: "highway-checkpoint", x: 2770, respawnX: 2700, label: "Highway checkpoint" },
    { id: "boss-runway-checkpoint", x: 4930, respawnX: 4900, label: "Boss runway checkpoint" },
  ]);

  for (let index = 0; index < LEVEL_ONE.checkpoints.length; index += 1) {
    const checkpoint = LEVEL_ONE.checkpoints[index];
    assert.ok(checkpoint.respawnX < checkpoint.x, `${checkpoint.id} must respawn before its trigger`);
    if (index > 0) {
      assert.ok(checkpoint.x > LEVEL_ONE.checkpoints[index - 1].x, "checkpoints must progress forward");
    }
  }

  assert.equal(LEVEL_ONE.boss.checkpointId, "boss-runway-checkpoint");
  assert.equal(LEVEL_ONE.rewards.find(({ id }) => id === "boss-checkpoint").x, 4870);
});
