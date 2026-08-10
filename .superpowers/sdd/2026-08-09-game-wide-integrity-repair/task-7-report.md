# Task 7 — Level 2 and Brutus acceptance report

Status: **DONE_WITH_CONCERNS**

Commit: this task's scoped commit, `fix: complete level two integrity pass`

## Scope and baseline

The pre-edit Level 2 regression matrix passed **76/76** at `0aba089`:

```text
node --test tests/level-two-definition.test.mjs tests/level-two-routes.test.mjs \
  tests/level-two-runtime.test.mjs tests/level-two-backgrounds.test.mjs \
  tests/level-two-enemies.test.mjs tests/level-two-props.test.mjs \
  tests/brutus-boss.test.mjs tests/brutus-atlas.test.mjs
```

That green baseline did not prove rendering integrity. Inspection of the canonical inventory and live direct routes reproduced one systemic defect: several fixed-aspect Level 2 atlas cells were drawn into independently scaled destination rectangles. The affected consumers were the charge obstacle, sprinkler water, hydrant body and water, Brutus utility platforms, and the cap pickup.

## RED / GREEN ledger

| Check | RED | Root cause | GREEN |
| --- | --- | --- | --- |
| Fixed-aspect Level 2 prop cells use one runtime scale | New assertion initially failed because no shared `chargeObstacleDrawRect` contract existed | Render sizes were embedded independently in runtime branches and inventory allowlists normalized distortion instead of rejecting it | Central draw metrics and helpers now derive square destination geometry; focused prop test passes |
| Brutus platform art agrees with one-way surface and arena floor | Expanded placement contract exposed art/collision/base mismatch | The 128x128 cell was stretched to 104x96 and anchored by destination rather than visible source bounds | Per-visual opaque bounds drive one uniform scale and source-bottom registration; both platform records are 96x96 and pass symmetry/top/base checks |
| Inventory rejects Level 2 distortion | Existing audit allowlist admitted Level 2 exceptions | Inventory described the old distorted rectangles | Level 2 prop/platform/cap exceptions were removed; the only remaining VIS-007 allowlist item is the unrelated Level 1 tire rounding |

No new source art was needed for the reproduced geometry defect. Existing Level 2 source work was rebuilt to prove that its checked-in atlases and contact sheets are deterministic.

## Route and action ledger

The in-app browser was controllable for static direct-route inspection at 1280x720. Every listed fresh route returned an empty warning/error log.

### Trashy

| Area | Evidence | Result |
| --- | --- | --- |
| Backyard chapter | `after/task7-backyard-1280x720.png` | PASS static composition |
| Street chapter | `after/task7-street-1280x720.png` | PASS static composition |
| Obstacle-course chapter | `after/task7-obstacle-1280x720.png` | PASS static composition |
| Drainage chapter | `after/task7-drainage-1280x720.png` | PASS static composition |
| Runway chapter | `after/task7-runway-1280x720.png` | PASS static composition |
| Main-street route | `after/task7-main-street-1280x720.png` | PASS static composition |
| Squirrel fixture | `after/task7-squirrel-1280x720.png` | PASS static state |
| Terrier fixture | `after/task7-terrier-1280x720.png` | PASS static state |
| Skunk fixture | `after/task7-skunk-1280x720.png` | PASS static state |
| Moth/lamp fixture | `after/task7-moth-1280x720.png` | PASS static attachment/composition |
| Interaction fixture | `after/task7-interaction-fixed-1280x720.png` | PASS corrected prop aspect/baselines |
| Brutus arena | `after/task7-brutus-fixed-1280x720.png` | PASS corrected platform/hydrant composition |
| Victory | `after/task7-victory-1280x720.png` | PASS static release/reward state |

### Jimothy

| Area | Evidence | Result |
| --- | --- | --- |
| Squirrel fixture | `after/task7-jimothy-squirrel-1280x720.png` | PASS static baseline/composition |
| Brutus arena | `after/task7-jimothy-brutus-1280x720.png` | PASS static baseline/platform composition |
| Victory | `after/task7-jimothy-victory-1280x720.png` | PASS static victory presentation |

The five background chapters, their semantic far/middle/close plates, exact dimensions, alpha rules, contact baseline, transition ordering, and parallax rates are covered deterministically by `level-two-backgrounds.test.mjs`. Static screenshots showed complete sky coverage and no obvious split-opacity or floating chapter element.

## Precise CANNOT VERIFY boundary

Direct routes are deterministic static QA fixtures, not a substitute for a complete normal playthrough. The following remain **CANNOT VERIFY live** in this task:

- normal-input traversal through both optional routes and every checkpoint;
- perceived transition/parallax motion and duplicate-transition absence under continuous play;
- squirrel reflection feel and exactly-once behavior under real input;
- terrier charge, edge stop, obstacle impact, pause, and recovery motion;
- skunk tell/spray attachment and moth dive/return motion;
- sprinkler push interaction;
- Jimothy attack, reflection, damage, normal-jump platform reach, and boss stomp feel;
- smooth runway entry, retreat lock, live Brutus phase reactions, defeat danger clearing, and victory timing.

Those paths have deterministic state/lifecycle/integration coverage, but no visual PASS is inferred from those tests. Manual recheck path: start a normal Level 2 campaign as Trashy, traverse all five chapters plus two optional routes, complete every named interaction above, defeat Brutus, then repeat the character-sensitive paths as Jimothy.

## Verification evidence

- Required and directly affected matrix: **140/140 PASS**.
- Isolated index-package recheck: **123/123 PASS** across the required matrix
  and committed affected contracts; production and Pages builds also pass from
  that exact staged tree (`6410cc0645cc4fdb2767d7b09657bc3b7ea68bfd`).
- Full repository suite: **277/277 PASS**, plus **5/5** skill-system pretests.
- `npm run validate:skills`: PASS, seven canonical skills and repository references validated.
- `npm run lint`: PASS with zero errors; one existing `@next/next/no-img-element` warning at `app/trash-dash-game.tsx:2954`.
- `npm run build`: PASS as part of `npm test`.
- `npm run build:pages && npm run test:pages`: PASS, **1/1** Pages test.
- Fresh browser logs for corrected interaction and Brutus fixtures: `[]`.
- Two consecutive asset builds produced identical SHA-256 values:
  - `level2-props.png`: `ff4cd724f31d4b781e0643c90dbbe3d46172f1a8499ba0f1d6147b504667b44a`
  - prop contact sheet: `847f9ade601dfa3ab0a74009f281f678dd04ca9b2bae734ef6703d51555c4dd0`
  - `level2-lamp-post.png`: `ea658816a8a1ee22ececd0bc91ac4989a8cea758d3dc787adb1ed2161d97f8b6`
  - lamp contact sheet: `eea888370a6c8f2b815131219654a7cdba8a4f6041a4df37046880d2595d2f0d`
  - `level2-enemy-motion.png`: `617c7531dc564f20828b87d19e796064a67fe7a2eba0aa9137775669175092cf`
  - enemy contact sheet: `dbc0bbd5c6e69a45c9cabf9b279c0ac3b9906c25a79f6c0d524d074a04a83456`

## Files in the scoped package

- Runtime/contracts: `app/dumpster-render.mjs`, `app/level-two-enemies.mjs`, `app/level-two-props.mjs`, selected Level 2 hunks in `app/trash-dash-game.tsx`, `app/visual-inventory.mjs`.
- Builders/source/generated evidence: Level 2 enemy/prop builders, directly consumed new source sheets, regenerated atlases, and contact sheets.
- Tests: Level 2 enemy/prop, victory dumpster, visual inventory, and asset-integrity contracts.
- Audit/evidence: `docs/visual-audit.md`, this report, and the Task 7 screenshots named above.

## Self-review and concerns

- The change fixes the systemic destination-geometry contract rather than hiding distortion with per-frame offsets.
- Runtime, inventory, placement, and browser evidence now agree on the repaired dimensions and baselines.
- No unrelated responsive/mobile test changes, skill-system files, Level 1 crate changes, or other pre-existing dirty work are included in the scoped package.
- Concern: browser input automation did not complete the required normal traversal/action matrix, so dynamic visual feel is deliberately left CANNOT VERIFY and prevents an unconditional DONE status.
- Concern: the lint warning is pre-existing and outside Task 7; it is recorded rather than suppressed.

## Review fix round 1

Review commit `3816a0e` found two genuine closure gaps.

### RED / GREEN

- **Lamp aspect and coverage:** RED measured actual source→runtime scales of
  0.5 X and 0.8125 Y and proved the lamp had neither an inventory record nor a
  draw-family binding. GREEN derives 156×208 from the 192×256 source with one
  0.8125 scale, registers the complete source/destination path, and publishes
  the measured 111×248 alpha-visible bounds. The bottom-center anchor is
  unchanged; placement uses the visible silhouette and the fixture moves 12px
  to clear the adjacent poolside ledge without floating.
- **Emitter effects:** RED proved both water records inherited
  `GROUND_CONTACT` and `walkable-surface`, with no mirrored origin-relative
  bounds. GREEN creates dedicated emitter records whose right/left bounds come
  directly from `sprinklerWaterDrawRect` and `hydrantWaterDrawRect`, whose
  placement footprint is their mirrored motion envelope, and whose allowed
  relationship is `named-emitter-envelope` under `FREE_ANCHOR`.

No source or generated asset was rebuilt; the valid lamp art and water cells
were repaired through runtime geometry and authoritative metadata. The focused
prop/inventory/asset/placement/enemy matrix is green. Final browser appearance
after this corrective change remains `CANNOT VERIFY` unless new evidence is
captured; the original static screenshots are not reused as proof.

Corrective verification:

- Required plus directly affected working-tree matrix: **141/141 PASS**.
- Full repository suite: **278/278 PASS**, plus **5/5** skill-system pretests.
- Exact staged package: **124/124 PASS** and production build PASS from tree
  `bbcf19362fee331f800d17b52d8da552206c429d`.
- Skill validation and Pages build/test pass. Lint remains zero errors with the
  same recorded pre-existing `<img>` warning.
- Browser attempt returned `Browser is not available`; no post-fix screenshot
  or runtime visual PASS is claimed.
