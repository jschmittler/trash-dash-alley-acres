# DEPRECATED / HISTORICAL — Level Creator Snapshot

This is not an active project skill. Use `../../.skills/environment-placement/SKILL.md`, `../../.skills/overlap-prevention/SKILL.md`, and the canonical registry. The remaining text is historical.

# Level Creator

Read `game-art-contract.md`. For Trash Dash, also read
`../../docs/guides/parallax-backgrounds.md` and
`../../docs/guides/enemy-placement-and-grounding.md` when those paths exist.

## Workflow

1. Define the level name, theme, narrative role, emotional arc, signature motifs,
   palette roles, lighting progression, and readability targets.
2. Break progression into introduction, teaching space, first challenge,
   escalation, variation, combination, set piece, final challenge, and exit.
   Give each beat an objective, geometry, encounter, hazard, landmark, mechanic,
   difficulty, reward, and recovery space.
3. Describe collision geometry separately from artwork. Use the actual player
   jump apex, horizontal reach, body size, glider/boost abilities, and camera.
4. Author reusable terrain, edges, transitions, large props, small prop variants,
   animated environment objects, hazards, secrets, checkpoints, and gates.
5. Separate semantic sky, far, middle, close, gameplay, foreground, and effects
   layers. Keep whole objects on one plane and register substantial objects to a
   declared contact line or deliberate occlusion.
6. Specify hazard visuals, telegraph, collision, trigger, damage, animation,
   audio, feedback, and reset behavior.
7. Create layout, collision, encounter, reward, camera, and transition maps.
8. Audit player visibility, platform legibility, route communication, enemy
   contrast, foreground occlusion, repeated textures, and parallax transitions.
9. Derive a platform exclusion region from every solid surface and validate
   each prop's full visible bounds. Declare `ON_SURFACE`, `BESIDE`, `BELOW`,
   `ABOVE_WITH_CLEARANCE`, or `EXPLICITLY_PLATFORM_ATTACHED`; default to no
   intersection and use centralized clearance/padding values.
10. Run a level-wide intersection audit after any platform or sprite-bounds
    change. Move invalid objects to the nearest semantically appropriate legal
    location; do not use render order to conceal impossible geometry.
11. Give every placeable object the full placement contract named in
    `game-art-contract.md`. Reserve the largest-frame/motion envelope, reject
    forbidden candidates, and use one deterministic legal fallback or skip.
12. Run automated placement/animation regression checks, then inspect start, middle, end, dense compositions, boss handoff, and supported
    viewports in the rendered game. No screenshot-only fixes: never repair one screenshot with an
    unexplained local offset, scale, or layer change.
13. Divide the route into deliberate dense, medium, and open visual zones.
    Enforce rolling-viewport limits for medium, large, and hero props and
    category-aware composition gaps. Reserve negative space around landmarks,
    interactions, and boss silhouettes instead of populating every legal slot.
14. Audit source-versus-runtime frame bounds for every new or changed prop,
    animated object, and effect. Confirm the crop, hard alpha, draw size, scale,
    anchor, layer, and single render ownership before tuning placement.

## Required output

Provide a level specification, ordered gameplay beats, dimensions, surfaces,
gaps, spawn/checkpoint positions, camera boundaries, encounter zones, secrets,
layer manifest with parallax rates, asset inventory, animation timing, hazard
contracts, paths, and implementation hierarchy.

## Validation

Prove required jumps are reachable; each background object has one semantic
layer; contact pixels meet intended surfaces; chapter transitions occur once;
terrain is reusable; hazards are readable before damage; important routes stay
visible; no foreground or atmosphere hides critical gameplay; and every
freestanding prop clears solid platform bodies under the shared
`game-art-contract.md` platform exclusion rules.

Capture representative rendered screenshots after meaningful scenery or
geometry work. Spatial validity is not sufficient: reject any legal layout that
still looks crowded, unsupported, repetitive, improperly scaled, or physically
impossible.

## Example

“Use Level Creator to design a suburban nighttime side-scroller with layered
yards, streets, utility routes, sprinklers, exploration rewards, and a boss
runway.”
