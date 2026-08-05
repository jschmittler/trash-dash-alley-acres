# Animation State and Sprite Baseline Design

## Objective

Remove the remaining enemy and player animation glitches by separating gameplay bodies from visual sprite placement and by representing time-based reactions as explicit states. The update normalizes ground-enemy artwork to a shared foot baseline, stabilizes enemy facing, improves the boss walk and hit reactions, adds a complete player hurt sequence for ordinary damage, and makes pit falls immediately consume a paw and respawn or end the run.

This slice does not redesign enemy AI, replace the collision system, add new enemies, rebalance level placement, or change the number of paws. It preserves current checkpoints, power-up rules, controls, level geometry, and flying-enemy motion.

## Sprite baseline normalization

### Build-time atlas processing

`scripts/build-sprite-atlases.py` will normalize every ground-enemy frame in `enemy-variety-motion.png` to a common transparent-cell baseline. For each 192×192 source cell, the script will:

1. find the nontransparent pixel bounds after chroma-key cleanup;
2. preserve the frame's pixels, dimensions, and horizontal center;
3. translate the visible artwork vertically so its lowest nontransparent pixel sits eight source pixels above the cell bottom;
4. clip nothing—if a translated frame would exceed the cell, the build fails instead of silently cropping it.

The eight-pixel source margin matches the established original enemy atlas and provides one consistent visual contract for bottom-anchored rendering. The normalization applies to snake, spider, rat, hedgehog, fox, boar, and frog. Flying rows retain their existing placement because their sine-wave motion is centered on an airborne baseline rather than a surface.

The generated atlas remains deterministic. Re-running the script from unchanged inputs must produce identical output bytes. A build-time validation step will inspect every normalized ground frame and fail if its opaque bounds do not end at the expected row or if any opaque pixels touch a cell boundary.

### Runtime drawing contract

Gameplay collision rectangles remain unchanged. Ground-enemy artwork continues to render bottom-center against `enemy.y + enemy.h`; the normalized atlas ensures that the visible feet now share the same relationship to that anchor. No per-enemy runtime offset table will be introduced.

Flying enemies continue using their existing stable flight baseline and small sine-wave offset. The surface resolver remains authoritative for ground-enemy `y` positions, including platforms and terrain.

## Explicit enemy animation state

### Facing direction

Each enemy stores an explicit facing value of `-1` for left or `1` for right. Rendering reads this field instead of inferring orientation directly from the current frame's velocity.

Patrolling enemies update facing only when their horizontal movement has a meaningful magnitude. The possum's chase behavior uses a horizontal dead zone around the player: while the player is inside that zone, the possum keeps its current facing and does not repeatedly reverse. Once the target is outside the dead zone, the possum selects a direction and retains it until a real movement reversal occurs. Patrol-boundary reversals update velocity and facing together.

This makes orientation a stable piece of enemy state and prevents a possum that overlaps the player's horizontal position from alternating left and right every frame.

### Boss states

The boss has two visual states:

- `walking`: uses the existing four-frame motion row in a slower ping-pong sequence, avoiding a hard last-frame-to-first-frame jump;
- `hit`: uses the existing star-impact boss frame for the full hit-recovery interval.

Boss collision and health logic remain unchanged. A successful player attack enters `hit`, starts the existing recovery timer, and blocks repeat damage until recovery ends. The hit frame takes precedence over walking and opacity flashing. When recovery completes, the boss returns to `walking` without changing patrol direction.

## Player damage state

### Ordinary enemy or hazard damage

The player gains an explicit hurt phase with a fixed duration long enough to display the existing `smallHurt` or `largeHurt` sprite clearly. On ordinary damage:

1. if the player is already hurt, invulnerable, won, or dead, the new hit is ignored;
2. input-driven movement and attacks stop for the hurt phase;
3. the player receives a short knockback impulse and the appropriate hurt sprite is rendered for the entire phase;
4. additional damage is blocked while the sequence runs;
5. only when the phase completes is its queued outcome applied.

The queued outcome is decided at impact time:

- large raccoon: shrink to small form in place, then receive the existing post-hit invulnerability window;
- small raccoon with paws remaining: remove one paw and respawn at the current checkpoint as a small raccoon;
- small raccoon on the last paw: remove the final paw and show game over.

The queued outcome cannot be changed by collisions encountered during the hurt phase. Restarting or beginning a new run clears all hurt state and pending outcomes.

### Pit death

Crossing the existing pit threshold is a distinct terminal event, not ordinary damage. It bypasses the hurt animation and invulnerability checks, immediately removes one paw, resets the player to small form, and either respawns at the current checkpoint or shows game over when no paws remain.

Pit handling is idempotent: one fall consumes exactly one paw. The transition prevents another update frame from processing the same fall before respawn or game over.

## State and data flow

Enemy update code owns movement, facing changes, and boss-state transitions. Rendering consumes the resulting `facing` and animation state without recalculating them. Sprite preprocessing owns opaque-pixel alignment; runtime drawing consumes the normalized atlas without asset-specific corrections.

Player collision code starts a hurt sequence and records a pending outcome. The regular update loop advances the hurt timer and commits that outcome when it expires. Pit detection calls a separate immediate-death transition and never enters the hurt state.

This separation keeps three concerns independent:

- collision bodies determine gameplay contact;
- animation state determines which frame is shown;
- sprite baselines determine where opaque artwork sits inside its atlas cell.

## Failure handling and invariants

- Atlas generation fails loudly if a ground frame is empty, clipped, or cannot be aligned to the shared baseline.
- Facing must always be `-1` or `1`; zero velocity never produces a third orientation.
- Boss hit recovery must have one visual owner, so walking animation cannot overwrite the hit frame.
- A hurt sequence has exactly one pending outcome, applied once.
- A pit transition cannot pass through the large-to-small damage path and cannot consume more than one paw.
- Checkpoint respawn clears transient velocity, attack, glider, hurt, and pending-damage state.

## Verification strategy

### Automated tests

- Generate the enemy atlas and assert every ground frame's lowest opaque pixel uses the shared eight-pixel margin.
- Assert normalized frames retain nonzero opaque bounds and no opaque pixel touches a cell edge.
- Assert a possum inside the chase dead zone preserves its facing across repeated updates.
- Assert patrol and chase reversals update explicit facing once movement direction actually changes.
- Assert boss walking uses a ping-pong frame sequence and boss recovery selects the hit frame.
- Assert an ordinary hit enters hurt state without immediately shrinking or consuming a paw.
- Assert the pending shrink, checkpoint respawn, and game-over outcomes occur only after the hurt timer completes.
- Assert repeat collisions during hurt do not queue or apply additional damage.
- Assert a pit fall immediately consumes exactly one paw, resets large form, skips hurt state, and respawns or ends the run.
- Run the existing surface, rendering, input, audio, lint, and production-build checks to catch regressions.

### Browser playtest

1. Inspect snake, spider, rat, hedgehog, fox, boar, and frog on terrain and platforms; their visible contact point must remain attached to the surface throughout each walk cycle.
2. Approach and cross a possum slowly from both directions; it must not flicker between orientations while near the player.
3. Watch each ground enemy reverse at a patrol boundary; it must face its new travel direction.
4. Observe the boss for multiple walk cycles; the loop must read as continuous rather than snapping.
5. Strike the boss and confirm the star-impact frame remains visible throughout recovery before walking resumes.
6. Take ordinary damage while large and small; confirm the correct hurt sprite finishes before shrink, respawn, or game over.
7. Remain near an enemy during the hurt sequence; confirm only one damage outcome occurs.
8. Fall into a pit while large and while small; confirm immediate checkpoint respawn, one-paw loss per fall, small form after respawn, and no hurt animation.

## Acceptance criteria

- All generated ground-enemy frames share the documented opaque-pixel baseline without clipping.
- Ground enemies visually remain on their assigned terrain or platform surfaces through their animation cycles.
- Possum facing remains stable near the player and all moving enemies face their actual travel direction.
- The boss walk uses a smooth ping-pong cycle and a successful hit displays the existing star-impact frame for the recovery interval.
- Ordinary player damage visibly completes the correct hurt animation before applying shrink, checkpoint respawn, or game over.
- Damage cannot repeat during the hurt sequence.
- Pit falls skip the hurt sequence, immediately remove exactly one paw, reset large form, and respawn or end the run.
- Existing controls, checkpoints, attacks, power-ups, enemy surfaces, audio, desktop layout, and current mobile foundation continue to work.
- Automated checks, lint, both production builds, and the browser gameplay walkthrough pass.
