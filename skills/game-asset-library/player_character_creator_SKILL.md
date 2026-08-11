# DEPRECATED / HISTORICAL — Player Character Creator Snapshot

This is not an active project skill. Use `../../.skills/sprite-art/SKILL.md`, `../../.skills/animation/SKILL.md`, `../../.skills/rendering-asset-integrity/SKILL.md`, and `../../.skills/visual-qa/SKILL.md`. The remaining text is historical.

# Player Character Creator

Read `game-art-contract.md`. Inspect the controller and approved character art
before adding states. Preserve identity, proportions, clothing, markings,
equipment, default facing, and established gameplay scale.

## Define the player contract

- Establish role, personality, silhouette, shape language, palette, scale, and
  distinguishing accessories.
- Inventory actual mechanics and map each to a visual state.
- Include true idle, walk, run, skid/turn, jump ascent, apex/fall, landing, hit,
  defeat, and victory where applicable.
- Add crouch, climb, swim, glide, fly, attack, block, interact, carry, throw,
  power-up, transformation, or equipment states only when mechanics require them.
- Define small/large or alternate forms as explicit compatible state sets.

## Animation and gameplay

Document transition priority, interruptibility, coyote/buffer feedback,
anticipation, active attack frames, recovery, invulnerability feedback, form
changes, and the point at which control returns. Keep hit reactions visible long
enough to read and complete before shrink, respawn, or game-over outcomes when
the design requires it.

Separate body collision, hurtbox, attack hitboxes, interaction zones, ground
probe, and special-movement regions. Align visible feet and head/top contact to
their gameplay regions without using the entire artwork rectangle.

## Required output

Provide a state inventory and coverage matrix, sprite/atlas metadata, runtime
scale, pivots, baselines, input-to-state mapping, transition diagram, hit/event
frames, collision definitions, tunables, audio/VFX cues, asset paths, and direct
test cases for every action and form.

## Validation

Test every state facing both directions, transitions at movement boundaries,
ground and airborne baselines, rapid input changes, damage outcomes, forms,
mobile controls if supported, and runtime compositions. No action may fall back
to an unrelated pose or shift the character inside its hitbox.

Before authoring, enumerate all applicable gameplay states and require a
machine-readable visual mapping for each. Apply the complete placement contract
from `game-art-contract.md` and validate the largest visible frame
and complete action envelope against `visualBounds`, `collisionBounds`,
`placementFootprint`, `groundAnchor`, layers, zones, clearances, scale, and
viewport behavior. Registration must remain stable through every transition,
pause/resume, damage outcome, character switch, and horizontal flip. Completion
requires automated validation plus inspection of the rendered game in every affected form,
facing, level, and supported viewport; screenshot-only offsets are forbidden.

## Example

“Use Player Character Creator to give the raccoon full small/large parity,
running, jumping, gliding, hurt, victory, and a frame-authored tail swipe.”
