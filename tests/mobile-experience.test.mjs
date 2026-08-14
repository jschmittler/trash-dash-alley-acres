import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  clearInputState,
  readBrowserExperience,
  shouldInterruptBrowserExperience,
  subscribeBrowserExperience,
  toggleGameFullscreen,
} from "../app/mobile-experience.mjs";

const makeTarget = () => {
  const listeners = new Map();
  return {
    listeners,
    addEventListener(type, listener) {
      listeners.set(type, listener);
    },
    removeEventListener(type) {
      listeners.delete(type);
    },
  };
};

test("reads touch, orientation, and fullscreen capabilities", () => {
  const browserWindow = {
    matchMedia: (query) => ({ matches: query.includes("portrait") }),
  };
  const browserDocument = {
    fullscreenElement: { id: "game" },
    documentElement: { requestFullscreen() {} },
  };

  assert.deepEqual(readBrowserExperience(browserWindow, browserDocument), {
    touchFirst: false,
    portrait: true,
    fullscreen: true,
    fullscreenSupported: true,
  });
});

test("subscribes to and removes every viewport signal", () => {
  const browserWindow = makeTarget();
  const touchQuery = makeTarget();
  touchQuery.matches = true;
  const portraitQuery = makeTarget();
  portraitQuery.matches = false;
  browserWindow.matchMedia = (query) => (query.includes("portrait") ? portraitQuery : touchQuery);
  browserWindow.visualViewport = makeTarget();
  const browserDocument = makeTarget();
  const onChange = () => {};

  const unsubscribe = subscribeBrowserExperience(browserWindow, browserDocument, onChange);

  assert.deepEqual([...browserWindow.listeners.keys()].sort(), ["orientationchange", "resize", "visibilitychange"]);
  assert.deepEqual([...browserWindow.visualViewport.listeners.keys()], ["resize"]);
  assert.deepEqual([...browserDocument.listeners.keys()], ["fullscreenchange"]);
  assert.deepEqual([...touchQuery.listeners.keys()], ["change"]);
  assert.deepEqual([...portraitQuery.listeners.keys()], ["change"]);

  unsubscribe();

  assert.equal(browserWindow.listeners.size, 0);
  assert.equal(browserWindow.visualViewport.listeners.size, 0);
  assert.equal(browserDocument.listeners.size, 0);
  assert.equal(touchQuery.listeners.size, 0);
  assert.equal(portraitQuery.listeners.size, 0);
});

test("clears held and newly pressed input together", () => {
  const held = new Set(["ArrowRight", "Space"]);
  const pressed = new Set(["Space"]);

  clearInputState(held, pressed);

  assert.equal(held.size, 0);
  assert.equal(pressed.size, 0);
});

test("interrupts only for orientation changes or fullscreen exit", () => {
  const landscapeWindowed = { portrait: false, fullscreen: false };

  assert.equal(shouldInterruptBrowserExperience(landscapeWindowed, landscapeWindowed), false);
  assert.equal(shouldInterruptBrowserExperience(landscapeWindowed, { portrait: true, fullscreen: false }), true);
  assert.equal(shouldInterruptBrowserExperience({ portrait: false, fullscreen: true }, landscapeWindowed), true);
  assert.equal(shouldInterruptBrowserExperience(landscapeWindowed, { portrait: false, fullscreen: true }), false);
});

test("enters fullscreen even when orientation lock is rejected", async () => {
  let requested = 0;
  let lockedOrientation = null;
  const result = await toggleGameFullscreen(
    { requestFullscreen: async () => { requested += 1; } },
    { fullscreenElement: null },
    { lock: async (orientation) => { lockedOrientation = orientation; throw new Error("unsupported"); } },
  );

  assert.equal(result, "entered");
  assert.equal(requested, 1);
  assert.equal(lockedOrientation, "landscape");
});

test("exits fullscreen and reports rejected requests without throwing", async () => {
  let exited = 0;
  const exitResult = await toggleGameFullscreen(
    null,
    { fullscreenElement: {}, exitFullscreen: async () => { exited += 1; } },
  );
  const failedResult = await toggleGameFullscreen(
    { requestFullscreen: async () => { throw new Error("denied"); } },
    { fullscreenElement: null },
  );

  assert.equal(exitResult, "exited");
  assert.equal(exited, 1);
  assert.equal(failedResult, "failed");
});

test("Level 2 keeps the shared responsive canvas and landscape-safe touch deck", async () => {
  const [game, styles] = await Promise.all([
    readFile(new URL("../app/trash-dash-game.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(game, /devParams\?\.get\("level"\) === "2"/);
  assert.match(
    game,
    /className="game-cabinet"[\s\S]*className=\{`game-stage \$\{screen === "playing" \? "is-playing" : ""\}`\}[\s\S]*className="game-canvas"/,
  );
  assert.match(game, /className="touch-controls" aria-label="Touch game controls"/);

  assert.match(styles, /--safe-right:\s*env\(safe-area-inset-right, 0px\)/);
  assert.match(styles, /--safe-bottom:\s*env\(safe-area-inset-bottom, 0px\)/);
  assert.match(styles, /--safe-left:\s*env\(safe-area-inset-left, 0px\)/);
  assert.match(styles, /@media \(hover: none\) and \(pointer: coarse\) and \(orientation: landscape\)/);
  assert.match(
    styles,
    /\.touch-controls \{\s*inset:\s*auto\s*max\(12px, var\(--safe-right\)\)\s*max\(10px, var\(--safe-bottom\)\)\s*max\(12px, var\(--safe-left\)\);/,
  );
  assert.match(
    styles,
    /\.game-cabinet:fullscreen \.game-stage,[\s\S]*\.game-cabinet:-webkit-full-screen \.game-stage[\s\S]*max-height: calc\(100dvh - 46px - var\(--safe-top\) - var\(--safe-bottom\)\)/,
  );
});

test("touch-first landscape exposes the complete five-action input deck", async () => {
  const game = await readFile(new URL("../app/trash-dash-game.tsx", import.meta.url), "utf8");
  const controls = game.slice(game.indexOf('className="touch-controls"'), game.indexOf("</div>\n            </>", game.indexOf('className="touch-controls"')));

  assert.match(controls, /aria-label="Move left"[\s\S]*touchProps\("ArrowLeft"\)/);
  assert.match(controls, /aria-label="Move right"[\s\S]*touchProps\("ArrowRight"\)/);
  assert.match(controls, /aria-label="Sprint"[\s\S]*touchProps\("ShiftLeft"\)/);
  assert.match(controls, /aria-label="Run or use action"[\s\S]*touchProps\("KeyE"\)/);
  assert.match(controls, /aria-label="Jump"[\s\S]*touchProps\("Space"\)/);
});

test("Pocket Controls is an onboarding hint that dismisses with gameplay input", async () => {
  const game = await readFile(new URL("../app/trash-dash-game.tsx", import.meta.url), "utf8");
  const startGame = game.slice(game.indexOf("const startGame = useCallback"), game.indexOf("const continueCampaign = useCallback"));
  const onKeyDown = game.slice(game.indexOf("const onKeyDown ="), game.indexOf("const onKeyUp ="));
  const touchProps = game.slice(game.indexOf("const touchProps ="), game.indexOf("const showOrientationPrompt"));

  assert.match(game, /const \[showTouchDeckHint, setShowTouchDeckHint\] = useState\(true\)/);
  assert.match(game, /const dismissTouchDeckHint = useCallback\(\(\) => \{\s*if \(screenRef\.current === "playing"\) setShowTouchDeckHint\(false\);\s*\}, \[\]\)/);
  assert.match(startGame, /setShowTouchDeckHint\(true\);/);
  assert.match(onKeyDown, /dismissTouchDeckHint\(\);/);
  assert.match(touchProps, /dismissTouchDeckHint\(\);/);
  assert.match(game, /\{showTouchDeckHint && \(<div className="touch-deck-hint" aria-hidden="true">/);
});

test("every game-screen transition clears held and newly pressed input", async () => {
  const game = await readFile(new URL("../app/trash-dash-game.tsx", import.meta.url), "utf8");
  const changeScreen = game.slice(
    game.indexOf("const changeScreen = useCallback"),
    game.indexOf("const clearHeldInput = useCallback"),
  );
  const startGame = game.slice(
    game.indexOf("const startGame = useCallback"),
    game.indexOf("const continueCampaign = useCallback"),
  );

  assert.match(changeScreen, /clearInputState\(keysRef\.current, pressedRef\.current\)/);
  assert.match(startGame, /clearHeldInput\(\)/);
  assert.match(game, /const onBlur = \(\) => interruptGame\(\)/);
  assert.match(game, /visibilityState === "hidden"\) interruptGame\(\)/);
  assert.match(game, /shouldInterruptBrowserExperience\(previous, next\)[\s\S]{0,120}interruptGame\(\)/);
});

test("the fullscreen control itself interrupts play when an exit event is delayed or absent", async () => {
  const game = await readFile(new URL("../app/trash-dash-game.tsx", import.meta.url), "utf8");
  const handler = game.slice(
    game.indexOf("const handleFullscreen = useCallback"),
    game.indexOf("useEffect(() =>", game.indexOf("const handleFullscreen = useCallback")),
  );

  assert.match(handler, /const previous = browserExperienceRef\.current/);
  assert.match(handler, /shouldInterruptBrowserExperience\(previous, next\)[\s\S]{0,100}interruptGame\(\)/);
});

test("responsive shell protects browser chrome, safe areas, and touch interaction", async () => {
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");

  for (const edge of ["top", "right", "bottom", "left"]) {
    assert.match(styles, new RegExp(`--safe-${edge}:\\s*env\\(safe-area-inset-${edge}, 0px\\)`));
  }
  assert.match(styles, /\.hud \{[\s\S]*padding:[\s\S]*var\(--safe-top\)[\s\S]*var\(--safe-right\)[\s\S]*var\(--safe-left\)/);
  assert.match(styles, /\.touch-controls \{[\s\S]*var\(--safe-right\)[\s\S]*var\(--safe-bottom\)[\s\S]*var\(--safe-left\)/);
  assert.match(styles, /\.touch-button \{[\s\S]*width: clamp\(48px,[\s\S]*height: clamp\(48px,/);
  assert.match(styles, /overscroll-behavior: none/);
  assert.match(styles, /\.game-canvas \{[\s\S]*touch-action: none;[\s\S]*user-select: none;/);
  assert.match(styles, /\.touch-button \{[\s\S]*touch-action: none;[\s\S]*-webkit-user-select: none;/);
  assert.match(styles, /100svh/);
  assert.match(styles, /100dvh/);
  const narrowViewportRules = styles.slice(
    styles.indexOf("@media (max-width: 760px)"),
    styles.indexOf("@media (hover: none), (pointer: coarse)"),
  );
  assert.doesNotMatch(narrowViewportRules, /\.touch-controls \{\s*display: flex;/);
  assert.match(styles, /@media \(hover: none\), \(pointer: coarse\) \{\s*\.touch-controls \{\s*display: flex;/);
});

test("short desktop viewports preserve the 16:9 cabinet instead of stretching the canvas", async () => {
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const baseStageStart = styles.indexOf("\n.game-stage {") + 1;
  const baseStage = styles.slice(baseStageStart, styles.indexOf(".game-stage::after", baseStageStart));

  assert.match(baseStage, /width: min\(100%, calc\(\(100svh - 112px\) \* 16 \/ 9\)\)/);
  assert.match(baseStage, /width: min\(100%, calc\(\(100dvh - 112px\) \* 16 \/ 9\)\)/);
  assert.match(baseStage, /height: auto/);
  assert.match(baseStage, /aspect-ratio: 16 \/ 9/);
  assert.doesNotMatch(baseStage, /max-height:/);
});
