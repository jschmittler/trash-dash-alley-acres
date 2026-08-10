# Trash Dash V2 Failed Visual Audit Remediation

## Release decision

**INCOMPLETE — do not publish from this report.**

The committed V2 snapshot passes the complete automated release matrix, and a
normal browser session reached gameplay as Jimothy with no warning or error
logs. The required uninterrupted Level 1 → Level 2 campaign could not be
completed with the browser controls available in this session: the game reads
held keyboard state across animation frames, while the browser exposes only
atomic keypresses and no supported key-down/key-up or pointer-hold operation.
The campaign, boss lifecycle, transition probes, and twelve campaign-derived
screenshots therefore remain unverified. Static routes were not used to turn
that missing normal-play evidence into a false pass.

## Scope and tested snapshot

- Repository: `trash-dash`
- Commit: `74887a7fcd8acdb8370d3111e4aca79b6c4c9c22`
- Clean test snapshot: a `git archive HEAD` extraction with the repository's
  installed dependencies linked read-only into the isolated working directory
- Local runtime: `http://localhost:3010/?build=v2-task6-clean`
- Browser: Codex in-app browser
- Viewport and capture dimensions: 1280×720
- Character: Jimothy
- Runtime console warnings/errors: `[]`

Unrelated dirty and untracked user work was excluded from the clean automated
snapshot and was not modified by this verification pass.

## Automated release gates

| Gate | Result |
| --- | --- |
| `npm run validate:skills` | PASS — 7 canonical skills and all references validated |
| Focused V2 remediation matrix | PASS — 74/74 |
| `npm test` | PASS — production build plus 314/314 committed-tree tests |
| `npm run lint` | PASS with 0 errors and 1 existing `<img>` performance warning |
| `npm run build` | PASS |
| `npm run build:pages` | PASS |
| `npm run test:pages` | PASS — 1/1 |
| `git diff --check` | PASS |

The committed-tree count is 314 rather than the dirty-worktree count reported
during Task 5 because the unrelated uncommitted `rendered-html` test was
intentionally excluded.

## Deterministic asset rebuild

The Level 2 prop/lamp, Level 2 enemy, and Jimothy builders were run
consecutively in the isolated snapshot. The following SHA-256 values reproduced
exactly on both runs:

| Output | SHA-256 |
| --- | --- |
| `public/assets/generated/level2-props.png` | `aa0c68035e4f354c21e674e299d91eaae5af3564091e6b50b552f04e86fda86b` |
| `public/assets/generated/level2-lamp-post.png` | `632d3734edc2b83ee77fcb4eea7dfa237bdb7f999c7475c7ce4e9eafdd638cd3` |
| `public/assets/generated/level2-enemy-motion.png` | `294a19fdb21d2ba6834b1c92621cc83d196af904c9919fb2285af9b7ab8c4a5d` |
| `public/assets/generated/jimothy-hero-motion.png` | `89d9eb8762952e67219a682d616fa94f5e94c586f164d5ebc58e56a1d678dc32` |
| `public/assets/generated/jimothy-hero-contact-sheet.png` | `89d9eb8762952e67219a682d616fa94f5e94c586f164d5ebc58e56a1d678dc32` |
| `concepts/level-two/level2-props-contact-sheet.png` | `1ce0e1619bbd73342c7539abc7a4cb7377316b8299f94961751a61edeec280af` |
| `concepts/level-two/level2-enemy-motion-contact-sheet.png` | `bd11c499bacc2afa2c2084e1dfb0780d82ed0bbb530de4660897c96758c10a6d` |
| `concepts/jimothy/jimothy-animation-contact-sheet.png` | `89d9eb8762952e67219a682d616fa94f5e94c586f164d5ebc58e56a1d678dc32` |

## Normal campaign attempt

Golden path: start at the title, select Jimothy, traverse Level 1 and its
checkpoints, transition normally into Level 2, encounter every remediated
scene, enter Brutus without a shortcut, die/retry once, defeat him, traverse
the post-boss route, and reach victory.

Observed normal steps:

1. Opened the title route without a direct-state test parameter.
2. Selected **Start rummaging**.
3. Selected **Play as Jimothy**.
4. Selected **Start as Jimothy**.
5. Reached the ordinary Level 1 opening at a stable 1280×720 viewport.
6. Attempted Arrow Right, D, and Shift + Arrow Right through the documented
   browser keypress API. Atomic presses did not maintain the game's held-key
   state across request-animation frames and could not produce traversal.
7. Read the runtime warning/error log after the attempts: empty.

Supplemental evidence:

- `docs/superpowers/reports/2026-08-10-trash-dash-v2-remediation-screenshots/00-normal-campaign-input-blocker.jpg`
- Route: `/?build=v2-task6-clean`
- State: ordinary Level 1 gameplay after title → character select → Jimothy
- Capture: 1280×720 JPEG
- Log attribution: warning/error log `[]` from the same tab after input attempts

## Prior task runtime evidence (supplemental only)

These captures and observations were produced after their respective scoped
repairs. They remain useful visual evidence, but none is relabeled as the
missing uninterrupted Task 6 campaign.

- **Task 1, former sprinkler and hydrant fixtures:**
  `/?level=2&levelTest=obstacle&visualQa=former-sprinkler-area`,
  `/?level=2&encounterTest=interaction&visualQa=former-interaction-sprinkler`,
  and `/?level=2&bossTest=brutus&visualQa=single-hydrant`. The report records no
  visible sprinkler body/effect at the former locations and one grounded arena
  hydrant, with empty warning/error logs. The final lifecycle-owner fix round
  itself remained `CANNOT VERIFY` in-browser.
- **Task 2, repaired props:** fresh squirrel, terrier, moth, and Brutus fixtures
  showed three readable acorns, the classic round residential can, a clean lamp
  and restrained runtime halo, and two canonical crates with an open lane. All
  four fixture logs were empty. The later boss-entry-coordinate fix rounds were
  not re-inspected in-browser and remained `CANNOT VERIFY`.
- **Task 3, historical terrier sequence:**
  `/?encounterTest=terrier&visualQa=task3-terrier&debugVisuals=1&cacheBust=20260810-task3`
  and `/?level=2&levelTest=street&visualQa=task3-normal-street&debugVisuals=1&cacheBust=20260810-task3`
  were entered through title/selection at 1280×720. The eight-second fixture
  sequence showed both facing charges, impact, dedicated recovery, repeat
  charge, an 82×82 overlay, and grounded feet; logs were empty. Artifact:
  `.superpowers/sdd/2026-08-10-trash-dash-v2-failed-visual-audit-remediation/task-3-runtime-contact-sheet.jpg`.
  The subsequent hit/defeat timing and instrumentation fix round had no fresh
  browser capture, so the strict three-cycle/both-facing acceptance remains
  `CANNOT VERIFY` here.
- **Task 4, arena fixtures:** `/?level=2&bossTest=brutus&debugVisuals=1` was
  entered three times and showed one hydrant, two separate crates, an open lane,
  and grounded Brutus. `/?level=2&victoryTest=level2&debugVisuals=1` showed a
  uniformly scaled holy dumpster separated from the remaining crate and player
  path. Logs were empty. A keyboard retry returned to the Level 2 beginning;
  controller-driven death/retry/defeat/exit/re-entry was explicitly not proven.
- **Task 5, Jimothy same-camera fixture:**
  `/?victoryTest=level2&victoryTransitionTest=jimothy&visualQa=task5-jimothy-victory&debugVisuals=1`
  was entered through title and Start as Jimothy at 1280×720. Artifacts
  `.superpowers/sdd/2026-08-10-trash-dash-v2-failed-visual-audit-remediation/task-5-before-victory.jpg`
  and `task-5-during-victory.jpg` show the same 110×110 destination, 38×58
  collision, and bottom-center anchor before/during victory, with empty logs.
  This development fixture supplements but does not replace the campaign
  victory requirement.

## Required runtime evidence disposition

| Required evidence | Status | Reason |
| --- | --- | --- |
| Loose nut/acorn pile | CANNOT VERIFY in continuous campaign | Level 2 not reached |
| Residential trash can | CANNOT VERIFY in continuous campaign | Level 2 not reached |
| Lamp/moth | CANNOT VERIFY in continuous campaign | Level 2 not reached |
| Former sprinkler area and collision | CANNOT VERIFY | Level 2 not reached; no player traversal through area |
| Terrier run | CANNOT VERIFY | Level 2 not reached |
| Terrier sit | CANNOT VERIFY | Level 2 not reached |
| Terrier hit | CANNOT VERIFY | Level 2 not reached |
| Level 2 boss crate | CANNOT VERIFY | Brutus arena not reached |
| Exactly one hydrant | CANNOT VERIFY across live lifecycle | Brutus arena not reached |
| Post-boss composition | CANNOT VERIFY | Brutus not defeated |
| Jimothy immediately before victory | CANNOT VERIFY in campaign | Victory route not reached |
| Jimothy during victory | CANNOT VERIFY in campaign | Victory route not reached |

The twelve required numbered screenshots were deliberately not created from
static fixture routes because the plan makes them supplemental to, not a
substitute for, the normal played sequence.

## Deferred edge probes

- Activate Level 1 and Level 2 checkpoints through normal traversal.
- Exercise the terrier sit → wake → run/charge → hit/impact → recover → run
  lifecycle three complete times, including both facings.
- Walk through the former sprinkler region and confirm no invisible collision,
  push, hazard, effect, or audio remains.
- Enter Brutus normally; confirm one hydrant; die and retry; confirm the same
  single identity; complete every phase; exit; and re-enter.
- Inspect both canonical boss crates under live jumping/collision.
- Inspect the separated post-boss crate and uniformly scaled holy dumpster.
- Capture Jimothy on consecutive frames immediately before and during victory
  at the same camera position.
- Produce and inspect the twelve exact campaign screenshots with route/time,
  state, viewport, dimensions, and log attribution.

## What is established despite the incomplete release gate

The clean committed code, asset, state, placement, lifecycle, build, and Pages
contracts are green. This is strong prevention evidence for all nine repairs,
but the project's canonical Visual QA rule correctly keeps the final release
decision `INCOMPLETE` until the running game is walked end-to-end after the
last change.
