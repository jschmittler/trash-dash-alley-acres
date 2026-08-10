# Task 1 Report: Canonical V2 Visual Contracts and Complete Sprinkler Removal

Status: DONE

## Applicable project skills

- Rendering / Asset Integrity
- Sprite / Art Asset
- Animation / Motion Sprites
- Environment Placement / Z-Order
- Overlap Prevention / Spatial QA
- Visual QA

All six canonical skill files and their routed references/guides were read before implementation. The in-app browser workflow was used for the required running-game verification.

## RED evidence

Created `tests/v2-visual-remediation.test.mjs`, then ran the required focused command before implementation:

```text
node --test tests/v2-visual-remediation.test.mjs tests/level-two-props.test.mjs tests/level-two-definition.test.mjs tests/brutus-boss.test.mjs tests/visual-inventory.test.mjs
```

Expected RED result: 41 tests passed and the new suite failed because `validateAnimationStateScale` was not yet exported. The pre-remediation runtime and existing tests still positively described the sprinkler system, proving the deletion contract was not satisfied.

## Root cause and systemic deletion

The removed feature was not a single prop. It was distributed across the deterministic atlas builder, atlas rows, prop frame metadata, emitter/body helpers, Level 2 encounter fixtures, Brutus arena configuration, boss phase timers/hazard output, runtime environment construction, bin-lid pushes, player collision, Canvas rendering, visual inventory records, placement validation, and dependent tests.

The feature was removed at every shipped/runtime boundary:

- Repacked `level2-props.png` from 4×7 cells (512×896) to 4×4 cells (512×512), moving retained hydrant frames into rows 2–3.
- Removed all sprinkler build slots, generated-water helper logic, atlas recoloring branches, frame records, render metrics, emitter/draw helpers, and cycle/visual-state helpers.
- Removed tutorial/interaction environment placements and the environment kind.
- Removed both Brutus arena placements, alternating-side/timer state, phase hazard output, player hitbox, and renderer/effect branch.
- Removed sprinkler-derived bin-lid push behavior, including the obsolete shared push helper and its skunk-loop consumer.
- Preserved Brutus phase-three pressure through its existing 420 px/s charge, without changing unrelated movement/state sequencing.
- Kept one explicit `brutus-hydrant` identity, constructed once from `LEVEL_TWO.boss.hydrant`.
- Removed inventory body/effect records and draw-family bindings.
- Updated boss-arena validation and all dependent route, enemy, placement, prop, boss, and inventory tests.

Historical documentation and prior audit screenshots were intentionally preserved because they are evidence, not shipped runtime/configuration paths.

## Prevention contracts

Added reusable mutation-sensitive inventory validators:

- `validateFixedAspectDestinations` rejects unequal X/Y scale from source rectangle to destination.
- `validateAnimationStateScale` rejects per-state destination dimension multipliers.

Added/strengthened assertions for:

- reduced canonical prop atlas dimensions and exact retained frame manifest;
- hard alpha and transparent atlas-cell boundaries;
- canonical uniform prop destinations;
- no sprinkler token in shipped runtime/configuration/builder sources;
- no deleted prop/effect inventory identity;
- no Brutus sprinkler hazard in any phase;
- exactly one stable hydrant identity across fresh entry, retry, and re-entry materialization.

Strengthened the existing canonical skills rather than adding a new skill. They now explicitly require runtime-first verification, fixed-aspect destination proof, canonical dimensions, no state-dependent character scale, native/zoomed alpha-boundary audits, consecutive-frame transition QA, and persistent prop identity checks across arena lifecycle transitions.

## Verification evidence

### Automated

- Required focused matrix: 44/44 passed.
- Extended Level 2/boss/placement matrix: 101/101 passed after updating the now-environment-free skunk fixture contract.
- `npm run validate:skills`: passed; 7 canonical skills and all repository skill references validated.
- `npm test`: passed; production build succeeded and 292/292 tests passed.
- `git diff --check`: passed.
- Shipped search: `rg -n -i "sprinkler" app scripts` returned no matches; no matching shipped file name exists under `app`, `scripts`, or `public`.
- Deterministic rebuild: two consecutive builds produced identical SHA-256 hashes:
  - `public/assets/generated/level2-props.png`: `7b4bc693c69cbf5d44c98d86aac9056c3fff7308eca391497a855e020c59691b`
  - `concepts/level-two/level2-props-contact-sheet.png`: `d8d0eef7a84e4c4bc5d896bbe3005aa0269bf3490a5fa068e09b1302dd3163d8`
  - lamp output/contact sheet also remained byte-deterministic and unchanged in identity.

### Running-game Visual QA

Local game served at the development route and was inspected in the in-app browser after the final code/atlas changes:

- `/?level=2&levelTest=obstacle&visualQa=former-sprinkler-area`
- `/?level=2&encounterTest=interaction&visualQa=former-interaction-sprinkler`
- `/?level=2&bossTest=brutus&visualQa=single-hydrant`

Observed at the normal desktop gameplay viewport:

- former tutorial/interaction locations contain no sprinkler body, water effect, duplicate body, or residual visible obstacle;
- skunk and nearby props render normally;
- Brutus arena renders one grounded hydrant and no auxiliary sprinkler bodies/effects;
- no runtime warning or error was logged on any inspected route.

Automated lifecycle tests cover fresh entry, retry, and re-entry identity materialization. Repeated played death/retry cycles remain part of Task 4's broader arena lifecycle acceptance scope.

## Files outside the original minimum list

Systemic deletion required scoped changes to `app/level-two-enemies.mjs`, `app/boss-arena.mjs`, `tests/level-two-enemies.test.mjs`, `tests/level-two-routes.test.mjs`, `tests/world-placement.test.mjs`, the shipped reduced atlas, and its contact sheet. These are direct owners/consumers of the deleted feature and are included to avoid dead branches or failing repository tests.

## Concerns

None blocking. Unrelated dirty and untracked work was preserved. Existing unrelated hunks in `app/trash-dash-game.tsx` were excluded from the Task 1 staging scope.
