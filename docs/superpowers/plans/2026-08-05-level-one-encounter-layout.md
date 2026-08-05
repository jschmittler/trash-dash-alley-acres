# Level One Encounter Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Re-space Alley Acres into readable encounter zones with meaningful alternate routes while limiting level-one enemies to snake, pigeon, wasp, mosquito, possum, spider, and fox plus the final boss.

**Architecture:** Keep the current data-driven Canvas layout in `app/trash-dash-game.tsx`. Replace the flat spawn list with explicitly labeled encounter zones and adjust the shared platform list so upper branches communicate bypass/reward routes. Add regression assertions to the rendered-game test so the roster and late-level spacing cannot silently regress.

**Tech Stack:** React/Vinext, TypeScript, HTML Canvas, Node test runner.

## Global Constraints

- Level-one regular enemies are limited to snake, pigeon, wasp, mosquito, possum, spider, and fox.
- Small enemies may appear in packs; possums and foxes receive isolated encounter space.
- The final boss remains the only enemy in the locked boss arena.
- This pass does not implement the power-up takeover overlay or victory-screen redesign.
- Jimothy remains excluded from runtime and public assets.

---

### Task 1: Lock the roster and encounter regression tests

**Files:**
- Modify: `tests/rendered-html.test.mjs`

- [x] Add assertions that the level spawn list contains only the approved regular enemy kinds and the boss.
- [x] Add assertions for the new encounter anchor positions and the quiet runway before the boss.
- [x] Run `npm test` and confirm the new assertions fail against the current mixed roster.

### Task 2: Rebuild the level-one encounter and route data

**Files:**
- Modify: `app/trash-dash-game.tsx` (platforms, `initialEnemies`, and nearby pickup placements)

- [x] Remove level-one spawns for slime, bat, beetle, moth, rat, hedgehog, crow, boar, and frog; retain pigeon as the approved bird type.
- [x] Use spaced zones: pigeon flock near the entrance, isolated possum in Taco Yard, a flying wasp/mosquito pack over the rooftop route, isolated spider/possum mid-level tests, isolated fox in Scrapworks, and one final runway threat before the boss.
- [x] Shape upper platforms into readable bypass lines over the possum and fox encounters, with taco/cap rewards placed on those optional routes.
- [x] Keep the boss trigger and boss-only arena boundaries unchanged.

### Task 3: Verify the pass locally

**Files:**
- No new files.

- [x] Run `npm test`, `npm run lint`, `npm run build:pages`, `npm run test:pages`, and `git diff --check`.
- [x] Run the local browser preview and inspect the entrance and boss runway; browser diagnostics are clean.
- [x] Commit the pass as `feat: rebalance level one encounter layout`.
