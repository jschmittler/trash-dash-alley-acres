# Task 8 — responsive desktop, mobile landscape, touch, orientation, fullscreen

Status: **DONE_WITH_CONCERNS**

Commit: scoped implementation commit titled
`fix: harden responsive game presentation`.

## Applicable skills

- Rendering / Asset Integrity
- Visual QA

No sprite, source-art, atlas, world-geometry, or gameplay-physics file changed.

## Baseline and RED → GREEN

The pre-assertion focused baseline passed 9/9:

```text
node --test tests/mobile-experience.test.mjs tests/rendered-html.test.mjs
```

The first RED acceptance pass reproduced a lifecycle defect: 11/12 passed and
the transition-clear assertion failed because `changeScreen` did not clear
held/newly-pressed input. GREEN centralized clearing in every screen transition.

Browser geometry then reproduced a second defect that the old suite missed:

| Viewport | Before stage/canvas | Before aspect | Expected |
| --- | ---: | ---: | ---: |
| 1024×640 | 991×528 | 1.877 | 1.778 |
| 844×390 | 817×278 | 2.939 | 1.778 |

The second RED test rejected the base `width: 100%` + `max-height` shell.
GREEN derives stage width from available `svh` and `dvh` height and retains an
automatic 16:9 height. Final focused result: 15/15.

Fullscreen runtime inspection also showed why the handler needs its own exit
fallback: the control label changed while the browser's event observation was
not a reliable sole signal. The final handler shares a pure orientation/exit
interruption predicate with the subscription. Browser exit now lands on the
paused overlay and clears input even when an exit event is late or absent.

## Runtime viewport/state ledger

All named screenshots are static viewport/browser evidence. They are not real
touch-device evidence.

| Viewport | States/routes observed | Measured result | Console |
| --- | --- | --- | --- |
| 1440×900 | title, character select, Level 1 play, pause, taco notice, both bosses, both victories | 1280×720 stage/canvas; HUD visible; no overflow | `[]` |
| 1024×640 | Level 2 play, fullscreen enter/exit, pause, resume | 938.664×527.992 stage/canvas after fix; state/score/time preserved | `[]` |
| 844×390 | Level 1 park, Level 2 main street, both bosses, Level 2 victory | 494.219×277.992 stage/canvas after fix; HUD visible; no overflow | `[]` |
| 390×844 | title/portrait fallback | 390×219.375 stage, 390px HUD, no overflow | `[]` |

Representative evidence:

- `task8-title-1440x900.png`
- `task8-character-select-1440x900.png`
- `task8-level1-gameplay-1440x900.png`
- `task8-pause-1440x900.png`
- `task8-powerup-1440x900.png`
- `task8-boss1-1440x900.png`
- `task8-brutus-1440x900.png`
- `task8-victory1-1440x900.png`
- `task8-victory2-1440x900.png`
- `task8-level2-small-desktop-1024x640.png`
- `task8-fullscreen-exit-paused-1024x640.png`
- `task8-level1-landscape-844x390.png`
- `task8-level2-landscape-844x390.png`
- `task8-boss1-landscape-844x390.png`
- `task8-brutus-landscape-844x390.png`
- `task8-victory2-landscape-844x390.png`
- `task8-title-portrait-390x844.png`

Evidence directory:
`docs/superpowers/reports/2026-08-09-game-wide-integrity/after/`.

## Capability boundary

The selected browser reported `touchFirst: false` at every viewport. Therefore:

- desktop/mouse fullscreen entry and exit: **PASS**;
- viewport resize with same-run state preservation: **PASS**;
- browser-scroll and 16:9 geometry at the measured viewport sizes: **PASS**;
- orientation-lock rejection and input clearing: **PASS** in pure mutation-
  sensitive tests;
- touch deck rendered under a real coarse pointer: **CANNOT VERIFY**;
- simultaneous thumb input, pointer cancellation, lost capture, safe-area
  cutouts, portrait guidance on touch-first hardware, native rotation,
  background/restore, and phone fullscreen: **CANNOT VERIFY**.

The CSS/source contracts still require all five inputs (left/right, dash,
action, jump), 48px minimum targets, safe-area padding, dynamic viewport units,
no overscroll, and no canvas/control selection or browser touch gestures.

## Manual-device checklist

Run on current iPhone Safari and mid-range Android Chrome, then one tablet:

1. Start in portrait; verify the landscape recommendation and choose both
   fullscreen and **Play in portrait** on separate runs.
2. Rotate twice during play; confirm one safe pause, no run reset, and no held
   movement/action after resume.
3. Enter/exit fullscreen; confirm the same score/time/checkpoint/music/mute
   state and a paused return.
4. Hold move+jump/glide and move+action for ten trials; release in both orders,
   cancel a pointer, background/restore, and confirm no stuck control.
5. Inspect notch/home-indicator clearance, HUD legibility, 48px targets, thumb
   spacing, browser chrome collapse/expand, scroll/zoom/selection prevention,
   and that controls do not obscure the hero, landing zones, or boss tells.
6. Complete one Level 1 and Level 2 boss route touch-only.

## Files changed

- `app/mobile-experience.mjs`
- isolated Task 8 hunks in `app/trash-dash-game.tsx`
- `app/globals.css`
- `tests/mobile-experience.test.mjs`
- `docs/visual-audit.md`
- this report and `task8-*` screenshots

`tests/rendered-html.test.mjs` was exercised but its pre-existing dirty changes
were not authored or staged by Task 8.

## Verification gates

- Focused responsive/rendered shell: **15/15 PASS**.
- Directly affected responsive, route, power-up, victory, boss-transition, and
  campaign matrix: **34/34 PASS**.
- Shared worktree full suite: **284/284 PASS**, plus skill-system **5/5** and
  production build PASS.
- Exact staged-tree clean archive: focused **34/34 PASS**, full package
  **224/224 PASS**, production build PASS, Pages build PASS, Pages **1/1**.
- `npm run validate:skills`: PASS for all seven canonical project skills.
- `npm run lint`: zero errors; one pre-existing `no-img-element` advisory at
  `app/trash-dash-game.tsx:2958`.
- `git diff --cached --check`: PASS.
- Exact staged tree used for clean verification:
  `c9e330812e1a304249fd1e00c2d9660cdb098499`.

## Self-review

- Fixes are shared shell/input-lifecycle repairs, not per-screen offsets.
- Desktop remains primary; logical 960×540 gameplay and all sprite/world sizes
  are unchanged.
- Fullscreen/orientation failures are caught and non-blocking.
- Every claimed visual PASS was observed after the final relevant change.
- Real-device-only conditions remain explicitly CANNOT VERIFY.
