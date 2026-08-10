# Trash Dash Enemy Sprite Rebuild and Roster Migration Design

**Date:** 2026-08-10

**Status:** Approved design; implementation planning pending

**Art direction:** Trashpunk Distillation

**Boss scope:** Existing bosses, including Brutus, are excluded from redesign

## Goal

Replace every non-boss enemy with the approved character designs, rebuild the
animation and effect pipelines around those designs, migrate the enemy rosters,
rebalance both levels, and verify the complete result in real gameplay.

The approved sheets are the source of truth for character appearance, pose
language, signature gear, attack identity, and effects. They are presentation
sheets rather than production atlases and must be audited and extracted before
runtime use.

## Approved source masters

The supplied source files will be copied byte-for-byte into a canonical project
source directory before processing. Canonical project names correct spelling in
the supplied filenames without changing the original files:

| Canonical enemy | Supplied master | Runtime ID |
| --- | --- | --- |
| Spider | `spider.png` | `spider` |
| Pigeon | `pegeon.png` | `pigeon` |
| Mosquito | `mosquito.png` | `mosquito` |
| Opossum | `opposum.png` | `opossum` |
| Snake | `snake.png` | `snake` |
| Squirrel | `squirrel.png` | `squirrel` |
| Dog | `dog.png` | `dog` |
| Skunk | `skunk.png` | `skunk` |
| Moth / Dustwing | `moth.png` | `moth` |
| Bee | `bee.png` | `bee` |

`dog` replaces the legacy ordinary-enemy `terrier` ID. This rename does not
alter Brutus or any boss state. Historical documentation may retain old names
only when clearly marked archival.

## Locked rosters

### Level 1

Level 1 contains exactly five ordinary enemy kinds:

1. Spider
2. Pigeon
3. Mosquito
4. Opossum
5. Snake

Fox and Bee are absent from normal Level 1 gameplay.

### Level 2

Level 2 contains exactly five ordinary enemy kinds:

1. Squirrel
2. Dog
3. Skunk
4. Moth / Dustwing
5. Bee

Opossum remains exclusive to Level 1. Brutus remains unchanged.

### Migration rules

- Remove Fox from active assets, builders, manifests, type unions, factories,
  level definitions, tests, fixtures, imports, preloads, animation tables, and
  runtime branches.
- Move Bee completely from Level 1 to Level 2.
- Reject legacy or placeholder art for every roster member.
- Repository searches may retain historical Fox or Bee references only in
  documents explicitly labeled archival.

## Shared visual system

All ten enemies use the approved **Trashpunk Distillation** language:

- Preserve each animal's approved silhouette, expression, signature scavenged
  prop, costume, palette identity, and attack language.
- Convert painted detail into crisp gameplay pixels with hard colored outlines,
  three-to-four shade ramps, restrained surface texture, and no antialiasing.
- Simplify details that disappear at gameplay scale while retaining large
  identifying features such as helmets, sacks, armor, tails, wings, lanterns,
  collars, and attack tools.
- Use transparent `192x192` runtime cells and nearest-neighbor processing.
- Use uniform X/Y scale only. No enemy or state receives a runtime squash,
  stretch, or state-specific size correction.
- Ground enemies use a stable bottom-center physical anchor and common local
  foot baseline. Flying enemies use a stable body-center anchor and explicit
  hover band.
- Author one canonical right-facing source and flip consistently at runtime.
- Separate reusable effects and projectiles from base character frames whenever
  their ownership, timing, or layering differs.

Natural relative scale remains intentional: Spider and Snake are low and wide;
Pigeon, Mosquito, and Bee are small but readable; Opossum and Dog are the
largest ordinary ground threats; Squirrel is compact; Skunk is medium with its
full tail envelope; Moth has a substantial wing silhouette around a smaller
body.

## Character design roster

### Level 1

#### Bottleback Spider

A low, broad purple spider carrying a patched green bottle-sack. Its curious
eyes become predatory during attack. Web strands, venom, and impact splashes are
separate effects. Its physical footprint stays low even when the sack changes
pose.

#### Pot-Helmet Pigeon

A small grounded bruiser with an oversized saucepan helmet, iridescent neck,
and annoyed expression. It attacks through aggressive pecks, wing flares, and
a committed helmet-first slam. Pigeon remains a ground enemy; none of its
movement states are flight states.

#### Needle Mosquito

A small dark-brown flyer with a riveted scrap cap, pale wings, and bright red
proboscis. It hovers nervously, patrols slowly, dashes along a clear lane, and
commits to a precise needle thrust.

#### Pilfer Opossum

The largest Level 1 regular: a hunched scavenger with black beanie, purple
hoodie, long pink tail, and overstuffed trash sack. Its swipe and lunge scatter
small stolen debris without baking environment-specific scenery into every
frame.

#### Can-Collar Snake

A low olive snake with a battered metal collar and bits of litter caught in its
route. It alternates a readable idle coil, ordinary slither, low fast dash,
tall strike anticipation, and fast venomous snap.

### Level 2

#### Acorn Squire

A compact orange ranged fighter with saucepan helmet, leaf plume, shoulder
armor, and green scarf. Its full performance culminates in a hand-anchored,
animated acorn projectile with travel, impact, crack, and debris states.

#### Trash-Day Dog

The largest ordinary Level 2 threat: a scarred tan street dog wearing patched
scrap armor and a leafy collar. It has a strong four-legged silhouette,
dust-heavy run/charge, bite/lunge attack, distinct wall impact, nonfatal hit,
and readable recovery. It replaces the generic terrier presentation without
changing Brutus.

#### Stinkpunk Skunk

A medium ground controller with a large readable tail, scavenged purple gear,
and portable trash-can nozzle. A tail-rise telegraph precedes a directional gas
blast. Gas clouds are separate effect cells so the body is never duplicated in
the effect layer.

#### Dustwing Moth

A mystical purple flyer with large cream wings, amber eyes, feathered antennae,
and dangling toxic lantern. It orbits lights, flutters, dashes, and swings or
releases lantern energy. Lantern payload and glow are separate attachments.

#### Rivet Bee

A fast black-and-gold aerial duelist with riveted armor, aggressive eyes,
translucent wings, and mechanical venom stinger. Its hover, dash lane, thrust,
and venom impact remain distinct from Mosquito's thinner needle silhouette.

## Animation contract

Every enemy owns an explicit presentation profile containing:

- canonical source crops and visible bounds;
- stable anchor and uniform destination geometry;
- named animation states;
- deterministic frame order and FPS;
- loop or one-shot policy;
- interruptibility policy;
- attack-active or projectile-release frame;
- state completion and return state;
- attachment points for projectiles and effects;
- collision geometry independent from transparent sprite bounds.

Unknown states throw during development and fail tests. Runtime never silently
falls back to another state's cells.

| Enemy | Required state families |
| --- | --- |
| Spider | idle, walk, run, web/bite anticipation, attack, recovery, hit |
| Pigeon | idle, walk, run, peck/slam anticipation, attack, recovery, hit |
| Mosquito | hover, slow flight, dash, needle anticipation, thrust, recovery, hit |
| Opossum | idle, walk, run, swipe/lunge anticipation, attack, recovery, hit |
| Snake | idle coil, slither, fast slither, strike anticipation, strike, recovery, hit |
| Squirrel | idle, walk, run, detect/aim, prepare, wind-up, release, follow-through, recovery, hit |
| Dog | idle, walk, run/charge, bite anticipation, lunge, impact, recovery, hit |
| Skunk | idle, walk, run, tail-rise telegraph, gas attack, recovery, hit |
| Moth | hover, flutter, dash, lantern anticipation, lantern attack, recovery, hit |
| Bee | hover, slow flight, dash, stinger anticipation, thrust, recovery, hit |

Grounded movement must agree visually with foot cadence. Flying movement must
agree with body pitch and wing cadence. Gameplay damage, hitboxes, and
projectile release activate on the visually correct frame rather than at state
entry.

Hit reactions play to completion before recovery or removal. If the mechanical
source audit finds no visually correct art for a runtime state, implementation
must remove an obsolete behavior, generate an approved missing state through a
separate design gate, or report the state as a blocker. It may not borrow an
unrelated pose.

## Projectiles and effects

Reusable effect families include:

- Spider web, venom, and impact;
- Pigeon feathers, debris, and helmet impact;
- Mosquito wing motion, dash trail, and blood/proboscis impact;
- Opossum swipe, dust, and scattered trash;
- Snake dust, venom, and strike impact;
- Squirrel acorn spin, fast travel, trajectory arc, impact, crack, and debris;
- Dog dust, dirt, bite/lunge impact, and paw prints;
- Skunk telegraph fumes and directional gas clouds;
- Moth lantern payload, glow, wing motes, and toxic impact;
- Bee wing motion, dash trail, venom drops, and ground impact.

Effects have their own bounds, origin, facing behavior, duration, and layer.
Environment-specific debris is not baked into universally reused movement
frames.

The Squirrel projectile origin is an authored hand attachment. Its release
frame, projectile spawn, trajectory, visual rotation, collision, impact, crack,
and debris sequence are one synchronized contract.

## Source ingestion and deterministic build pipeline

The approved sheets contain backgrounds, labels, gutters, shadows, effects,
and presentation spacing. They are not sliced as regular grids.

For every sheet the ingestion audit records:

- image dimensions and color mode;
- alpha/transparency behavior;
- row labels and presentation-only regions;
- usable character, projectile, and effect bounds;
- frame count and sequence within each state;
- source scale consistency;
- foot baseline or flying body center;
- transparent clearance;
- decorative material that must be excluded.

Explicit crop manifests own every frame. A deterministic builder then removes
presentation backgrounds and labels, performs bounded matte cleanup, quantizes
the approved palette, applies nearest-neighbor scaling, normalizes anchors, and
builds separate Level 1 and Level 2 atlases. It also emits contact sheets and a
machine-readable coverage report.

Builds fail when a crop is empty, clipped, mislabeled, attached to an unsupported
state, outside its canonical envelope, inconsistently scaled, incorrectly
grounded/centered, or contaminated by labels/background pixels. Two consecutive
builds must produce identical hashes.

The source audit determines exact usable frame counts. Presentation-layout
counts are not treated as proof until crops pass alpha, uniqueness, anchor, and
sequence checks.

## Runtime architecture

The runtime separates four responsibilities:

1. **Presentation profiles** own cells, timings, destinations, anchors, active
   frames, return states, attachments, and effects.
2. **Level behavior modules** own perception, movement, attack decisions, and
   state transitions.
3. **Level definitions** own roster membership, encounter placement, patrols,
   surfaces, and flight bands.
4. **Canvas rendering** consumes the strict profile and state; it does not
   invent fallbacks, rescale states, or decide attacks.

Level 1 receives explicit stateful behavior rather than its current locomotion-
only visual dispatch. Level 2 retains focused behavior modules but migrates
`terrier` to `dog` and adds Bee. Assets remain lazy-loaded by active level.

## Encounter progression

### Level 1: teaching

- **Woodland:** Snake solo introduction.
- **Creek:** grounded Pigeon introduction, then a small Mosquito aerial lesson.
- **Highway:** Spider introduction with bypass space; later Snake and Mosquito
  on separated lanes.
- **Industrial:** Opossum solo introduction with generous reaction space;
  later Pigeon and Spider on separate elevations.
- **Park:** mastery combinations using familiar Opossum, Snake, or Mosquito
  behavior; no new mechanics.
- **Boss runway:** completely enemy-free.

### Level 2: specialized combinations

- **Backyard:** Squirrel ranged tutorial from a safe observation pocket.
- **Street:** Dog charge tutorial with a long runway; later Squirrel repeat from
  a separated platform.
- **Obstacle course:** Skunk area-denial tutorial; later Skunk and Squirrel with
  non-overlapping attack lanes.
- **Drainage:** Moth light-orbit tutorial followed by Bee dash tutorial in open
  airspace.
- **Late drainage:** carefully separated mastery encounters without combining
  Dog, Skunk, and a flyer simultaneously.
- **Boss approach:** enemy-free runway; Brutus unchanged.
- **Post-boss street:** reward space without ordinary enemies.

## Placement and balance rules

- No more than two active threat groups share a viewport.
- Dog, Opossum, and Skunk normally own their screen.
- Flyers appear in small groups only after solo introduction.
- Full visual/motion envelopes remain within named support surfaces or flight
  bands and outside foreground occluders.
- Mandatory landing zones remain safe.
- Projectile and gas lanes cannot permanently block the only route.
- Dog receives sufficient charge runway and recovery space.
- Squirrel sightlines and arcs are evaluated against approach direction,
  platforms, and alternate routes.
- Enemy bodies and attacks do not overlap at spawn.
- Checkpoints, recovery pickups, and boss approaches preserve breathing room.

## Error handling and completeness gate

The project generates an explicit coverage table with this shape:

`Enemy | State | Source crop | Usable frames | Timing | Active frame | Attachment | Complete`

An enemy is complete only when every reachable gameplay state has unique,
appropriate, validated art and the running game has exercised those states.
Missing texture paths, missing states, invalid crops, duplicate/fallback cells,
unknown IDs, and unsupported roster entries fail automated checks.

The final readiness answer must be exactly one of:

- `YES - VERIFIED`
- `NO - MISSING: <exact states or assets>`

`YES - VERIFIED` requires both source/atlas verification and uninterrupted
gameplay observation. Fixtures and contract tests are supplemental evidence.

## Automated verification

Required tests cover:

- exact Level 1 and Level 2 rosters;
- Fox absence from active runtime ownership;
- Bee exclusion from Level 1 and inclusion in Level 2;
- canonical IDs and asset paths;
- complete animation registration and frame counts;
- strict state mapping with no fallback;
- uniform destination scaling and stable anchors;
- grounded baselines and flying centers;
- attack active-frame timing;
- hit/recovery completion;
- Squirrel attachment/release/projectile/impact lifecycle;
- spawn, support, patrol, flight-band, density, and overlap validity;
- lazy loading and missing-texture rejection;
- deterministic builder hashes.

## Runtime visual audit

The final audit begins at the title screen, selects a character normally, and
plays through Levels 1 and 2 without direct-state shortcuts. Every enemy must be
observed during idle/hover, ordinary movement, fast movement where applicable,
attack, hit, recovery/removal, facing changes, projectile/effect behavior,
grounding/hover, collision, layering, and encounter spacing.

The Squirrel must throw a real acorn during normal gameplay. Mosquito, Moth, and
Bee must be observed flying. Spider, Pigeon, Opossum, Snake, Dog, and Skunk must
be observed using their complete attacks. The run includes checkpoints, both
boss approaches, responsive presentation, console logs, and the full roster
progression.

If the available control surface cannot hold movement input, the audit remains
`INCOMPLETE`. Debug routes may diagnose individual states but cannot replace
the uninterrupted campaign.

## Implementation sequence

1. Copy and inventory all ten approved source masters.
2. Build the crop/coverage audit before integrating any art.
3. Establish one approved production anchor per character, then derive states.
4. Build and review the complete ten-enemy contact-sheet roster together.
5. Integrate Level 1 profiles, behaviors, projectiles/effects, and roster.
6. Integrate Level 2 profiles, behaviors, Bee migration, Dog rename, and roster.
7. Rebuild encounter placement and balance for both levels.
8. Remove Fox and obsolete legacy art/runtime ownership.
9. Run deterministic, automated, native-image, and runtime fixture checks.
10. Perform the uninterrupted campaign audit and issue an honest readiness
    report.

## Non-goals

- No boss redesign or rescore.
- No player-character redesign.
- No unrelated background, prop, HUD, camera, checkpoint, or progression
  redesign.
- No state-specific scale exceptions to hide source inconsistency.
- No vector or Canvas placeholders in place of approved bitmap art.
