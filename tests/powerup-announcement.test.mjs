import assert from "node:assert/strict";
import test from "node:test";

import {
  POWERUP_PAUSE_DURATION,
  POWERUP_NOTICE_DURATION,
  createPowerupNotice,
  powerupNoticeProgress,
} from "../app/powerup-announcement.mjs";

test("power-up notices provide distinct player-facing copy", () => {
  assert.deepEqual(createPowerupNotice("taco"), {
    kind: "taco",
    title: "TACO POWER!",
    accent: "#ffb13b",
  });
  assert.equal(createPowerupNotice("cap").title, "GLIDER READY!");
});

test("power-up hit-stop is brief while the visual notice lasts longer", () => {
  assert.equal(POWERUP_PAUSE_DURATION, 0.5);
  assert.ok(POWERUP_NOTICE_DURATION > POWERUP_PAUSE_DURATION);
});

test("power-up notice progress clamps to the takeover duration", () => {
  assert.equal(powerupNoticeProgress(-1), 0);
  assert.equal(powerupNoticeProgress(POWERUP_NOTICE_DURATION / 2), 0.5);
  assert.equal(powerupNoticeProgress(POWERUP_NOTICE_DURATION + 1), 1);
});
