# Entity State Coverage

Use this inventory to decide applicable states; it is not a requirement to invent mechanics.

## Players

True idle, walk, run, skid/turn, crouch if supported, jump anticipation, takeoff/ascent, apex, descent/fall, land, stomp/bounce, attack anticipation/active/recovery, hit/invulnerability, shrink/transform, glide/fly/boost, carry/throw/interact, defeat, victory, and equipment/form variants. Keep input priority and control-return timing explicit. Hit reactions must finish before shrink, respawn, or game-over when the design requires readability.

## Enemies

Idle/sleep, patrol/walk/run/fly, turn, notice/alert, telegraph, committed attack, active contact, follow-through, recovery, jump/fall/land, obstacle impact, hit, stunned/vulnerable, defeat/retreat, spawn/despawn, and special environment interactions. Projectiles spawn exactly once on an authored release frame from a named socket.

## Bosses

Intro/reveal, idle, locomotion, primary/secondary/special tell-action-recovery sequences, crash, stomp/weak-point response, hit, stunned/open, protected phase transition, enraged/final, defeat, and visible exit. Phase changes must not skip reactions or unlock the arena before the defeat/exit presentation completes.

## Items, objects, platforms, and environment

- Items: idle/hover, spawn, pickup, activate, use, cooldown, equipped, depleted, locked/unlocked, destroyed.
- Emitters/hazards: idle, startup, connected active frames, taper, stop, damaged/broken, reset.
- Moving platforms: idle, anticipation, move, arrival, hold, reverse, fall/break, respawn/reset as applicable.
- Environmental animation: stable base plus loops, wind/water/light changes, triggered reactions, damage, and shutdown states as applicable.

## Timing and geometry

Attacks follow anticipation → action → active contact → recovery. State metadata owns exact active/event frames, reaction time, cooldown, and vulnerability. Visual motion may exceed simple gameplay collision; collision must never force art into a rectangular or clipped silhouette. Stable world registration comes from shared logical anchors, not per-frame offsets.
