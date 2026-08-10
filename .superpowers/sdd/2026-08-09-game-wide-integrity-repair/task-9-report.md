# Task 9 — confirm existing music integration without rescoring

Status: **DONE_WITH_CONCERNS**

Scoped implementation commit: `test: confirm game music integration` (this
commit).

## Applicable instruction

- Canonical Trash Dash Conductor, integration-confirmation mode only
- Browser control for local user-gesture/runtime evidence

No visual asset changed, so visual skills were not activated. No soundtrack
brief, master, encoded audio, manifest version, or score changed.

## Baseline and RED → GREEN

Baseline controller/rendered/artifact matrix: **9/9 PASS**.

RED 1 failed at module load because the canonical campaign role table did not
exist. The expanded contract also specified deterministic short fades and
same-track mute/resume behavior absent from the controller. GREEN added the
immutable Level 1/Level 2 role table, resolver, injected fade wait, safe
same-track replay, and exhaustive fake-audio lifecycle coverage.

RED 2 reproduced the pre-activated Brutus fixture's wrong initial role: it
requested exploration because arena-entry switching was bypassed. GREEN makes
initial selection boss-aware for an already-active arena. Normal arena entry
continues to resolve the active level's boss role.

Final focused result: **15/15 PASS** across controller, runtime source,
rendered shell, and Pages artifact tests.

## Track-role ledger

| Level | Exploration | Boss | Truth |
| --- | --- | --- | --- |
| Level 1 | `raccoon-rush-loop.m4a` | `trash-heap-tyrant-loop.m4a` | Existing authored pair |
| Level 2 | `raccoon-rush-loop.m4a` | `trash-heap-tyrant-loop.m4a` | Both roles shared; no distinct Level 2/Brutus track |

## State and failure ledger

- Create: loop/preload/fixed volume, silent until `play()` — PASS.
- Start/restart/pause/resume: deterministic fake audio — PASS.
- Shared mute through start, same-track, and switch — PASS.
- Zero and short fade completion — PASS.
- Previous-track pause/source removal/load — PASS.
- Same-track reuse — PASS; no new player/listener.
- Rejected play/switch — PASS; no escaped rejection, rejected replacement is
  disposed, current remains alive.
- Repeated switches — PASS; every predecessor disposed, one final active
  player, zero attached listeners.

## Browser evidence and capability boundary

After user gestures on localhost:

- Level 1 start exposed the exploration resource.
- Visible pause/mute/resume state remained coherent and time resumed.
- Level 1 arena exposed exploration plus boss resources.
- Brutus exposed only the boss resource after the repair.
- Brutus restart returned to live gameplay at a reset time.
- All sampled warning/error logs were `[]`.

The browser could inventory media requests but not the detached `new Audio()`
element's private state. Audible playback, exact loop continuity, SFX balance,
forced live rejection, and acoustic non-overlap remain **CANNOT VERIFY**.

## Files

- `app/music-controller.mjs`
- isolated Task 9 hunks in `app/trash-dash-game.tsx`
- `tests/music-controller.test.mjs`
- two music-ownership assertions in `tests/rendered-html.test.mjs`
- `docs/visual-audit.md`
- `docs/superpowers/reports/2026-08-09-audio-integration-confirmation.md`
- this task report

No audio asset file changed.

## Verification

- Focused controller/runtime/rendered/Pages source matrix: **15/15 PASS**.
- `npm run validate:skills`: PASS (7 canonical skills).
- `npm run lint`: zero errors; one unrelated `no-img-element` warning.
- `npm test`: production build PASS; skill system **5/5**; package **290/290**.
- Pages build PASS; Pages verification **1/1**.
- Exact staged implementation tree (before recording this result): production
  and Pages builds PASS, focused **14/14**, clean package **230/230**.
- `git diff --cached --check`: PASS.

## Self-review and concerns

- Runtime filenames now have one owner and every supported role resolves
  explicitly.
- Repairs affect lifecycle integration only; no subjective audio claim is
  made.
- Existing dirty world-placement formatting and all unrelated user files are
  preserved and excluded from Task 9 staging.
- Concern: Level 2 music is shared and may merit a later creative pass, but
  creating or judging that score was explicitly out of scope.
