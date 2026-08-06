import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

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
  const [game, characterProfiles, mobileExperience, musicController, styles, packageJson] = await Promise.all([
    readFile(new URL("../app/trash-dash-game.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/playable-character.mjs", import.meta.url), "utf8"),
    readFile(new URL("../app/mobile-experience.mjs", import.meta.url), "utf8"),
    readFile(new URL("../app/music-controller.mjs", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  const enemySource = game.slice(game.indexOf("const initialEnemies"), game.indexOf("const initialPickups"));

  assert.match(game, /requestAnimationFrame/);
  assert.match(game, /raccoon-sprites\.png/);
  assert.match(game, /touch-controls/);
  assert.match(game, /Enter fullscreen/);
  assert.match(game, /Rotate for the best view/);
  assert.match(game, /onLostPointerCapture/);
  assert.match(game, /character-selection/);
  assert.match(game, /confirm-character/);
  assert.match(game, /Choose your raccoon/);
  assert.match(game, /createCharacterSelectionState/);
  assert.match(styles, /character-cards/);
  assert.match(game, /aria-label="Sprint"/);
  assert.match(game, /visibilityState === "hidden"/);
  assert.match(game, /raccoon-rush-loop\.m4a/);
  assert.match(game, /playGameMusic/);
  assert.match(game, /pauseGameMusic/);
  assert.match(game, /localStorage/);
  assert.match(game, /const camera = Math\.round\(world\.cameraX\)/);
  assert.match(game, /trash-pickups-motion\.png/);
  assert.match(game, /taco-power-motion\.png/);
  assert.match(game, /dumpster-holy-atlas\.png/);
  assert.match(game, /DUMPSTER_GOAL_WORLD_X/);
  assert.match(game, /dumpsterRevealProgress/);
  assert.doesNotMatch(game, /midgroundProps\.checkpoint,[\s\S]{0,160}6288 - camera/);
  assert.match(game, /enemy-variety-motion\.png/);
  assert.match(game, /type PickupKind = "trash" \| "taco" \| "cap"/);
  assert.match(game, /const flyingEnemies = new Set<EnemyKind>/);
  assert.match(game, /\| "snake" \| "spider" \| "rat" \| "hedgehog"/);
  assert.match(game, /from "\.\/level-one\.mjs"/);
  assert.match(enemySource, /LEVEL_ONE\.encounters/);
  assert.doesNotMatch(enemySource, /makeEnemy\("(?:slime|bat|beetle|moth|rat|hedgehog|crow|boar|frog)"/);
  assert.match(game, /createEnemyPatrol/);
  assert.match(game, /patrolMinX,/);
  assert.match(game, /LEVEL_ONE\.boss\.arenaStartX/);
  assert.doesNotMatch(game, /makeEnemy\("bottle"/);
  assert.doesNotMatch(game, /enemy\.kind === "bottle"/);
  assert.doesNotMatch(game, /\bcrab\b/);
  assert.match(characterProfiles, /player-hero-motion\.png/);
  assert.match(characterProfiles, /trashy-selection-portrait\.png/);
  assert.match(characterProfiles, /jimothy-selection-portrait\.png/);
  assert.match(game, /enemy-motion\.png/);
  assert.match(game, /assets\/generated\/decorative-atlas\.png/);
  assert.match(game, /assets\/generated\/branch-platform-strip\.png/);
  assert.match(game, /assets\/generated\/metal-platform-strip\.png/);
  assert.match(game, /ground-seamless\.png/);
  assert.match(game, /drawPlatformStrip/);
  assert.match(game, /const frameIndex = Math\.floor\(enemy\.phase\) % 4/);
  assert.match(game, /nextEnemyIntent/);
  assert.match(game, /animationState: keyof typeof BOSS_ANIMATIONS/);
  assert.match(game, /const flip = enemy\.facing < 0/);
  assert.match(game, /boss-motion\.png/);
  assert.match(game, /selectBossAnimation/);
  assert.match(game, /BOSS_ANIMATIONS/);
  assert.match(game, /activateBossArena/);
  assert.match(game, /clampArenaPlayerX/);
  assert.match(game, /bossArenaCameraX/);
  assert.match(game, /createBossTransition/);
  assert.match(game, /advanceBossTransition/);
  assert.match(game, /!powerupPausedRef\.current/);
  assert.match(game, /showPowerupNotice\("taco"\)/);
  assert.match(game, /showPowerupNotice\("cap"\)/);
  assert.match(game, /powerup-flash/);
  assert.match(game, /createPowerupNotice/);
  assert.match(game, /const activated = activateBossArena\(world\.enemies\)/);
  assert.match(game, /trash-heap-tyrant-loop\.m4a/);
  assert.match(game, /arenaActive: boolean/);
  assert.doesNotMatch(game, /bossFrameIndex\(enemy\.phase\)/);
  assert.doesNotMatch(game, /sprites\.bossHit/);
  assert.doesNotMatch(game, /const flip = enemy\.vx < 0/);
  assert.match(game, /beginPlayerHurt/);
  assert.match(game, /advanceHurtTimer/);
  assert.match(game, /resolvePitFall/);
  assert.match(game, /pendingDamage: "shrink" \| "respawn" \| "gameover" \| null/);
  assert.match(characterProfiles, /player-hero-motion\.png/);
  assert.match(game, /selectCharacterAnimation/);
  assert.match(characterProfiles, /selectPlayerAnimation/);
  assert.match(game, /PLAYER_ANIMATIONS/);
  assert.match(game, /animationFrame/);
  assert.match(game, /isTailSwipeActive\(playerFrameIndex\)/);
  assert.match(game, /shrinkTimer: number/);
  assert.match(game, /endSequence: "won" \| "gameover" \| null/);
  assert.match(game, /player\.endSequence = "won"/);
  assert.match(game, /YOU WIN!/);
  assert.match(game, /victory-confetti/);
  assert.match(game, /victoryRecord/);
  assert.match(game, /NEW BEST!/);
  assert.doesNotMatch(game, /const groundedFrames =/);
  assert.doesNotMatch(game, /player\.large \? sprites\.largeHurt : sprites\.smallHurt/);
  assert.doesNotMatch(game, /player\.y > HEIGHT \+ 120\) \{\s*hurtPlayer\(world, 0\)/);
  assert.match(game, /Math\.sin\(world\.elapsed \* 1\.65 \+ pickup\.phase\) \* 2/);
  assert.match(game, /flyingEnemies\.has\(enemy\.kind\).*Math\.sin/);
  assert.doesNotMatch(game, /Math\.floor\(pickup\.phase\).*sprites\.trashCan/);
  assert.doesNotMatch(game, /drawSprite\(sprites\.(?:branch|metal)/);
  assert.doesNotMatch(game, /context\.fillRect\(0, 405, WIDTH/);
  assert.match(styles, /image-rendering:\s*pixelated/);
  assert.match(styles, /safe-area-inset-top/);
  assert.match(styles, /100dvh/);
  assert.match(styles, /100svh/);
  assert.match(styles, /:-webkit-full-screen/);
  assert.match(styles, /transform: translateY\(-50%\)/);
  assert.match(styles, /touch-action: none/);
  assert.match(styles, /orientation:\s*landscape/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(styles, /powerup-text/);
  assert.match(styles, /powerup-rays/);
  assert.match(styles, /victory-wash/);
  assert.match(styles, /confetti-fall/);
  assert.match(mobileExperience, /fullscreenchange/);
  assert.match(mobileExperience, /orientationchange/);
  assert.match(mobileExperience, /clearInputState/);
  assert.match(musicController, /music\.loop = true/);
  assert.match(musicController, /MUSIC_VOLUME = 0\.32/);
  assert.match(musicController, /catch/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await access(new URL("../public/assets/raccoon-sprites.png", import.meta.url));
  await access(new URL("../public/assets/enemy-motion.png", import.meta.url));
  await access(new URL("../public/assets/audio/raccoon-rush-loop.m4a", import.meta.url));
  await access(new URL("../public/assets/generated/enemy-variety-motion.png", import.meta.url));
  await access(new URL("../public/assets/generated/trash-pickups-motion.png", import.meta.url));
  await access(new URL("../public/assets/generated/taco-power-motion.png", import.meta.url));
  await access(new URL("../public/assets/generated/jimothy-hero-motion.png", import.meta.url));
  await access(new URL("../public/assets/generated/jimothy-selection.png", import.meta.url));
  await access(new URL("../public/assets/generated/trashy-selection-portrait.png", import.meta.url));
  await access(new URL("../public/assets/generated/jimothy-selection-portrait.png", import.meta.url));
  await access(new URL("../public/assets/generated/decorative-atlas.png", import.meta.url));
  await access(new URL("../public/assets/generated/branch-platform-strip.png", import.meta.url));
  await access(new URL("../public/assets/generated/metal-platform-strip.png", import.meta.url));
  await access(new URL("../public/assets/ground-seamless.png", import.meta.url));
  await access(new URL("../public/og.png", import.meta.url));
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
});
