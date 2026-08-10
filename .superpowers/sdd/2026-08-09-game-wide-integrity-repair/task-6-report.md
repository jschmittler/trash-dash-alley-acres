# Task 6 report — Level 1 and Trash Heap Tyrant acceptance

Status: `DONE_WITH_CONCERNS`

## Applicable instructions

Applied all seven canonical Trash Dash skills. Rendering / Asset Integrity,
Animation, Environment Placement, Overlap Prevention, and Visual QA governed
the acceptance investigation. Sprite / Art found no source-art failure and
Conductor remained confirmation-only; no art or audio bytes changed.

## Pre-edit baseline

Required command:

```text
node --test tests/level-one-definition.test.mjs tests/level-one-routes.test.mjs tests/level-one-backgrounds.test.mjs tests/boss-arena.test.mjs tests/boss-transition.test.mjs tests/victory-phase.test.mjs
```

Result before edits: **27 passed, 0 failed**.

The directly affected deterministic acceptance expansion also passed **89/89**
before the lifecycle repair. It covered the canonical direct-route catalog,
single background transitions, three distinct parallax speeds, both character
profiles and their reachable states, damage/shrink, terminal and non-terminal
pit paths, pickup/power-up contracts, enemy grounding/facing, boss animation
geometry, placement/composition, dumpster states, and rendered-shell source
guards including `YOU WIN!`.

## Runtime route/action ledger

The localhost development command first initialized and then failed because
the Cloudflare/Vite inspector could not listen on `0.0.0.0:9229` (`EPERM`). The
required escalated restart did not complete before its approval attempt was
aborted. No in-app browser tab was initialized. Per the task's non-blocking
rule, the hanging route was abandoned and was not retried.

| Required route or action | Evidence | Result |
| --- | --- | --- |
| Title → character select → Trashy/Jimothy | catalog, character-selection, profile/state tests | `CANNOT VERIFY` visually |
| Woodland, creek, highway, industrial, park | exact direct-route catalog; Level 1/background/transition tests | `CANNOT VERIFY` visually |
| Optional route, trash/taco/cap, checkpoint | route/reward/support/hover and power-up tests | `CANNOT VERIFY` live input |
| Jump, glide, tail swipe, hurt/shrink | player atlas/state/hit and gameplay lifecycle tests | `CANNOT VERIFY` live action/facing |
| Nonterminal and terminal pit | threshold/respawn/final-frame lifecycle tests | deterministic PASS; visual `CANNOT VERIFY` |
| Runway, purge, lock, camera easing | arena/transition/placement tests | deterministic PASS; motion `CANNOT VERIFY` |
| Tyrant tells, charge, recovery, hit, rage, defeat | boss state/atlas/local-timer tests | deterministic PASS; combat `CANNOT VERIFY` |
| Post-defeat release, dumpster reveal, exit | new completion regression plus dumpster/victory tests | deterministic PASS; visual `CANNOT VERIFY` |
| Explicit rewarding victory overlay | rendered source guard contains `YOU WIN!` and victory presentation | `CANNOT VERIFY` visually |

No screenshot or browser-console PASS is claimed.

## RED → GREEN: VIS-008 boss arena release

Static runtime investigation reproduced one acceptance defect: the Level 1
`finishBossDefeat` path disabled the boss and set `bossDefeated`, but did not
clear `arenaActive`. Combat lock therefore persisted after the committed
defeat sequence instead of releasing the camera/player into the reward exit.

RED command:

```text
node --test tests/boss-arena.test.mjs
```

Result: module-instantiation failure because the asserted central
`completeBossArena` contract did not exist.

GREEN repair:

- Added pure `completeBossArena()` returning the canonical released lifecycle:
  `arenaActive: false`, `bossDefeated: true`, `bossTransition: null`.
- Wired only Level 1 `finishBossDefeat` to apply that completion result.
- Preserved the locked runway and active fight. Runtime source evidence proves
  completion is reached only from the `defeat` branch after `actionTimer <= 0`,
  so the existing 0.9-second defeat animation completes before release.

Focused GREEN command:

```text
node --test tests/boss-arena.test.mjs tests/boss-transition.test.mjs tests/boss-animation.test.mjs tests/victory-phase.test.mjs tests/dumpster-render-state.test.mjs
```

Result: **28 passed, 0 failed**.

## Files owned by Task 6

- `app/boss-arena.mjs`
- isolated import and Level 1 defeat-completion hunks in
  `app/trash-dash-game.tsx`
- `tests/boss-arena.test.mjs`
- `docs/visual-audit.md`
- this report

No source or generated visual asset changed, so deterministic asset hashes are
not applicable.

## Final verification

- Clean staged-package required matrix: **28/28 PASS**.
- Clean staged-package production build: **PASS**.
- Shared expanded Level 1 route/lifecycle matrix: **117/117 PASS**.
- `npm run validate:skills`: **PASS** for all seven canonical skills and
  repository-local references.
- `npm run lint`: **PASS**, 0 errors and one existing Next `<img>` advisory at
  `app/trash-dash-game.tsx:2952`.
- `npm test`: **276/276 PASS**, including the production build.
- `npm run build:pages && npm run test:pages`: **PASS**, Pages **1/1**.
- `git diff --cached --check`: **PASS**.

## Self-review and concerns

- The fix is a lifecycle contract, not a camera offset or rendering workaround.
- Boss lock remains active through intro, combat, hit/rage/recovery, and the
  full defeat timer; only the completion boundary releases it.
- `bossDefeated` still prevents re-entry, and the existing dumpster/victory
  gates remain defeat-dependent.
- Unrelated dirty Level 2/runtime/asset work is not owned by this task and must
  not be staged.
- Concern: all running-game observations required by the brief remain precise
  `CANNOT VERIFY` because localhost/browser control never became available.

Commit message: `fix: complete level one integrity pass`.
