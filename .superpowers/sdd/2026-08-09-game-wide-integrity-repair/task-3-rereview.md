# Task 3 Fix Round 1 — independent re-review

## Verdict: FAIL

Reviewed `2cf4840..939c6fd` against the Task 3 brief, Task 3 report, the
original Task 3 review, and the supplied scoped diff.  The original terminal
pit implementation defect is repaired in the runtime hunk, and land/defeat/
victory now have distinct Jimothy source strips.  The reachable `large_glide`
row nevertheless fails the required Jimothy identity contract, and the new
tests do not prove the runtime pit reachability/timing chain.

## Critical

None.

## Important

### I1 — FAIL: the new `large_glide` source is still not Jimothy

`JIMOTHY_SOURCE_STATE_IDENTITY` maps `large_glide` directly to the new
`source/jimothy-large-glide-source.png` row
(`concepts/jimothy/jimothy-animation.mjs:53-60`), and the builder consumes
that mapping rather than the legacy jump row
(`concepts/jimothy/build-atlas.mjs:116-136`). This resolves the original
*state-name* fallback and the source has the intended game canopy.

However, native-resolution visual inspection of all four added rows and the
final 1152x4224 contact sheet shows that the glide rider is a different
raccoon design: long ringed tail, orange/blue outfit, longer neck, and a
different slimmer body. It is visibly not Jimothy's squat rounded-back,
short-neck, bob-tail silhouette used by the land, defeat, victory, and normal
Jimothy rows. The incorrect rider survives unchanged in contact-sheet row 19,
the reachable `large_glide` row. This is exactly the prohibited incompatible
character fallback, even though the manifest labels it `glide` and the canopy
itself is correct.

The source-identity test only asserts a manifest label, pathname, frame count,
and alpha channel (`tests/jimothy-player-atlas.test.mjs:62-87`). It cannot
detect the visible character substitution, so it passes despite this failure.

### I2 — INCOMPLETE TEST EVIDENCE: pit runtime behavior is correct by trace,
but static tests do not prove its reachability/timing

The implementation repairs the original bypass: the fall threshold calls
`handlePitFall` (`app/trash-dash-game.tsx:1851-1854`); terminal falls consume
one paw, clear hurt/shrink/attack/glider/pending-damage state, select the
current character's `small_defeat`, and retain a local duration before screen
change (`app/trash-dash-game.tsx:1449-1477`). `endSequence` is then prioritized
to `small_defeat` by the selector (`app/trash-dash-game.tsx:1904-1920`) and
`endTimer` reaches `changeScreen("gameover")` only afterward
(`app/trash-dash-game.tsx:1757-1765`). Non-terminal falls still take the
existing `respawn` branch. The changed runtime surface is confined to the
import and this pit-presentation hunk.

But `tests/gameplay-animation-state.test.mjs:106-127` only proves the pure
`presentPitDefeat` helper produces `4 / 6`; it does not exercise or statically
guard the runtime threshold → `handlePitFall` → selected profile →
`endSequence`/`endTimer` → delayed gameover path. There is also no test of the
actual profile duration, selector priority during that interval, or that the
last clamped defeat frame is presented before the screen changes. The brief
requires static tests to prove reachability and timing, so the helper-only
coverage is insufficient even though source review finds the runtime logic
sound.

## Minor

None.

## Passing evidence

- The new land, defeat, and victory source strips are visually distinct and
  retain Jimothy's gray, rounded-back, bob-tail character design. They contain
  no clipping or cross-frame fragments in the generated sheet.
- The new source rows are alpha-bearing and the builder uses uniform,
  nearest-neighbor scaling with a fixed baseline; no axis distortion is
  introduced (`concepts/jimothy/build-atlas.mjs:97-113`). Native inspection
  found clean pixel edges and no chroma-key remnants. The small number of
  bright green opaque pixels is canopy foliage, not a key fringe.
- All native files were inspected: land 2045x769, defeat 2172x724, victory
  1774x887, large glide 2172x724, and final contact sheet 1152x4224.
- The focused static matrix passed: `node --test
  tests/jimothy-player-atlas.test.mjs tests/gameplay-animation-state.test.mjs
  tests/player-animation.test.mjs tests/playable-character.test.mjs
  tests/character-gameplay.test.mjs` — 26 passed, 0 failed.
- `git diff --check 2cf4840 939c6fd` passed. The reviewed diff changes only
  the intended Jimothy sources/builder/atlas, pit helper/runtime hunk, focused
  tests, audit/report evidence, and generated outputs.

## Visual QA status

Browser action and both-facing verification remains `CANNOT VERIFY` in this
read-only re-review. The native source/contact-sheet inspection is sufficient
to reject the glide identity independently of browser availability.

## Required follow-up

Replace `jimothy-large-glide-source.png` with a canopy sequence that preserves
Jimothy's short/bob tail, rounded squat body, long legs, short neck, and
unclothed gray design; regenerate and inspect row 19. Add an integration-level
static regression that proves a terminal pit encounter reaches the selected
character's `small_defeat`, retains it for that profile's four-frame local
duration, then changes to gameover, while a non-terminal pit respawns and
does not queue defeat.
