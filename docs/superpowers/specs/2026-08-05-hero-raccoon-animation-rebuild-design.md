# Hero Raccoon Animation Rebuild Design

## Goal

Replace the hero's mixture of reused motion strips and raw atlas crops with a complete, standardized animation system for the small and large raccoon forms. Preserve the current face, scarf, belt, tail pattern, palette, outline treatment, and overall personality while repairing or redrawing the poses required for consistent animation.

The rebuilt assets must eliminate cross-sprite crops, baseline drift, scale changes, and state-dependent centering jumps. The browser game must select animations through an explicit manifest rather than hard-coded source rectangles inside the render loop.

## Approved Direction

Use a hybrid rebuild:

- Recover and reuse clean existing artwork whenever it meets the new standards.
- Repair or redraw only missing, incomplete, or inconsistent poses.
- Keep the current visual identity rather than moving to a stricter SNES redesign.
- Preserve the power hierarchy: small form cannot tail-swipe or glide; large form can.
- Make the large form's signature attack a tail swipe, not a punch or projectile.

## Canonical Sprite Standard

All gameplay frames use 192 by 192 transparent cells. Each grounded frame shares one foot baseline and enough transparent margin to prevent clipping. Frames within a form share a stable optical center, head height, body mass, palette, outline weight, and facing direction.

The canonical atlas is accompanied by a manifest that declares:

- form and state name;
- atlas row and frame count;
- playback cadence;
- looping or one-shot behavior;
- draw offset and display size;
- optional active gameplay frames, such as the tail-swipe hit window;
- fallback state.

The renderer reads the manifest only. Raw coordinates from `raccoon-sprites.png` do not remain in the gameplay loop.

## Animation State Matrix

### Small form

| State | Frames | Behavior |
| --- | ---: | --- |
| Idle | 4 | Subtle breathing and tail motion; looping |
| Walk | 6 | Controlled low-speed travel; looping |
| Run | 6 | Longer stride and stronger forward lean; looping |
| Jump | 2 | Takeoff and rising pose; one directional sequence |
| Fall | 2 | Apex transition and descending pose |
| Land | 2 | Plays after meaningful airtime, then returns to locomotion |
| Hurt | 3 | Impact, recoil, and recovery; committed sequence |
| Skid/turn | 3 | Fast reversal feedback; facing flips on the designated turn frame |
| Defeat | 4 | Plays only after the final paw is lost |
| Victory | 4 | End-of-level celebration |

### Large form

| State | Frames | Behavior |
| --- | ---: | --- |
| Idle | 4 | Confident breathing and tail motion; looping |
| Walk | 6 | Heavy controlled travel; looping |
| Run | 6 | Powerful stride and forward lean; looping |
| Jump | 2 | Takeoff and rising pose |
| Fall | 2 | Apex transition and descending pose |
| Land | 2 | Plays after meaningful airtime |
| Tail swipe | 5 | Wind-up, active sweep, impact, follow-through, and recovery |
| Hurt | 3 | Impact, recoil, and recovery; committed sequence |
| Shrink | 4 | Bridges large hurt into small idle without a scale pop |
| Glide | 6 | Existing glider motion, normalized to the canonical standard |
| Skid/turn | 3 | Fast reversal feedback with a controlled facing flip |
| Victory | 4 | End-of-level celebration |

Small form has no attack or glide state. Large form defeat is not a separate requirement because ordinary damage first resolves through hurt and shrink; final defeat occurs while small.

## State Selection and Transition Rules

The controller selects one animation with this priority, from highest to lowest:

1. defeat;
2. hurt or shrink;
3. victory;
4. tail swipe;
5. glide or ordinary airborne state;
6. skid/turn;
7. run, walk, or idle.

Committed sequences cannot be restarted by repeated input. Hurt finishes before shrink, checkpoint reset, paw loss, or game over. Pit falls remain immediate and bypass the hurt sequence.

The tail swipe activates its gameplay hitbox only during the sweep and impact frames. Its wind-up and recovery frames are visual only. Repeated action input cannot restart the attack until recovery finishes.

Idle, walk, and run use velocity thresholds with a small hysteresis band to prevent rapid state flicker. Jump, fall, and land are selected from grounded state, vertical velocity, and meaningful airtime. Glide overrides ordinary jump and fall visuals. A fast horizontal reversal selects skid/turn and flips facing on the designated turn frame rather than during the draw call.

If a state or frame is unavailable during development, the controller uses the current form's idle frame and reports a warning. Production assets must pass validation, so the fallback is defensive rather than an accepted shipping condition.

## Asset Construction Pipeline

1. Lock the existing face, scarf, belt, palette, tail markings, outlines, and small/large silhouettes as the character reference.
2. Extract clean existing poses before creating new artwork.
3. Repair or redraw missing transition frames while keeping the locked reference consistent.
4. Normalize every frame to a 192 by 192 transparent cell with shared baselines and optical centers.
5. Pack the canonical atlas and generate the animation manifest and labeled contact sheets.

The build script owns source extraction, alpha isolation, cell placement, and atlas packing. Generated outputs are deterministic. Re-running the pipeline with unchanged sources must produce identical files.

## Integration Architecture

The animation subsystem is separated into three responsibilities:

- The manifest describes artwork, cadence, offsets, looping, and active frames.
- A pure state selector maps player gameplay data to a named animation and frame index.
- The canvas renderer draws the selected manifest frame and does not infer gameplay state itself.

Physics, collision outcomes, health, checkpoints, and power state remain owned by the existing gameplay update. The animation selector observes that state but does not mutate it. Tail-swipe collision reads the attack sequence's declared active-frame window.

Desktop and mobile rendering use the same state selector and manifest. Input methods may differ, but visual state behavior does not.

## Validation and Testing

### Asset validation

- No opaque pixel touches a cell edge.
- Every grounded frame shares the declared foot baseline.
- Frame bounds remain inside the atlas.
- Each required state has its declared frame count.
- Frames within a form remain within approved head-height, width, and optical-center tolerances.
- Horizontal flips do not introduce visible position jumps.
- The pipeline emits labeled contact sheets for small, large, glide, action, and reaction states.

### State and gameplay validation

- Every reachable player state resolves to a valid manifest animation.
- Walk/run thresholds do not flicker near their boundary.
- Jump, fall, landing, glide, and skid transitions occur under the declared conditions.
- Tail-swipe damage is active only on the declared frames.
- Rapid action input cannot restart a committed attack.
- Hurt completes before shrink, checkpoint respawn, paw loss, or game over.
- Pit falls continue to consume exactly one paw immediately.
- Missing development frames fall back to idle and emit a warning.

### Browser playtest

Test small and large locomotion, repeated direction reversals, short and long jumps, landing after meaningful airtime, repeated attack input, attack contact with ordinary enemies and the boss, ordinary damage in each form, shrink, checkpoint respawn, pit death, gliding, victory, and final defeat. Inspect the browser console after the walkthrough and capture the final local preview for user testing.

## Incremental Delivery

1. Canonical atlas foundation, manifest, validators, and contact sheets.
2. Idle, walk, run, jump, fall, land, and skid integration.
3. Tail swipe, hurt, shrink, glide, victory, and defeat integration.
4. Full automated verification, local browser playtest, and visual polish.

Each checkpoint must leave the game runnable. The local preview is refreshed only after its automated checks pass.

## Out of Scope

- Changing the hero's costume, palette, or personality.
- Giving small form attack or glide abilities.
- Adding new gameplay abilities beyond existing movement, gliding, damage, transformation, attack, and end states.
- Reworking enemies, environments, audio, level layout, or mobile controls except where needed to keep existing player-state behavior compatible.
