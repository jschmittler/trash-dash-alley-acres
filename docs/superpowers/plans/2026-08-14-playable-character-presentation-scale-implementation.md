# Playable Character Presentation Scale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render Trashy and Jimothy at 1.5× their existing small and large form destinations without changing gameplay collision or state behavior.

**Architecture:** The animation manifests remain the single source of truth for destination dimensions and derive their feet-preserving offsets from the existing 192 px source-cell baseline. The playable-character registry and visual inventory will mirror those destination values, while physics widths, heights, and hitboxes retain their current values.

**Tech Stack:** Next.js, React, HTML Canvas, ES modules, Node.js built-in test runner.

## Global Constraints

- Trashy and Jimothy small-form runtime destinations are exactly 126×126 px.
- Trashy and Jimothy large-form runtime destinations are exactly 165×165 px.
- Apply the scale uniformly to every reachable state, including victory, hurt, defeat, glide, shrink, and tail swipe.
- Preserve the existing bottom-center anchor and source-cell baseline calculation.
- Do not alter source artwork, sprite sheets, animation timing, state selection, player physics dimensions, player hitboxes, attack timing, or camera logic.
- Per Trash Dash workflow, wait for the user’s manual test before running any automated UI/browser test; focused non-UI tests and production build checks are permitted before that confirmation.

---

### Task 1: Update both runtime animation manifests and profile metadata

**Files:**
- Modify: `app/player-animation.mjs:1-48`
- Modify: `concepts/jimothy/jimothy-animation.mjs:1-69`
- Modify: `app/playable-character.mjs:15-53`
- Modify: `app/visual-inventory.mjs:193-216`

**Interfaces:**
- Consumes: `entry(row, frames, fps, loop, drawSize, baseline)` which derives `drawWidth`, `drawHeight`, and `offsetY` from a 192 px source cell.
- Produces: `PLAYER_ANIMATIONS`, `JIMOTHY_ANIMATIONS`, `JIMOTHY_VICTORY_CONTRACT.destinationByForm`, `PLAYABLE_CHARACTERS`, and visual-inventory player records with canonical destinations of 126 px (small) and 165 px (large).

- [ ] **Step 1: Add the canonical form-size assertions before changing manifests**

In `tests/player-animation.test.mjs`, replace both canonical-size loops with:

```js
for (const [form, canonicalSize] of [["small", 126], ["large", 165]]) {
```

Keep the loop over every `PLAYER_FORM_STATES[form]` and every playable profile, and retain the exact hitbox assertions in the bottom-center test. In `tests/playable-character.test.mjs`, add:

```js
assert.deepEqual(
  [profile.small.drawWidth, profile.small.drawHeight, profile.large.drawWidth, profile.large.drawHeight],
  [126, 126, 165, 165],
);
assert.deepEqual(profile.small.hitbox, { x: 4, y: 3, w: 24, h: 43 });
assert.deepEqual(profile.large.hitbox, { x: 4, y: 4, w: 30, h: 54 });
```

In `tests/visual-inventory.test.mjs`, assert each player’s `renderedSize.small` is `[126, 126]`, `renderedSize.large` is `[165, 165]`, and `animationScalePolicy.destinationByForm` is `{ small: 126, large: 165 }`. In `tests/jimothy-player-atlas.test.mjs`, change idle/victory expected destinations to 126×126 and 165×165 and assert `JIMOTHY_VICTORY_CONTRACT.destinationByForm` is `{ small: 126, large: 165 }`.

- [ ] **Step 2: Run the focused manifest test to verify it fails**

Run: `node --test tests/player-animation.test.mjs tests/playable-character.test.mjs tests/visual-inventory.test.mjs`

Expected: FAIL because the tests require 126×126 and 165×165 while runtime manifests still use 84×84 and 110×110.

- [ ] **Step 3: Change canonical animation destinations without changing anchors**

In `app/player-animation.mjs`, declare and use canonical constants:

```js
const SMALL_PLAYER_DRAW_SIZE = 126;
const LARGE_PLAYER_DRAW_SIZE = 165;
```

Pass `SMALL_PLAYER_DRAW_SIZE` to every `small_*` `entry(...)` and `LARGE_PLAYER_DRAW_SIZE` to every `large_*` entry. Leave `entry` and `playerAnimationDrawRect` unchanged so the offset remains derived and every frame stays bottom-center anchored.

In `concepts/jimothy/jimothy-animation.mjs`, use the same values for every reachable `JIMOTHY_ANIMATIONS` state and update the public contract:

```js
destinationByForm: Object.freeze({ small: 126, large: 165 }),
```

Do not change `JIMOTHY_CONCEPT_ANIMATIONS`, since those are non-runtime concept-only motions.

In `app/playable-character.mjs`, update only `drawWidth` and `drawHeight` for both profiles:

```js
small: { width: 32, height: 46, drawWidth: 126, drawHeight: 126, hitbox: { x: 4, y: 3, w: 24, h: 43 } },
large: { width: 38, height: 58, drawWidth: 165, drawHeight: 165, hitbox: { x: 4, y: 4, w: 30, h: 54 } },
```

Preserve `width`, `height`, and both `hitbox` objects verbatim.

In `app/visual-inventory.mjs`, update the player record’s `renderedSize`, fallback `runtimeDestinations`, and `destinationByForm` to `[126, 126]`, `[165, 165]`, and `{ small: 126, large: 165 }`. Keep visual bounds derived from animations and keep the collision bounds derived from the unchanged profile physics dimensions.

- [ ] **Step 4: Run the focused non-UI tests**

Run: `node --test tests/player-animation.test.mjs tests/playable-character.test.mjs tests/visual-inventory.test.mjs tests/jimothy-player-atlas.test.mjs`

Expected: PASS. The manifests, profile metadata, inventory, bottom-center draw rect, collision data, and Jimothy victory contract agree on 126/165 without source-atlas changes.

- [ ] **Step 5: Commit the runtime scale change**

```bash
git add app/player-animation.mjs concepts/jimothy/jimothy-animation.mjs app/playable-character.mjs app/visual-inventory.mjs tests/player-animation.test.mjs tests/playable-character.test.mjs tests/visual-inventory.test.mjs tests/jimothy-player-atlas.test.mjs
git commit -m "feat: scale playable character presentation"
```

### Task 2: Build verification and manual UI gate

**Files:**
- Verify: `tests/player-animation.test.mjs`, `tests/playable-character.test.mjs`, `tests/visual-inventory.test.mjs`, `tests/jimothy-player-atlas.test.mjs`
- Verify: `app/trash-dash-game.tsx` through user manual testing, then browser inspection

**Interfaces:**
- Consumes: `PLAYER_FORM_STATES`, `PLAYABLE_CHARACTERS`, `playerAnimationDrawRect`, `JIMOTHY_VICTORY_CONTRACT`, and `VISUAL_INVENTORY` player records.
- Produces: evidence that the changed destinations are consistent, the production build remains valid, and visual UI checks occur only after the user’s manual test.

- [ ] **Step 1: Verify focused non-UI coverage after Task 1**

Run: `node --test tests/player-animation.test.mjs tests/playable-character.test.mjs tests/visual-inventory.test.mjs tests/jimothy-player-atlas.test.mjs`

Expected: PASS with both character profiles, all reachable states, feet anchoring, unchanged collision geometry, and inventory contract covered.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: PASS with the Canvas game’s imports and client bundle compiling successfully.

- [ ] **Step 3: Pause for the required manual test**

Ask the user to test the local game in the browser: choose Trashy and Jimothy, observe both small and large forms in movement, jumping, damage, victory, and the large-only tail swipe/glide where reachable. Confirm characters visibly scale to 1.5×, feet remain on platforms, and collisions feel unchanged.

Do not run `tests/mobile-experience.test.mjs`, browser automation, screenshots, or any other automated UI checks until the user reports their manual result.

- [ ] **Step 4: Run UI checks only after user manual confirmation**

Run the relevant browser inspection and visual test after, and only after, the user confirms manual testing. Capture a desktop screenshot of both form sizes for each character; verify the bottom-center ground anchor, no clipping into terrain, and no unexpected touch controls on desktop.

- [ ] **Step 5: Commit the regression coverage**

```bash
git add tests/player-animation.test.mjs tests/playable-character.test.mjs tests/visual-inventory.test.mjs tests/jimothy-player-atlas.test.mjs
git commit -m "test: cover playable character presentation scale"
```
