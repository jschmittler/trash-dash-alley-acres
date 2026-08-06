# Enemy Placement and Grounding Manual

## Purpose

This manual defines how to place side-scroller enemies so encounters remain readable, patrols respect the environment, and animated sprites stay visually attached to their supporting surfaces.

The central rule is:

> An enemy owns one movement contract and one encounter role at a time.

Ground enemies belong to a specific surface. Flying enemies belong to a deliberate flight band. Bosses belong to a locked arena. Encounter groups belong to a pacing beat rather than appearing wherever empty space exists.

## 1. Failure history and what each failure taught us

### Failure: enemies floated above platforms or terrain

**Symptom:** Feet never touched the supporting surface, or an enemy drifted at a fixed screen Y.

**Root causes:** Sprite cells had inconsistent transparent padding; spawn Y values were trusted without resolving a surface; ground and flight rules were mixed.

**Fix:** Normalize grounded animation frames to one foot baseline and resolve every grounded spawn to a real support surface. Collision position and sprite baseline are separate contracts and both must pass.

### Failure: enemies sank through the ground

**Symptom:** Parts of the body clipped below the platform during some animation frames.

**Root cause:** Frames had different lowest opaque pixels even though the collision body remained stable.

**Fix:** Normalize all grounded frames to the same visible foot row at atlas-build time. Do not compensate with per-frame runtime offsets.

### Failure: enemies crossed gaps or walked off platform edges

**Symptom:** A patrol continued into empty space.

**Root cause:** Patrol bounds were authored independently from collision surfaces.

**Fix:** Intersect requested patrol bounds with the supporting surface bounds after subtracting the enemy's full width. Reverse before the collision body leaves support.

### Failure: pigeons were treated as flying enemies

**Symptom:** Walking pigeon art floated because its behavior was assigned from the animal category rather than the animation shown.

**Root cause:** “Bird” was assumed to mean airborne.

**Fix:** Classify movement from the actual animation and encounter role. A pigeon with a walking cycle is grounded; a bee with a hover cycle is flying.

### Failure: enemies slid backward

**Symptom:** The sprite faced left while velocity moved right.

**Root cause:** Rendering guessed direction inconsistently or the source art's canonical facing was misunderstood.

**Fix:** Store explicit facing state. Update it only when meaningful horizontal movement changes direction. Render flips from that state.

### Failure: the opossum flickered between directions

**Symptom:** Facing alternated when the player was almost directly above or overlapping horizontally.

**Root cause:** Chase direction recalculated from a near-zero horizontal difference each frame.

**Fix:** Add a facing dead zone. Preserve current facing until the target is meaningfully to one side.

### Failure: enemy populations became chaotic

**Symptom:** Too many unrelated enemies appeared simultaneously, making the level noisy and unfair.

**Root cause:** Enemies were placed individually instead of as authored encounter groups, and all spawns were active too early.

**Fix:** Use declarative encounter groups, activate them near the player, limit visible groups, and reserve isolated space for large enemies.

### Failure: large and small enemies used the same spacing

**Symptom:** Foxes and opossums overlapped other threats and removed route choices.

**Root cause:** Spacing was based only on available pixels, not threat footprint and attention cost.

**Fix:** Give large enemies solo encounter zones. Small enemies may form coherent pairs or trios. Mixed groups require vertical or route separation.

### Failure: ordinary enemies followed the player into the boss sequence

**Symptom:** The boss arena contained leftover threats or the player could retreat into the previous level.

**Root cause:** Arena activation did not own population state and camera bounds.

**Fix:** Add an enemy-free runway, deactivate all ordinary enemies on arena entry, clamp the player and camera, and keep only the boss active.

## 2. Enemy movement classes

### Grounded

Examples: snake, walking pigeon, opossum, spider, fox.

- Requires a support surface.
- Visible foot baseline must match the collision body's bottom anchor.
- Patrol range is clipped to the support surface.
- Cannot cross gaps unless a dedicated jump/fall state explicitly owns that behavior.

### Platform-bound

A grounded subtype used on raised surfaces.

- Support must be the intended platform, not merely the nearest ground below.
- The platform must be at least as wide as the enemy body.
- Patrol endpoints include a safety margin or edge-turn anticipation.
- Moving platforms require local/platform-relative coordinates.

### Flying

Examples: bee/wasp, mosquito, a bird with an actual flight animation.

- Uses an authored flight baseline independent from terrain.
- Small sine or hover offsets are centered around that stable baseline.
- Horizontal bounds remain explicit.
- Must not be snapped to ground or platforms.
- Flight paths cannot overlap required blind jumps without a readable warning.

### Arena-bound

Bosses and scripted guardians.

- Activated by an arena trigger.
- Uses arena-specific bounds, not ordinary patrol surfaces.
- Other populations are cleared or frozen as defined by the encounter.
- Entry, attack, hit, defeat, and recovery states are explicit and telegraphed.

## 3. Size and attention classes

Use the enemy's gameplay footprint and attention demand, not its source-image dimensions.

| Class | Typical use | Cluster size | Companion threats | Recommended clear space |
| --- | --- | ---: | --- | --- |
| Tiny/ambient | mosquito, small bee | 1–3 | One matching type | 0.35 viewport before next group |
| Small | snake, spider, walking bird | 1–3 | Pair or vertical complement | 0.45 viewport before next group |
| Medium | fast or durable specialist | 1–2 | At most one light support threat | 0.6 viewport before next major group |
| Large | fox, opossum, brute | 1 | Optional distant airborne pressure only | 0.8 viewport of owned encounter space |
| Boss | named arena enemy | 1 | None unless the boss design explicitly summons | Locked arena plus entry runway |

Viewport-relative spacing scales better than fixed pixels. At a 1152-pixel gameplay width, 0.45 viewport is about 520 pixels and 0.8 viewport is about 920 pixels.

## 4. Clustering rules

### Valid small clusters

- Two or three matching enemies that communicate one idea.
- A walking bird pair moving on the same broad surface.
- A bee and mosquito occupying separate flight heights.
- A ground enemy plus a visually separated airborne enemy when the player has an alternate route.

Intra-cluster spacing should keep silhouettes distinct. A useful initial range is one-to-two enemy widths between bodies; widen it for fast enemies.

### Invalid clusters

- Multiple large enemies sharing one screen without an arena design.
- A large ground enemy, multiple flyers, and a pit demanding attention simultaneously.
- Enemies from three unrelated behavior families in one introductory encounter.
- Overlapping patrol ranges that cause enemies to stack into one unreadable mass.
- A new enemy type introduced during a mandatory precision jump.

### Visible population budget

- Target no more than two ordinary encounter groups visible at once.
- Only one group should demand immediate reaction.
- The next group may be visible as foreshadowing but should not already be attacking.
- Leave a recovery pocket after every intensity spike.

## 5. Encounter teaching sequence

For each enemy type, follow this arc:

1. **Show:** player sees the enemy from safety.
2. **Solo test:** enemy appears alone with clear ground and reaction space.
3. **Repeat:** same rule appears in a slightly different surface layout.
4. **Combine:** pair it with one previously learned pressure source.
5. **Mastery/bypass:** present a harder version with an optional safer route.
6. **Release:** provide enemy-free traversal, pickup space, or a checkpoint.

Do not introduce, combine, and peak the same enemy in one screen.

## 6. Declarative encounter data

Enemies should be authored inside named groups rather than appended as incidental platform children.

Recommended portable shape:

```ts
type EnemyPlacement = {
  kind: EnemyKind;
  x: number;
  movement: "grounded" | "platform" | "flying" | "arena";
  surfaceId?: string;
  flightY?: number;
  patrol?: [number, number];
};

type EncounterGroup = {
  id: string;
  zoneId: string;
  spawnX: number;
  sizeClass: "tiny" | "small" | "medium" | "large" | "boss";
  enemies: EnemyPlacement[];
  bypassRouteId?: string;
  recoveryEndX: number;
};
```

Trash Dash currently resolves many supports by `surfaceY`; future levels should prefer a stable `surfaceId` so two nearby platforms at similar heights cannot be confused.

## 7. Support-surface resolution

For a grounded enemy:

1. Read the enemy's collision width, not the rendered sprite width.
2. Find surfaces at the requested contact height that are wide enough.
3. Prefer the surface nearest the enemy's horizontal center.
4. If no exact-height surface exists, use a deliberate nearest-surface fallback and flag it for review.
5. Compute the legal horizontal interval:

```text
minimum = surface.x
maximum = surface.x + surface.width - enemy.width
```

6. Intersect the requested patrol interval with the legal interval.
7. Clamp the spawn X into the resolved patrol interval.
8. Replace the authored contact Y with the support surface's authoritative Y.
9. Store the resolved surface or identifier for later validation.

For a flying enemy, skip surface resolution and preserve the explicit flight band.

Trash Dash implementation: `app/enemy-surface.mjs`.

## 8. Runtime patrol contract

- The collision body remains fully inside `minX..maxX`.
- Direction reverses once at a boundary.
- Explicit facing changes with the committed movement direction.
- Zero velocity preserves facing.
- Animation state does not change collision dimensions.
- Ground Y comes from the support surface, never from animation frame bounds.
- A patrol cannot migrate to a neighboring surface merely because it is close.
- A gap, wall, platform edge, or arena boundary is a real movement constraint.

If the enemy can jump, fall, climb, or transfer surfaces, implement that as an explicit state transition with a destination surface. Do not weaken ordinary patrol clamping.

## 9. Spawn activation and population control

- Encounter groups begin dormant.
- Activate a group when the player is close enough to see or anticipate it, not at level load.
- Activation distance should be shorter than the distance to the following group.
- Do not activate groups behind the camera unless they intentionally persist.
- Deactivate or retire enemies that cannot re-enter the play space.
- At boss entry, deactivate every ordinary group before the arena becomes interactive.

Spawn activation is a population tool, not a substitute for encounter spacing. Poorly placed groups remain poor even if they activate later.

## 10. Route and reward relationship

Each high-pressure group needs one of:

- adequate flat-ground reaction space;
- a readable elevated bypass;
- a lower culvert or alternate path;
- cover or a safe waiting pocket; or
- a power-up/recovery pickup earned immediately before or after the test.

Large enemies should guard a choice, route, or meaningful space. Do not use them as decorative traffic.

## 11. Automated checks

### Surface tests

At minimum, cover these cases:

- Ground enemy remains inside a raised platform.
- Edge spawn is pulled fully onto its support.
- Unsupported spawn resolves to the intended nearest matching segment.
- Requested patrol bounds are clipped to the supporting segment.
- Flying patrol remains independent from all surfaces.
- No resolved ground patrol has `minX > maxX`.
- Enemy width never exceeds its support width.

### Sprite baseline tests

- Every grounded animation frame is non-empty.
- Lowest visible pixels share the declared foot row.
- No visible pixels touch forbidden atlas boundaries.
- Horizontal flipping preserves the same optical center and contact line.

### Encounter data tests

- Only the approved level roster appears.
- Encounter groups remain in the authored traversal order.
- Large enemies occupy solo groups.
- No more than the approved number of groups overlap one viewport.
- Every bypass references a real route in the same zone.
- The final runway contains no ordinary enemies.
- The boss is the only arena population after activation.

### State tests

- Facing remains stable inside the target dead zone.
- Facing changes after committed reversal.
- Ground and flying states use distinct vertical formulas.
- Hit, defeat, and recovery animation states take priority over locomotion.

## 12. Visual QA pass

For every ground enemy:

1. Watch a complete idle and walk cycle on flat terrain.
2. Watch a complete cycle on a raised platform.
3. Follow it to both patrol endpoints.
4. Confirm feet remain attached and no body pixels clip below the surface.
5. Confirm the full collision body turns before leaving support.
6. Confirm the sprite faces its movement direction after both reversals.

For every flying enemy:

1. Watch a full hover/flight loop.
2. Confirm the vertical motion is slow, small, and centered on a stable band.
3. Confirm there is no walking frame pretending to fly.
4. Confirm the path does not intersect foreground art or required landing zones unfairly.

For every encounter group:

1. Approach at walking speed.
2. Approach at running speed.
3. Stop at the first moment the group becomes visible.
4. Count visible groups and immediate threats.
5. Verify silhouettes do not overlap into one unreadable shape.
6. Verify the player can identify the main route and any bypass.
7. Verify the following group is not already attacking.
8. Verify a recovery space follows the peak.

## 13. Encounter review sheet

| Encounter | Size class | Group count | Support resolved | Patrol clamped | Facing correct | Reaction space | Bypass/recovery | Pass |
| --- | --- | ---: | --- | --- | --- | --- | --- | --- |
| Encounter ID | small/large/etc. | number | Yes/No | Yes/No | Yes/No | Yes/No | route or distance | Yes/No |

Record the world X coordinate and a screenshot for every failure.

## 14. Release checklist

- [ ] Every enemy has an explicit movement class.
- [ ] Every grounded enemy resolves to one real support surface.
- [ ] Every patrol interval is clipped using the full collision width.
- [ ] Grounded frames share one visible foot baseline.
- [ ] Flying enemies use stable authored flight bands.
- [ ] Explicit facing matches committed movement direction.
- [ ] Small enemies cluster only in coherent pairs or trios.
- [ ] Large enemies own isolated encounter space.
- [ ] No more than two ordinary groups are visible at once.
- [ ] New enemies follow show → solo → repeat → combine progression.
- [ ] High-pressure groups have reaction space, a bypass, or recovery support.
- [ ] Spawn activation preserves the authored population budget.
- [ ] The boss runway is quiet and the boss arena contains no ordinary enemies.
- [ ] Surface, baseline, encounter-data, and state tests pass.
- [ ] Desktop and mobile-landscape visual scans pass.

## Project examples

- Declarative zones and encounter groups: `app/level-one.mjs`
- Surface-aware spawn and patrol resolution: `app/enemy-surface.mjs`
- Surface regression tests: `tests/enemy-surface.test.mjs`
- Roster and encounter-order tests: `tests/level-one-definition.test.mjs`
- Grounded atlas rules: `docs/superpowers/specs/2026-08-05-animation-state-and-sprite-baseline-design.md`
- Level 1 pacing and route logic: `docs/superpowers/specs/2026-08-06-level-one-design.md`

