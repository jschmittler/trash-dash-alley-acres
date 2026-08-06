# Level 1: Woodlands to City Limits

**Status:** Draft for review  
**Level type:** Mixed platforming and exploration  
**Target clear time:** 6–8 minutes on a first successful run  
**Current implementation boundary:** Browser Canvas/TypeScript world data, not a separate scene file

## Design goal

By the end of the level, the player understands how to read safe routes, use
platforms to bypass danger, collect trash to grow, and use the glider to reach
optional rewards. The emotional arc moves from safe woodland curiosity to a
confident first step into civilization.

## Visual sequence

The five supplied concept scenes are the level's visual chapters. They are
reference compositions for backgrounds, platform silhouettes, landmark props,
lighting, and transition mood; they are not collision geometry.

1. `01-deep-woodland.png` — warm late-afternoon forest, roots, stumps, hollow
   log, campsite, and a distant skyline tease.
2. `02-creek-and-ruined-mill.png` — orange sunset over water, stepping stones,
   floating logs, broken bridge, and waterwheel.
3. `03-forest-edge-highway.png` — blue-violet dusk, concrete embankment,
   culverts, fencing, guardrails, and the first strong city silhouette.
4. `04-industrial-city-fringe.png` — blue night, rail cars, containers,
   warehouses, loading platforms, and drainage channels.
5. `05-urban-park-transition.png` — moonlit park, brick buildings, playground,
   bridge, and the quiet neighborhood route leading toward Level 2.

## Pacing curve

```text
Deep woodland 2 → Creek/mill 5 → Highway 7 → Industrial fringe 4 →
Park transition 6 → Boss arena 8
```

| Beat | World band | Target duration | Player experience | Design intent |
| --- | --- | ---: | --- | --- |
| Intro | 0–1150 | 60–75s | Curious and safe | Teach movement, collecting, first stomp, and route readability |
| Build | 1150–2350 | ~90s | Focused traversal | Teach water risk, moving logs, and vertical reward routes |
| Peak 1 | 2350–3000 | ~45s | Pressured | First meaningful bypass choice around an opossum |
| Peak 2 | 3000–3550 | ~45s | High alert | Fox patrol plus airborne pressure; optional culvert escape |
| Release | 3550–4800 | ~90s | Recovering and scavenging | Calm industrial exploration and score recovery |
| Hook | 4800–5680 | ~60s | Anticipation | Park checkpoint, skyline reveal, and enemy-free boss runway |
| Boss | 5680–6600 | ~90s | Focused challenge | Locked Trash Heap Tyrant arena and victory transition |

## Enemy roster and encounter order

Level 1 uses only the approved first-level enemies: snake, bird, bee, mosquito,
opossum, spider, and fox. Standard enemies take one stomp or powered attack.
Every attack has a readable 0.35–0.65 second tell. No more than two ordinary
groups should be visible at once.

1. **Woodland clearing — snake** at the end of the first safe trash trail.
2. **Campsite overlook — bird pair** crossing above the upper route.
3. **Creek entry — bee + mosquito** split across stepping stones and airspace.
4. **Mill interior — spider below + bird pair above**; lower route remains safe.
5. **Highway main lane — opossum** with a clear raised bypass through fencing.
6. **Highway intensity spike — fox + mosquito**; culvert route bypasses the fox.
7. **Industrial rail yard — spider + bird pair** separated by vertical layers.
8. **Park approach — snake** before the checkpoint, followed by a quiet runway.
9. **Boss arena — Trash Heap Tyrant only.** All ordinary enemies are removed
   when the arena activates.

Enemy movement is surface-aware: grounded enemies use the supporting platform's
contact line, flying enemies use independent patrol bands, and direction flips
only when patrol velocity changes. Enemy spawn groups are data, not implicit
side effects of platform creation.

## Optional routes and secrets

### S1 — Campsite cache

The upper stump/root route reveals a hidden trash bundle and the first taco.
It is visible from the main path and requires a short jump sequence, not a
damage trade.

### S2 — Mill glider route

The waterwheel overlook contains the glider cap. A higher branch above the
creek holds bonus trash reachable by glider or a precise moving-log jump.
Missing this route never blocks the level.

### S3 — Highway culvert shortcut

The culvert bypasses the fox encounter and leads to a hidden pickup near the
highway checkpoint. The entrance is visible from the main embankment so the
player understands it is a deliberate alternate route.

### S4 — Industrial container route

Container tops provide a slower, safer route with a short trash chain. The
ground route is faster but exposes the player to the spider and bird pair.

## Reward gates

| Reward | Location | Gate | Required? |
| --- | --- | --- | --- |
| Starter trash trail | Deep woodland | None | Yes |
| First taco | Campsite upper route | Short platform sequence | No, but strongly signposted |
| Recovery trash | Creek approach | First enemy group or lower route | No |
| Glider cap | Mill overlook | Reach the waterwheel platform | No |
| Mill bonus cache | Above the creek | Glider or precise moving-log jump | No |
| Highway taco | Culvert/embankment split | Choose bypass or defeat opossum | No |
| Industrial trash chain | Rail/container fringe | Main route | No |
| Boss checkpoint | Park transition | Reach the park trigger | Yes |
| Final pre-boss taco | Park overlook | Upper optional path | No |
| Level-clear reward | Boss arena | Defeat Trash Heap Tyrant | Yes |

## Checkpoints and failure handling

- **Creek checkpoint:** respawn before the first water traversal.
- **Highway checkpoint:** respawn before the opossum/fox pressure sequence.
- **Boss runway checkpoint:** respawn at the park exit and reset the arena
  transition, not the entire level.
- Falling into water or pits is an immediate loss of one paw and respawn at the
  latest checkpoint.
- Ordinary enemy contact uses the existing hurt/respawn rules.
- The boss arena never allows the player to run backward into the level.

## Boss transition

At the park exit, the camera eases toward the skyline and the music crossfades
to the boss track. The player walks through an enemy-free runway with no new
collectibles. Once the arena trigger is crossed:

1. Ordinary enemies become inactive.
2. The camera completes its short ease into the arena framing.
3. Arena bounds clamp the player and boss.
4. Trash Heap Tyrant enters from the right with a readable introduction pose.
5. The boss uses the existing warning → committed attack → recovery pattern.
6. Victory crossfades into the newly revealed dumpster and the Level 2 hook.

## Implementation data shape

The level should be represented as declarative data consumed by the current
Canvas update/draw loop:

```ts
type LevelZone = {
  id: string;
  startX: number;
  endX: number;
  background: "forest" | "city";
  lighting: "late-afternoon" | "sunset" | "dusk" | "night" | "moonlit";
  landmark: string;
};

type LevelEncounter = {
  id: string;
  zoneId: string;
  spawnX: number;
  enemies: Array<{ kind: EnemyKind; x: number; y?: number; patrol?: [number, number] }>;
  bypass?: string;
};

type LevelReward = {
  id: string;
  kind: "trash" | "taco" | "cap" | "checkpoint";
  x: number;
  surfaceY: number;
  optional: boolean;
  gate?: string;
};

type LevelDefinition = {
  id: "level-1";
  zones: LevelZone[];
  encounters: LevelEncounter[];
  rewards: LevelReward[];
  boss: { kind: "boss"; triggerX: number; arenaStartX: number; arenaEndX: number };
};
```

The first implementation should translate the current hard-coded arrays into
this shape without changing movement physics. A later pass can add a level
registry and load Levels 2–5 from the same contract.

## Acceptance criteria

- A first-time player can reach the boss without the glider.
- The taco and glider are each introduced before they are required anywhere.
- Every enemy group has a clear route-around option or adequate reaction space.
- The highway contains two distinct intensity spikes.
- The boss runway contains no ordinary enemies.
- The boss arena lock and camera transition feel continuous rather than jumpy.
- Level 1’s visual lighting progresses from warm forest to moonlit city edge.
- All encounter, reward, checkpoint, and zone data can be tested without a
  browser by importing the level definition.

## Open decisions for review

- Whether the first taco should be guaranteed on the main route or remain an
  optional campsite reward.
- Whether the glider cap should persist into Level 2 or be reintroduced as a
  campaign ability at each level start.
- Whether the Level 1 Trash Heap Tyrant remains a full boss or becomes a
  shorter “guardian” encounter once later bosses are added.
