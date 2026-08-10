# Game-wide integrity release-candidate verification

Date: 2026-08-09

Result: **DONE_WITH_CONCERNS**

Scope: local-only final verification; no feature work, push, or publication

## Outcome

The local release candidate passes the complete automated release matrix and
all 27 canonical routes load through the normal title/character-entry flow
with clean sampled browser logs. Representative Level 1, Level 2, player,
enemy, boss, prop, background, victory, responsive, and control states were
visually inspected. No new Critical or Important regression was reproduced.

Closure is intentionally qualified. Continuous keyboard-driven campaign
playthroughs, every live action/facing sequence, real-device mobile behavior,
and audible quality were not supported by this session and remain CANNOT
VERIFY. Existing VIS-004 through VIS-008 and VIS-010 therefore remain
INCOMPLETE as detailed in `docs/visual-audit.md`.

## Automated release matrix

| Gate | Shared worktree result |
| --- | --- |
| `npm run validate:skills` | PASS — 7 canonical skills and routed references validated |
| `npm test` | PASS — skill pretest 5/5; package suite 295/295; production build passed |
| `npm run lint` | PASS — 0 errors; 1 existing `@next/next/no-img-element` warning at `app/trash-dash-game.tsx:2950` |
| `npm run build:pages` | PASS — HTML 1.60 kB; CSS 28.92 kB (7.08 kB gzip); JS 324.45 kB (100.16 kB gzip) |
| `npm run test:pages` | PASS — 1/1 |
| `git diff --check` | PASS |

Observed non-failing advisories: Node DEP0205 for `module.register()` and the
Vinext unknown-route classification advisory.

The focused clean archive at `/private/tmp/trash-dash-task10.gn0Huc` used the
committed HEAD plus the existing dependency installation. Its production
build and package suite passed 235/235, and its Pages build/test passed 1/1.
`git diff --check` is not applicable inside a Git-less `git archive`; the
shared repository check above is authoritative.

## Browser route ledger

Protocol: 1440×900, title → **Start rummaging** → **Start as Trashy**, then
the exact canonical URL. A first attempt included an optional canvas-locator
measurement; after that locator timed out, the sweep was restarted in a fresh
tab without the optional measurement. Route verification itself completed.

| Family | Routes | Result |
| --- | --- | --- |
| Level 1 | `l1-start`, `l1-creek`, `l1-highway`, `l1-industrial`, `l1-park`, `l1-middle`, `l1-end`, `l1-boss`, `l1-victory` | PASS — 9/9 static route/render checks; 0 warnings/errors |
| Level 2 chapters | `l2-backyard`, `l2-street`, `l2-obstacle`, `l2-drainage`, `l2-runway`, `l2-main-street`, `l2-start`, `l2-middle`, `l2-end` | PASS — 9/9; 0 warnings/errors |
| Level 2 encounters | `l2-squirrel`, `l2-terrier`, `l2-skunk`, `l2-moth`, `l2-interaction`, `l2-boss`, `l2-victory` | PASS — 7/7; 0 warnings/errors |
| State fixtures | `player-states`, `enemy-states` | PASS — 2/2; 0 warnings/errors |

Level 1 victory visibly presented `YOU WIN`. The Level 2 victory fixture
remained in play while showing its authored glowing holy-dumpster reward; this
matches the fixture contract and is not represented as a victory-overlay test.

Alternate-character static matrix: Jimothy `start`, `squirrel`, `Brutus`, and
`victory` routes passed 4/4 with clean logs and stable identity/grounding.

## Viewport and control ledger

| Sample | Measured stage/canvas | Result |
| --- | --- | --- |
| 1440×900 representative routes | 16:9 centered cabinet | PASS |
| 1024×640 Level 2 middle | 938.664×527.992; ratio 1.777799 | PASS |
| 844×390 L1 end/boss and L2 end/boss | 494.219×277.992 at x=174.891, y=88; ratio 1.777815 | PASS; document 844×390; clean logs |
| 390×844 title | 390×219.375 at x=0, y=52; ratio 1.777778 | PASS; document 390×844; clean logs |

At 1024×640, Pause displayed `Snack break`, Resume restored play, Mute changed
to Unmute, fullscreen changed to Exit Full, and fullscreen exit returned to a
valid paused state. Logs were empty. Real touch/multi-touch, safe-area cutouts,
orientation lock, background/restore, and mobile-browser fullscreen are CANNOT
VERIFY.

## State and flow classification

| Requirement | Classification | Evidence / limitation |
| --- | --- | --- |
| Title and character entry | PASS | Normal entry used for every canonical route and Jimothy matrix |
| Static route composition and placement | PASS | 27/27 routes plus representative screenshots and clean logs |
| Pause/resume, mute, desktop fullscreen | PASS | 1024×640 interactive control exercise |
| Power-up presentation | INCOMPLETE | Static test fixture and deterministic contracts pass; live pickup/timing is CANNOT VERIFY |
| Damage, checkpoint, pit death | INCOMPLETE | Deterministic lifecycle coverage passes; uninterrupted live presentation is CANNOT VERIFY |
| Complete Trashy and Jimothy campaign traversal | INCOMPLETE | Entry/direct fixtures pass; continuous player-controlled traversal is CANNOT VERIFY |
| Enemy/player/boss all-state and both-facing playback | INCOMPLETE | Manifests, contact sheets, deterministic routes, and representative frames pass; exhaustive live sequences are CANNOT VERIFY |
| Boss combat, defeat, release, and victory transitions | INCOMPLETE | Automated lifecycle and direct boss/victory fixtures pass; continuous combat-to-release is CANNOT VERIFY |
| Audible soundtrack/loop quality | CANNOT VERIFY | Existing resources/controllers verified separately; no audio byte changed |
| Real-device mobile behavior | CANNOT VERIFY | No physical iOS/Android device capability in this session |

## Visual evidence inspected

Task 10 screenshots are under
`docs/superpowers/reports/2026-08-09-game-wide-integrity/after/` with the
`task10-` prefix. They cover L1 start/creek/boss/victory; L2 moth,
interaction, boss, victory, and smaller desktop; player/enemy state fixtures;
four 844×390 samples; portrait title; and four Jimothy samples.

Final contact sheets inspected:

- `public/assets/generated/player-hero-contact-sheet.png`
- `public/assets/generated/jimothy-hero-contact-sheet.png`
- `public/assets/generated/boss-contact-sheet.png`
- `concepts/level-two/brutus-motion-contact-sheet.png`
- `concepts/level-two/level2-enemy-motion-contact-sheet.png`
- `concepts/level-two/level2-props-contact-sheet.png`
- `concepts/level-two/level2-lamp-post-contact-sheet.png`
- `concepts/level-two/level2-backgrounds-contact-sheet.png`
- `concepts/dumpster/dumpster-source-contact-sheet.png`
- `concepts/decorative/source/decorative-contact-sheet.png`

The inspected sheets contain complete silhouettes, stable identity/baselines,
separated prop/effect cells, semantic background layers, and bounded platform
and dumpster frames. Chroma in the dumpster source sheet is intentional source
material; the runtime atlas/key-removal contract remains green.

## Asset identity ledger

| Asset | SHA-256 |
| --- | --- |
| `player-hero-motion.png` | `cd5712057d7cb4c568574bc15850d0fa346d5c931a62391152a09e57952801ad` |
| `player-hero-contact-sheet.png` | `4589a51e143b44a5ebf9ee745b3ab046017416157e39d22e1132c99db59a89bb` |
| `jimothy-hero-motion.png` / contact sheet | `844bf1805100ab41bb105e8f6cf25fa05d65868a9ffe6e2d76f53f90f70d9000` |
| `level2-props.png` | `ff4cd724f31d4b781e0643c90dbbe3d46172f1a8499ba0f1d6147b504667b44a` |
| `level2-lamp-post.png` | `ea658816a8a1ee22ececd0bc91ac4989a8cea758d3dc787adb1ed2161d97f8b6` |
| `level2-enemy-motion.png` | `617c7531dc564f20828b87d19e796064a67fe7a2eba0aa9137775669175092cf` |
| `boss-motion.png` | `13dec71f7bdd99260dd3e18a174a587cc3ae7f3f14ba3065247ef145e55b700c` |
| `boss-contact-sheet.png` | `fb80b8be24003f8011761e56ee399bfea14cbfb71aca4938f513e3ebe3226360` |
| `brutus-motion.png` | `5e0075a8010b5e398fdb3e01704f754a4e3510d109949d903fb0942dfb688567` |
| `dumpster-holy-atlas.png` | `6479320f3b0bef600275efab3f40e819de966877e730a94a9a6777680e6b909c` |
| `decorative-atlas.png` | `b732e9452ba300e11de1c526712d75481e27d6844c29f4d56537b672396260b1` |
| `branch-platform-strip.png` | `3bb48385456ef6d83cceafcdbacd3a49bbfa6b716ec5fd17039b5984f406ddbe` |
| `metal-platform-strip.png` | `25732734e15fb90ab315df99a2852428aac9d237892434a1a89d7d81e39f6a7b` |

Audio SHA-256 identities were recorded without modifying bytes:
`raccoon-rush-loop.m4a`
`527d3ff44a94d23c94fb24173c2adb38432549cff9c285c68e91a625726cff27`;
`trash-heap-tyrant-loop.m4a`
`b37a4bc4638c868747acfaa9e11deaf66e1024e3b4f596576d7d76224d8c9bb9`.
`git diff --name-only d8b80f9 -- public/assets/audio` returned no paths.

## Systems covered by Tasks 1–9

The candidate incorporates the canonical skill/audit framework, measured
rendering and atlas contracts, player and enemy/boss animation manifests,
world relationship/composition validation, Level 1/Trash Heap Tyrant closure,
Level 2/Brutus and prop/effect closure, responsive/input lifecycle repair, and
existing-music integration confirmation. Task 10 introduced no runtime,
gameplay, asset, or audio change.

## Audit and preservation

Final issue results: VIS-001 PASS, VIS-002 PASS, VIS-003 PASS, VIS-004
INCOMPLETE, VIS-005 INCOMPLETE, VIS-006 INCOMPLETE, VIS-007 INCOMPLETE,
VIS-008 INCOMPLETE, VIS-009 PASS, VIS-010 INCOMPLETE.

The shared worktree was already dirty. Existing runtime/test changes and all
unrelated untracked files were preserved. Task 10 stages only this report, the
audit status update, its task report, and `task10-*` screenshot evidence.

## Manual follow-up checklist

- Complete both campaigns with keyboard/gamepad as Trashy and Jimothy.
- Exercise every action, facing, hit, recovery, defeat, and victory sequence.
- Observe both boss combats continuously through defeat, release, and reward.
- Verify touch/multi-touch, safe areas, orientation, background/restore, and
  fullscreen on representative iOS and Android devices.
- Perform the separately planned audible music/SFX/loop/balance analysis.
- Resolve and re-audit the one-pixel decorative tire rounding under VIS-007.
