# Jimothy Playable Character Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a reusable character-selection flow and enable Jimothy as a full-parity playable character across movement, power-ups, damage, boss, and victory states.

**Architecture:** Promote character presentation data into a profile registry consumed by the existing shared physics/world loop. Each profile points to a normalized 192px atlas and declares dimensions, hitboxes, animation rows, and attack frames. Add a selection screen before `startGame`, then keep the chosen character id in world state so every render and reset resolves the same profile.

**Tech Stack:** Next.js/React, TypeScript, Vite Pages build, Canvas 2D, ESM animation modules, Node test runner, Sharp image validation, CSS media queries.

## Global Constraints

- Preserve the existing raccoon behavior and all current gameplay regression tests.
- Jimothy frames use a transparent 192×192 cell grid, right-facing source art, and horizontal flip for left-facing movement.
- Every required frame must be non-empty, avoid cell-edge clipping, and use an explicit baseline/draw metadata entry.
- The first release remains one-player; no simultaneous or alternating multiplayer is added.
- Desktop keyboard and mobile touch input must both work in the selection screen.
- Do not enable Jimothy until atlas and profile validation pass.

---

### Task 1: Complete and validate Jimothy's production atlas

**Files:**
- Modify: `concepts/jimothy/build-atlas.py`
- Modify: `concepts/jimothy/jimothy-animation.mjs`
- Create: `public/assets/generated/jimothy-hero-motion.png`
- Create: `public/assets/generated/jimothy-hero-contact-sheet.png`
- Create: `public/assets/generated/jimothy-selection.png`
- Create: `tests/jimothy-player-atlas.test.mjs`
- Modify: `tests/jimothy-atlas.test.mjs`

**Interfaces:**
- Produces `JIMOTHY_ANIMATIONS` with small/large state keys matching `PLAYER_ANIMATIONS` semantics.
- Produces a 6-column atlas with one row per required state and 192px cells.

- [ ] **Step 1: Write failing atlas coverage tests**

Add tests that load the public atlas with Sharp, assert its dimensions, enumerate every required small/large state, reject empty cells, reject alpha touching the cell edge, and require baseline metadata for every animation.

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `node --test tests/jimothy-player-atlas.test.mjs`

Expected: FAIL because the public Jimothy atlas and full-parity manifest do not exist.

- [ ] **Step 3: Extend the atlas builder and manifest**

Keep existing Jimothy motion where it fits, add the missing land, skid, defeat, victory, large-form, shrink, and glide rows, and emit a public atlas/contact sheet plus a transparent selection preview. Keep optional forage/eat/groom source rows private unless used by the selector.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run: `node --test tests/jimothy-player-atlas.test.mjs tests/jimothy-atlas.test.mjs`

Expected: PASS, with no frame clipping or missing-state failures.

- [ ] **Step 5: Commit**

```bash
git add concepts/jimothy/build-atlas.py concepts/jimothy/jimothy-animation.mjs public/assets/generated/jimothy-hero-motion.png public/assets/generated/jimothy-hero-contact-sheet.png public/assets/generated/jimothy-selection.png tests/jimothy-player-atlas.test.mjs tests/jimothy-atlas.test.mjs
git commit -m "feat: add Jimothy full-parity animation atlas"
```

### Task 2: Add the playable-character profile registry

**Files:**
- Create: `app/playable-character.mjs`
- Create: `tests/playable-character.test.mjs`
- Modify: `app/player-animation.mjs`
- Modify: `app/trash-dash-game.tsx`

**Interfaces:**
- `getPlayableCharacter(id: string): PlayableCharacter`
- `PLAYABLE_CHARACTERS: Record<string, PlayableCharacter>`
- `selectCharacterAnimation(character, input): string`
- Profile fields include `id`, `displayName`, `atlasSrc`, `small`, `large`, `animations`, and `attackFrames`.

- [ ] **Step 1: Write failing profile and routing tests**

Cover raccoon and Jimothy registry entries, profile fallback to raccoon, small/large dimensions, animation selection for movement/jump/fall/attack/glide/hurt/shrink/defeat/victory, and Jimothy's paw-swipe attack frames.

- [ ] **Step 2: Run the focused tests to verify they fail**

Run: `node --test tests/playable-character.test.mjs`

Expected: FAIL because the registry and profile-aware routing do not exist.

- [ ] **Step 3: Implement the registry and shared routing**

Move character-specific draw metadata out of the implicit hero-only assumptions. Preserve existing exported hero constants as compatibility aliases where tests or rendering still use them, but resolve the selected profile for atlas source, frame rows, draw size, and hitbox.

- [ ] **Step 4: Run focused and existing animation tests**

Run: `node --test tests/playable-character.test.mjs tests/player-animation.test.mjs tests/player-hero-atlas.test.mjs`

Expected: PASS with the original raccoon behavior unchanged.

- [ ] **Step 5: Commit**

```bash
git add app/playable-character.mjs app/player-animation.mjs app/trash-dash-game.tsx tests/playable-character.test.mjs
git commit -m "feat: add playable character profiles"
```

### Task 3: Build the character-selection state and UI

**Files:**
- Create: `app/character-selection.mjs`
- Create: `tests/character-selection.test.mjs`
- Modify: `app/trash-dash-game.tsx`
- Modify: `app/globals.css`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- `createCharacterSelectionState(ids, initialIndex = 0)` returns `{ ids, index, selectedId }`.
- `moveCharacterSelection(state, delta)` wraps focus within available ids.
- `confirmCharacterSelection(state)` returns the selected id.

- [ ] **Step 1: Write failing selection-state tests**

Test initial focus, left/right wrapping, confirmation, empty/unknown id fallback, and reset after returning from victory/game over.

- [ ] **Step 2: Run focused tests to verify they fail**

Run: `node --test tests/character-selection.test.mjs`

Expected: FAIL because selection state helpers and selector UI do not exist.

- [ ] **Step 3: Implement the selection screen**

Add a `characterSelect` screen state between title and playing. Render profile cards with idle previews, names, flavor copy, focus styling, and a confirm action. Map ArrowLeft/ArrowRight and A/D to focus, Enter/Space to confirm, and expose touch-friendly card and confirm buttons.

- [ ] **Step 4: Add responsive styling and rendered markers**

Use the existing cabinet/stage tokens. Ensure cards fit portrait and landscape mobile viewports, respect safe-area padding, and do not steal gameplay touch keys. Add stable aria labels and test markers for selection and confirmation.

- [ ] **Step 5: Run focused tests**

Run: `node --test tests/character-selection.test.mjs tests/rendered-html.test.mjs`

Expected: PASS with selector markup present and no regressions to existing HUD/title assertions.

- [ ] **Step 6: Commit**

```bash
git add app/character-selection.mjs app/trash-dash-game.tsx app/globals.css tests/character-selection.test.mjs tests/rendered-html.test.mjs
git commit -m "feat: add character selection screen"
```

### Task 4: Wire selected profiles through gameplay and lifecycle

**Files:**
- Modify: `app/trash-dash-game.tsx`
- Modify: `app/gameplay-animation-state.mjs`
- Create: `tests/character-gameplay.test.mjs`

**Interfaces:**
- `World.selectedCharacterId: string`
- `World.player.animationName` resolves against the selected profile manifest.
- `startGame(characterId?: string)` starts with a validated profile id.

- [ ] **Step 1: Write failing gameplay integration tests**

Cover Jimothy selection persistence, initial small form, taco transition to large, paw-swipe attack hit window, glider animation, hurt/shrink/respawn, boss transition, and victory animation selection.

- [ ] **Step 2: Run focused tests to verify they fail**

Run: `node --test tests/character-gameplay.test.mjs`

Expected: FAIL because the world does not persist a selected profile and renderer/physics still assume the hero atlas.

- [ ] **Step 3: Integrate profile-aware world state**

Store the selected id on world initialization and reset. Resolve small/large dimensions and animation manifests from the profile. Preserve shared collision and damage rules. Map Jimothy's large paw-swipe frames into the existing attack rectangle and keep the raccoon tail-swipe path unchanged.

- [ ] **Step 4: Run gameplay and regression tests**

Run: `npm test`

Expected: PASS for the full suite, including both characters and all existing boss, victory, mobile, and asset tests.

- [ ] **Step 5: Commit**

```bash
git add app/trash-dash-game.tsx app/gameplay-animation-state.mjs tests/character-gameplay.test.mjs
git commit -m "feat: enable Jimothy in gameplay"
```

### Task 5: Verify responsive selection and full local run

**Files:**
- Modify: `tests/pages-build.test.mjs` only if the new public assets require an explicit artifact assertion.
- No source changes unless verification identifies a concrete defect.

- [ ] **Step 1: Run all static checks**

Run:

```bash
npm test
npm run lint
npm run build:pages
npm run test:pages
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 2: Start the local preview**

Run: `npm run dev -- --host 0.0.0.0 --port 3003`

Open `http://localhost:3003/` and verify the title-to-selector-to-game flow.

- [ ] **Step 3: Manually test the full Jimothy run**

Verify desktop keyboard flow and mobile viewport flow for selection, movement, taco, glider, damage/respawn, boss entry, boss hit, victory, and replay. Confirm no baseline drift, sprite clipping, or incorrect facing.

- [ ] **Step 4: Commit only concrete verification fixes**

If a defect is found, add a focused regression test, fix it, rerun the complete checks, and commit with a narrowly scoped message. Otherwise leave the implementation commits intact and record the verified local URL in the handoff.

## Self-review checklist

- Atlas work covers every required small/large state and quality gate.
- Profile registry is the only character-specific source of truth.
- Selection UI is keyboard-, pointer-, touch-, portrait-, and landscape-capable.
- Shared physics and lifecycle preserve the existing hero behavior.
- Taco, glider, hurt, boss, and victory requirements each have an explicit integration test.
- No multiplayer or unrelated character abilities were introduced.
