# Animation Registration and Large Player Scale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restore terrier running animation, stabilize squirrel throws, and reduce only large player forms to 132 px.

**Architecture:** Correct the updated-sheet pose map in the atlas builder, preserving ground registration and shared body scale. Keep player sizes centralized in animation/profile contracts; small remains 126 while large changes from 165 to 132.

**Tech Stack:** Sharp, Node.js tests, Canvas runtime, Next.js/Vinext.

## Global Constraints

- Preserve hitboxes, physics, state selection, FPS, frame counts, attack timing, and anchors.
- Terrier charge requires four complete running frames; squirrel throw uses locomotion body scale plus transparent headroom.
- Large player forms are 132×132; small forms remain 126×126.
- Wait for user manual test before any automated browser/UI check.

---

### Task 1: Correct enemy source-pose registration

**Files:**
- Modify: `concepts/level-two/build-atlases.mjs`
- Modify: `tests/level-two-enemies.test.mjs`
- Modify: `tests/terrier-animation-integrity.test.mjs`

- [ ] Write failing assertions that terrier charge source cells have distinct primary-body silhouettes and squirrel throw primary widths equal locomotion within two pixels while throw cells may have greater transparent top clearance.
- [ ] Run `node --test tests/level-two-enemies.test.mjs tests/terrier-animation-integrity.test.mjs` and confirm failure against the reused standing poses.
- [ ] Replace terrier charge map entries with four complete running-sheet rectangles. Compute squirrel family scale from row-zero locomotion primary bounds, use it for all squirrel cells, and place every cell at the shared feet baseline without cropping the taller throw silhouette.
- [ ] Rebuild with `node concepts/level-two/build-atlases.mjs`.
- [ ] Run the same focused tests and confirm PASS.

### Task 2: Reduce only large player presentation

**Files:**
- Modify: `app/player-animation.mjs`
- Modify: `concepts/jimothy/jimothy-animation.mjs`
- Modify: `app/playable-character.mjs`
- Modify: `app/visual-inventory.mjs`
- Modify: `tests/player-animation.test.mjs`
- Modify: `tests/playable-character.test.mjs`
- Modify: `tests/jimothy-player-atlas.test.mjs`

- [ ] Change large canonical destinations from 165 to 132 while retaining small at 126; use the existing baseline-derived offset function.
- [ ] Assert both profiles use `[126, 126]` small and `[132, 132]` large for every reachable state, with unchanged hitboxes.
- [ ] Run `node --test tests/player-animation.test.mjs tests/playable-character.test.mjs tests/jimothy-player-atlas.test.mjs tests/visual-inventory.test.mjs` and confirm PASS.

### Task 3: Verify and pause for manual UI testing

- [ ] Run `npm run build` and confirm PASS.
- [ ] Ask the user to manually test squirrel throw, terrier run/charge, and both large players.
- [ ] Only after the user reports manual results, run browser visual checks and update `docs/visual-audit.md` with observed evidence.
