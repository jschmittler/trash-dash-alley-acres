# Skunk Scale, Squirrel Registration, and Brutus Reliability Design

## Scope

This follow-up addresses three defects reported during gameplay review:

1. The skunk is undersized beside the recently enlarged Level 2 enemies.
2. The squirrel visibly changes scale when moving from patrol to the throw attack.
3. Brutus's hydrant-crash vulnerability must be reliably hittable without changing the established encounter loop.

## Root causes

- Skunk still uses the older 78×78 canonical destination while squirrel and terrier now use 114×114 and 123×123.
- Squirrel patrol source cells have 77–84px visible widths, while its throw cells span 107–158px. One stable 114×114 destination therefore renders the attack silhouette much larger even though runtime geometry does not change.
- Brutus intentionally accepts damage only during `stunned-open` after a hydrant crash. His fixed 14px top-contact band is narrow, and the runtime does not expose a separate forgiving vulnerability region for the full intended vulnerable interval.

## Approved behavior

### Skunk

- Use a uniform 117×117 canonical runtime destination (1.5× the original 78×78), anchored to the same authored ground point.
- Keep collision, patrol, spray behavior, and source-frame selection unchanged.

### Squirrel

- Normalize the attack frames in the atlas builder to the patrol-scale visible envelope while preserving the shared bottom-center baseline, frame sequencing, and detached acorn release frame.
- Keep one 114×114 runtime destination for every squirrel state; do not use state-specific runtime scaling.

### Brutus

- Preserve the hydrant-crash → `stunned-open` → hit → recovery loop; closed armor remains invulnerable.
- Define a consistent, forgiving stomp region for the entire `stunned-open` interval, derived from the same rendered source and anchored visible body geometry.
- Keep collision damage and phase behavior unchanged. A valid downward crossing of the open-state region always produces one damage result, bounded by the existing hit cooldown.

## Verification

- Add focused tests for 117×117 skunk geometry, squirrel source-envelope normalization across locomotion and attack cells, and Brutus open-state hit-region continuity.
- Run focused non-UI tests and a production build.
- Ask the user to manually test before running any automated browser/UI checks.
- After manual approval, inspect skunk, squirrel patrol/attack transition, and every Brutus vulnerability cycle in the running browser; record the final visual evidence in `docs/visual-audit.md`.
