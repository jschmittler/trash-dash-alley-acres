# Task 4 — Enemy and Boss Presentation Re-review (Fix Round 2)

## Verdict: PASS

Reviewed the committed repair range `a1ecb0b..2a778b1` for the prior I3/I4
findings only. The shared worktree's unrelated dirty changes were not used as
review evidence.

## I3 — PASS: Trash Heap Tyrant separates physical placement from composition reserve

`app/visual-inventory.mjs` now creates the Tyrant's physical record with
`grounded(166, 166, 96, 96)` and explicit composition padding of left/right
64px and top 16px. Its committed contract therefore is:

```
visualBounds:       { x: -83,  y: -166, w: 166, h: 166 }
placementFootprint: { x: -83,  y: -166, w: 166, h: 166 }
collisionBounds:    { x: -48,  y: -96,  w: 96,  h: 96 }
composition envelope:{ x: -147, y: -182, w: 294, h: 182 }
```

The runtime boss branch passes `bossAnimation.drawWidth` and
`bossAnimation.drawHeight` directly to `drawEnemy`; every committed
`BOSS_ANIMATIONS` entry supplies 166×166. The regression checks the maximum
inventory destination, physical visual and placement bounds, 96×96 collision,
and `expandedCompositionFootprint`. A clean temporary mutation changing the
actual boss animation draw size from 166 to 180 made that test fail with the
expected 180×180 destination versus 166×166 physical bounds, confirming the
test is bound to the runtime animation destination rather than a disconnected
constant.

## I4 — PASS: exact-token campaign-runtime scan retains the necessary guard

`tests/rendered-html.test.mjs` uses `/\bLEVEL_ONE\b/` against the rendered
runtime source. It expressly accepts `LEVEL_ONE_ENEMY_ANIMATIONS` and matches
a direct `LEVEL_ONE` fixture before asserting the runtime has no direct token.
The committed `app/trash-dash-game.tsx` contains no exact `LEVEL_ONE` token;
the manifest-backed `LEVEL_ONE_ENEMY_ANIMATIONS` import remains valid. The
remaining rendered-runtime source assertions in that test are unchanged by
the reviewed diff.

## Scope and verification

- `git diff --check a1ecb0b..2a778b1`: passed.
- Reviewed diff changes only Task 4 evidence, Tyrant inventory geometry, and
  the targeted boss/rendered-runtime regressions.
- `node --test tests/boss-animation.test.mjs tests/rendered-html.test.mjs`:
  **11 passed, 0 failed**.
- Mutation verification (temporary archive): changing the actual
  `BOSS_ANIMATIONS` default draw size 166 → 180 caused the Tyrant physical
  footprint test to fail, as required.

No I3/I4 regressions or unrelated regression finding in the reviewed range.
