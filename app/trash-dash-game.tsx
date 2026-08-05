"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  clearInputState,
  readBrowserExperience,
  subscribeBrowserExperience,
  toggleGameFullscreen,
} from "./mobile-experience.mjs";
import {
  createGameMusic,
  disposeGameMusic,
  pauseGameMusic,
  playGameMusic,
  setGameMusicMuted,
} from "./music-controller.mjs";

type Screen = "title" | "playing" | "paused" | "gameover" | "won";
type Frame = readonly [number, number, number, number];
type PlatformKind = "ground" | "branch" | "metal" | "box";
type PickupKind = "trash" | "taco" | "cap";
type EnemyKind =
  | "pigeon" | "slime" | "beetle" | "possum" | "bottle" | "boss"
  | "bat" | "wasp" | "mosquito" | "moth"
  | "snake" | "spider" | "rat" | "hedgehog"
  | "fox" | "crow" | "boar" | "frog";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Platform extends Rect {
  kind: PlatformKind;
}

interface Pickup extends Rect {
  kind: PickupKind;
  active: boolean;
  phase: number;
}

interface Enemy extends Rect {
  kind: EnemyKind;
  vx: number;
  active: boolean;
  phase: number;
  hp: number;
  hitCooldown: number;
  originX: number;
  surfaceY: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface Player extends Rect {
  vx: number;
  vy: number;
  grounded: boolean;
  facing: 1 | -1;
  large: boolean;
  glider: number;
  invulnerable: number;
  coyote: number;
  jumpBuffer: number;
  attackTimer: number;
  attackId: number;
  boostCooldown: number;
  anim: number;
}

interface World {
  player: Player;
  enemies: Enemy[];
  pickups: Pickup[];
  particles: Particle[];
  cameraX: number;
  checkpoint: number;
  checkpointReached: boolean;
  bossDefeated: boolean;
  trash: number;
  score: number;
  lives: number;
  elapsed: number;
  message: string;
  messageTimer: number;
}

const WIDTH = 960;
const HEIGHT = 540;
const GROUND_Y = 468;
const WORLD_WIDTH = 6600;
const MOTION_CELL = 192;
const ASSET_CELL = 256;
const INITIAL_BROWSER_EXPERIENCE = {
  touchFirst: false,
  portrait: false,
  fullscreen: false,
  fullscreenSupported: false,
};

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

const motionRow = (row: number, count: number): Frame[] =>
  Array.from({ length: count }, (_, index) => [index * MOTION_CELL, row * MOTION_CELL, MOTION_CELL, MOTION_CELL] as Frame);

const playerMotion = {
  small: motionRow(0, 6),
  large: motionRow(1, 6),
};

const enemyMotion = {
  pigeon: motionRow(0, 4),
  slime: motionRow(1, 4),
  beetle: motionRow(2, 4),
  possum: motionRow(3, 4),
};

const varietyEnemyMotion = {
  bat: motionRow(0, 4),
  wasp: motionRow(1, 4),
  mosquito: motionRow(2, 4),
  moth: motionRow(3, 4),
  snake: motionRow(4, 4),
  spider: motionRow(5, 4),
  rat: motionRow(6, 4),
  hedgehog: motionRow(7, 4),
  fox: motionRow(8, 4),
  crow: motionRow(9, 4),
  boar: motionRow(10, 4),
  frog: motionRow(11, 4),
};

const trashPickupMotion = {
  can: motionRow(0, 4),
  bottle: motionRow(1, 4),
  banana: motionRow(2, 4),
  appleCore: motionRow(3, 4),
};
const trashPickupRows = [
  trashPickupMotion.can,
  trashPickupMotion.bottle,
  trashPickupMotion.banana,
  trashPickupMotion.appleCore,
];

const tacoPowerMotion = motionRow(0, 4);
const flyingEnemies = new Set<EnemyKind>(["bat", "wasp", "mosquito", "moth", "crow"]);
const varietyEnemyDrawSizes: Record<keyof typeof varietyEnemyMotion, [number, number]> = {
  bat: [68, 68],
  wasp: [66, 66],
  mosquito: [64, 64],
  moth: [68, 68],
  snake: [74, 64],
  spider: [70, 64],
  rat: [72, 66],
  hedgehog: [70, 66],
  fox: [82, 72],
  crow: [72, 70],
  boar: [84, 74],
  frog: [66, 62],
};

const assetRow = (row: number, count: number): Frame[] =>
  Array.from({ length: count }, (_, index) => [index * ASSET_CELL, row * ASSET_CELL, ASSET_CELL, ASSET_CELL] as Frame);

const hazardMotion = {
  bottle: assetRow(0, 4),
  boss: assetRow(1, 4),
};

const gliderMotion = assetRow(0, 6);
const recycleCrates = assetRow(0, 2);

const midgroundProps = {
  bush: [0, 0, ASSET_CELL, ASSET_CELL] as Frame,
  tree: [ASSET_CELL, 0, ASSET_CELL, ASSET_CELL] as Frame,
  bin: [ASSET_CELL * 2, 0, ASSET_CELL, ASSET_CELL] as Frame,
  crate: [0, ASSET_CELL, ASSET_CELL, ASSET_CELL] as Frame,
  checkpoint: [ASSET_CELL, ASSET_CELL, ASSET_CELL, ASSET_CELL] as Frame,
  tires: [ASSET_CELL * 2, ASSET_CELL, ASSET_CELL, ASSET_CELL] as Frame,
};

const sprites = {
  smallIdle: [18, 10, 76, 84] as Frame,
  smallWalk: [
    [94, 10, 72, 84],
    [169, 9, 74, 85],
    [244, 10, 72, 84],
    [320, 9, 74, 85],
    [397, 10, 74, 84],
    [474, 10, 75, 84],
  ] as Frame[],
  smallRun: [
    [17, 103, 83, 82],
    [105, 103, 82, 82],
    [194, 104, 87, 81],
  ] as Frame[],
  smallJump: [622, 8, 78, 91] as Frame,
  smallFall: [785, 5, 82, 95] as Frame,
  smallHurt: [1264, 104, 85, 84] as Frame,
  smallRoll: [308, 105, 76, 75] as Frame,
  largeIdle: [18, 201, 83, 105] as Frame,
  largeWalk: [
    [104, 201, 84, 105],
    [190, 202, 85, 104],
    [280, 203, 84, 103],
    [366, 201, 88, 105],
    [458, 201, 84, 105],
    [545, 202, 82, 104],
  ] as Frame[],
  largeJump: [707, 199, 84, 109] as Frame,
  largeFall: [798, 199, 86, 109] as Frame,
  largeAttack: [
    [529, 309, 101, 105],
    [638, 309, 116, 105],
    [754, 309, 116, 105],
    [875, 309, 120, 105],
  ] as Frame[],
  largeHurt: [1338, 205, 94, 101] as Frame,
  glider: [
    [34, 437, 112, 105],
    [147, 438, 112, 104],
    [260, 438, 110, 104],
    [372, 438, 112, 104],
    [486, 438, 111, 104],
    [602, 438, 110, 104],
  ] as Frame[],
  trashCan: [26, 623, 39, 43] as Frame,
  banana: [260, 622, 49, 43] as Frame,
  bag: [328, 563, 48, 56] as Frame,
  cap: [385, 615, 58, 48] as Frame,
  crate: [480, 554, 82, 74] as Frame,
  box: [691, 557, 79, 70] as Frame,
  bin: [943, 551, 78, 80] as Frame,
  checkpoint: [1364, 552, 78, 80] as Frame,
  pigeon: [
    [14, 673, 69, 70],
    [89, 673, 70, 70],
    [166, 673, 70, 70],
    [243, 673, 70, 70],
  ] as Frame[],
  slime: [
    [356, 668, 71, 72],
    [426, 668, 72, 72],
    [499, 668, 72, 72],
  ] as Frame[],
  beetle: [
    [611, 672, 84, 68],
    [696, 672, 83, 68],
    [782, 672, 84, 68],
  ] as Frame[],
  possum: [
    [12, 742, 91, 72],
    [103, 742, 91, 72],
    [199, 742, 91, 72],
  ] as Frame[],
  bottle: [
    [356, 742, 74, 72],
    [433, 742, 74, 72],
    [512, 742, 74, 72],
  ] as Frame[],
  boss: [
    [1000, 650, 126, 158],
    [1124, 650, 124, 158],
    [1245, 650, 127, 158],
    [1352, 650, 94, 158],
  ] as Frame[],
  ground: [14, 812, 58, 65] as Frame,
  branch: [793, 888, 151, 49] as Frame,
  metal: [514, 882, 112, 59] as Frame,
  bush: [16, 1007, 129, 77] as Frame,
  tree: [218, 986, 81, 98] as Frame,
  horizon: [554, 952, 879, 133] as Frame,
} as const;

const groundSegments: Platform[] = [
  { x: 0, y: GROUND_Y, w: 1380, h: 90, kind: "ground" },
  { x: 1490, y: GROUND_Y, w: 980, h: 90, kind: "ground" },
  { x: 2590, y: GROUND_Y, w: 1020, h: 90, kind: "ground" },
  { x: 3730, y: GROUND_Y, w: 1010, h: 90, kind: "ground" },
  { x: 4870, y: GROUND_Y, w: 1730, h: 90, kind: "ground" },
];

const platforms: Platform[] = [
  ...groundSegments,
  { x: 620, y: 366, w: 220, h: 22, kind: "branch" },
  { x: 905, y: 420, w: 54, h: 48, kind: "box" },
  { x: 965, y: 420, w: 54, h: 48, kind: "box" },
  { x: 1160, y: 396, w: 160, h: 72, kind: "ground" },
  { x: 1600, y: 352, w: 220, h: 22, kind: "branch" },
  { x: 1915, y: 294, w: 175, h: 22, kind: "branch" },
  { x: 2200, y: 360, w: 190, h: 22, kind: "branch" },
  { x: 2720, y: 385, w: 180, h: 22, kind: "branch" },
  { x: 3340, y: 372, w: 155, h: 22, kind: "branch" },
  { x: 3540, y: 312, w: 150, h: 22, kind: "branch" },
  { x: 3810, y: 392, w: 155, h: 22, kind: "metal" },
  { x: 4100, y: 350, w: 210, h: 22, kind: "metal" },
  { x: 4380, y: 402, w: 160, h: 22, kind: "metal" },
  { x: 4980, y: 382, w: 180, h: 22, kind: "metal" },
  { x: 5200, y: 330, w: 170, h: 22, kind: "metal" },
  { x: 5500, y: 402, w: 150, h: 22, kind: "metal" },
];

const scenery = [
  { x: 360, groundY: GROUND_Y, frame: midgroundProps.bush, size: 98 },
  { x: 1260, groundY: GROUND_Y, frame: midgroundProps.tree, size: 112 },
  { x: 2050, groundY: GROUND_Y, frame: midgroundProps.bush, size: 100 },
  { x: 2860, groundY: GROUND_Y, frame: midgroundProps.tree, size: 112 },
  { x: 3940, groundY: GROUND_Y, frame: midgroundProps.bin, size: 92 },
  { x: 4480, groundY: GROUND_Y, frame: midgroundProps.tires, size: 94 },
];

const recycleScenery = [
  { x: 5100, groundY: GROUND_Y, frame: recycleCrates[0] },
  { x: 6150, groundY: GROUND_Y, frame: recycleCrates[1] },
];

const makeEnemy = (kind: EnemyKind, x: number, y = GROUND_Y): Enemy => {
  const sizes: Record<EnemyKind, [number, number]> = {
    pigeon: [46, 38],
    slime: [46, 38],
    beetle: [50, 34],
    possum: [58, 38],
    bottle: [48, 36],
    boss: [96, 96],
    bat: [50, 34],
    wasp: [48, 32],
    mosquito: [46, 30],
    moth: [50, 34],
    snake: [58, 28],
    spider: [52, 30],
    rat: [54, 34],
    hedgehog: [52, 34],
    fox: [62, 40],
    crow: [52, 36],
    boar: [62, 42],
    frog: [48, 30],
  };
  const [w, h] = sizes[kind];
  return {
    kind,
    x,
    y: y - h,
    w,
    h,
    vx: kind === "bottle" ? -105 : kind === "fox" || kind === "boar" ? -78 : flyingEnemies.has(kind) ? -64 : -42,
    active: true,
    phase: x / 100,
    hp: kind === "boss" ? 3 : 1,
    hitCooldown: 0,
    originX: x,
    surfaceY: y,
  };
};

const makePickup = (kind: PickupKind, x: number, y: number, phase = 0): Pickup => ({
  kind,
  x,
  y,
  w: kind === "trash" ? 30 : 38,
  h: kind === "trash" ? 30 : 38,
  active: true,
  phase,
});

const initialEnemies = () => [
  makeEnemy("pigeon", 520),
  makeEnemy("pigeon", 610),
  makeEnemy("pigeon", 640, 366),
  makeEnemy("bat", 820, 310),
  makeEnemy("slime", 1090),
  makeEnemy("possum", 1280),
  makeEnemy("wasp", 1450, 292),
  makeEnemy("snake", 1540),
  makeEnemy("pigeon", 1710, 352),
  makeEnemy("mosquito", 1870, 276),
  makeEnemy("beetle", 2040, 294),
  makeEnemy("slime", 2320),
  makeEnemy("spider", 2440),
  makeEnemy("moth", 2600, 306),
  makeEnemy("possum", 2790),
  makeEnemy("rat", 3060),
  makeEnemy("pigeon", 3430, 372),
  makeEnemy("hedgehog", 3690),
  makeEnemy("bottle", 4040),
  makeEnemy("beetle", 4210, 350),
  makeEnemy("fox", 4320),
  makeEnemy("slime", 4510),
  makeEnemy("crow", 4810, 322),
  makeEnemy("bottle", 5030),
  makeEnemy("beetle", 5280, 330),
  makeEnemy("possum", 5400),
  makeEnemy("boar", 5570),
  makeEnemy("boss", 5790),
  makeEnemy("frog", 6150),
];

const initialPickups = () => [
  makePickup("trash", 300, 410),
  makePickup("trash", 400, 410, 1),
  makePickup("trash", 690, 320, 2),
  makePickup("trash", 760, 320, 3),
  makePickup("taco", 935, 374),
  makePickup("trash", 1220, 342, 1),
  makePickup("trash", 1545, 406, 2),
  makePickup("trash", 1660, 305, 3),
  makePickup("trash", 1735, 305, 4),
  makePickup("cap", 2000, 236),
  makePickup("trash", 2255, 315, 2),
  makePickup("trash", 2380, 405, 3),
  makePickup("trash", 2710, 420),
  makePickup("trash", 2790, 335, 1),
  makePickup("trash", 2870, 335, 2),
  makePickup("trash", 3250, 405, 3),
  makePickup("cap", 3600, 255),
  makePickup("trash", 3780, 410),
  makePickup("trash", 3875, 344, 2),
  makePickup("trash", 4150, 300, 3),
  makePickup("trash", 4250, 300, 4),
  makePickup("trash", 4460, 352),
  makePickup("taco", 4670, 410),
  makePickup("trash", 5025, 330, 1),
  makePickup("trash", 5260, 278, 2),
  makePickup("trash", 5570, 352, 3),
  makePickup("trash", 6100, 410),
  makePickup("trash", 6200, 410, 2),
];

const makeWorld = (): World => ({
  player: {
    x: 125,
    y: GROUND_Y - 46,
    w: 32,
    h: 46,
    vx: 0,
    vy: 0,
    grounded: true,
    facing: 1,
    large: false,
    glider: 0,
    invulnerable: 0,
    coyote: 0.12,
    jumpBuffer: 0,
    attackTimer: 0,
    attackId: 0,
    boostCooldown: 0,
    anim: 0,
  },
  enemies: initialEnemies(),
  pickups: initialPickups(),
  particles: [],
  cameraX: 0,
  checkpoint: 125,
  checkpointReached: false,
  bossDefeated: false,
  trash: 0,
  score: 0,
  lives: 3,
  elapsed: 0,
  message: "A / D to move • Space to jump",
  messageTimer: 5,
});

const intersects = (a: Rect, b: Rect) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${secs}`;
};

export function TrashDashGame() {
  const cabinetRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const atlasRef = useRef<HTMLImageElement | null>(null);
  const playerMotionRef = useRef<HTMLImageElement | null>(null);
  const enemyMotionRef = useRef<HTMLImageElement | null>(null);
  const varietyEnemyMotionRef = useRef<HTMLImageElement | null>(null);
  const trashPickupMotionRef = useRef<HTMLImageElement | null>(null);
  const tacoPowerMotionRef = useRef<HTMLImageElement | null>(null);
  const hazardMotionRef = useRef<HTMLImageElement | null>(null);
  const gliderMotionRef = useRef<HTMLImageElement | null>(null);
  const midgroundPropsRef = useRef<HTMLImageElement | null>(null);
  const recycleCratesRef = useRef<HTMLImageElement | null>(null);
  const groundTileRef = useRef<HTMLImageElement | null>(null);
  const forestFarRef = useRef<HTMLImageElement | null>(null);
  const forestNearRef = useRef<HTMLImageElement | null>(null);
  const cityFarRef = useRef<HTMLImageElement | null>(null);
  const cityNearRef = useRef<HTMLImageElement | null>(null);
  const worldRef = useRef<World>(makeWorld());
  const keysRef = useRef(new Set<string>());
  const pressedRef = useRef(new Set<string>());
  const screenRef = useRef<Screen>("title");
  const audioRef = useRef<AudioContext | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const mutedRef = useRef(false);
  const lastFrameRef = useRef(0);
  const hudTickRef = useRef(0);
  const fullscreenPendingRef = useRef(false);
  const browserExperienceRef = useRef(INITIAL_BROWSER_EXPERIENCE);
  const [screen, setScreen] = useState<Screen>("title");
  const [loaded, setLoaded] = useState(false);
  const [muted, setMuted] = useState(false);
  const [portraitDismissed, setPortraitDismissed] = useState(false);
  const [browserExperience, setBrowserExperience] = useState(INITIAL_BROWSER_EXPERIENCE);
  const [hud, setHud] = useState({ trash: 0, score: 0, lives: 3, time: 0, glider: 0 });
  const [best, setBest] = useState({ score: 0, time: 0 });

  const changeScreen = useCallback((next: Screen) => {
    if (next !== "playing") pauseGameMusic(musicRef.current);
    screenRef.current = next;
    setScreen(next);
  }, []);

  const clearHeldInput = useCallback(() => {
    clearInputState(keysRef.current, pressedRef.current);
  }, []);

  const interruptGame = useCallback(() => {
    clearHeldInput();
    if (screenRef.current === "playing") changeScreen("paused");
  }, [changeScreen, clearHeldInput]);

  const tone = useCallback((frequency: number, duration = 0.08, type: OscillatorType = "square") => {
    if (mutedRef.current) return;
    const context = audioRef.current;
    if (!context) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gain.gain.setValueAtTime(0.045, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
  }, []);

  const burst = useCallback((world: World, x: number, y: number, color: string, amount = 7) => {
    for (let index = 0; index < amount; index += 1) {
      const angle = (Math.PI * 2 * index) / amount + Math.random() * 0.5;
      const speed = 55 + Math.random() * 90;
      world.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        life: 0.4 + Math.random() * 0.35,
        color,
        size: 3 + Math.random() * 4,
      });
    }
  }, []);

  const setMessage = useCallback((world: World, message: string, time = 2.2) => {
    world.message = message;
    world.messageTimer = time;
  }, []);

  const startGame = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new AudioContext();
    }
    void audioRef.current.resume();
    if (!musicRef.current) {
      musicRef.current = createGameMusic(assetUrl("assets/audio/raccoon-rush-loop.m4a"));
    }
    void playGameMusic(musicRef.current, { muted: mutedRef.current, restart: true });
    worldRef.current = makeWorld();
    lastFrameRef.current = performance.now();
    changeScreen("playing");
    tone(520, 0.08);
    window.setTimeout(() => tone(720, 0.12), 80);
  }, [changeScreen, tone]);

  const togglePause = useCallback(() => {
    if (screenRef.current === "playing") changeScreen("paused");
    else if (screenRef.current === "paused") {
      lastFrameRef.current = performance.now();
      changeScreen("playing");
      void playGameMusic(musicRef.current, { muted: mutedRef.current });
    }
  }, [changeScreen]);

  const toggleMute = useCallback(() => {
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
    setGameMusicMuted(musicRef.current, mutedRef.current);
    if (!mutedRef.current && screenRef.current === "playing") {
      void playGameMusic(musicRef.current);
    }
  }, []);

  const setTouchKey = useCallback((code: string, active: boolean) => {
    if (active) {
      if (!keysRef.current.has(code)) pressedRef.current.add(code);
      keysRef.current.add(code);
    } else {
      keysRef.current.delete(code);
    }
  }, []);

  const handleFullscreen = useCallback(async () => {
    if (fullscreenPendingRef.current) return;
    fullscreenPendingRef.current = true;
    await toggleGameFullscreen(cabinetRef.current, document, window.screen.orientation);
    fullscreenPendingRef.current = false;
    const next = readBrowserExperience(window, document);
    browserExperienceRef.current = next;
    setBrowserExperience(next);
  }, []);

  useEffect(() => {
    const storedScore = Number(window.localStorage.getItem("trash-dash-high-score") ?? 0);
    const storedTime = Number(window.localStorage.getItem("trash-dash-best-time") ?? 0);
    let cancelled = false;
    window.queueMicrotask(() => {
      if (!cancelled) setBest({ score: storedScore, time: storedTime });
    });
    const loadImage = (source: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = source;
      });

    void Promise.all([
      loadImage(assetUrl("assets/raccoon-sprites.png")),
      loadImage(assetUrl("assets/player-motion.png")),
      loadImage(assetUrl("assets/enemy-motion.png")),
      loadImage(assetUrl("assets/generated/enemy-variety-motion.png")),
      loadImage(assetUrl("assets/generated/trash-pickups-motion.png")),
      loadImage(assetUrl("assets/generated/taco-power-motion.png")),
      loadImage(assetUrl("assets/hazard-motion.png")),
      loadImage(assetUrl("assets/glider-motion.png")),
      loadImage(assetUrl("assets/midground-props.png")),
      loadImage(assetUrl("assets/recycle-crates-v2.png")),
      loadImage(assetUrl("assets/ground-seamless.png")),
      loadImage(assetUrl("assets/backgrounds/forest-far.png")),
      loadImage(assetUrl("assets/backgrounds/forest-near.png")),
      loadImage(assetUrl("assets/backgrounds/city-far.png")),
      loadImage(assetUrl("assets/backgrounds/city-near.png")),
    ])
      .then(([atlas, playerAtlas, enemyAtlas, varietyEnemyAtlas, trashPickupAtlas, tacoPowerAtlas, hazardAtlas, gliderAtlas, propAtlas, crateAtlas, groundTile, forestFar, forestNear, cityFar, cityNear]) => {
        if (cancelled) return;
        atlasRef.current = atlas;
        playerMotionRef.current = playerAtlas;
        enemyMotionRef.current = enemyAtlas;
        varietyEnemyMotionRef.current = varietyEnemyAtlas;
        trashPickupMotionRef.current = trashPickupAtlas;
        tacoPowerMotionRef.current = tacoPowerAtlas;
        hazardMotionRef.current = hazardAtlas;
        gliderMotionRef.current = gliderAtlas;
        midgroundPropsRef.current = propAtlas;
        recycleCratesRef.current = crateAtlas;
        groundTileRef.current = groundTile;
        forestFarRef.current = forestFar;
        forestNearRef.current = forestNear;
        cityFarRef.current = cityFar;
        cityNearRef.current = cityNear;
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      disposeGameMusic(musicRef.current);
      musicRef.current = null;
    };
  }, []);

  useEffect(() => {
    let initialized = false;
    let cancelled = false;

    const syncBrowserExperience = () => {
      if (cancelled) return;
      const previous = browserExperienceRef.current;
      const next = readBrowserExperience(window, document);
      browserExperienceRef.current = next;
      setBrowserExperience(next);

      if (initialized && (previous.portrait !== next.portrait || (previous.fullscreen && !next.fullscreen))) {
        interruptGame();
      }
      initialized = true;
    };

    const unsubscribe = subscribeBrowserExperience(window, document, syncBrowserExperience);
    window.queueMicrotask(syncBrowserExperience);

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [interruptGame]);

  useEffect(() => {
    const handled = new Set([
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Space",
      "KeyA",
      "KeyD",
      "KeyW",
      "KeyS",
      "KeyE",
      "KeyZ",
      "KeyX",
      "ShiftLeft",
      "ShiftRight",
    ]);

    const onKeyDown = (event: KeyboardEvent) => {
      if (handled.has(event.code)) event.preventDefault();
      if (!keysRef.current.has(event.code)) pressedRef.current.add(event.code);
      keysRef.current.add(event.code);

      if ((event.code === "Enter" || event.code === "Space") && screenRef.current === "title") {
        startGame();
      }
      if (event.code === "Escape" || event.code === "KeyP") togglePause();
      if (event.code === "KeyR" && screenRef.current !== "title") startGame();
      if (event.code === "KeyM") toggleMute();
    };
    const onKeyUp = (event: KeyboardEvent) => keysRef.current.delete(event.code);
    const onBlur = () => interruptGame();
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") interruptGame();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearHeldInput();
    };
  }, [clearHeldInput, interruptGame, startGame, toggleMute, togglePause]);

  useEffect(() => {
    let animationFrame = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.imageSmoothingEnabled = false;

    const keyHeld = (...codes: string[]) => codes.some((code) => keysRef.current.has(code));
    const keyPressed = (...codes: string[]) => codes.some((code) => pressedRef.current.has(code));

    const playerHeight = (player: Player) => (player.large ? 58 : 46);

    const transformPlayer = (player: Player, large: boolean) => {
      const feet = player.y + player.h;
      player.large = large;
      player.w = large ? 38 : 32;
      player.h = playerHeight(player);
      player.y = feet - player.h;
    };

    const respawn = (world: World) => {
      const player = world.player;
      player.x = world.checkpoint;
      player.y = GROUND_Y - player.h;
      player.vx = 0;
      player.vy = 0;
      player.invulnerable = 1.8;
      player.glider = 0;
      world.cameraX = Math.max(0, world.checkpoint - 180);
      setMessage(world, "Back on your paws!", 1.7);
    };

    const hurtPlayer = (world: World, direction: number) => {
      const player = world.player;
      if (player.invulnerable > 0) return;
      tone(130, 0.18, "sawtooth");
      if (player.large) {
        transformPlayer(player, false);
        player.invulnerable = 1.8;
        player.vx = direction * 190;
        player.vy = -280;
        setMessage(world, "Oof — back to small!", 1.6);
      } else {
        world.lives -= 1;
        burst(world, player.x + player.w / 2, player.y + player.h / 2, "#f6d477", 11);
        if (world.lives <= 0) {
          changeScreen("gameover");
          return;
        }
        respawn(world);
      }
    };

    const damageEnemy = (world: World, enemy: Enemy, stomp = false) => {
      if (!enemy.active || enemy.hitCooldown > 0) return;
      enemy.hp -= 1;
      enemy.hitCooldown = 0.5;
      burst(world, enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, enemy.kind === "boss" ? "#ffd248" : "#c7f170", enemy.kind === "boss" ? 12 : 7);
      tone(enemy.kind === "boss" ? 170 : 260, 0.09, "square");
      if (enemy.hp <= 0) {
        enemy.active = false;
        world.score += enemy.kind === "boss" ? 2500 : stomp ? 250 : 180;
        if (enemy.kind === "boss") {
          world.bossDefeated = true;
          setMessage(world, "Alley cleared — depot ahead!", 3);
          tone(420, 0.12);
          window.setTimeout(() => tone(620, 0.15), 100);
        }
      } else if (enemy.kind === "boss") {
        enemy.vx *= -1.35;
        setMessage(world, `${enemy.hp} hits left!`, 1.2);
      }
    };

    const update = (world: World, dt: number) => {
      const player = world.player;
      const previousY = player.y;
      const previousBottom = previousY + player.h;
      world.elapsed += dt;
      player.anim += dt;
      player.invulnerable = Math.max(0, player.invulnerable - dt);
      player.attackTimer = Math.max(0, player.attackTimer - dt);
      player.boostCooldown = Math.max(0, player.boostCooldown - dt);
      player.glider = Math.max(0, player.glider - dt);
      player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
      world.messageTimer = Math.max(0, world.messageTimer - dt);

      const left = keyHeld("ArrowLeft", "KeyA");
      const right = keyHeld("ArrowRight", "KeyD");
      const running = keyHeld("ShiftLeft", "ShiftRight", "KeyX");
      const jumpHeld = keyHeld("Space", "ArrowUp", "KeyW");
      const jumpPressed = keyPressed("Space", "ArrowUp", "KeyW");
      const actionPressed = keyPressed("KeyE", "KeyZ");

      if (jumpPressed) player.jumpBuffer = 0.13;
      player.coyote = player.grounded ? 0.12 : Math.max(0, player.coyote - dt);

      const direction = (right ? 1 : 0) - (left ? 1 : 0);
      const targetSpeed = direction * (running ? 330 : 225);
      const acceleration = player.grounded ? 1900 : 1050;
      const speedDelta = targetSpeed - player.vx;
      player.vx += Math.sign(speedDelta) * Math.min(Math.abs(speedDelta), acceleration * dt);
      if (!direction && player.grounded) player.vx *= Math.pow(0.0008, dt);
      if (direction) player.facing = direction as 1 | -1;

      if (player.jumpBuffer > 0 && player.coyote > 0) {
        player.vy = -615;
        player.grounded = false;
        player.coyote = 0;
        player.jumpBuffer = 0;
        tone(380, 0.08);
        burst(world, player.x + player.w / 2, player.y + player.h, "#e7d8a5", 4);
      }

      const isGliding = player.glider > 0 && jumpHeld && player.vy > 10;
      const gravity = isGliding ? 430 : 1750;
      if (!jumpHeld && player.vy < -210) player.vy += 2100 * dt;
      player.vy = Math.min(isGliding ? 155 : 780, player.vy + gravity * dt);

      if (actionPressed && player.glider > 0 && player.boostCooldown <= 0) {
        player.vy = Math.min(player.vy, -240);
        player.boostCooldown = 1.05;
        tone(560, 0.1, "triangle");
      } else if (actionPressed && player.large && player.glider <= 0 && player.attackTimer <= 0) {
        player.attackTimer = 0.32;
        player.attackId += 1;
        tone(210, 0.07, "sawtooth");
      }

      player.x += player.vx * dt;
      player.y += player.vy * dt;
      player.x = Math.max(0, Math.min(WORLD_WIDTH - player.w, player.x));
      player.grounded = false;

      for (const platform of platforms) {
        const bottom = player.y + player.h;
        const overlapsX = player.x + player.w > platform.x + 4 && player.x < platform.x + platform.w - 4;
        if (overlapsX && player.vy >= 0 && previousBottom <= platform.y + 8 && bottom >= platform.y) {
          player.y = platform.y - player.h;
          player.vy = 0;
          player.grounded = true;
          break;
        }
      }

      if (player.y > HEIGHT + 120) {
        hurtPlayer(world, 0);
      }

      if (!world.checkpointReached && player.x > 3050) {
        world.checkpointReached = true;
        world.checkpoint = 3060;
        world.score += 500;
        setMessage(world, "Checkpoint recycled!", 2.4);
        tone(660, 0.12);
      }

      for (const pickup of world.pickups) {
        if (!pickup.active) continue;
        if (!intersects(player, pickup)) continue;
        pickup.active = false;
        world.score += pickup.kind === "trash" ? 100 : 500;
        if (pickup.kind === "trash") {
          world.trash += 1;
          tone(620 + (world.trash % 5) * 65, 0.07);
          if (world.trash % 5 === 0 && !player.large) {
            transformPlayer(player, true);
            setMessage(world, "Five scraps — powered up!", 2.2);
            tone(820, 0.16, "triangle");
          }
        } else if (pickup.kind === "taco") {
          transformPlayer(player, true);
          setMessage(world, "Taco power!", 2);
          tone(760, 0.15, "triangle");
        } else {
          player.glider = 14;
          transformPlayer(player, true);
          setMessage(world, "Glider ready — hold jump, E to boost", 3);
          tone(980, 0.16, "triangle");
        }
        burst(world, pickup.x + pickup.w / 2, pickup.y + pickup.h / 2, pickup.kind === "cap" ? "#ffd248" : "#8bdc63", 8);
      }

      for (const enemy of world.enemies) {
        if (!enemy.active) continue;
        enemy.phase += dt * Math.max(3.4, Math.abs(enemy.vx) / 26);
        enemy.hitCooldown = Math.max(0, enemy.hitCooldown - dt);

        const patrolRadius = enemy.kind === "boss" ? 245 : enemy.kind === "slime" ? 85 : 105;
        if (enemy.kind === "slime") {
          enemy.x += enemy.vx * 0.35 * dt;
        } else if (enemy.kind === "possum") {
          const distance = player.x - enemy.x;
          if (Math.abs(distance) < 250) enemy.vx = Math.sign(distance || 1) * 105;
          else if (Math.abs(enemy.x - enemy.originX) > 72) enemy.vx = Math.sign(enemy.originX - enemy.x) * 55;
          enemy.x += enemy.vx * dt;
        } else {
          enemy.x += enemy.vx * dt;
        }

        const patrolMin = enemy.originX - patrolRadius;
        const patrolMax = enemy.originX + patrolRadius;
        if (enemy.x <= patrolMin) {
          enemy.x = patrolMin;
          enemy.vx = Math.abs(enemy.vx);
        } else if (enemy.x >= patrolMax) {
          enemy.x = patrolMax;
          enemy.vx = -Math.abs(enemy.vx);
        }
        enemy.y = enemy.surfaceY - enemy.h + (flyingEnemies.has(enemy.kind) ? Math.sin(enemy.phase * 0.82) * 11 : 0);

        if (player.attackTimer > 0.08 && player.large) {
          const attackRect: Rect = {
            x: player.facing > 0 ? player.x + player.w - 4 : player.x - 58,
            y: player.y + 8,
            w: 62,
            h: player.h - 10,
          };
          if (intersects(attackRect, enemy)) damageEnemy(world, enemy);
        }

        if (!intersects(player, enemy)) continue;
        const stomped = player.vy > 80 && previousBottom <= enemy.y + 16;
        if (stomped) {
          player.vy = -360;
          damageEnemy(world, enemy, true);
        } else if (enemy.hitCooldown <= 0) {
          hurtPlayer(world, player.x < enemy.x ? -1 : 1);
        }
      }

      for (const particle of world.particles) {
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += 420 * dt;
        particle.life -= dt;
      }
      world.particles = world.particles.filter((particle) => particle.life > 0);

      if (world.bossDefeated && player.x > 6300 && screenRef.current === "playing") {
        world.score += Math.max(0, Math.floor(4000 - world.elapsed * 12));
        const oldScore = Number(window.localStorage.getItem("trash-dash-high-score") ?? 0);
        const oldTime = Number(window.localStorage.getItem("trash-dash-best-time") ?? 0);
        const nextScore = Math.max(oldScore, world.score);
        const nextTime = oldTime === 0 ? world.elapsed : Math.min(oldTime, world.elapsed);
        window.localStorage.setItem("trash-dash-high-score", String(nextScore));
        window.localStorage.setItem("trash-dash-best-time", String(nextTime));
        setBest({ score: nextScore, time: nextTime });
        changeScreen("won");
        tone(640, 0.15);
        window.setTimeout(() => tone(800, 0.18), 120);
      }

      const cameraTarget = Math.max(0, Math.min(WORLD_WIDTH - WIDTH, player.x - WIDTH * 0.36));
      world.cameraX += (cameraTarget - world.cameraX) * Math.min(1, dt * 5.5);
      pressedRef.current.clear();
    };

    const drawSprite = (
      frame: Frame,
      x: number,
      y: number,
      w: number,
      h: number,
      flip = false,
      alpha = 1,
      source: HTMLImageElement | null = atlasRef.current,
    ) => {
      const atlas = source;
      if (!atlas) return;
      const drawX = Math.round(x);
      const drawY = Math.round(y);
      const drawW = Math.round(w);
      const drawH = Math.round(h);
      context.save();
      context.globalAlpha = alpha;
      if (flip) {
        context.translate(drawX + drawW, drawY);
        context.scale(-1, 1);
        context.drawImage(atlas, frame[0], frame[1], frame[2], frame[3], 0, 0, drawW, drawH);
      } else {
        context.drawImage(atlas, frame[0], frame[1], frame[2], frame[3], drawX, drawY, drawW, drawH);
      }
      context.restore();
    };

    const drawCloud = (x: number, y: number, scale: number) => {
      const unit = Math.max(4, Math.round(8 * scale));
      const left = Math.round(x);
      const top = Math.round(y);
      context.fillStyle = "#d9eef1";
      context.fillRect(left + unit, top + unit * 2, unit * 9, unit * 2);
      context.fillStyle = "#fff7d8";
      context.fillRect(left + unit * 2, top + unit, unit * 7, unit * 2);
      context.fillRect(left + unit * 3, top, unit * 3, unit * 3);
      context.fillRect(left + unit * 6, top + unit, unit * 3, unit * 2);
    };

    const drawTiledLayer = (
      image: HTMLImageElement | null,
      camera: number,
      speed: number,
      y: number,
      drawWidth: number,
      drawHeight: number,
      alpha: number,
    ) => {
      if (!image || alpha <= 0) return;
      const offset = -Math.round((camera * speed) % drawWidth);
      context.save();
      context.globalAlpha = alpha;
      for (let x = offset - drawWidth; x < WIDTH + drawWidth; x += drawWidth) {
        context.drawImage(image, Math.round(x), y, drawWidth, drawHeight);
      }
      context.restore();
    };

    const drawBranchPlatform = (x: number, y: number, width: number) => {
      const left = Math.round(x);
      const top = Math.round(y - 4);
      const drawWidth = Math.ceil(width);
      context.save();
      context.beginPath();
      context.rect(left, top, drawWidth, 32);
      context.clip();
      context.fillStyle = "#332117";
      context.fillRect(left, top + 4, drawWidth, 24);
      context.fillStyle = "#754522";
      context.fillRect(left + 4, top + 2, Math.max(0, drawWidth - 8), 20);
      context.fillStyle = "#a96c35";
      context.fillRect(left + 5, top + 3, Math.max(0, drawWidth - 10), 4);
      context.fillStyle = "#533019";
      for (let detailX = left + 28; detailX < left + drawWidth - 18; detailX += 46) {
        context.fillRect(detailX, top + 9, 13, 4);
        context.fillRect(detailX + 5, top + 13, 5, 6);
      }
      context.fillStyle = "#2d7d3e";
      for (let leafX = left + 24; leafX < left + drawWidth - 16; leafX += 72) {
        context.fillRect(leafX, top, 8, 4);
        context.fillRect(leafX + 4, top - 3, 8, 4);
      }
      context.fillStyle = "#24170f";
      context.fillRect(left, top + 6, 5, 18);
      context.fillRect(left + drawWidth - 5, top + 6, 5, 18);
      context.restore();
    };

    const drawMetalPlatform = (x: number, y: number, width: number) => {
      const left = Math.round(x);
      const top = Math.round(y - 4);
      const drawWidth = Math.ceil(width);
      context.save();
      context.beginPath();
      context.rect(left, top, drawWidth, 38);
      context.clip();
      context.fillStyle = "#26343b";
      context.fillRect(left, top + 3, drawWidth, 33);
      context.fillStyle = "#758594";
      context.fillRect(left + 4, top, Math.max(0, drawWidth - 8), 29);
      context.fillStyle = "#aebac2";
      context.fillRect(left + 5, top + 1, Math.max(0, drawWidth - 10), 4);
      context.fillStyle = "#586875";
      context.fillRect(left + 5, top + 23, Math.max(0, drawWidth - 10), 5);
      for (let seamX = left + 54; seamX < left + drawWidth - 18; seamX += 54) {
        context.fillStyle = "#3f4d57";
        context.fillRect(seamX, top + 5, 3, 18);
        context.fillStyle = "#8f9da8";
        context.fillRect(seamX + 3, top + 5, 2, 18);
      }
      context.fillStyle = "#26343b";
      context.fillRect(left, top, 5, 31);
      context.fillRect(left + drawWidth - 5, top, 5, 31);
      context.fillStyle = "#c2cbd0";
      context.fillRect(left + 9, top + 8, 4, 4);
      context.fillRect(left + drawWidth - 13, top + 8, 4, 4);
      context.restore();
    };

    const render = (world: World) => {
      const camera = Math.round(world.cameraX);
      const cityMix = Math.max(0, Math.min(1, (camera - 2140) / 1050));
      const forestMix = 1 - cityMix;
      context.clearRect(0, 0, WIDTH, HEIGHT);
      const sky = context.createLinearGradient(0, 0, 0, GROUND_Y);
      sky.addColorStop(0, cityMix > 0.5 ? "#7085ad" : "#64c7e6");
      sky.addColorStop(0.58, cityMix > 0.5 ? "#a28ba3" : "#83d8e4");
      sky.addColorStop(1, cityMix > 0.5 ? "#d4a27f" : "#badbaf");
      context.fillStyle = sky;
      context.fillRect(0, 0, WIDTH, GROUND_Y);

      const cloudLayout = [
        { x: 80, y: 55, scale: 1.05, speed: 0.035 },
        { x: 335, y: 145, scale: 0.8, speed: 0.055 },
        { x: 610, y: 72, scale: 1.2, speed: 0.04 },
        { x: 875, y: 215, scale: 0.72, speed: 0.065 },
        { x: 1110, y: 125, scale: 0.9, speed: 0.05 },
      ];
      for (const cloud of cloudLayout) {
        const cloudX = ((cloud.x - camera * cloud.speed + 180) % 1180 + 1180) % 1180 - 180;
        context.save();
        context.globalAlpha = 0.72 * forestMix;
        drawCloud(cloudX, cloud.y, cloud.scale);
        context.restore();
      }

      // Each environment has two independently tiled strips. Their different
      // camera speeds create depth while the oversized art keeps repetition subtle.
      drawTiledLayer(forestFarRef.current, camera, 0.055, 34, 1540, 514, forestMix * 0.92);
      drawTiledLayer(forestNearRef.current, camera, 0.13, -8, 1540, 514, forestMix * 0.82);
      drawTiledLayer(cityFarRef.current, camera, 0.045, 18, 1540, 514, cityMix * 0.72);
      drawTiledLayer(cityNearRef.current, camera, 0.11, 34, 1540, 514, cityMix * 0.9);

      for (const item of scenery) {
        const x = item.x - camera;
        if (x < -160 || x > WIDTH + 160) continue;
        drawSprite(
          item.frame,
          x,
          item.groundY - item.size,
          item.size,
          item.size,
          false,
          1,
          midgroundPropsRef.current,
        );
      }

      for (const item of recycleScenery) {
        const x = item.x - camera;
        if (x < -140 || x > WIDTH + 140) continue;
        drawSprite(
          item.frame,
          x,
          item.groundY - 112,
          88,
          112,
          false,
          1,
          recycleCratesRef.current,
        );
      }

      for (const platform of platforms) {
        const x = platform.x - camera;
        if (x + platform.w < -80 || x > WIDTH + 80) continue;
        if (platform.kind === "ground") {
          context.save();
          context.beginPath();
          context.rect(Math.round(x), platform.y - 2, Math.ceil(platform.w), platform.h + 2);
          context.clip();
          context.fillStyle = "#6f3d25";
          context.fillRect(Math.round(x), platform.y, Math.ceil(platform.w), platform.h);
          const groundTile = groundTileRef.current;
          if (groundTile) {
            for (let tileX = 0; tileX < platform.w + 64; tileX += 64) {
              context.drawImage(groundTile, Math.round(x + tileX), platform.y - 2, 65, 66);
            }
          }
          context.restore();
        } else if (platform.kind === "branch") {
          drawBranchPlatform(x, platform.y, platform.w);
        } else if (platform.kind === "metal") {
          drawMetalPlatform(x, platform.y, platform.w);
        } else {
          const frame = recycleCrates[Math.round(platform.x / 60) % recycleCrates.length];
          drawSprite(
            frame,
            x + platform.w / 2 - 34,
            platform.y + platform.h - 78,
            68,
            80,
            false,
            1,
            recycleCratesRef.current,
          );
        }
      }

      drawSprite(
        midgroundProps.checkpoint,
        2988 - camera,
        GROUND_Y - 104,
        104,
        104,
        false,
        world.checkpointReached ? 1 : 0.62,
        midgroundPropsRef.current,
      );
      drawSprite(
        midgroundProps.checkpoint,
        6288 - camera,
        GROUND_Y - 108,
        108,
        108,
        false,
        world.bossDefeated ? 1 : 0.5,
        midgroundPropsRef.current,
      );

      context.save();
      context.font = "900 15px var(--font-body), sans-serif";
      context.textAlign = "center";
      context.fillStyle = "#173e3b";
      if (camera < 550) {
        context.fillText("MOVE  A / D", 245 - camera, 378);
        context.fillText("JUMP  SPACE", 245 - camera, 398);
      }
      if (camera > 2900 && camera < 3600) {
        context.fillText("HOLD JUMP TO GLIDE", 3530 - camera, 265);
      }
      context.restore();

      for (const pickup of world.pickups) {
        if (!pickup.active) continue;
        const x = pickup.x - camera;
        if (x < -80 || x > WIDTH + 80) continue;
        const y = pickup.y + Math.sin(world.elapsed * 1.65 + pickup.phase) * 2;
        const pickupFrame = Math.floor(world.elapsed * 5 + pickup.phase) % 4;
        if (pickup.kind === "taco") {
          drawSprite(tacoPowerMotion[pickupFrame], x - 10, y - 12, 58, 58, false, 1, tacoPowerMotionRef.current);
        } else if (pickup.kind === "cap") {
          drawSprite(sprites.cap, x - 9, y - 7, 50, 42);
        } else {
          const trashFrames = trashPickupRows[Math.abs(Math.floor(pickup.phase)) % trashPickupRows.length];
          drawSprite(trashFrames[pickupFrame], x - 8, y - 10, 46, 46, false, 1, trashPickupMotionRef.current);
        }
      }

      for (const enemy of world.enemies) {
        if (!enemy.active) continue;
        const x = enemy.x - camera;
        if (x < -150 || x > WIDTH + 150) continue;
        const frameIndex = Math.floor(enemy.phase) % 4;
        const flip = enemy.vx < 0;
        const drawEnemy = (
          frame: Frame,
          drawW: number,
          drawH: number,
          alpha = 1,
          source: HTMLImageElement | null = atlasRef.current,
        ) => {
          drawSprite(
            frame,
            x + enemy.w / 2 - drawW / 2,
            enemy.y + enemy.h - drawH,
            drawW,
            drawH,
            flip,
            alpha,
            source,
          );
        };
        if (enemy.kind === "pigeon") drawEnemy(enemyMotion.pigeon[frameIndex], 66, 66, 1, enemyMotionRef.current);
        if (enemy.kind === "slime") drawEnemy(enemyMotion.slime[frameIndex], 62, 62, 1, enemyMotionRef.current);
        if (enemy.kind === "beetle") drawEnemy(enemyMotion.beetle[frameIndex], 68, 68, 1, enemyMotionRef.current);
        if (enemy.kind === "possum") drawEnemy(enemyMotion.possum[frameIndex], 78, 78, 1, enemyMotionRef.current);
        if (enemy.kind === "bottle") drawEnemy(hazardMotion.bottle[frameIndex], 68, 68, 1, hazardMotionRef.current);
        const varietyKind = enemy.kind as keyof typeof varietyEnemyMotion;
        const varietyFrames = varietyEnemyMotion[varietyKind];
        if (varietyFrames) {
          const [drawW, drawH] = varietyEnemyDrawSizes[varietyKind];
          drawEnemy(varietyFrames[frameIndex], drawW, drawH, 1, varietyEnemyMotionRef.current);
        }
        if (enemy.kind === "boss") {
          const bossFrame = hazardMotion.boss[frameIndex];
          drawEnemy(
            bossFrame,
            150,
            150,
            enemy.hitCooldown > 0 && Math.floor(enemy.hitCooldown * 20) % 2 ? 0.35 : 1,
            hazardMotionRef.current,
          );
          context.fillStyle = "#173e3b";
          context.fillRect(x + 4, enemy.y - 48, 88, 9);
          context.fillStyle = "#ffb13b";
          context.fillRect(x + 7, enemy.y - 45, 82 * (enemy.hp / 3), 3);
        }
      }

      const player = world.player;
      const playerX = player.x - camera;
      const running = Math.abs(player.vx) > 250;
      const groundedFrames = player.large ? playerMotion.large : playerMotion.small;
      let source = playerMotionRef.current;
      let frame = groundedFrames[0];
      let drawW = player.large ? 110 : 84;
      let drawH = drawW;

      if (player.glider > 0 && !player.grounded) {
        source = gliderMotionRef.current;
        frame = gliderMotion[Math.floor(player.anim * 6) % gliderMotion.length];
        drawW = 140;
        drawH = 140;
      } else if (player.attackTimer > 0 && player.large) {
        source = atlasRef.current;
        frame = sprites.largeAttack[1];
        drawW = 96;
        drawH = 88;
      } else if (!player.grounded) {
        frame = groundedFrames[player.vy < 0 ? 2 : 3];
      } else if (Math.abs(player.vx) > 22) {
        const cadence = running ? 11 : Math.max(6, Math.abs(player.vx) / 30);
        frame = groundedFrames[Math.floor(player.anim * cadence) % groundedFrames.length];
      }

      drawSprite(
        frame,
        playerX + player.w / 2 - drawW / 2,
        player.y + player.h - drawH,
        drawW,
        drawH,
        player.facing < 0,
        player.invulnerable > 0 && Math.floor(player.invulnerable * 18) % 2 ? 0.45 : 1,
        source,
      );

      for (const particle of world.particles) {
        context.globalAlpha = Math.max(0, particle.life * 1.8);
        context.fillStyle = particle.color;
        context.fillRect(Math.round(particle.x - camera), Math.round(particle.y), particle.size, particle.size);
      }
      context.globalAlpha = 1;

      if (world.messageTimer > 0 && screenRef.current === "playing") {
        const alpha = Math.min(1, world.messageTimer * 2);
        context.save();
        context.globalAlpha = alpha;
        context.font = "1000 17px var(--font-body), sans-serif";
        const width = Math.min(520, context.measureText(world.message).width + 42);
        context.fillStyle = "#163c3c";
        context.beginPath();
        context.roundRect(WIDTH / 2 - width / 2, 24, width, 40, 12);
        context.fill();
        context.fillStyle = "#fff4ce";
        context.textAlign = "center";
        context.fillText(world.message, WIDTH / 2, 50);
        context.restore();
      }
    };

    const loop = (timestamp: number) => {
      const elapsed = lastFrameRef.current ? (timestamp - lastFrameRef.current) / 1000 : 0;
      const dt = Math.min(0.033, Math.max(0, elapsed));
      lastFrameRef.current = timestamp;
      const world = worldRef.current;
      if (screenRef.current === "playing") update(world, dt);
      render(world);

      if (timestamp - hudTickRef.current > 100) {
        hudTickRef.current = timestamp;
        setHud({
          trash: world.trash,
          score: world.score,
          lives: world.lives,
          time: world.elapsed,
          glider: world.player.glider,
        });
      }
      animationFrame = requestAnimationFrame(loop);
    };

    animationFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrame);
  }, [burst, changeScreen, setMessage, tone]);

  const overlay = (() => {
    if (screen === "title") {
      return (
        <div className="screen-overlay">
          <div className="screen-copy">
            <h1 className="game-title">
              Trash Dash <span>Alley Acres</span>
            </h1>
            <p>Turn five tasty scraps into big raccoon energy. Glide the gaps, clean up the alley, and reach the recycling depot.</p>
            <button className="primary-button" type="button" onClick={startGame} disabled={!loaded}>
              {loaded ? "Start rummaging" : "Loading the alley…"}
            </button>
            <span className="controls-line">Move A/D or arrows · Jump Space · Run Shift · Action E</span>
          </div>
        </div>
      );
    }
    if (screen === "paused") {
      return (
        <div className="screen-overlay compact">
          <div className="screen-copy">
            <h2>Snack break</h2>
            <p>The alley is paused. Your checkpoint and collected trash are safe.</p>
            <div className="button-row">
              <button className="primary-button" type="button" onClick={togglePause}>Keep rummaging</button>
              <button className="secondary-button" type="button" onClick={startGame}>Restart run</button>
            </div>
          </div>
        </div>
      );
    }
    if (screen === "gameover") {
      return (
        <div className="screen-overlay compact">
          <div className="screen-copy">
            <h2>Out of paws</h2>
            <p>You scored {hud.score.toLocaleString()} points. The alley is ready for another run.</p>
            <button className="primary-button" type="button" onClick={startGame}>Try again</button>
          </div>
        </div>
      );
    }
    if (screen === "won") {
      return (
        <div className="screen-overlay compact">
          <div className="screen-copy">
            <h2>Alley acres cleared!</h2>
            <p>{hud.trash} scraps recycled · {hud.score.toLocaleString()} points · {formatTime(hud.time)}</p>
            <p>Best: {best.score.toLocaleString()} points{best.time ? ` · ${formatTime(best.time)}` : ""}</p>
            <button className="primary-button" type="button" onClick={startGame}>Run it again</button>
          </div>
        </div>
      );
    }
    return null;
  })();

  const touchProps = (code: string) => ({
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.classList.add("is-pressed");
      setTouchKey(code, true);
    },
    onPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.classList.remove("is-pressed");
      setTouchKey(code, false);
    },
    onPointerCancel: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.currentTarget.classList.remove("is-pressed");
      setTouchKey(code, false);
    },
    onLostPointerCapture: (event: React.PointerEvent<HTMLButtonElement>) => {
      event.currentTarget.classList.remove("is-pressed");
      setTouchKey(code, false);
    },
    onContextMenu: (event: React.MouseEvent<HTMLButtonElement>) => event.preventDefault(),
  });

  const showOrientationPrompt =
    browserExperience.touchFirst &&
    browserExperience.portrait &&
    !portraitDismissed &&
    (screen === "title" || screen === "playing");

  return (
    <main className="game-page">
      <section ref={cabinetRef} className="game-cabinet" aria-label="Trash Dash: Alley Acres browser game">
        <div className="hud">
          <div className="brand-lockup">
            <strong>Trash Dash</strong>
            <span>Alley Acres</span>
          </div>
          <div className="hud-stat trash"><span>Trash</span><strong>{hud.trash}</strong></div>
          <div className="hud-stat score"><span>Score</span><strong>{hud.score.toLocaleString()}</strong></div>
          <div className="hud-stat time"><span>Time</span><strong>{formatTime(hud.time)}</strong></div>
          <div className="hud-stat lives"><span>Paws</span><strong>{hud.lives}</strong></div>
          <div className={`hud-stat glider ${hud.glider <= 0 ? "empty" : ""}`}><span>Glide</span><strong>{hud.glider > 0 ? `${Math.ceil(hud.glider)}s` : "—"}</strong></div>
          <div className="hud-actions">
            <button className="icon-button" type="button" onClick={togglePause} aria-label={screen === "paused" ? "Resume game" : "Pause game"}>Pause</button>
            <button className="icon-button" type="button" onClick={toggleMute} aria-label={muted ? "Unmute sound" : "Mute sound"}>{muted ? "Sound" : "Mute"}</button>
            {browserExperience.fullscreenSupported && (
              <button
                className="icon-button fullscreen-button"
                type="button"
                onClick={handleFullscreen}
                aria-label={browserExperience.fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {browserExperience.fullscreen ? "Exit" : "Full"}
              </button>
            )}
          </div>
        </div>

        <div className={`game-stage ${screen === "playing" ? "is-playing" : ""}`}>
          <canvas
            ref={canvasRef}
            className="game-canvas"
            width={WIDTH}
            height={HEIGHT}
            aria-label="Side-scrolling platform game. Move right through Alley Acres, collect trash, and defeat the trash-bag monster."
          />
          {!loaded && <div className="load-status" role="status">Loading raccoon sprites…</div>}
          {overlay}

          {showOrientationPrompt && (
            <div className="orientation-prompt" role="dialog" aria-labelledby="orientation-title">
              <div className="orientation-copy">
                <strong id="orientation-title">Rotate for the best view</strong>
                <span>Trash Dash plays best with your phone held sideways.</span>
              </div>
              <div className="button-row">
                {browserExperience.fullscreenSupported && (
                  <button className="primary-button" type="button" onClick={handleFullscreen}>
                    Try landscape fullscreen
                  </button>
                )}
                <button className="secondary-button" type="button" onClick={() => setPortraitDismissed(true)}>
                  Play in portrait
                </button>
              </div>
            </div>
          )}

          {screen === "playing" && (
            <>
              <div className="touch-deck-hint" aria-hidden="true">
                <strong>Pocket controls</strong>
                <span>Hold Jump to glide · Action swings your tail</span>
              </div>
              <div className="touch-controls" aria-label="Touch game controls">
                <div className="touch-cluster">
                  <button className="touch-button" type="button" aria-label="Move left" {...touchProps("ArrowLeft")}>Left</button>
                  <button className="touch-button" type="button" aria-label="Move right" {...touchProps("ArrowRight")}>Right</button>
                </div>
                <div className="touch-cluster">
                  <button className="touch-button action" type="button" aria-label="Run or use action" {...touchProps("KeyE")}>Action</button>
                  <button className="touch-button jump" type="button" aria-label="Jump" {...touchProps("Space")}>Jump</button>
                </div>
              </div>
            </>
          )}
          <p className="sr-only" aria-live="polite">
            {screen === "playing" ? `Playing. ${hud.trash} trash collected, ${hud.lives} lives remaining.` : screen}
          </p>
        </div>
      </section>
    </main>
  );
}
