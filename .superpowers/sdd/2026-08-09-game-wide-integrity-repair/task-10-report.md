# Task 10 report — release-candidate verification and audit closure

Result: **DONE_WITH_CONCERNS**

## Work completed

- Ran the full shared-worktree and clean-archive release matrices.
- Entered all 27 canonical QA routes through title and Trashy selection.
- Ran four Jimothy-sensitive static routes.
- Exercised responsive geometry, pause/resume, mute, and desktop fullscreen.
- Inspected final player, enemy, boss, prop, background, dumpster, platform,
  and decorative contact sheets.
- Recorded Task 10 screenshots, final classifications, hashes, limitations,
  and dirty-worktree preservation.
- Made no feature, runtime, gameplay, asset, or audio change; did not push or
  publish.

## Exact verification

- `npm run validate:skills`: PASS, 7 canonical skills/references.
- `npm test`: PASS, skill pretest 5/5, package 295/295, production build PASS.
- `npm run lint`: PASS, 0 errors and 1 existing image-element warning.
- `npm run build:pages`: PASS.
- `npm run test:pages`: PASS, 1/1.
- `git diff --check`: PASS.
- Clean archive: package/build 235/235 PASS; Pages 1/1 PASS.
- Browser: canonical routes 27/27 PASS for static load/render integrity and
  clean route-scoped logs; Jimothy matrix 4/4 PASS.

## Review correction

Review commit `2bcd3bf` found that nine evidence files named `-1440x900.png`
contained 1280×720 PNGs. The in-app browser was disconnected during this fix
round, so the approved truthful fallback was used: all nine files were renamed
to `-1280x720.png`, their dimensions were verified from the bytes, and every
affected audit/report viewport claim was narrowed. The final report now owns an
exact per-route file/dimension/log table and states that no per-route DOM
rectangle was retained for those captures. No runtime file changed.

## Files in the scoped close

- `docs/visual-audit.md`
- `docs/superpowers/reports/2026-08-09-game-wide-integrity-final.md`
- `.superpowers/sdd/2026-08-09-game-wide-integrity-repair/task-10-report.md`
- `docs/superpowers/reports/2026-08-09-game-wide-integrity/after/task10-*.png`

Commit: `docs: close game-wide integrity audit` (hash supplied in handoff).

## Self-review

- Every VIS-001 through VIS-010 item has an exact PASS or INCOMPLETE status.
- Unsupported live input, physical-device behavior, and audible quality are
  never promoted to PASS.
- Direct routes are identified as static fixtures rather than complete
  campaign playthroughs.
- The optional canvas-locator timeout is disclosed; the route sweep was
  restarted in a fresh tab and completed without that nonessential measure.
- Evidence paths, counts, measurements, hashes, and warnings were transcribed
  from the observed commands/browser session.
- Every `task10-*` filename now agrees with its PNG byte dimensions; no
  1280×720 capture is presented as 1440×900 evidence.
- Staging is restricted to Task 10 documentation and `task10-*` evidence.

## Concerns

Continuous campaign/control traversal, exhaustive live animation/facing
sequences, boss combat-to-release flow, real-device mobile behavior, audible
quality, and VIS-007 tire rounding remain open. These are classified in the
final report and audit rather than concealed by the green automated matrix.
