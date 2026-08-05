import assert from "node:assert/strict";
import test from "node:test";

import {
  clearInputState,
  readBrowserExperience,
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

  assert.deepEqual([...browserWindow.listeners.keys()].sort(), ["orientationchange", "resize"]);
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

test("enters fullscreen even when orientation lock is rejected", async () => {
  let requested = 0;
  const result = await toggleGameFullscreen(
    { requestFullscreen: async () => { requested += 1; } },
    { fullscreenElement: null },
    { lock: async () => { throw new Error("unsupported"); } },
  );

  assert.equal(result, "entered");
  assert.equal(requested, 1);
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
