import assert from "node:assert/strict";
import test from "node:test";

import {
  MUSIC_VOLUME,
  createGameMusic,
  disposeGameMusic,
  pauseGameMusic,
  playGameMusic,
  setGameMusicMuted,
  switchGameMusic,
} from "../app/music-controller.mjs";

class FakeAudio {
  constructor(source) {
    this.source = source;
    this.currentTime = 9;
    this.muted = false;
    this.playCount = 0;
    this.pauseCount = 0;
    this.loadCount = 0;
    this.removed = [];
  }

  async play() {
    this.playCount += 1;
  }

  pause() {
    this.pauseCount += 1;
  }

  removeAttribute(name) {
    this.removed.push(name);
  }

  load() {
    this.loadCount += 1;
  }
}

test("creates low-volume looping music without starting playback", () => {
  const music = createGameMusic("/music.m4a", FakeAudio);

  assert.equal(music.source, "/music.m4a");
  assert.equal(music.loop, true);
  assert.equal(music.preload, "auto");
  assert.equal(music.volume, MUSIC_VOLUME);
  assert.equal(music.playCount, 0);
});

test("starts or restarts music and applies shared mute state", async () => {
  const music = new FakeAudio("/music.m4a");

  assert.equal(await playGameMusic(music, { muted: true, restart: true }), true);
  assert.equal(music.currentTime, 0);
  assert.equal(music.muted, true);
  assert.equal(music.playCount, 1);

  setGameMusicMuted(music, false);
  assert.equal(music.muted, false);
});

test("contains playback rejection and lets gameplay continue", async () => {
  const music = new FakeAudio("/music.m4a");
  music.play = async () => {
    throw new Error("blocked");
  };

  assert.equal(await playGameMusic(music), false);
});

test("pauses and disposes a music element", () => {
  const music = new FakeAudio("/music.m4a");

  pauseGameMusic(music);
  disposeGameMusic(music);

  assert.equal(music.pauseCount, 2);
  assert.deepEqual(music.removed, ["src"]);
  assert.equal(music.loadCount, 1);
});

test("switches music sources while preserving mute and disposing the old track", async () => {
  const current = new FakeAudio("/level.m4a");
  current.volume = MUSIC_VOLUME;
  const next = await switchGameMusic(current, "/boss.m4a", {
    muted: true,
    AudioConstructor: FakeAudio,
    fadeMs: 0,
  });

  assert.equal(next.source, "/boss.m4a");
  assert.equal(next.muted, true);
  assert.equal(next.volume, MUSIC_VOLUME);
  assert.equal(next.playCount, 1);
  assert.equal(current.pauseCount, 1);
  assert.deepEqual(current.removed, ["src"]);
});
