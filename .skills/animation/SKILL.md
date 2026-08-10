---
name: animation
description: Design, implement, repair, or audit Trash Dash sprite animation states, frame geometry, timing, transitions, anchors, hit reactions, attacks, platforms, environmental motion, and presentation. Use whenever a visual asset has multiple frames or gameplay state changes its rendered motion.
---

# Trash Dash Animation / Motion Sprites

Read [Entity State Coverage](references/entity-state-coverage.md) before changing an animated player, enemy, boss, item, object, platform, or environmental effect.

## Applicability relationships

- Also apply [Sprite / Art Asset](../sprite-art/SKILL.md) when frames are created, missing, incomplete, or redrawn.
- Always apply [Rendering / Asset Integrity](../rendering-asset-integrity/SKILL.md) for extraction, frame geometry, scaling, anchors, and runtime drawing.
- Also apply [Environment Placement / Z-Order](../environment-placement/SKILL.md) when motion changes support contact, attachment, world footprint, platform behavior, or layering.
- Finish meaningful visual changes with [Visual QA](../visual-qa/SKILL.md).

## State contract

1. Inventory applicable states before editing. Include IDLE, RUN/MOVE, JUMP ANTICIPATION, ASCENT, APEX, DESCENT, LAND, HIT, ATTACK, STOMP, BOUNCE, DEATH, and SPECIAL STATES wherever the entity or object supports them.
2. Map every gameplay state to intentional, ordered, reachable frames. Never silently substitute an unrelated row or frozen locomotion pose.
3. Declare frame count, duration/FPS, loop/hold/one-shot behavior, transition conditions, interruptibility, event/active frames, and completion behavior.
4. Use a state-local timer. Clamp one-shots on their last frame and reset elapsed time on transitions; never use a global modulo clock for committed reactions.
5. Preserve stable pivots, anchors, ground contact, attachment points, frame dimensions, world scale, and optical registration across transitions and horizontal flips.
   Runtime destination scale is invariant across animation states within the same gameplay form. A larger pose reserves a larger source/motion envelope; it does not receive a state-specific draw scale.
6. Separate collision, hurtbox, attack, weak-point, stomp, support, and effect geometry from transparent art while aligning visible contacts to authored regions.
7. Keep facing explicit. Preserve it inside a dead zone and during committed attacks unless tracking is intentionally designed.
8. Reserve the largest complete visible frame and full motion/attack/effect envelope for placement and overlap validation.

## Review gate

- Inspect every frame at native scale and in a contact sheet.
- Verify complete silhouettes, clean alpha, safe cell margins, consistent scale, and no neighboring-cell bleed.
- Verify tells precede active danger and impacts agree with event frames.
- Exercise every reachable state, transition, facing, pause/resume path, damage result, and relevant viewport in the running game.
- Inspect consecutive runtime frames immediately before and after every changed transition at one camera position. Compare destination dimensions, anchor, baseline, and collision before accepting the transition; a static contact sheet alone cannot prove transition stability.
- Reject jitter, foot sliding, floating, clipping, size pops, stale facing, detached effects, duplicate layers, unreachable art, and looping one-shots.

## Handoff

Report the state coverage matrix, frame metadata, timing and transitions, anchor strategy, motion envelope, collision/effect relationships, runtime states exercised, and unavailable or intentionally omitted states.
