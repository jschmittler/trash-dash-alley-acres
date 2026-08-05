import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the finished game shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Trash Dash: Alley Acres<\/title>/i);
  assert.match(html, /Trash Dash/);
  assert.match(html, /Alley Acres/);
  assert.match(html, /brief-pinned-raccoon-world/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("ships the playable assets and removes the starter preview", async () => {
  const [game, styles, packageJson] = await Promise.all([
    readFile(new URL("../app/trash-dash-game.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(game, /requestAnimationFrame/);
  assert.match(game, /raccoon-sprites\.png/);
  assert.match(game, /touch-controls/);
  assert.match(game, /localStorage/);
  assert.match(game, /const camera = Math\.round\(world\.cameraX\)/);
  assert.match(game, /else drawSprite\(sprites\.trashCan, x, y, 32, 34\)/);
  assert.match(game, /player-motion\.png/);
  assert.match(game, /enemy-motion\.png/);
  assert.match(game, /hazard-motion\.png/);
  assert.match(game, /midground-props\.png/);
  assert.match(game, /ground-seamless\.png/);
  assert.match(game, /const drawBranchPlatform/);
  assert.match(game, /const drawMetalPlatform/);
  assert.match(game, /const frameIndex = Math\.floor\(enemy\.phase\) % 4/);
  assert.match(game, /Math\.sin\(world\.elapsed \* 1\.65 \+ pickup\.phase\) \* 2/);
  assert.match(game, /enemy\.y = enemy\.surfaceY - enemy\.h/);
  assert.doesNotMatch(game, /Math\.floor\(pickup\.phase\).*sprites\.trashCan/);
  assert.doesNotMatch(game, /drawSprite\(sprites\.(?:branch|metal)/);
  assert.match(styles, /image-rendering:\s*pixelated/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await access(new URL("../public/assets/raccoon-sprites.png", import.meta.url));
  await access(new URL("../public/assets/player-motion.png", import.meta.url));
  await access(new URL("../public/assets/enemy-motion.png", import.meta.url));
  await access(new URL("../public/assets/hazard-motion.png", import.meta.url));
  await access(new URL("../public/assets/midground-props.png", import.meta.url));
  await access(new URL("../public/assets/ground-seamless.png", import.meta.url));
  await access(new URL("../public/og.png", import.meta.url));
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
});
