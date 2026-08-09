# Task 4 — Enemy and Boss Animation Geometry

## Status

`DONE_WITH_CONCERNS` — deterministic state, atlas, source/destination, and
full-suite verification are green. Browser state/input automation was not
available, so the required rendered encounter and boss sequence coverage is
recorded as `CANNOT VERIFY`.

## RED → GREEN

- RED: added the table-driven actor contract first. It exposed 86 exact
  `VIS-006` Level 1/Level 2 enemy and Trash Heap Tyrant frame mappings whose
  runtime destination axes were non-uniform. The focused RED command was
  `node --test tests/boss-animation.test.mjs`; its new VIS-006 assertion
  failed while the allowlist was populated.
- Classification: all affected source cells had complete, inset alpha and the
  existing atlas/contact-sheet tests passed. The fault was pure destination
  geometry, not clipped, contaminated, or missing source art; no atlas or
  source rebuild was justified.
- GREEN: authoritative Level 1 dispatch uses square 64px snake/spider and
  72px fox transforms; Level 2 dispatch uses square 76px squirrel, 82px
  terrier, 78px skunk, and 82px moth transforms; all Trash Heap Tyrant states
  use a single 166px square transform. Ground draw paths retain the existing
  bottom-anchor calculation and moth retains the authored center calculation.
  VIS-006 is removed from the measured distortion ledger.
- Brutus stays unchanged: its 256×192 source to 220×165 destination is a
  uniform scale, and its frame-derived visible-top weak-point remains the
  collision authority.

## State and route ledger

| Family | Contracted reachable presentation states | Result |
| --- | --- | --- |
| Level 1 actors | snake, pigeon, wasp, mosquito, possum, spider, fox: move | bounded four-frame atlas rows and looping playback |
| Level 2 squirrel | idle, anticipation, release, follow-through, recovery, hit, defeat | explicit one-frame action beats; single release event |
| Level 2 terrier | sleep, wake, charge, stunned, recovery, hit, defeat | local tell/impact/recovery playback |
| Level 2 skunk | patrol, telegraph, spray, recovery, hit, defeat | tell → active spray → recovery |
| Level 2 moth | orbit, telegraph, dive, climb, hit, defeat | center anchor and authored flight return |
| Trash Heap Tyrant | idle, walk, windup, charge, recover, hit, rage, defeat | state-local frame clamp for committed actions |
| Brutus | intro/idle, sniff, bark, charge, crash, stunned-open, hit, recover, defeat slide/shake/exit | existing local state timer and visible-top collision mapping |

- Automated: both facings, tells/actions/recovery, projectile release and
  reflection, obstacle impact, vulnerable/hit/defeat, effect attachment,
  flight return, repeat entry, boss phases, weak-point/hit, recovery, defeat,
  and exit are covered by module/atlas tests.
- Browser: direct `encounterTest=squirrel|terrier|skunk|moth|interaction` and
  both boss sequences are `CANNOT VERIFY`; this session has no callable
  in-app browser backend or input controller. No screenshot or runtime PASS
  is claimed.

## Verification

- Focused matrix plus gameplay/hit/Task 2 contracts: 80 passing, 0 failing.
- `npm run validate:skills`: passed.
- `npm run lint`: 0 errors; one existing Next `<img>` advisory at
  `app/trash-dash-game.tsx:2927`.
- `npm test`: 258 passing, 0 failing, including production build.
- `git diff --check`: passed.
- Asset hashes/rebuild: not applicable; no source, builder, atlas, or contact
  sheet changed.

## Files and commit

- `app/boss-animation.mjs`
- `app/trash-dash-game.tsx` (isolated render-dispatch hunks only)
- `app/visual-inventory.mjs`
- `tests/boss-animation.test.mjs`
- `docs/visual-audit.md`
- Commit: `fix: harden enemy and boss presentation` (hash supplied in handoff).

## Self-review and concerns

- Preserved all unrelated dirty Level 2 behavior, prop, asset, and route work;
  only the two frame-destination dispatch hunks are staged from the shared
  runtime file.
- No changes were made to Brutus art or source geometry because its transform
  and weak-point geometry were already truthful.
- Runtime browser input coverage remains the single concern and requires a
  follow-up visual pass before a rendered PASS claim.

## Controller supplemental browser QA

At 1280×720 DPR 2 after title → Trashy confirmation, the controller observed
grounded squirrel/skunk debug bounds on
`/?encounterTest=interaction&visualQa=task4-interaction&debugVisuals=1`, a
grounded complete terrier on
`/?encounterTest=terrier&visualQa=task4-terrier&debugVisuals=1`, the grounded
Trash Heap Tyrant idle on `/?bossTest=1&visualQa=task4-boss1&debugVisuals=1`,
and grounded proportional Brutus walking on
`/?bossTest=brutus&visualQa=task4-brutus&debugVisuals=1`. The named screenshot
evidence is committed alongside this supplement. All route logs were empty.

This closes representative idle/grounding route QA only. Both facings and
full tell/action/recovery/hit/defeat/exit sequences remain `CANNOT VERIFY`.

## Round 1 review repair — C1 / I1 / I2 / I3

- C1: the committed Task 4 archive now owns every required Level 2 semantic
  animation/state hunk and runtime squirrel release wiring; no Level 2
  placement, prop, or route changes were absorbed. A clean `git archive HEAD`
  passes the focused matrix (83/83) and complete suite (205/205).
- I1: reachable Level 2 mappings are explicit and unknown combinations throw.
  Skunk recovery selects its own row-12 spray follow-through frame; moth climb
  selects its own looping row-15 flight frames; neither is relabelled as hit.
  Squirrel anticipation/release/follow-through/recovery select source row 2,
  frames 0/1/2/3 respectively.
- I2: Level 1 has a pure, declared-FPS frame selector. Runtime rendering uses
  elapsed local state time plus a phase seed only for deterministic initial
  desynchronization, rather than phase velocity for playback speed.
- I3: Trash Heap Tyrant's visual bounds and placement footprint are 166×166,
  matching the maximum actual runtime destination while collision and arena
  clearance remain unchanged.
- RED evidence: the first focused run failed with the missing Level 1 selector
  module; it is now covered by selector, runtime-wiring, semantic-mapping, and
  Tyrant-bound regressions. No asset/source rebuild was needed because the
  required compatible source cells already exist in their respective atlases.
