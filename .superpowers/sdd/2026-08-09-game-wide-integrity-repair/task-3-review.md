# Task 3 integrity review — player normalization

## Verdict: FAIL

Reviewed target: `adedabb..482b6b3` (`fix: normalize playable character
states`, plus its idle-QA evidence). This is a fresh static, generated-art, and
focused-test review. The geometric normalization is sound, but the task does
not meet its required complete, intentional state ownership for Jimothy or its
pit-defeat presentation requirement.

## Critical

None.

## Important

### I1 — FAIL: Jimothy still borrows incompatible source rows for reachable states

`concepts/jimothy/build-atlas.mjs:36-52` explicitly builds named gameplay
states from other state rows: both `*_land` use `jump`, both `*_defeat` use
`hurt`, both `*_victory` use `idle`, and, most materially, `large_glide` uses
`jump`. `large_glide` is a live selector outcome whenever the player is large,
airborne, gliding, and descending (`app/player-animation.mjs:51-53`), with the
runtime providing that condition at `app/trash-dash-game.tsx:1891-1904`.

The generated `public/assets/generated/jimothy-hero-contact-sheet.png` confirms
the row-19 `large_glide` cells are ordinary jump poses and contain no glider.
This directly violates the Task 3 brief requirement that no animation borrow
an incompatible state row, as well as the approved plan's requirement for
intentional ordered frames for every reachable state. The current atlas tests
only prove that each declared cell is nonempty/in bounds/baseline-aligned
(`tests/jimothy-player-atlas.test.mjs:16-41`); they cannot detect this semantic
fallback.

### I2 — FAIL: the pit-defeat path bypasses the declared defeat animation

The state selector chooses `small_defeat` only for `input.defeated`
(`app/player-animation.mjs:47`), and runtime supplies that input only from
`player.endSequence === "gameover"` (`app/trash-dash-game.tsx:1891-1904`).
However, `handlePitFall` transforms the player to small and immediately calls
`changeScreen("gameover")` on its terminal outcome
(`app/trash-dash-game.tsx:1448-1465`); it never sets `endSequence`,
`animationName`, or a local defeat timer. The required pit-defeat state is
therefore not visibly exercised, despite a populated `small_defeat` atlas row.

## Minor

None.

## Passing evidence

- Both generated 1152x4224 runtime atlases have every declared frame populated,
  inset, and baseline-aligned at source row 183. The expected unused cells are
  blank only: 49 for Trashy and 44 for Jimothy, exactly matching each manifest's
  unused sixth-column capacity. No required frame is split, clipped, or blank.
- Each manifest uses a square destination rectangle (82x82 through 140x140),
  preserving the 192x192 cell transform. `offsetY` derives from baseline 184,
  and the renderer now uses only that offset (no grounded-only compensation) at
  `app/trash-dash-game.tsx:2772-2780`.
- Both profiles declare right-authored, destination-center flipping and derive
  a maximum animation envelope. The focused contract confirms local elapsed
  time resets on state change (`app/trash-dash-game.tsx:1905-1908`) and clamps
  non-looping frames (`app/player-animation.mjs:63-65`).
- Character-selection portrait paths remain unchanged and point to the correct
  Trashy/Jimothy portrait assets; the separately generated Jimothy selection
  cell remains a valid transparent 192x192 PNG.
- `VIS-005` is correctly narrowed, not falsely closed: source/destination axis
  mismatch entries are gone, the idle screenshots show both characters grounded,
  and action/both-facing routes remain explicitly `CANNOT VERIFY`. The reported
  brief Jimothy hurt/invulnerability flash is consistent with the renderer's
  intentional alpha branch at `app/trash-dash-game.tsx:2779`, not an atlas
  failure.

## Verification run

```text
node --test tests/player-animation.test.mjs tests/player-hero-atlas.test.mjs \
  tests/jimothy-player-atlas.test.mjs tests/character-gameplay.test.mjs \
  tests/visual-contract.test.mjs tests/visual-asset-integrity.test.mjs \
  tests/visual-inventory.test.mjs

40 passed, 0 failed
```

The green matrix validates geometry and inventory contracts, but it does not
cover I1's source-state compatibility or I2's pit-defeat transition. Browser
action/both-facing sequences remain `CANNOT VERIFY` as documented by the task;
no unsupported runtime-pass claim is made here.

## Required follow-up

Author distinct Jimothy land, defeat, victory, and especially glider motion
rows (or explicitly remove unsupported gameplay states), add source-state
identity/contact-sheet regressions, and route terminal pit falls through the
local `small_defeat` presentation before the game-over screen. Re-run both
characters through the affected action and facing sequences in a browser.
