const animation = (row, frames, fps, loop = false) => Object.freeze({
  row, frames, fps, loop, cellWidth: 256, cellHeight: 192,
});

export const BRUTUS_ANIMATIONS = Object.freeze({
  idle: animation(0, 2, 3, true),
  sniff: animation(1, 2, 4, true),
  bark: animation(2, 2, 6),
  charge: animation(3, 4, 10, true),
  crash: animation(4, 1, 1),
  "stunned-open": animation(5, 2, 4, true),
  hit: animation(6, 3, 8),
  recover: animation(7, 2, 5),
  "defeat-slide": animation(8, 2, 6),
  "defeat-shake": animation(9, 2, 8),
  "defeat-exit": animation(10, 2, 7, true),
});

export const BRUTUS_DURATIONS = Object.freeze({
  intro: 0.7,
  sniff: 0.65,
  bark: 0.52,
  charge: Object.freeze({ 1: 1.25, 2: 1.05, 3: 0.9 }),
  "stunned-open": 0.78,
  hit: 0.45,
  recover: 0.5,
  "defeat-slide": 0.55,
  "defeat-shake": 0.5,
  "defeat-exit": 0.55,
  sprinkler: 0.72,
});

const phaseFromHp = (hp) => Math.min(3, Math.max(1, 4 - hp));
const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
const approach = (value, target, amount) => (
  value < target ? Math.min(target, value + amount) : Math.max(target, value - amount)
);
const timerFor = (mode, phase = 1) => (
  mode === "charge" ? BRUTUS_DURATIONS.charge[phase] : BRUTUS_DURATIONS[mode] ?? 0
);

export function createBrutusState() {
  return {
    hp: 3,
    phase: 1,
    mode: "intro",
    timer: BRUTUS_DURATIONS.intro,
    arenaUnlocked: false,
    rollingCanId: null,
    sprinklerSide: "left",
    sprinklerTimer: BRUTUS_DURATIONS.sprinkler,
    visualState: null,
    visualTimer: 0,
  };
}

export const BRUTUS_CHARGE_SPEED = Object.freeze({ 1: 310, 2: 360, 3: 420 });
export const BRUTUS_RECOVERY_SPEED = 760;
export const BRUTUS_EXIT_SPEED = 360;

export function brutusTopHitRegion(boss) {
  const inset = 18;
  return {
    x: boss.x + inset,
    y: boss.y,
    w: Math.max(0, boss.w - inset * 2),
    h: 18,
  };
}

export function isBrutusTopHit(player, boss, previousBottom) {
  const region = brutusTopHitRegion(boss);
  const currentBottom = player.y + player.h;
  return player.vy > 80
    && previousBottom <= region.y
    && currentBottom >= region.y
    && player.y < region.y + region.h
    && player.x < region.x + region.w
    && player.x + player.w > region.x;
}

export function moveBrutusInArena(actor, state, { dt = 0, boss }) {
  const elapsed = Math.max(0, dt);
  const width = actor.w ?? 96;
  const minimumX = boss.arenaStartX + 100;
  const maximumX = boss.arenaEndX - width - 36;
  const exitTargetX = boss.defeatExitX ?? boss.arenaEndX + width;

  // Combat movement is arena-clamped, but the authored defeat target lives
  // beyond the locked camera. Reaching it is the only signal that may finish
  // the exit and release the arena.
  if (state.mode === "defeat-exit") {
    const startX = Math.max(minimumX, actor.x);
    const x = approach(startX, exitTargetX, BRUTUS_EXIT_SPEED * elapsed);
    return {
      x,
      vx: elapsed > 0 ? (x - startX) / elapsed : 0,
      facing: 1,
      hydrantHit: false,
      exitComplete: x >= exitTargetX,
    };
  }

  const base = {
    x: clamp(actor.x, minimumX, maximumX),
    vx: 0,
    facing: actor.facing,
    hydrantHit: false,
    exitComplete: false,
  };

  if (state.mode === "recover") {
    const fallbackTarget = (boss.hydrant?.x ?? minimumX) + (boss.hydrant?.w ?? 0) + 348;
    const target = clamp(boss.recoveryX ?? fallbackTarget, minimumX, maximumX);
    const x = approach(base.x, target, BRUTUS_RECOVERY_SPEED * elapsed);
    return { ...base, x, vx: elapsed > 0 ? (x - base.x) / elapsed : 0, facing: x < base.x ? -1 : 1 };
  }

  if (state.mode !== "charge") return base;
  const vx = (actor.facing < 0 ? -1 : 1) * BRUTUS_CHARGE_SPEED[state.phase];
  const proposedX = clamp(base.x + vx * elapsed, minimumX, maximumX);
  const hydrant = boss.hydrant;
  if (!hydrant) return { ...base, x: proposedX, vx };

  const currentLeft = base.x;
  const currentRight = base.x + width;
  const proposedLeft = proposedX;
  const proposedRight = proposedX + width;
  const hydrantHit = vx < 0
    ? currentLeft > hydrant.x + hydrant.w && proposedLeft <= hydrant.x + hydrant.w
    : currentRight < hydrant.x && proposedRight >= hydrant.x;
  return hydrantHit
    ? {
        ...base,
        x: vx < 0 ? hydrant.x + hydrant.w : hydrant.x - width,
        vx: 0,
        hydrantHit: true,
      }
    : { ...base, x: proposedX, vx };
}

const tickSprinkler = (state, dt) => {
  if (state.phase !== 3 || state.arenaUnlocked) return state;
  const current = state.sprinklerTimer ?? BRUTUS_DURATIONS.sprinkler;
  const elapsed = Math.max(0, dt);
  if (elapsed < current) return { ...state, sprinklerTimer: current - elapsed };
  const remainder = elapsed - current;
  const changes = 1 + Math.floor(remainder / BRUTUS_DURATIONS.sprinkler);
  return {
    ...state,
    sprinklerSide: changes % 2 === 0
      ? state.sprinklerSide
      : state.sprinklerSide === "left" ? "right" : "left",
    sprinklerTimer: BRUTUS_DURATIONS.sprinkler - (remainder % BRUTUS_DURATIONS.sprinkler),
  };
};

const advanceDefeat = (state, dt, exitComplete = false) => {
  let next = state.mode === "defeat" ? { ...state, mode: "defeat-slide" } : { ...state };
  let remaining = Math.max(0, dt);
  const sequence = ["defeat-slide", "defeat-shake", "defeat-exit"];
  while (sequence.includes(next.mode) && remaining >= 0) {
    if (next.mode === "defeat-exit") {
      return exitComplete
        ? { ...next, mode: "complete", timer: 0, arenaUnlocked: true, rollingCanId: null }
        : { ...next, timer: 0, arenaUnlocked: false };
    }
    const timer = next.timer ?? timerFor(next.mode);
    if (remaining < timer) return { ...next, timer: timer - remaining, arenaUnlocked: false };
    remaining -= timer;
    const index = sequence.indexOf(next.mode);
    const mode = sequence[index + 1];
    next = { ...next, mode, timer: mode === "defeat-exit" ? 0 : timerFor(mode), arenaUnlocked: false };
  }
  return next;
};

export function updateBrutus(state, input = {}) {
  const dt = Math.max(0, input.dt ?? 0);
  if (state.mode === "complete" || state.arenaUnlocked) {
    return { ...state, mode: "complete", timer: 0, arenaUnlocked: true, rollingCanId: null };
  }
  if (state.mode === "defeat" || state.mode.startsWith("defeat-")) {
    return advanceDefeat(state, dt, input.exitComplete === true);
  }

  let next = tickSprinkler({
    ...state,
    visualTimer: Math.max(0, (state.visualTimer ?? 0) - dt),
    visualState: (state.visualTimer ?? 0) > dt ? state.visualState ?? null : null,
  }, dt);

  // The overturned bin stays closed in every other state. Neither a wall,
  // ordinary prop, stomp, nor tail swipe can substitute for the hydrant.
  if (next.mode === "charge" && input.hydrantHit === true) {
    return {
      ...next,
      mode: "stunned-open",
      timer: BRUTUS_DURATIONS["stunned-open"],
      visualState: "crash",
      visualTimer: 0.22,
    };
  }
  if (next.mode === "stunned-open" && input.playerAttackHit === true) {
    const hp = Math.max(0, next.hp - 1);
    const phase = phaseFromHp(hp);
    return {
      ...next,
      hp,
      phase,
      mode: "hit",
      timer: BRUTUS_DURATIONS.hit,
      rollingCanId: phase === 2 ? next.rollingCanId ?? "brutus-can" : null,
      sprinklerTimer: phase === 3 ? BRUTUS_DURATIONS.sprinkler : next.sprinklerTimer,
    };
  }

  const timer = Math.max(0, (next.timer ?? timerFor(next.mode, next.phase)) - dt);
  if (timer > 0) return { ...next, timer };

  if (next.mode === "intro") return { ...next, mode: "sniff", timer: BRUTUS_DURATIONS.sniff };
  if (next.mode === "sniff") return { ...next, mode: "bark", timer: BRUTUS_DURATIONS.bark };
  if (next.mode === "bark") return { ...next, mode: "charge", timer: timerFor("charge", next.phase) };
  if (next.mode === "charge") return { ...next, mode: "recover", timer: BRUTUS_DURATIONS.recover };
  if (next.mode === "stunned-open") return { ...next, mode: "recover", timer: BRUTUS_DURATIONS.recover };
  if (next.mode === "hit") {
    return next.hp === 0
      ? { ...next, mode: "defeat-slide", timer: BRUTUS_DURATIONS["defeat-slide"], arenaUnlocked: false }
      : { ...next, mode: "recover", timer: BRUTUS_DURATIONS.recover };
  }
  if (next.mode === "recover") return { ...next, mode: "sniff", timer: BRUTUS_DURATIONS.sniff };
  return { ...next, timer: 0 };
}

export function brutusArenaHazards(state) {
  if (state.hp <= 0 || state.arenaUnlocked || state.mode === "complete") return [];
  const hazards = [];
  if (state.phase === 2 && state.rollingCanId) {
    hazards.push({ kind: "rolling-can", id: state.rollingCanId });
  }
  if (state.phase === 3) {
    hazards.push({ kind: "sprinkler", side: state.sprinklerSide ?? "left" });
  }
  return hazards;
}

export function brutusAnimation(state) {
  if (state.visualState === "crash" && state.visualTimer > 0) return BRUTUS_ANIMATIONS.crash;
  const mode = state.mode === "intro" ? "idle" : state.mode;
  return BRUTUS_ANIMATIONS[mode] ?? BRUTUS_ANIMATIONS.idle;
}

export function brutusAnimationFrame(animationState, elapsed) {
  const raw = Math.floor(Math.max(0, elapsed) * animationState.fps);
  return animationState.loop ? raw % animationState.frames : Math.min(animationState.frames - 1, raw);
}
