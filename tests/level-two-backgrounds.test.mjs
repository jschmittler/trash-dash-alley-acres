import assert from "node:assert/strict";
import test from "node:test";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { groundedComponentBaselines } from "../scripts/parallax-baseline.mjs";
import { LEVEL_TWO } from "../app/level-two.mjs";
import { levelBackgroundBlendAt, PARALLAX_SPEEDS } from "../app/level-background.mjs";

const root = fileURLToPath(new URL("../public/assets/backgrounds/", import.meta.url));
const stages = ["backyard", "street", "obstacle", "drainage", "main-street"];
const layers = ["far", "middle", "close"];

const runtimePath = (stage, layer) => `${root}/level2-${stage}-${layer}.png`;

test("Level 2 backgrounds provide five exact-size semantic parallax sets", async () => {
  for (const stage of stages) {
    for (const layer of layers) {
      const path = runtimePath(stage, layer);
      await access(path);
      const info = await sharp(path).metadata();
      assert.equal(info.width, 2048, `${stage}-${layer} width`);
      assert.equal(info.height, 716, `${stage}-${layer} height`);
    }
  }
});

test("far plates are opaque while middle and close plates mix visible and transparent pixels", async () => {
  for (const stage of stages) {
    for (const layer of layers) {
      const { data, info } = await sharp(runtimePath(stage, layer))
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      let transparent = 0;
      let visible = 0;
      let soft = 0;
      for (let offset = 3; offset < data.length; offset += info.channels) {
        if (data[offset] === 0) transparent += 1;
        else {
          visible += 1;
          if (data[offset] !== 255) soft += 1;
        }
      }
      if (layer === "far") {
        assert.equal(transparent, 0, `${stage}-far is opaque`);
      } else {
        assert.ok(transparent > 0, `${stage}-${layer} contains transparent space`);
        assert.ok(visible > 0, `${stage}-${layer} contains visible silhouettes`);
        assert.equal(soft, 0, `${stage}-${layer} uses hard alpha only`);
      }
    }
  }
});

test("far plates use a bounded hard value ladder instead of smooth sky gradients", async () => {
  for (const stage of stages) {
    const { data, info } = await sharp(runtimePath(stage, "far"))
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const channelValues = [new Set(), new Set(), new Set()];
    for (let offset = 0; offset < data.length; offset += info.channels) {
      channelValues[0].add(data[offset]);
      channelValues[1].add(data[offset + 1]);
      channelValues[2].add(data[offset + 2]);
    }
    for (const [channel, values] of channelValues.entries()) {
      assert.ok(values.size <= 9, `${stage}-far channel ${channel} has ${values.size} values`);
    }
  }
});

test("visible moving-plate boundaries contain no magenta key contamination", async () => {
  for (const stage of stages) {
    for (const layer of ["middle", "close"]) {
      const { data, info } = await sharp(runtimePath(stage, layer))
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      let contaminated = 0;
      for (let y = 0; y < info.height; y += 1) {
        for (let x = 0; x < info.width; x += 1) {
          const offset = (y * info.width + x) * info.channels;
          if (data[offset + 3] === 0) continue;
          const touchesTransparency = [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dx, dy]) => {
            const nextX = x + dx;
            const nextY = y + dy;
            if (nextX < 0 || nextX >= info.width || nextY < 0 || nextY >= info.height) return true;
            return data[(nextY * info.width + nextX) * info.channels + 3] === 0;
          });
          if (!touchesTransparency) continue;
          const magentaDominance = Math.min(data[offset], data[offset + 2]) - data[offset + 1];
          if (magentaDominance > 12) contaminated += 1;
        }
      }
      assert.equal(contaminated, 0, `${stage}-${layer} has ${contaminated} contaminated edge pixels`);
    }
  }
});

test("moving plates use object-shaped transparency instead of row-wide alpha masks", async () => {
  for (const stage of stages) {
    for (const layer of ["middle", "close"]) {
      const { data, info } = await sharp(runtimePath(stage, layer))
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
      assert.ok(mixedRows >= 24, `${stage}-${layer} has object-shaped alpha`);
    }
  }
});

test("substantial Level 2 middle silhouettes share runtime contact row 603", async () => {
  for (const stage of stages) {
    const { data, info } = await sharp(runtimePath(stage, "middle"))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const audit = groundedComponentBaselines(data, info, { baseline: 603 });
    const substantial = audit.components.filter(
      (component) => component.area >= audit.options.minimumArea,
    );
    assert.ok(substantial.length > 0, `${stage} has substantial middle silhouettes`);
    for (const component of substantial) {
      assert.ok(
        Math.abs(component.maxY - 603) <= 2,
        `${stage} component baseline ${component.maxY} should meet 603`,
      );
    }
  }
});

test("source documentation declares the Level 2 runtime baseline", async () => {
  const readme = await readFile(
    fileURLToPath(new URL("../concepts/level-two/README.md", import.meta.url)),
    "utf8",
  );
  assert.match(readme, /Runtime middle contact row: 603/);
});

test("Level 2 maps its five zones to five asset sets with four monotonic transitions", () => {
  assert.deepEqual(LEVEL_TWO.backgroundSets, [
    { zoneId: "moonlit-backyard", stage: "backyard" },
    { zoneId: "garbage-night-street", stage: "street" },
    { zoneId: "backyard-obstacle-course", stage: "obstacle" },
    { zoneId: "drainage-ditch", stage: "drainage" },
    { zoneId: "suburban-main-street", stage: "main-street" },
  ]);
  assert.equal(LEVEL_TWO.zones.length - 1, 4);
  for (const zone of LEVEL_TWO.zones.slice(0, -1)) {
    const samples = [-220, -110, 0, 110, 220].map((offset) => (
      levelBackgroundBlendAt(zone.endX + offset, LEVEL_TWO.zones).blend
    ));
    for (let index = 1; index < samples.length; index += 1) {
      assert.ok(samples[index] >= samples[index - 1], `${zone.id} blend remains monotonic`);
    }
  }
  assert.equal(LEVEL_TWO.zones.at(-1).landmark, "cul-de-sac");
  assert.equal(LEVEL_TWO.backgroundSets.at(-1).stage, "main-street");
});

test("Level 2 preserves the required parallax rates", () => {
  assert.deepEqual(PARALLAX_SPEEDS, { far: 0.018, middle: 0.055, close: 0.13 });
});

test("offline motion audit covers five forward/reverse sweeps and four boundaries", async () => {
  const artifact = fileURLToPath(
    new URL("../concepts/level-two/level2-parallax-motion-audit.png", import.meta.url),
  );
  const auditPath = fileURLToPath(
    new URL("../concepts/level-two/level2-parallax-motion-audit.json", import.meta.url),
  );
  await access(artifact);
  const metadata = await sharp(artifact).metadata();
  assert.equal(metadata.width, 960);
  assert.equal(metadata.height, 1620);
  const audit = JSON.parse(await readFile(auditPath, "utf8"));
  const chapters = audit.rows.filter(({ kind }) => kind === "chapter");
  const boundaries = audit.rows.filter(({ kind }) => kind === "boundary");
  assert.equal(chapters.length, 5);
  assert.equal(boundaries.length, 4);
  for (const chapter of chapters) {
    assert.deepEqual(chapter.reverse, [...chapter.forward].reverse());
    assert.equal(chapter.forward.at(-1) - chapter.forward[0], 960);
  }
  for (const boundary of boundaries) {
    for (let index = 1; index < boundary.blends.length; index += 1) {
      assert.ok(boundary.blends[index] >= boundary.blends[index - 1]);
    }
  }
  assert.equal(audit.summary.visibleTileSeams, 0);
  assert.ok(audit.summary.maxCloseCenterCoverage < 0.2);
});
