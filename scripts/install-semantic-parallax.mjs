import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { normalizeGroundedComponents } from "./parallax-baseline.mjs";

const [, , farSource, middleSource, closeSource, stage = "creek"] = process.argv;

if (!farSource || !middleSource || !closeSource) {
  throw new Error(
    "Usage: node scripts/install-semantic-parallax.mjs <far> <middle> <close> [stage]",
  );
}

const outputRoot = new URL("../public/assets/backgrounds/", import.meta.url);
const outputPath = (layer) =>
  fileURLToPath(new URL(`level1-${stage}-${layer}.png`, outputRoot));

async function removeMagentaKey(source, normalizeBaseline = false) {
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let offset = 0; offset < data.length; offset += info.channels) {
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    const isKeyPixel =
      red > 100 &&
      blue > 80 &&
      green < 120 &&
      red - green > 60 &&
      blue - green > 50;

    if (isKeyPixel) {
      data[offset + 3] = 0;
    }
  }

  const normalized = normalizeBaseline
    ? normalizeGroundedComponents(data, info)
    : { data, info };

  return sharp(normalized.data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels,
    },
  });
}

await Promise.all([
  sharp(farSource)
    .resize(2048, 716, { fit: "fill", kernel: sharp.kernel.nearest })
    .png()
    .toFile(outputPath("far")),
  (await removeMagentaKey(middleSource, true))
    .resize(2048, 716, { fit: "fill", kernel: sharp.kernel.nearest })
    .png()
    .toFile(outputPath("middle")),
  (await removeMagentaKey(closeSource))
    .resize(2048, 716, { fit: "fill", kernel: sharp.kernel.nearest })
    .png()
    .toFile(outputPath("close")),
]);

console.log(`Installed semantic parallax plates for ${stage}.`);
