import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  GAME_MUSIC_TRACKS,
  MUSIC_VOLUME,
  createGameMusic,
  disposeGameMusic,
  gameMusicTrackFor,
  pauseGameMusic,
  playGameMusic,
  setGameMusicMuted,
  switchGameMusic,
} from "../app/music-controller.mjs";

class FakeAudio {
  static instances = [];

  constructor(source) {
    this.source = source;
    this.currentTime = 9;
    this.muted = false;
    this.playCount = 0;
    this.pauseCount = 0;
    this.loadCount = 0;
    this.removed = [];
    this.paused = true;
    this.listeners = [];
    FakeAudio.instances.push(this);
  }

  async play() {
    this.playCount += 1;
    this.paused = false;
  }

  pause() {
    this.pauseCount += 1;
    this.paused = true;
  }

  removeAttribute(name) {
    this.removed.push(name);
  }

  load() {
    this.loadCount += 1;
  }

  addEventListener(type) {
    this.listeners.push(type);
  }
}

test.beforeEach(() => {
  FakeAudio.instances = [];
});

test("declares the existing campaign track roles without inventing a Level 2 score", () => {
  assert.deepEqual(GAME_MUSIC_TRACKS, {
    "level-1": {
      exploration: "assets/audio/raccoon-rush-loop.m4a",
      boss: "assets/audio/trash-heap-tyrant-loop.m4a",
    },
    "level-2": {
      exploration: "assets/audio/raccoon-rush-loop.m4a",
      boss: "assets/audio/trash-heap-tyrant-loop.m4a",
    },
  });
  assert.equal(gameMusicTrackFor("level-1", "exploration"), GAME_MUSIC_TRACKS["level-1"].exploration);
  assert.equal(gameMusicTrackFor("level-2", "boss"), GAME_MUSIC_TRACKS["level-2"].boss);
  assert.equal(gameMusicTrackFor("unknown", "boss"), null);
});

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

  music.currentTime = 4;
  pauseGameMusic(music);
  assert.equal(await playGameMusic(music, { muted: true }), true);
  assert.equal(music.currentTime, 4);
  assert.equal(music.playCount, 2);

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
  assert.equal(current.loadCount, 1);
  assert.equal(current.paused, true);
  assert.equal(next.paused, false);
});

test("short fades use deterministic steps and leave only the replacement playing", async () => {
  const current = new FakeAudio("/level.m4a");
  current.volume = MUSIC_VOLUME;
  current.paused = false;
  const waits = [];

  const next = await switchGameMusic(current, "/boss.m4a", {
    AudioConstructor: FakeAudio,
    fadeMs: 24,
    wait: async (delay) => waits.push(delay),
  });

  assert.deepEqual(waits, Array(12).fill(2));
  assert.equal(current.volume, 0);
  assert.equal(current.paused, true);
  assert.equal(next.volume, MUSIC_VOLUME);
  assert.equal(next.paused, false);
});

test("same-track switches reuse one player while applying mute and resuming safely", async () => {
  const current = new FakeAudio("/level.m4a");

  const next = await switchGameMusic(current, "/level.m4a", {
    muted: true,
    AudioConstructor: FakeAudio,
    fadeMs: 0,
  });

  assert.equal(next, current);
  assert.equal(FakeAudio.instances.length, 1);
  assert.equal(current.muted, true);
  assert.equal(current.playCount, 1);
  assert.equal(current.removed.length, 0);
});

test("rejected replacement playback is contained and keeps the current player alive", async () => {
  class RejectingAudio extends FakeAudio {
    async play() {
      this.playCount += 1;
      throw new Error("autoplay blocked");
    }
  }
  const current = new FakeAudio("/level.m4a");
  current.paused = false;

  const result = await switchGameMusic(current, "/boss.m4a", {
    AudioConstructor: RejectingAudio,
    fadeMs: 0,
  });
  const rejected = FakeAudio.instances.at(-1);

  assert.equal(result, current);
  assert.equal(current.pauseCount, 0);
  assert.equal(current.removed.length, 0);
  assert.equal(rejected.pauseCount, 1);
  assert.deepEqual(rejected.removed, ["src"]);
  assert.equal(rejected.loadCount, 1);
});

test("repeated switches dispose every predecessor without stacking players or listeners", async () => {
  const exploration = new FakeAudio("/level.m4a");
  exploration.paused = false;
  const boss = await switchGameMusic(exploration, "/boss.m4a", {
    AudioConstructor: FakeAudio,
    fadeMs: 0,
  });
  const restarted = await switchGameMusic(boss, "/level.m4a", {
    AudioConstructor: FakeAudio,
    fadeMs: 0,
  });

  assert.equal(FakeAudio.instances.length, 3);
  assert.deepEqual(FakeAudio.instances.map((music) => music.listeners), [[], [], []]);
  assert.deepEqual(FakeAudio.instances.map((music) => music.paused), [true, true, false]);
  assert.deepEqual(FakeAudio.instances.slice(0, -1).map((music) => music.removed), [["src"], ["src"]]);
  assert.equal(restarted.source, "/level.m4a");
});

test("runtime resolves both level roles through the canonical track table", async () => {
  const game = await readFile(new URL("../app/trash-dash-game.tsx", import.meta.url), "utf8");

  assert.match(game, /const initialMusicRole = bossRoute\?\.activateArena \? "boss" : "exploration"/);
  assert.match(game, /gameMusicTrackFor\(levelId, initialMusicRole\)/);
  assert.match(game, /gameMusicTrackFor\(world\.levelId, "boss"\)/);
  assert.doesNotMatch(game, /assetUrl\("assets\/audio\/(?:raccoon-rush|trash-heap-tyrant)-loop\.m4a"\)/);
});
