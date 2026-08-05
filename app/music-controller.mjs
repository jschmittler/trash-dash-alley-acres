export const MUSIC_VOLUME = 0.32;

export function createGameMusic(source, AudioConstructor = globalThis.Audio) {
  if (typeof AudioConstructor !== "function") return null;
  const music = new AudioConstructor(source);
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
  if (!music) return;
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
  } = {},
) {
  if (current?.source === source || current?.src === source) return current;
  const next = createGameMusic(source, AudioConstructor);
  if (!next) return current;
  next.muted = muted;
  next.volume = fadeMs > 0 ? 0 : MUSIC_VOLUME;
  if (!await playGameMusic(next, { muted, restart: true })) {
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
      await new Promise((resolve) => globalThis.setTimeout(resolve, delay));
    }
  }

  disposeGameMusic(current);
  next.volume = MUSIC_VOLUME;
  return next;
}
