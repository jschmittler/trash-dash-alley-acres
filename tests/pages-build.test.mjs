import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const pagesRoot = new URL("../dist-pages/", import.meta.url);

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(entryPath)));
    else files.push(entryPath);
  }

  return files;
}

test("builds a complete GitHub Pages artifact under the repository base path", async () => {
  const html = await readFile(new URL("index.html", pagesRoot), "utf8");
  assert.match(html, /<title>Trash Dash: Alley Acres<\/title>/);
  assert.match(html, /\/trash-dash-alley-acres\/assets\//);

  const files = await collectFiles(fileURLToPath(pagesRoot));
  const scripts = files.filter((file) => file.endsWith(".js"));
  const javascript = (await Promise.all(scripts.map((file) => readFile(file, "utf8")))).join("\n");

  assert.match(javascript, /\/trash-dash-alley-acres\//);
  assert.match(javascript, /assets\/player-motion\.png/);
  assert.match(javascript, /assets\/recycle-crates-v2\.png/);
  assert.doesNotMatch(javascript, /["']\/assets\/player-motion\.png/);

  await access(new URL(".nojekyll", pagesRoot));
  await access(new URL("assets/player-motion.png", pagesRoot));
  await access(new URL("assets/recycle-crates-v2.png", pagesRoot));
  await access(new URL("og.png", pagesRoot));
});
