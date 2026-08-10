export const MUSIC_VOLUME = 0.32;
const MUSIC_SOURCE_IDENTITIES = new WeakMap();
const DISPOSED_MUSIC = new WeakSet();
const FALLBACK_MUSIC_BASE = "https://trash-dash.invalid/";

export const GAME_MUSIC_TRACKS = Object.freeze({
  "level-1": Object.freeze({
    exploration: "assets/audio/raccoon-rush-loop.m4a",
    boss: "assets/audio/trash-heap-tyrant-loop.m4a",
  }),
  "level-2": Object.freeze({
    exploration: "assets/audio/raccoon-rush-loop.m4a",
    boss: "assets/audio/trash-heap-tyrant-loop.m4a",
  }),
});

export function gameMusicTrackFor(levelId, role) {
  return GAME_MUSIC_TRACKS[levelId]?.[role] ?? null;
}

function canonicalMusicSource(source, base = globalThis.location?.href) {
  if (typeof source !== "string" || source.length === 0) return null;
  try {
    return new URL(source, base || FALLBACK_MUSIC_BASE).href;
  } catch {
    return source;
  }
}

function musicSourceIdentity(music) {
  if (!music) return null;
  const known = MUSIC_SOURCE_IDENTITIES.get(music);
  if (known) return known;
  const exposed = music.currentSrc || music.src || music.source;
  return canonicalMusicSource(exposed, music.currentSrc || music.src || undefined);
}

function musicUsesSource(music, source) {
  const current = musicSourceIdentity(music);
  const requested = canonicalMusicSource(source, music?.currentSrc || music?.src || undefined);
  return current !== null && current === requested;
}

export function createGameMusic(source, AudioConstructor = globalThis.Audio) {
  if (typeof AudioConstructor !== "function") return null;
  const music = new AudioConstructor(source);
  MUSIC_SOURCE_IDENTITIES.set(
    music,
    canonicalMusicSource(music.currentSrc || music.src || source),
  );
  music.loop = true;
  music.preload = "auto";
  music.volume = MUSIC_VOLUME;
  return music;
}

export async function playGameMusic(music, { muted = false, restart = false } = {}) {
  if (!music) return false;
  music.muted = muted;
  if (restart) music.currentTime = 0;

  try {
    await music.play();
    return true;
  } catch {
    return false;
  }
}

export function pauseGameMusic(music) {
  music?.pause();
}

export function setGameMusicMuted(music, muted) {
  if (music) music.muted = muted;
}

export function disposeGameMusic(music) {
  if (!music || DISPOSED_MUSIC.has(music)) return;
  DISPOSED_MUSIC.add(music);
  music.pause();
  music.removeAttribute("src");
  music.load();
}

export async function switchGameMusic(
  current,
  source,
  {
    muted = false,
    AudioConstructor = globalThis.Audio,
    fadeMs = 360,
    wait = (delay) => new Promise((resolve) => globalThis.setTimeout(resolve, delay)),
    onReplacementReady = () => {},
    shouldContinue = () => true,
  } = {},
) {
  if (musicUsesSource(current, source)) {
    await playGameMusic(current, { muted });
    return current;
  }
  if (!shouldContinue()) return current;
  const next = createGameMusic(source, AudioConstructor);
  if (!next) return current;
  next.muted = muted;
  next.volume = fadeMs > 0 ? 0 : MUSIC_VOLUME;
  if (!await playGameMusic(next, { muted, restart: true })) {
    disposeGameMusic(next);
    return current;
  }
  if (!shouldContinue()) {
    disposeGameMusic(next);
    return current;
  }
  onReplacementReady(next);
  if (!shouldContinue()) {
    disposeGameMusic(next);
    return current;
  }

  if (fadeMs > 0) {
    const steps = 12;
    const delay = fadeMs / steps;
    for (let step = 1; step <= steps; step += 1) {
      const progress = step / steps;
      next.volume = MUSIC_VOLUME * progress;
      if (current) current.volume = MUSIC_VOLUME * (1 - progress);
      await wait(delay);
      if (!shouldContinue()) {
        disposeGameMusic(next);
        if (current) current.volume = MUSIC_VOLUME;
        return current;
      }
    }
  }

  disposeGameMusic(current);
  next.volume = MUSIC_VOLUME;
  return next;
}

export function createGameMusicOwner() {
  let current = null;
  let pending = null;
  let generation = 0;
  let playing = false;
  let muted = false;

  const eachOwned = (visit) => {
    if (current) visit(current);
    if (pending && pending !== current) visit(pending);
  };

  const owner = {
    get current() {
      return current;
    },
    get pending() {
      return pending;
    },
    replace(next, { restart = false, active = true, muted: nextMuted = muted } = {}) {
      generation += 1;
      eachOwned((music) => {
        if (music !== next) disposeGameMusic(music);
      });
      current = next;
      pending = null;
      playing = active;
      muted = nextMuted;
      setGameMusicMuted(current, muted);
      if (playing) void playGameMusic(current, { muted, restart });
      else pauseGameMusic(current);
      return current;
    },
    pause() {
      playing = false;
      eachOwned(pauseGameMusic);
    },
    resume() {
      playing = true;
      eachOwned((music) => void playGameMusic(music, { muted }));
    },
    setMuted(nextMuted) {
      muted = Boolean(nextMuted);
      eachOwned((music) => setGameMusicMuted(music, muted));
      if (!muted && playing) {
        eachOwned((music) => void playGameMusic(music, { muted }));
      }
    },
    async switch(source, options = {}) {
      const switchGeneration = ++generation;
      const outgoing = current;
      const next = await switchGameMusic(outgoing, source, {
        ...options,
        muted,
        onReplacementReady: (replacement) => {
          if (switchGeneration !== generation) {
            disposeGameMusic(replacement);
            return;
          }
          pending = replacement;
          setGameMusicMuted(replacement, muted);
          if (!playing) pauseGameMusic(replacement);
          options.onReplacementReady?.(replacement);
        },
        shouldContinue: () => switchGeneration === generation
          && (options.shouldContinue?.() ?? true),
      });
      if (switchGeneration !== generation) {
        return current;
      }
      pending = null;
      current = next;
      setGameMusicMuted(current, muted);
      if (!playing) pauseGameMusic(current);
      return current;
    },
    dispose() {
      generation += 1;
      eachOwned(disposeGameMusic);
      current = null;
      pending = null;
      playing = false;
    },
  };

  return Object.freeze(owner);
}
