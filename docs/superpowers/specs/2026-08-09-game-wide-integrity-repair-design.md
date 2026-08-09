# Trash Dash Game-Wide Integrity Repair Design

**Date:** 2026-08-09

**Status:** Approved design; implementation planning pending

## Goal

Perform a fresh, evidence-driven Level 1 and Level 2 quality pass that fixes every reproducible visual, rendering, animation, placement, collision, responsive, and presentation defect at its systemic root cause. Confirm existing audio integration without rescoring.

## Scope

The pass covers the currently implemented campaign:

- Level 1 from title and character selection through every environmental chapter, optional route, checkpoint, enemy sequence, boss runway, Trash Heap Tyrant encounter, defeat, and victory.
- Level 2 through all five suburban chapters, optional routes, squirrel, terrier, skunk, moth, sprinkler and prop interactions, boss runway, Brutus encounter, defeat, and victory.
- Trashy and Jimothy across every reachable movement, action, damage, transformation, defeat, and victory state.
- Desktop browser as the primary experience, plus responsive desktop, mobile landscape, safe-area, touch, orientation, and fullscreen behavior.
- Existing music loading, looping, level/boss switching, mute, pause/resume, balance against gameplay feedback, and failure containment.

The pass does not compose, replace, or rescore music. A full audio-direction and soundtrack analysis is deferred.

## Canonical Skills

All seven project skills apply:

- Rendering / Asset Integrity
- Sprite / Art Asset
- Animation / Motion Sprites
- Environment Placement / Z-Order
- Overlap Prevention / Spatial QA
- Visual QA
- Conductor, limited to implementation confirmation

The workflow follows `AGENTS.md` and `.skills/README.md`. Rendering / Asset Integrity is mandatory for every visual change. Visual QA is the final gate for every meaningful visual repair.

## Guiding Principles

1. The running game is the final visual source of truth.
2. Reproduce before modifying.
3. Fix shared pipeline and metadata defects before individual objects.
4. Preserve source artwork when it already satisfies the art contract.
5. Rebuild source artwork or animation sheets when the source itself cannot satisfy the contract.
6. Never hide rendering defects with arbitrary offsets, independent X/Y scaling, collision changes, or redraws.
7. Never close an issue from screenshots alone or tests alone; both automated and runtime evidence are required.
8. Preserve unrelated user changes in the existing dirty worktree.

## Repair Architecture

### Evidence layer

Every defect receives a stable `VIS-###` record containing severity, affected level/route, asset or state, reproduction steps, observed result, expected result, screenshot or frame-sequence evidence, related console output, and affected shared consumers.

Evidence comes from direct test routes, normal traversal, browser screenshots, animation sequences, browser logs, source files, processed atlases, contact sheets, metadata, and runtime measurements.

### Contract layer

The visual inventory, asset manifests, animation manifests, render metadata, visible-alpha bounds, anchors, placement footprints, collision geometry, effect origins, supports, flight bands, semantic layers, and viewport policies are authoritative.

Missing contracts are added centrally. Tests validate contract completeness and reject invalid scale, bounds, alpha, frame, placement, animation, and overlap states.

### Repair layer

Shared rendering, alpha, atlas, anchor, animation, support, collision, placement, composition, or responsive defects are repaired first. Object-specific asset rebuilding follows only when evidence shows that source art is incomplete, incompatible, or below the approved visual standard.

Repairs must not introduce non-uniform scaling, unexplained frame offsets, platform penetrations hidden by z-order, collision regions that disagree with visible contact areas, or effects bundled with duplicate emitter bodies.

### Verification layer

Each repair requires:

1. A failing deterministic regression for the reproduced root cause.
2. A focused green run after the minimal systemic repair.
3. Static inspection of affected source/runtime art and contact sheets.
4. Running-game verification of the exact route, state, facing, and viewport.
5. Regression inspection of nearby consumers using the same renderer, builder, atlas, support, layer, or metadata family.
6. An updated `docs/visual-audit.md` record.

## Defect Lifecycle

```text
Observed
→ Reproduced
→ Root cause identified
→ Regression test fails
→ Systemic repair
→ Focused tests pass
→ Running game verified
→ Closed
```

If a state cannot be driven or observed, it remains `INCOMPLETE` or `CANNOT VERIFY`. It is never inferred to pass from source inspection.

## Acceptance Contracts

### Rendering and source integrity

- Fixed-aspect art preserves the visible-source aspect ratio through one uniform scale.
- Source rectangles contain complete intended frames without neighboring-cell bleed.
- Hard-edged pixel art uses clean hard alpha; intentional water, light, smoke, or glow keeps deliberate semi-transparency.
- Nearest-neighbor sampling remains enabled and no sprite is blurred, squeezed, or stretched.
- Transparent padding does not define world scale or apparent grounding.
- Every visual body is rendered exactly once.

### Animation

- Every reachable gameplay state uses intentional ordered frames.
- State-local timers drive playback; looping and one-shot behavior are explicit.
- Feet, pivots, logical centers, emitters, and attachment sockets remain stable across frames and facing changes.
- Tells precede danger, event frames agree with gameplay events, reactions complete, and transitions do not reuse incompatible fallback rows.
- The largest visible frame and complete action/effect excursion fit inside the declared motion envelope.

### Placement, collision, and composition

- Every grounded entity and prop resolves to a named support using its intended contact pixel.
- Effects attach to named emitters with independent bounds.
- Platform visual tops match one-way or solid collision surfaces.
- Collision, weak-point, stomp, attack, and hurt regions agree with visible authored contact areas.
- Complete visual and motion bounds clear forbidden platform interiors and adjacent expanded footprints.
- Small enemies may form readable groups of one to three; large enemies own isolated spaces; bosses own enemy-free arenas.
- Required routes, recovery pockets, landing targets, pickups, tells, and negative space remain readable.

### Boss arenas

- A quiet runway precedes camera lock.
- Ordinary enemies cannot enter the active arena.
- The player cannot retreat after lock.
- Boss, weak point, hazards, hydrants, platforms, reward, and exit remain visually distinct.
- Utility platforms are reachable with the normal jump and align with their collision surfaces.
- At least one open dodge lane and one recovery lane remain available.
- Defeat presentation completes before danger disables, camera unlocks, or the victory exit appears.

### Responsive and mobile behavior

- Desktop remains the primary presentation and gameplay target.
- The cabinet, canvas, HUD, and controls fit supported responsive viewports without clipping or overlap.
- Mobile landscape respects safe areas and provides usable touch controls.
- Orientation and fullscreen requests fail safely when unsupported or rejected.
- Resizing, rotating, entering/exiting fullscreen, pausing, and resuming clear stale input and preserve coherent rendering.

### Audio confirmation

- The intended exploration and boss tracks load from valid paths.
- Playback begins only after a permitted user interaction.
- Loops do not introduce an obvious unintended stop or restart.
- Pause, resume, mute, and track switches retain correct state.
- Playback rejection does not block gameplay.
- Music remains audible without obscuring essential gameplay feedback.

## Ordered Repair Passes

1. Baseline capture and `VIS-###` issue inventory.
2. Shared rendering, scale, alpha, atlas, and clipping integrity.
3. Player, enemy, boss, object, and environmental animation geometry.
4. Grounding, support, collision, layering, overlap, and encounter composition.
5. Complete Level 1 traversal and Trash Heap Tyrant encounter.
6. Complete Level 2 traversal and authored enemy/prop interactions.
7. Both boss runways, arena locks, attack geometry, defeat, and victory presentation.
8. Responsive desktop, mobile landscape, safe-area, touch, orientation, and fullscreen validation.
9. Existing music integration confirmation.
10. Full release-candidate playthrough, regression matrix, audit closure, and handoff.

Each pass must produce independently testable software and may be rejected without invalidating completed earlier passes.

## Runtime Verification Matrix

### Level 1

- Normal start and character selection.
- `backgroundTest=woodland`, `creek`, `highway`, `industrial`, and `park`.
- `levelTest=creek` and `highway`, plus normal traversal of optional routes.
- Standard enemy introductions, grouped enemies, pickups, checkpoints, transitions, and pits.
- `bossTest=1` and `bossTest=arena`.
- Boss hit, recovery, defeat, camera release, and `victoryTest=1`.

### Level 2

- `level=2` normal start.
- `levelTest=backyard`, `street`, `obstacle`, `drainage`, `runway`, and `main-street`.
- `encounterTest=squirrel`, `terrier`, `skunk`, `moth`, and `interaction`.
- Pickups, optional paths, platforms, utility boxes, lamp/moth, sprinklers, hydrants, checkpoints, and transitions.
- `bossTest=brutus` through every phase and defeat.
- `victoryTest=level2`.

### Characters and state edges

- Trashy and Jimothy: idle, walk, run, turn/skid, jump ascent/apex/descent/land, glide, attack, hurt, transformation/shrink, pit defeat, checkpoint recovery, victory, and character-selection presentation.
- Rapid/repeated input, pause during motion, pause during committed animation, repeated state entry, direction changes, checkpoint restoration, and repeated route loads.

### Viewports

- Desktop 1440×900.
- Smaller desktop viewport that still uses the desktop control model.
- Mobile landscape representative viewport.
- Fullscreen enter/exit.
- Safe-area and orientation behavior where browser/device capability permits.

## Error Handling and Evidence Rules

- Browser warnings, errors, asset load failures, rejected audio promises, invalid source rectangles, missing states, missing supports, failed placement candidates, and unavailable test routes must be recorded.
- An unavailable browser/device/input condition is reported precisely rather than bypassed with assumption.
- A test that contradicts visible behavior is corrected after the visible root cause is measured.
- New source art preserves generation provenance, source masters, deterministic runtime outputs, and contact sheets.
- Existing user-owned dirty changes are never reset, overwritten wholesale, or folded into unrelated commits.

## Documentation and Handoff

`docs/visual-audit.md` remains the canonical living visual issue tracker. The supplied Desktop `audit.md` is treated as historical input because its named issues were already represented and marked complete in the repository audit; every one will nevertheless be rechecked from fresh runtime evidence.

The final handoff reports:

- reproduced issues and severities;
- systemic root causes;
- source assets rebuilt;
- render, animation, placement, collision, and responsive systems changed;
- routes, characters, states, and viewports actually exercised;
- automated test/build/lint/Pages results;
- audio integration results;
- screenshots and contact sheets;
- remaining `INCOMPLETE` or `CANNOT VERIFY` conditions;
- confirmation that no unrelated user changes were discarded.
