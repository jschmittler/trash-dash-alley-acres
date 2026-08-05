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
