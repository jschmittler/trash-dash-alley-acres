# Task 1 review — canonical V2 contracts and sprinkler removal

**Verdict: FAIL**

Reviewed `b81f4a5..24e3a02` against the Task 1 brief and the canonical
Rendering / Asset Integrity, Sprite / Art Asset, Animation / Motion Sprites,
Environment Placement / Z-Order, Overlap Prevention / Spatial QA, and Visual
QA contracts. The exact commit was also exported and tested in isolation so
unrelated dirty-worktree files could not satisfy its contracts.

## Critical findings

### C1 — The deleted sprinkler system survives under `hydrant-*` aliases

The patch removes the word `sprinkler`, but not the complete feature. The
shipped prop manifest still contains `hydrant-build`, `hydrant-spray`,
`hydrant-recover`, and three `hydrant-water-*` state families
(`app/level-two-props.mjs:19-25`). It also retains nozzle/water metrics and the
`hydrantNozzleOrigin`, `hydrantWaterDrawRect`, and `hydrantVisualState`
helpers (`app/level-two-props.mjs:28-34,89-116`). The builder deliberately
recreates all seven non-idle cells and the water palette
(`scripts/build-level-two-props.mjs:26-33,56-79,118-132,166-188`). The visual
inventory then advertises `hydrant-water` as a runtime effect and binds it to
the Level 2 prop draw family (`app/visual-inventory.mjs:405-443,475-478,566`).

None of those states or effect helpers is used by production. The runtime
imports only `hydrantDrawRect` from this family and renders only
`levelTwoPropFrame("hydrant-idle")` (`app/trash-dash-game.tsx:123-130,
2491-2502`). The committed contact sheet visibly confirms that its final two
rows are four hydrant body states plus four water-spray cells. These are dead
sprite, effect, emitter, builder, inventory, and configuration branches—the
exact residuals the brief requires deleting.

The new deletion regression cannot detect this aliasing: it only rejects the
literal `/sprinklers?/i` token and sprinkler-named keys/IDs
(`tests/v2-visual-remediation.test.mjs:35-42`). Existing prop, inventory, and
placement tests actively require the renamed water system instead
(`tests/level-two-props.test.mjs:27-34,90-157,216-232` and
`tests/visual-inventory.test.mjs:114-133`). Keep the single idle hydrant cell
needed by the crash mechanic, remove every other retained body/water cell and
helper/record/build input, and make the regression prove runtime reachability
or exact allowed frame ownership rather than names.

### C2 — Shipped player rendering still applies forbidden per-state scale

The new `validateAnimationStateScale` helper is never called on the canonical
inventory. Its only use is a synthetic four-state fixture
(`tests/v2-visual-remediation.test.mjs:77-90`), while
`validateImplementedVisualInventory` does not invoke it
(`app/visual-inventory.mjs:628-648`). Applying the committed helper to the
committed inventory produces **57 raccoon** and **64 Jimothy** scale errors.

This reflects real runtime behavior, not stale metadata. Player states still
declare different destination sizes within each form—for example small idle
84, jump 88, land 82, and victory 88; large idle 110, jump 114, land 104,
hurt 100, glide 140, and victory 114 (`app/player-animation.mjs:19-41`). The
renderer uses each selected state's `drawWidth`/`drawHeight` directly
(`app/trash-dash-game.tsx:2653-2668`). Jimothy carries the same per-state
pattern. Thus the shipped game violates the binding prohibition on
state-dependent scale, and the claimed canonical assertion is kept detached
because applying it would fail. Normalize runtime destination scale within
each gameplay form and validate every real player inventory state grouped by
form; a synthetic helper unit test is not the required contract.

### C3 — The exact commit does not contain the canonical skill system or its claimed validation

A clean archive of `24e3a02` contains only the six added
`.skills/*/SKILL.md` files. It does not contain `AGENTS.md`,
`.skills/README.md`, any linked `.skills/*/references/*`,
`scripts/validate-skills.mjs`, or a `validate:skills` package script. The new
skills therefore link to missing required references and are not registered
or routable as the project's canonical system. This is not a self-contained
amendment of existing skills.

The report's verification claims came from the dirty worktree:
`npm run validate:skills` fails in the exact archive with `Missing script:
"validate:skills"`. The exact commit's `npm test` passes **232/232**, not the
reported 292/292, and its package script omits the new V2 remediation,
inventory, world-placement, and skill-system suites. Commit the canonical
registry, references, validator, and package wiring needed by these skill
changes, then rerun the exact committed tree.

## Important findings

### I1 — The hydrant lifecycle test never exercises runtime entry, retry, or re-entry

`materializeLevelTwoEnvironment` constructs its own array from
`levelTwoEnvironmentRecords()` and `LEVEL_TWO.boss.hydrant`, then the test
calls that same local function three times and labels the results entry,
retry, and re-entry (`tests/v2-visual-remediation.test.mjs:28-33,54-62`). It
does not execute `makeWorld`, `startGame`, restart, checkpoint recovery, boss
phase changes, or re-entry.

A mutation that appends the hydrant twice in the actual runtime environment
construction at `app/trash-dash-game.tsx:722-726` leaves the V2, Brutus, and
Level 2 definition matrix green (**23/23** in the isolated mutation probe).
Move environment materialization to an importable runtime owner used by the
game and exercise the real lifecycle transitions, including one stable ID and
one instance after each transition.

## Confirmed evidence

- Clean required focused matrix: **44/44 PASS**. It does not invalidate C1 or
  C2 because it explicitly requires the aliased residuals and uses synthetic
  contract fixtures.
- Clean production build/default suite: **232/232 PASS**; the default script
  omits Task 1's new tests.
- Clean `npm run validate:skills`: **FAIL**, missing script.
- `git diff --check b81f4a5..24e3a02`: PASS.
- Exact clean atlas rebuild is self-contained and byte-deterministic. The
  reported prop atlas and contact-sheet SHA-256 hashes reproduce exactly.
- Brutus phase three still uses the existing 420 px/s charge and its focused
  movement assertion passes.
- Literal shipped `app`/`scripts` search has no `sprinkler` token, but that is
  insufficient because C1 preserves the behavior/art contracts by alias.

No implementation files were modified by this review.
