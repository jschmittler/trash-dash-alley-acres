import assert from "node:assert/strict";
import test from "node:test";

import {
  POWERUP_NOTICE_DURATION,
  createPowerupNotice,
  powerupNoticeProgress,
} from "../app/powerup-announcement.mjs";

test("power-up notices provide distinct player-facing copy", () => {
  assert.deepEqual(createPowerupNotice("taco"), {
    kind: "taco",
    title: "TACO POWER!",
    detail: "Big raccoon mode unlocked.",
    accent: "#ffb13b",
  });
  assert.match(createPowerupNotice("cap").detail, /float/i);
});

test("power-up notice progress clamps to the takeover duration", () => {
  assert.equal(powerupNoticeProgress(-1), 0);
  assert.equal(powerupNoticeProgress(POWERUP_NOTICE_DURATION / 2), 0.5);
  assert.equal(powerupNoticeProgress(POWERUP_NOTICE_DURATION + 1), 1);
});
