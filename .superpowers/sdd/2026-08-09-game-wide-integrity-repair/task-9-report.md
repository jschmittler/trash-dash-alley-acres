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

### Independent-review Fix Round 1

Review commit `a14dc54` reproduced two Important defects. RED used a
browser-shaped fake whose `src` and `currentSrc` are absolute and an injected,
blocked first fade step. The old controller created a duplicate same-track
player, and pausing during the fade left the incoming player active.

GREEN canonicalizes stored/requested source identities and routes runtime
lifecycle through a single owner for current and pending players. The owner
propagates pause/resume/mute to both, cancels stale generations on restart or
disposal, and prevents a cancelled incoming player from settling as current.
Negative mutation coverage confirms a genuinely distinct canonical URL still
switches. A restart-during-fade case confirms the stale player is disposed and
only the replacement remains active.

Fix-round focused result: **17/17 PASS** across controller and rendered runtime
source coverage; Pages verification is **1/1 PASS**.

### Independent-review Fix Round 2

Re-review commit `50e14d0` reproduced an overlapping-switch race: while the
first incoming player was blocked inside an injected fade wait, a second switch
could overwrite `pending` and leave both incoming players active until the old
wait returned. RED asserted immediate disposal before releasing that wait.

GREEN makes every newer switch synchronously stop/remove the previously pending
player, clear its ownership, and restore outgoing volume before starting its
own transition. The controlled test proves only the winner is active before
the stale wait releases; mute/pause reach the winner; and the eventual stale
continuation cannot alter ownership, replay, or dispose the winner.

Fix-round-2 focused result: **18/18 PASS** across controller and rendered
runtime source coverage; Pages verification is **1/1 PASS**.

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
- Browser absolute/base-path identity equivalence — PASS; same source reuses,
  distinct canonical source replaces.
- In-flight ownership — PASS; pause/mute survive nonzero fade settlement,
  resume reaches the settled incoming player, and restart cancels stale work.
- Overlapping switch ownership — PASS; the first pending player is disposed
  synchronously and its delayed continuation is a no-op.
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
- `npm test`: production build PASS; skill system **5/5**; package **294/294**.
- Pages build PASS; Pages verification **1/1**.
- Exact staged implementation tree (before recording this result): production
  and Pages builds PASS, focused **17/17**, clean package **234/234**.
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
