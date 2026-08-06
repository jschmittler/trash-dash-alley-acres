# Level 2: Suburban After Dark

**Status:** Approved design for review  
**Level type:** Mixed platforming and exploration  
**Target clear time:** 7–9 minutes on a first successful run  
**Implementation boundary:** Browser Canvas/TypeScript world data and runtime systems

## Design goal

By the end of Level 2, the player understands that environmental objects can
redirect threats and create opportunities. Reflected bin lids, committed dog
charges, sprinklers, trampolines, and culvert routes turn the neighborhood into
a readable interaction space rather than a corridor of enemies.

The emotional arc moves from moonlit backyard curiosity, through a lively
garbage-night scavenger run, into a contained cul-de-sac confrontation. A calm
main-street walk after the boss reveals the larger downtown destination.

Level 2 preserves the selected character and all progression carried from
Level 1, including powered size, Taco Power, and the glider.

## Chapter sequence and pacing

```text
Backyard 2 → Street 4 → Obstacle course 6 → Drainage ditch 7 →
Cul-de-sac boss 9 → Main-street release 2
```

| Beat | Chapter | Target duration | Player experience | Design intent |
| --- | --- | ---: | --- | --- |
| Intro | Moonlit backyard | 60–75s | Curious and capable | Reorient the player and teach bin-lid reflection safely |
| Build | Garbage-night street | 90–105s | Alert and opportunistic | Teach committed terrier charges and establish upper/lower routes |
| Interaction | Backyard obstacle course | 90–120s | Playful experimentation | Introduce sprinklers and combine environmental reactions |
| Peak | Drainage ditch and culvert | 75–90s | Focused traversal pressure | Test aerial timing, route choice, and environmental reading |
| Boss | Locked cul-de-sac | 90–120s | Focused confrontation | Recombine charge and sprinkler language at boss scale |
| Release | Suburban main street | 30–45s | Rewarded and curious | Provide a victory walk and reveal Level 3 downtown |

## Visual chapters

The supplied concept scenes are reference compositions for mood, landmark
selection, lighting, and traversal silhouettes. They are not collision maps.

1. `01-moonlit-backyard.png` — moon, mature trees, fences, porch, shed, and
   trash-can route.
2. `02-garbage-night-street.png` — wet pavement, bins, parked cars, mailboxes,
   utility poles, and warm porch lights.
3. `03-backyard-obstacle-course.png` — trampoline, pool, sprinklers, fences,
   treehouse, and tiered garden walls.
4. `04-drainage-ditch-and-culvert.png` — culvert, ditch, reeds, guardrails,
   utility corridor, and the downtown skyline.
5. `05-suburban-main-street.png` — small storefronts, laundromat, water tower,
   alleys, and the transition into the larger city.

The cul-de-sac runway and boss arena occupy the opening band of the suburban
main-street chapter. They use that chapter's far/middle/close set, with arena
geometry and whole house/fence props creating the cul-de-sac silhouette. Boss
entry therefore does not introduce a sixth background or a second transition.

## Encounter teaching arc

Level 2 uses four standard enemy types and one boss. Each new enemy is shown
from safety, tested alone, repeated with a variation, and only then combined.
No more than two ordinary encounter groups may be visible at once, and only one
group may demand immediate reaction.

### E1 — Backyard squirrel tutorial

One Bin-Lid Squirrel occupies a broad fence. Its slow lid throw has a clear
overhead telegraph and enough recovery time for a safe tail-swipe reflection.
The player first sees the squirrel from a non-hostile lawn pocket.

### E2 — Street terrier tutorial

One sleeping Trash-Day Terrier owns a full screen of flat street. It wakes,
raises its ears, barks once, and commits to a straight charge. A fence or bin
stops a missed charge and creates a vulnerable recovery window. No other active
threat shares this introduction.

### E3 — Street squirrel repeat

A squirrel throws across the lower route from a mailbox or fence. The player
may reflect the lid, pass beneath during recovery, or take the parked-car route
above the encounter.

### E4 — Obstacle-course skunk tutorial

One Sprinkler Skunk occupies a wide lawn beside a visible sprinkler. Its tail
rises and flashes before a short pushing spray. The spray cannot knock the
player directly into an unseen hazard.

### E5 — Obstacle-course interaction test

A squirrel and skunk occupy separate vertical layers. A reflected lid may pass
through the spray, while trampoline and treehouse platforms provide a complete
bypass. Silhouettes, patrol ranges, and attack lanes remain visually separate.

### E6 — Porch-Light Moth introduction

One moth follows a lazy figure-eight around a lit porch lamp. The player sees a
complete orbit before entering its diagonal dive trigger. The moth becomes
vulnerable during its slow return to the light.

### E7 — Drainage mastery encounter

Two moths use staggered flight bands above an open ditch. A lone terrier owns
the landing area beyond them, outside the moths' immediate reaction space. The
culvert bypass avoids the terrier; an upper utility route holds the premium
trash cache.

### E8 — Boss runway

The drainage checkpoint begins an enemy-free runway. All ordinary encounter
groups are inactive before the cul-de-sac camera lock starts.

## Enemy movement contracts

| Enemy | Movement | Surface or band | Spacing class |
| --- | --- | --- | --- |
| Bin-Lid Squirrel | Platform-bound | Named fence, mailbox, or porch platform | Small |
| Trash-Day Terrier | Grounded reactive chaser | Named lawn, sidewalk, or street surface | Large |
| Sprinkler Skunk | Grounded area control | Named lawn surface | Medium |
| Porch-Light Moth | Flying figure-eight and dive | Authored porch-light flight band | Small |
| Brutus the Bin-Hound | Arena-bound | Locked cul-de-sac bounds | Boss |

Every grounded or platform-bound spawn references a stable `surfaceId`. Runtime
patrol bounds are intersected with the supporting surface after subtracting the
collision width. Flying enemies use explicit flight bands and never resolve to
terrain. Facing follows committed horizontal velocity and preserves direction
inside a dead zone.

## Routes and optional rewards

### R1 — Backyard porch route

A short porch-and-fence sequence passes above the squirrel's lane and reveals a
trash cache. The route is visible from the starting lawn.

### R2 — Parked-car route

Car roofs and low porch ledges bypass the street squirrel. A trash chain makes
the safer route slower but visibly rewarding.

### R3 — Treehouse route

Trampoline and fence platforms lead to the treehouse. A Taco Power refresh
rewards the route, but carried progression means it is never required.

### R4 — Poolside secret

A concealed pool-edge pocket holds a major trash cache. It does not introduce
a new life or health economy.

### R5 — Culvert bypass

The lower culvert route avoids the drainage terrier and contains recovery
trash. Its entrance remains visible from the primary route.

### R6 — Utility-line mastery route

The upper drainage route requires glider use or precise platforming and holds
the level's premium trash cache. It rejoins before the boss checkpoint.

## Checkpoints and failure handling

- **Street checkpoint:** before the first terrier encounter.
- **Obstacle-course checkpoint:** before the sprinkler interaction chapter.
- **Drainage checkpoint:** before the moth mastery encounter.
- **Boss runway checkpoint:** before the cul-de-sac transition.
- Water and bottomless drainage gaps cause immediate paw loss and respawn at
  the latest checkpoint.
- Ordinary contact uses the existing hurt, shrink, and respawn rules.
- Carried abilities and character selection persist through checkpoint resets.

## Background layer contract

Each visual chapter receives purpose-built far, middle, and close plates. A
flattened concept image must never be divided with horizontal opacity masks.

| Chapter | Far plane | Middle plane | Close plane |
| --- | --- | --- | --- |
| Moonlit backyard | Moon, stars, distant roofs, treeline | Whole houses, fences, shed | Edge trunks, garden plants, porch framing |
| Garbage-night street | Clouds, distant neighborhood lights | Whole houses, poles, parked cars | Hedges, nearby bins, porch edges |
| Obstacle course | Moonlit roofs, distant trees | Whole treehouse, fences, patio structures | Close shrubs, pool edge, restrained sprinkler mist |
| Drainage ditch | Downtown skyline, dark hills | Whole culvert, guardrails, utility poles | Reeds, banks, foreground grasses |
| Main street | Downtown towers, night sky | Whole storefronts, laundromat, water tower | Alley walls, awnings, curb framing |

Substantial middle-plane objects share a chapter contact baseline or disappear
naturally behind gameplay geometry. Close objects frame the action without
covering platforms, enemies, pickups, or landing targets. Chapter boundaries
use one monotonic smoothstep blend through the existing parallax system.

## Traversal vocabulary

The level uses a compact set of reusable geometry:

- Lawn, sidewalk, and street ground strips.
- Fence, porch, mailbox, parked-car, and treehouse platforms.
- Trampoline launch surfaces.
- Pool and drainage water hazards.
- Culvert tunnels as safe lower routes.
- Utility and rooftop ledges as optional upper routes.
- A flat, locked cul-de-sac boss arena.
- A calm storefront path after victory.

Decorative props remain separate from collision surfaces. Anything that looks
safely standable receives an explicit support surface. Pure decoration is
positioned so it cannot falsely promise a traversal route.

## Brutus the Bin-Hound

Brutus reuses the terrier's charge language at boss scale.

1. **Phase 1:** Sniff, bark, then commit to a charge. A hydrant collision opens
   the bin armor and exposes the first hit.
2. **Phase 2:** Charges accelerate and dislodge rolling garbage cans. Only one
   moving can hazard may exist at a time.
3. **Phase 3:** Sprinklers activate in a predictable alternating pattern. A
   final hydrant collision exposes the winning hit.
4. **Defeat:** Brutus slides into a kiddie pool, shakes himself dry, and trots
   away with the bin stuck around his waist.

The camera and player remain clamped to the cul-de-sac from encounter entry
until the complete defeat sequence ends. Ordinary enemies cannot enter or
reactivate inside the arena.

## Runtime architecture

Level 2 extends the game through a reusable campaign-level contract rather than
adding Level 2 branches throughout `trash-dash-game.tsx`.

```ts
type CampaignLevelDefinition = {
  id: string;
  title: string;
  worldWidth: number;
  zones: LevelZone[];
  surfaces: LevelSurface[];
  encounters: EncounterGroup[];
  rewards: LevelReward[];
  checkpoints: LevelCheckpoint[];
  routeChoices: LevelRoute[];
  boss: LevelBoss;
  exit: LevelExit;
};
```

- A level registry selects the active definition.
- `app/level-two.mjs` owns all Level 2 declarative data.
- Rendering, collision, spawning, checkpoints, parallax, and boss transitions
  consume the active definition.
- New enemy behaviors live in focused state modules with pure helpers where
  possible.
- Direct local test routes open the full level, each chapter, interaction
  encounters, and the boss runway.
- Level 1 remains the default until campaign flow is implemented and retains
  full regression coverage.

## First playable milestone

The first local milestone includes:

- A reusable active-level registry and Level 2 definition.
- Complete chapter widths, traversal geometry, routes, and checkpoints.
- All five parallax chapter sets and the four smooth boundary transitions
  between them.
- Surface-owned placeholder behavior for the four standard enemies.
- Carried character, size, Taco Power, and glider state.
- A locked Brutus arena with phase scaffolding and direct boss test route.
- Direct chapter and encounter test links.

Final enemy animation atlases and cosmetic polish may be refined after the
structural playtest, but placeholder art must obey final baselines, facing,
support surfaces, and collision dimensions.

## Verification contract

### Automated

- Zone ranges are contiguous and cover the complete traversable world.
- Every encounter references an existing zone and valid support surface or
  flight band.
- Requested patrols remain inside their support surfaces.
- Large enemies own dedicated encounter space.
- No more than two ordinary groups are scheduled within one viewport.
- Route, reward, checkpoint, and bypass references are bidirectionally valid.
- Every background set passes size, alpha, semantic ownership, and baseline
  checks.
- Chapter blending crosses each boundary once without resetting.
- Selected character and carried progression survive the Level 1 → Level 2
  transition and checkpoint reset.
- Boss entry clears ordinary populations and clamps the player and camera.
- Existing Level 1 tests continue to pass.

### Browser playtest

- Walk and run through every background transition in both directions.
- Inspect all five parallax sets at desktop and mobile landscape sizes.
- Confirm no middle landmark, decorative prop, pickup, or enemy floats.
- Test every alternate route without taking intentional damage.
- Verify reflected lids, terrier recovery, sprinkler push, and moth dive tells.
- Confirm the boss runway is calm and the arena cannot be escaped.
- Confirm the post-boss main-street walk contains no hostile encounter.

## Acceptance criteria

- A first-time player can finish without using the glider or optional routes.
- Each new enemy is introduced alone before appearing in a combination.
- Environmental interactions are helpful but never mandatory before their rule
  has been demonstrated safely.
- Large enemies never share immediate reaction space with another large threat.
- Every grounded enemy stays visibly and physically attached to its surface.
- Every chapter supports one primary route and at least one meaningful optional
  route or secret.
- Background depth, grounding, and transitions meet the Level 1 manuals.
- Brutus recombines familiar rules instead of introducing an unrelated boss
  mechanic.
- Victory produces a calm, readable transition toward downtown Level 3.
