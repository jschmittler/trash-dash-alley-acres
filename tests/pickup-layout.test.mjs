import test from "node:test";
import assert from "node:assert/strict";
import { pickupVisibleBottom, pickupYAboveSurface } from "../app/pickup-layout.mjs";

for (const kind of ["trash", "taco", "cap"]) {
  test(`${kind} pickup keeps its visible art above the support surface`, () => {
    const surfaceY = 374;
    const gap = 18;
    const y = pickupYAboveSurface(kind, surfaceY, gap);
    assert.equal(pickupVisibleBottom(kind, y) + gap, surfaceY);
  });
}
