# Game-wide visual integrity baseline — 2026-08-09

## Scope and entry protocol

- Browser: localhost development server (`http://localhost:3000`)
- Primary viewport: 1440×900
- Responsive viewport: 844×390 landscape
- Character: Trashy
- Entry for every direct URL: title screen → **Start rummaging** → character
  selection → **Start as Trashy**. No route below was judged while title or
  character-select was displayed.
- Screenshot policy: capture `before/*.png` only for a visible defect. No
  defect was reproduced, so no baseline image was written.

## Automated catalog evidence

1. Added the required Level 1/Level 2 checkpoint assertion first.
2. `node --test tests/visual-inventory.test.mjs` initially failed with the
   expected 17 missing IDs: `l1-creek`, `l1-highway`, `l1-industrial`,
   `l1-park`, `l1-victory`, `l2-backyard`, `l2-street`, `l2-obstacle`,
   `l2-drainage`, `l2-runway`, `l2-main-street`, `l2-squirrel`,
   `l2-terrier`, `l2-skunk`, `l2-moth`, `l2-interaction`, and `l2-victory`.
3. `node --test tests/visual-inventory.test.mjs tests/visual-contract.test.mjs`
   passed: 11 tests, 0 failures.

## Desktop route sweep (1440×900)

All listed URLs reached active gameplay or the intended victory overlay after
the entry protocol. Screenshot path is `none — no visible defect` for each.

| Catalog ID | Visited URL | State/interaction exercised | Result | Screenshot / issue |
| --- | --- | --- | --- | --- |
| l1-start | `/?backgroundTest=woodland&visualQa=l1-start` | opening campsite; crate/pigeon composition | active gameplay | none / none |
| l1-creek | `/?backgroundTest=creek&visualQa=l1-creek` | creek checkpoint; ground/flying enemy presentation | active gameplay | none / none |
| l1-highway | `/?backgroundTest=highway&visualQa=l1-highway` | highway checkpoint; platform/parallax sweep | active gameplay | none / none |
| l1-industrial | `/?backgroundTest=industrial&visualQa=l1-industrial` | industrial fixture; direct-route respawn observed after contact | active gameplay | none / none |
| l1-park | `/?backgroundTest=park&visualQa=l1-park` | park runway composition | active gameplay | none / none |
| l1-middle | `/?backgroundTest=highway&visualQa=l1-middle` | legacy highway alias | active gameplay | none / none |
| l1-end | `/?backgroundTest=park&visualQa=l1-end` | legacy park alias | active gameplay | none / none |
| l1-boss | `/?bossTest=1&visualQa=l1-boss` | Trash Heap Tyrant arena body, ground, health bar | active gameplay | none / none |
| l1-victory | `/?victoryTest=1&visualQa=l1-victory` | intended YOU WIN overlay and reward scene | victory overlay | none / none |
| l2-backyard | `/?level=2&levelTest=backyard&visualQa=l2-backyard` | backyard route | active gameplay | none / none |
| l2-street | `/?level=2&levelTest=street&visualQa=l2-street` | street checkpoint and terrier-scale sample | active gameplay | none / none |
| l2-obstacle | `/?level=2&levelTest=obstacle&visualQa=l2-obstacle` | obstacle-course props and water effect | active gameplay | none / none |
| l2-drainage | `/?level=2&levelTest=drainage&visualQa=l2-drainage` | drainage lamp/moth sample | active gameplay | none / none |
| l2-runway | `/?level=2&levelTest=runway&visualQa=l2-runway` | quiet runway, hydrant/environment sample | active gameplay | none / none |
| l2-main-street | `/?level=2&levelTest=main-street&visualQa=l2-main-street` | post-boss dumpster presentation | active gameplay | none / none |
| l2-start | `/?level=2&levelTest=backyard&visualQa=l2-start` | legacy backyard alias | active gameplay | none / none |
| l2-middle | `/?level=2&levelTest=obstacle&visualQa=l2-middle` | legacy obstacle alias | active gameplay | none / none |
| l2-end | `/?level=2&levelTest=main-street&visualQa=l2-end` | legacy main-street alias | active gameplay | none / none |
| l2-squirrel | `/?encounterTest=squirrel&visualQa=l2-squirrel` | squirrel locomotion and projectile presence | active gameplay | none / none |
| l2-terrier | `/?encounterTest=terrier&visualQa=l2-terrier` | terrier locomotion/telegraph fixture | active gameplay | none / none |
| l2-skunk | `/?encounterTest=skunk&visualQa=l2-skunk` | skunk locomotion/spray fixture | active gameplay | none / none |
| l2-moth | `/?encounterTest=moth&visualQa=l2-moth` | moth flight band and lamp attachment | active gameplay | none / none |
| l2-interaction | `/?encounterTest=interaction&visualQa=l2-interaction` | squirrel/skunk interaction; sprinkler body/water | active gameplay | none / none |
| l2-boss | `/?bossTest=brutus&visualQa=l2-boss` | Brutus body, armor, ground, hydrants, arena lane | active gameplay | none / none |
| l2-victory | `/?victoryTest=level2&visualQa=l2-victory` | Level 2 post-boss exit scene | active gameplay | none / none |
| player-states | `/?powerupTest=taco&visualQa=player-states&debugVisuals=1` | debug bounds; player action key; respawn/recovery presentation | active gameplay | none / none |
| enemy-states | `/?encounterTest=interaction&visualQa=enemy-states&debugVisuals=1` | debug bounds; squirrel/skunk ground anchors | active gameplay | none / none |

## Responsive repeats (844×390 landscape)

| Catalog ID | Visited URL | Result | Screenshot / issue |
| --- | --- | --- | --- |
| l1-park | `/?backgroundTest=park&visualQa=l1-park` | canvas, HUD, route and runway fit without observed clipping or overlap | none / none |
| l2-main-street | `/?level=2&levelTest=main-street&visualQa=l2-main-street` | canvas, HUD, post-boss dumpster and exit scene fit without observed clipping or overlap | none / none |

## Historical-item recheck

- Sprinkler: `l2-interaction` rendered one body and an attached water effect;
  no duplicate body or wedge was observed.
- Lamp post: `l2-moth` and `l2-drainage` showed an undistorted tall post with
  its base on the support surface and moth/glow aligned to its housing.
- Opening crates: `l1-start` showed two distinct, non-overlapping crate
  supports with the pigeon fixture present.
- Level 1 boss: `l1-boss` showed the Trash Heap Tyrant grounded and fully
  visible in its arena.
- Brutus: `l2-boss` showed a grounded, proportionate body with visible arena
  utility props and no observed duplicate post-victory dumpster layer.
- Representative state evidence: debug routes showed stable bounds for the
  player, squirrel, and skunk. The direct fixtures did not deterministically
  force enemy hit and full recovery sequences during this baseline sweep;
  that is unverified and remains for the dedicated Task 4 state pass.

## Browser diagnostics

- 28 post-entry route checks captured browser warning/error logs.
- Warning/error entries: 0.
- The first `l1-start` entry was also visually inspected; no warning/error was
  present in the active tab after it was loaded, though its earlier per-route
  log snapshot was not retained when the tab was reused.

## Issue ledger outcome

No new `VIS-###` issue was opened. Every inspected historical item appeared
to pass at the stated viewport. The only unverified condition is deterministic
runtime observation of enemy hit/recovery transitions; it is not evidence of a
defect and should be exercised by Task 4 before a final acceptance claim.
