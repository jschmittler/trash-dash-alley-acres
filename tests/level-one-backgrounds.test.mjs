import assert from "node:assert/strict";
import test from "node:test";
import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { groundedComponentBaselines } from "../scripts/parallax-baseline.mjs";

const root = fileURLToPath(new URL("../public/assets/backgrounds/", import.meta.url));
const stages = ["woodland", "creek", "highway", "industrial", "park"];
const layers = ["", "-far", "-middle", "-close"];

test("Level 1 backgrounds provide a base plus explicit parallax layers", async () => {
  for (const stage of stages) {
    for (const layer of layers) {
      const path = `${root}/level1-${stage}${layer}.png`;
      await access(path);
      const info = await sharp(path).metadata();
      assert.ok(info.width >= 2048, `${stage}${layer} width`);
      assert.ok(info.height >= 716, `${stage}${layer} height`);
    }
  }
});

test("moving parallax plates use object-shaped transparency instead of horizontal bands", async () => {
  for (const stage of stages) {
    for (const layer of ["middle", "close"]) {
      const path = `${root}/level1-${stage}-${layer}.png`;
      const { data, info } = await sharp(path)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      let mixedRows = 0;

      for (let y = 0; y < info.height; y += 1) {
        let transparent = false;
        let visible = false;
        for (let x = 0; x < info.width; x += 1) {
          const alpha = data[(y * info.width + x) * info.channels + 3];
          transparent ||= alpha === 0;
          visible ||= alpha > 0;
          if (transparent && visible) break;
        }
        if (transparent && visible) mixedRows += 1;
      }

      assert.ok(
        mixedRows >= 24,
        `${stage}-${layer} should contain whole silhouettes, not row-wide opacity`,
      );
    }
  }
});

test("substantial middle-layer objects share the world baseline", async () => {
  for (const stage of stages) {
    const path = `${root}/level1-${stage}-middle.png`;
    const { data, info } = await sharp(path)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const audit = groundedComponentBaselines(data, info);
    const substantial = audit.components.filter(
      (component) => component.area >= audit.options.minimumArea,
    );

    assert.ok(substantial.length > 0, `${stage} has grounded middle silhouettes`);
    for (const component of substantial) {
      assert.ok(
        Math.abs(component.maxY - 603) <= 2,
        `${stage} component baseline ${component.maxY} should meet 603`,
      );
    }
  }
});
