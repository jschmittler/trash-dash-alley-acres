# Dismiss Pocket Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the persistent Pocket Controls instruction card from active gameplay after the player first uses a game input.

**Architecture:** `TrashDashGame` will hold a small, session-scoped boolean for the hint. `startGame` resets it; the existing keyboard and touch input entry points dismiss it only while the game screen is playing. The conditional JSX retains the existing hint markup until it is dismissed, and the mobile source-contract test verifies that behavior without altering the touch deck.

**Tech Stack:** React 19, TypeScript, Node.js built-in test runner.

## Global Constraints

- Keep the existing five touch controls and their `touchProps` mappings unchanged.
- Do not change art assets, canvas rendering, layout geometry, or world state.
- Reset hint visibility for every newly started or retried game session.
- Verify source behavior with `node --test tests/mobile-experience.test.mjs` and perform browser visual QA at `http://localhost:3000/`.

---

### Task 1: Session-scoped control-hint dismissal

**Files:**
- Modify: `app/trash-dash-game.tsx:822-830, 984-1169, 1330-1381, 2936-3075`
- Modify: `tests/mobile-experience.test.mjs:120-156`

**Interfaces:**
- Consumes: existing `screenRef.current`, `startGame`, `onKeyDown`, and `touchProps` input paths.
- Produces: `showTouchDeckHint: boolean` state, reset in `startGame`, and a `dismissTouchDeckHint` callback used by gameplay input paths.

- [ ] **Step 1: Write the failing source-contract test**

Add a test after `touch-first landscape exposes the complete five-action input deck` that reads `app/trash-dash-game.tsx` and asserts all of the following source contracts:

```js
assert.match(game, /const \[showTouchDeckHint, setShowTouchDeckHint\] = useState\(true\)/);
assert.match(game, /const dismissTouchDeckHint = useCallback\(\(\) => \{\s*if \(screenRef\.current === "playing"\) setShowTouchDeckHint\(false\);\s*\}, \[\]\)/);
assert.match(startGame, /setShowTouchDeckHint\(true\);/);
assert.match(onKeyDown, /dismissTouchDeckHint\(\);/);
assert.match(touchProps, /dismissTouchDeckHint\(\);/);
assert.match(game, /\{showTouchDeckHint && \(<div className="touch-deck-hint" aria-hidden="true">/);
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `node --test tests/mobile-experience.test.mjs`

Expected: FAIL because the hint has no visibility state, reset path, dismissal callback, or conditional wrapper.

- [ ] **Step 3: Implement the state and input behavior**

In `TrashDashGame`, add the `showTouchDeckHint` boolean state adjacent to other UI state and this callback adjacent to `clearHeldInput`:

```ts
const [showTouchDeckHint, setShowTouchDeckHint] = useState(true);

const dismissTouchDeckHint = useCallback(() => {
  if (screenRef.current === "playing") setShowTouchDeckHint(false);
}, []);
```

At the beginning of `startGame`, after clearing held input, reset the hint:

```ts
setShowTouchDeckHint(true);
```

Call `dismissTouchDeckHint()` from `onKeyDown` after key state is updated and from `touchProps(code).onPointerDown` after the pointer is captured. Add the callback to the keyboard effect dependency list. Wrap the existing `touch-deck-hint` element in `showTouchDeckHint && (...)`; add `aria-hidden="true"` because the instructions duplicate the interactive button labels.

- [ ] **Step 4: Run the focused test to verify it passes**

Run: `node --test tests/mobile-experience.test.mjs`

Expected: PASS, including the existing responsive canvas and five-action deck assertions.

- [ ] **Step 5: Perform browser visual QA**

At `http://localhost:3000/`, start a game in a touch-sized browser viewport. Confirm the Pocket Controls card appears at session start, press one control, and confirm the card immediately disappears while all five buttons remain present and usable. Restart the run and confirm the card appears again.

- [ ] **Step 6: Commit the implementation**

```bash
git add app/trash-dash-game.tsx tests/mobile-experience.test.mjs
git commit -m "fix: dismiss pocket controls during play"
```
