# Task 3 report — Trashy and Jimothy state geometry

## Status

`DONE_WITH_CONCERNS` — deterministic/player-contract evidence is green; live
browser state verification is `CANNOT VERIFY` because this session exposes no
browser-control backend.

## RED evidence

- Added the shared reachable-state contract before implementation. The focused
  player matrix failed because no shared atlas/envelope/facing contract existed.
- The source-alpha pass found complete, inset 192×192 cells, so no original art
  redraw was justified. It did find runtime registration defects: Trashy
  airborne/victory cells and Jimothy's copied concept cells did not share a
  baseline (Jimothy bottoms measured 106–179 against the required 184).
- The task's atlas assertions failed before the repair: Jimothy
  `small_idle:0` ended at source row 170 instead of 183, and the legacy player
  manifests used unequal destination axes such as 142×112 tail swipe.

## GREEN implementation and measurements

- Added `PLAYER_ATLAS` plus a shared 184 baseline, derived `offsetY`, complete
  envelope metadata, and a right-authored / destination-center-flip contract.
- Normalized both deterministic builders by translating complete alpha poses to
  source baseline 184 without independent width/height scaling. The regenerated
  Trashy and Jimothy runtime/contact sheets preserve all populated cells and
  keep their visible bottoms at row 183.
- Converted every player state destination to a uniform square transform
  (82×82–140×140), removed the grounded-only renderer compensation, and removed
  resolved player entries from `MEASURED_RUNTIME_DISTORTION_FRAMES`.
- Two consecutive rebuilds produced identical SHA-256 values for all five
  player motion/contact/selection artifacts.

## Verification

- RED matrix: `node --test tests/player-animation.test.mjs tests/player-hero-atlas.test.mjs tests/jimothy-player-atlas.test.mjs tests/character-gameplay.test.mjs` — 3 failures (missing shared atlas export and two baseline violations).
- GREEN focused player and Task 2 visual-contract matrix — 40 passed, 0 failed.
- `npm run validate:skills` — passed.
- `npm run lint` — 0 errors; one pre-existing Next `<img>` performance warning.
- `npm test` — 250 passed, 0 failed; production build completed.
- Static contact-sheet QA: inspected both regenerated sheets at native size;
  complete silhouettes stay inset and share the baseline. Both-facing behavior
  is covered by the destination-center flip contract and regression.

## Visual QA ledger

| Item | Result |
| --- | --- |
| Source alpha/contact-sheet inspection | PASS — complete inset frames; no source redraw needed |
| Atlas bounds, one-shot completion, envelopes, baselines, facings | PASS — automated |
| VIS-005 measured source/destination/anchor checks | PASS — zero remaining player mismatch entries |
| Running-game direct routes and normal play, both facings | CANNOT VERIFY — browser backend unavailable |

`docs/visual-audit.md` narrows VIS-005 accordingly and retains the complete
runtime route/state matrix for a browser-equipped follow-up.

## Scope and self-review

The commit contains only Task 3 player manifests/profiles, the exact renderer
compensation hunk, deterministic player builders and generated outputs, focused
tests, visual-inventory/audit evidence, and this report. Existing dirty Level
1/Level 2 and shared renderer work was not staged or altered. No unrelated
untracked Jimothy sources/documentation were included.

## Commit

`fix: normalize playable character states` (this report is included in that
scoped commit; final hash is supplied in the task handoff).
