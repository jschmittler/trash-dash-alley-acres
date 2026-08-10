# Task 3 report — terrier animation remediation

## Status

COMPLETE. Implementation commit: `71450a5` (`fix: normalize terrier animation lifecycle`).

## Applicable project skills

- Rendering / Asset Integrity
- Sprite / Art Asset
- Animation / Motion Sprites
- Environment Placement / Z-Order
- Visual QA
- In-app Browser control for the required running-game inspection

All routed skill files and their required references were read before implementation. The browser was used only after its local-development instructions were loaded.

## Recording reproduction and root cause

The supplied `2 - dog animation.mov` is 330×426, 4.65 seconds, and 286 frames. A full extraction plus a 10fps contact sheet reproduced three cycles of the visible defect:

`sleep/sit → wake/upright → charge → wall impact → seated settle → sleep`

The source-to-runtime investigation found two independent causes:

1. `terrier-motion-source.png` was a 1254×1254 RGB chroma-key composition, not a registered grid of stable 192px source cells. Atlas construction compensated with global crop/placement logic, but the source master did not itself carry the canonical cell/baseline contract.
2. The behavior and animation contracts were semantically wrong. `recover` selected row 8 hit cell 1, `stunned` and hit shared ownership, wake could finish before its authored one-shot duration, and recovery returned to `sleep` rather than locomotion.

The Canvas renderer was already drawing the Level 2 family into a nominal 82×82 square, but that geometry existed as an inline second table while inventory carried another copy. The repair centralizes the actual destination rectangle so later state-specific scaling mutations cannot reintroduce the pop.

## RED evidence

Created `tests/terrier-animation-integrity.test.mjs` before implementation and ran:

```text
node --test tests/terrier-animation-integrity.test.mjs tests/level-two-enemies.test.mjs tests/boss-animation.test.mjs
```

Initial result: **30 passed, 6 failed**. The six independent failures proved:

- source master was 1254×1254 RGB rather than 768×768 RGBA with 192px cells;
- state ownership still exposed `stunned` instead of explicit `impact`;
- the 20-row atlas had no owned recovery row;
- no pure runtime draw-rectangle contract existed;
- explicit state-local terrier durations/impact animation were absent;
- the three-cycle `recover → charge` fixture could not execute.

The new tests are mutation-sensitive to exact visible alpha bounds, the row-175 foot baseline, bottom-center registration, state/cell ownership, 82×82 destination geometry, facing invariance, local one-shot clamping, and the ordered three-cycle lifecycle.

## Source and atlas repair

- Reframed only existing approved terrier pixels into a transparent 768×768 RGBA source master: four columns × four rows × 192px. No pose was generated or invented.
- Updated the deterministic builder to preserve already-transparent source pixels and accept per-family source-row recipes.
- Expanded the enemy atlas from 20 to 21 rows so the terrier owns six rows:

| Row | State ownership | Frames | FPS | Policy |
| ---: | --- | ---: | ---: | --- |
| 5 | locomotion/trot | 4 | 9 | loop |
| 6 | sleep/wake | 1 / 4 | 1 / 7 | clamp |
| 7 | charge | 4 | 12 | loop |
| 8 | impact/hit | 2 | 9 | clamp |
| 9 | recover | 4 | 7 | clamp |
| 10 | defeat | 2 | 5 | clamp |

- Shifted skunk and moth rows by one and updated all manifests/tests.
- Recovery row 9 progresses `slump → sit → launch → charge`. It does not select row 8 hit cells. Defeat owns row 10.
- Rebuilt `level2-enemy-motion-contact-sheet.png` and `public/assets/generated/level2-enemy-motion.png`.

## Geometry and rendering contract

Before:

- source: 1254×1254 RGB keyed canvas;
- atlas: 768×3840, 20 rows;
- recovery: hit row 8, cell 1;
- destination geometry: inline renderer table plus separate inventory values.

After:

- source: 768×768 RGBA, stable 192×192 cells;
- atlas: 768×4032, 21 rows;
- all used terrier frames end on local opaque row 175;
- visible frame widths are measured exactly between 120px and 168px, with alpha-box centers at x=95.5–96;
- no silhouette touches a cell boundary;
- runtime source rectangle is always 192×192 and destination is always 82×82, scale `0.427083…` on both axes;
- ground draw origin offsets the 16px transparent foot inset so opaque row 175 meets the authoritative support surface;
- the same draw rectangle is returned for every terrier state and both facings.

No per-state or per-facing runtime scale or offset was added.

## Lifecycle repair

The reachable behavior sequence is now:

`sleep → wake → charge → impact → recover → reverse charge`

Wake, impact, recover, hit, and defeat use local elapsed time and clamp on their final cells. Durations are at least one complete animation duration:

- wake: `4/7s`;
- impact: `2/9s`;
- recover: `4/7s`.

At recovery completion the terrier reverses its committed facing and returns directly to the 420px/s charge. The deterministic fixture completes three complete impact/recovery cycles and observes right- and left-facing locomotion.

## Deterministic rebuild

Two consecutive `npm run build:level-two-enemies` runs produced identical hashes:

```text
45683cac529e557ee145e6274982aaa4a325620a296df06b926967201d5457c0  concepts/level-two/source/terrier-motion-source.png
bd11c499bacc2afa2c2084e1dfb0780d82ed0bbb530de4660897c96758c10a6d  concepts/level-two/level2-enemy-motion-contact-sheet.png
294a19fdb21d2ba6834b1c92621cc83d196af904c9919fb2285af9b7ab8c4a5d  public/assets/generated/level2-enemy-motion.png
```

## Native and running-game inspection

Native source and contact-sheet inspection verified complete silhouettes, hard alpha, safe margins, row-175 grounding, centered registration, and distinct impact/recover/defeat rows.

Running-game routes at the default 1280×720 browser viewport:

- `/?encounterTest=terrier&visualQa=task3-terrier&debugVisuals=1&cacheBust=20260810-task3`
- `/?level=2&levelTest=street&visualQa=task3-normal-street&debugVisuals=1&cacheBust=20260810-task3`

Both routes were entered through title and Trashy character selection. The direct fixture was captured every 250ms for eight seconds. The sequence visibly exercised right/left charge, impact, dedicated recovery, and repeat charge while the development overlay remained one 82×82 rectangle and the feet stayed on the ground contact line. The normal street route independently showed the dedicated `terrier:recover` presentation in its authored environment. Nearby player, trash can, terrain, and background rendering remained intact. Both route-scoped warning/error logs were empty.

Persistent evidence: `task-3-runtime-contact-sheet.jpg` in this report directory.

## Verification

- RED focused run: **30 passed / 6 expected failures**.
- Post-repair focused animation/inventory/art matrix: **54/54 passed**.
- Two deterministic atlas rebuilds: identical hashes.
- Exact staged snapshot `npm test`: production build passed; canonical skill tests **5/5**; default suite **301/301**.
- Exact staged snapshot `npm run lint`: **0 errors**, one pre-existing Next.js `<img>` performance warning.
- `git diff --cached --check`: passed.

The shared dirty worktree also passed its then-current 296-test default matrix before the new terrier suite was added to `package.json`; that count is not used as the final gate.

## Worktree preservation and concerns

Only Task 3 files/hunks were staged. The unrelated crate-position and formatting edits in `app/trash-dash-game.tsx`, the unrelated `tests/rendered-html.test.mjs` edit, and all unrelated untracked work remain unstaged and preserved.

No implementation blocker remains. The only verification note is the existing lint warning for a separate `<img>` element; Task 3 adds no lint error or warning.
