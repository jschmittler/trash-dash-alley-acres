# Task 4 Report: Brutus Arena Lifecycle and Post-Boss Composition

Status: DONE

## Skills applied

- Rendering / Asset Integrity
- Environment Placement / Z-Order
- Overlap Prevention / Spatial QA
- Visual QA
- In-app Browser control for the required running-game inspection

The canonical skill registry, all four skill files, and their routed references
were read before implementation. No source artwork changed.

## RED evidence

The initial focused run was:

```text
node --test tests/level-two-boss-lifecycle.test.mjs tests/brutus-boss.test.mjs tests/boss-arena.test.mjs tests/dumpster-render-state.test.mjs tests/world-placement.test.mjs
12 passed, 7 failed
```

Failures covered the incomplete lifecycle event set, absent actual runtime
death/defeat/exit wiring, missing world-authored victory dumpster, absent
visible/collision footprint helpers, and the missing Brutus reveal timestamp.

## Root cause and repair

`transitionLevelTwoEnvironment` rematerialized every environment object on each
transition. The runtime therefore preserved a hydrant string ID but discarded
the actual world object identity. It now materializes one deeply frozen record
set per world and carries the same record array and hydrant object through
death, checkpoint recovery, both phase changes, defeat, and exit. Retry and
re-entry create new worlds with exactly one immutable canonical
`brutus-hydrant`. Mutation checks exercise these actual owners and reject both
membership append and ID mutation.

The Level 2 dumpster previously derived its world position from the locked
arena camera:

```text
5650 + 960 - 36 - 180 = x6394
```

That overlapped the right canonical crate at x6414..6526. Level 2 now authors
the dumpster's visible left edge at x7000 on `victory-street`. Its entire glow
and conservative collision envelope sit beyond the victory-trigger player
route, while the right crate remains inside the arena and outside that route.

The shipped atlas was measured across all eight cells. Its complete sealed/body
and holy/glow union is `{ x: 13, y: 8, w: 166, h: 176 }` inside each 192px cell.
One scale of 0.75 applies to both source axes and every state:

```text
cell destination: 144x144
full alpha/glow footprint: 124.5x132
scaleX: 0.75
scaleY: 0.75
```

The draw rectangle compensates for transparent source padding so the visible
alpha bottom, not the cell bottom, meets ground y468. The sealed and holy rows
share this rectangle without a size pop. No renderer-specific or state-specific
scale exception was added.

The Brutus defeat gate and full exit requirement remain unchanged. The real
defeat completion path now records `dumpsterRevealStartedAt = world.elapsed`, so
the existing 0.8-second smoothstep sealed-to-holy reveal runs at the intended
time instead of appearing immediately.

## Spatial acceptance

- Right crate visual/collision: x6414..6526, y383..468.
- Dumpster full visible/glow/collision: x7000..7124.5, y336..468.
- Post-boss player route: x6600..6938, y410..468.
- Crate-to-dumpster clearance: 474px.
- Player-route-to-dumpster clearance: 62px (minimum asserted: 16px).
- Player-route-to-crate clearance: 74px.

Mutation tests fail when the dumpster is moved onto the right crate or into the
player route. The measured atlas-union test fails if any sealed or holy alpha
pixel leaves the declared canonical bounds.

## Running-game Visual QA

Development server: `http://localhost:3001/`.

Routes:

- `/?level=2&bossTest=brutus&debugVisuals=1`
- `/?level=2&victoryTest=level2&debugVisuals=1`

The Brutus fixture was reloaded and entered through title/character selection
three times. Each rendered exactly one hydrant, two separate canonical crates,
an open center lane, and a grounded Brutus. The victory fixture rendered the
holy dumpster at the far right, at one stable size and ground anchor, separated
widely from the remaining crate and outside the player path. Browser warning
and error logs were empty.

One keyboard `R` retry was also exercised. Production restart intentionally
passes an explicit level ID and therefore does not preserve development fixture
query activation; it restarted at the Level 2 beginning. The repeated locked-
arena evidence is consequently three clean fixture re-entries rather than
three in-place debug-route restarts.

Controller-driven death, checkpoint recovery, boss defeat, exit, and campaign
re-entry were not played as one uninterrupted sequence here and remain **CANNOT
VERIFY** visually. Their exact runtime owners are covered by the lifecycle
suite, and full continuous-play evidence remains assigned to Task 6.

## Verification

- Focused lifecycle/composition/render/placement matrix: 77/77 PASS.
- `npm run validate:skills`: PASS.
- Production build: PASS.
- Exact staged production build and default suite: 310/310 PASS.
- `npm run lint`: 0 errors; one pre-existing `no-img-element` warning.
- `git diff --check`: PASS.
- In-app browser warnings/errors: none.

## Worktree and concerns

Unrelated dirty work was preserved, including the existing campsite crate and
formatting hunks in `app/trash-dash-game.tsx`, the rendered-HTML test changes,
and all unrelated untracked files. Only Task 4 paths/hunks are staged.

No implementation blocker remains. The only limitation is the continuous-play
Visual QA item explicitly deferred to Task 6 above.

## Fix Round 1 — canonical identity and complete footprint contract

Review correctly identified that the first pass preserved hydrant identity only
inside one world runtime. The fresh-entry, retry, and re-entry constructors each
still materialized a different object. A new RED assertion compared the objects
with strict reference equality and failed. The Level 2 environment owner now
exports one frozen `LEVEL_TWO_HYDRANT_ENVIRONMENT_RECORD` and inserts that exact
reference into every runtime constructor. The same reference continues through
death, checkpoint recovery, both phase changes, defeat, and exit. Count remains
one and the stable ID remains `brutus-hydrant`; append and ID mutations still
throw against the actual runtime-owned arrays and record.

The post-boss validator formerly selected only the right crate. It now evaluates
the complete authored visual rectangle and canonical decorative collision
rectangle for both `brutus-platform-left` and `brutus-platform-right`, plus the
dumpster's full holy-glow/visible and collision rectangles and the complete
player route. Same-owner visual/collision representations are identified as one
object while every cross-owner intersection remains illegal. Independent left-
crate and right-crate overlap mutants fail, as does a dumpster moved into the
explicit active-arena forbidden rectangle.

The dumpster contract now uses one visible-left/bottom convention throughout:

```text
authored/runtime anchor: visible left x, visible bottom y
inventory local footprint: { x: 0, y: -132, w: 124.5, h: 132 }
reference world height: 132
renderer-only cell destination: 144x144
uniform source-axis scale: 0.75
```

`dumpsterPlacementFootprint` is the shared placement owner used by runtime draw
offsets, collision, boss validation, and inventory local bounds. Transparent
192px-cell padding remains solely a renderer concern. Sealed/holy destination
size, defeat gating, and the 0.8-second reveal timing are unchanged.

RED evidence was 21 passes and 3 expected failures: constructor reference
identity, left-crate mutation coverage, and the truthful inventory visible size.
After the repair, the focused review assertions pass 24/24 and the complete Task
4 matrix passes 77/77. The exact staged production build and default suite pass
310/310; staged lint completes with zero errors and the existing
`no-img-element` warning only. `git diff --cached --check` passes.
