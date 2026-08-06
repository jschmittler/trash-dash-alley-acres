import test from "node:test";
import assert from "node:assert/strict";
import {
  decorativeCollisionRect,
  decorativeDrawRect,
  decorativeShadowRect,
  platformStripSegments,
} from "../app/decorative-render.mjs";

test("props preserve visible aspect ratio and share a baseline", () => {
  const props = ["bush", "tree", "bin", "crate", "checkpoint", "tires"];
  const rects = props.map((prop) => decorativeDrawRect(prop, 100, 20, 468));
  assert.equal(rects[0].x, 80);
  for (const rect of rects) assert.equal(rect.y + rect.height, 468);
  const crate = rects[3];
  assert.ok(Math.abs(crate.width / crate.height - 214 / 188) < 0.01);
});

test("contact shadows stay near each prop's grounded bottom", () => {
  const rect = decorativeDrawRect("crate", 400, 100, 468);
  const shadow = decorativeShadowRect("crate", rect);
  assert.ok(shadow.x > rect.x && shadow.x < rect.x + rect.width);
  assert.ok(shadow.y >= rect.y + rect.height - 8);
  assert.ok(shadow.x + shadow.width <= rect.x + rect.width);
});

test("decorative collision geometry matches the visible sprite rectangle", () => {
  const drawRect = decorativeDrawRect("crate", 878, 0, 468);
  const collision = decorativeCollisionRect("crate", 878, 468);
  assert.deepEqual(collision, {
    x: drawRect.x,
    y: drawRect.y,
    w: drawRect.width,
    h: drawRect.height,
  });
});

for (const width of [24, 64, 180, 420]) {
  test(`platform strip segments cover ${width}px without gaps`, () => {
    const segments = platformStripSegments("branch", 12, 300, width);
    assert.equal(segments[0].dest.x, 12);
    assert.equal(segments.at(-1).dest.x + segments.at(-1).dest.width, 12 + width);
    for (let i = 1; i < segments.length; i += 1) {
      assert.equal(segments[i - 1].dest.x + segments[i - 1].dest.width, segments[i].dest.x);
    }
  });
}
