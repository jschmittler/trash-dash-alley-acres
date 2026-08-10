# Task 9 independent review — music integration

**Verdict: FAIL**

Reviewed implementation commit `4458bbc` against base `9584ebe`, the Task 9
brief and plan, the canonical Conductor skill, the audio confirmation report,
the visual audit entry, and the Task 9 implementation report. No audio asset
bytes or scoring metadata changed.

## Important findings

### I1 — Same-track reuse does not work with a real browser `Audio` element

`switchGameMusic()` compares the requested path directly with
`current.currentSrc` / `current.src`. Browsers expose those properties as
absolute normalized URLs, while the runtime passes the base-path URL returned
by `assetUrl()` (for example `/assets/...` or
`/trash-dash-alley-acres/assets/...`). The production comparison therefore
misses even when both values identify the same resource, creates a replacement
player, and fades/disposes the existing player. The test double masks the
defect by adding a non-browser `source` property that exactly matches the
request.

Deterministic reproduction with a browser-like URL-normalizing fake:

```text
{"reused":false,"instances":2,"currentPaused":true,"nextPaused":false}
```

This violates the required same-track handling and the report's claim that a
same-source request reuses one element. Compare normalized URLs (or retain an
explicit canonical source identity on created players) and test the behavior
with browser-shaped `src` / `currentSrc` values rather than relying on the
custom `source` field.

### I2 — Pausing during a boss fade does not pause the incoming track

The incoming element begins playback before the fade, but `musicRef.current`
continues to reference the outgoing element until the entire asynchronous
switch resolves. If the user pauses during that interval,
`changeScreen("paused")` pauses only the outgoing element. The incoming element
keeps playing throughout the paused state and is assigned to `musicRef` after
the fade without consulting the current screen state.

Controlled-fade reproduction:

```text
during pause [ true, false ]
after switch completion { current: true, next: false }
```

This violates the required pause/resume lifecycle confirmation. Add an
in-flight switch test and make pause ownership include the pending player (or
pause the resolved replacement when the runtime is no longer playing) before
claiming pause/resume correctness.

## Verified requirements

- The committed role table is recursively frozen for the two supported level
  entries and truthfully maps both Level 2 roles to the existing shared files.
  It explicitly documents that no distinct Brutus track exists.
- Level 1/Level 2 exploration and boss roles resolve through the canonical
  table; pre-activated Brutus selects the boss role initially.
- Creation sets loop, preload, and fixed `0.32` volume.
- Zero/short fade injection, prior-source disposal, rejected replacement
  cleanup, and repeated sequential switch cleanup are covered by deterministic
  tests.
- Reports correctly avoid rescoring, asset-quality, listening, seamless-loop,
  loudness, and SFX-balance claims and mark unsupported live observations
  `CANNOT VERIFY`.
- The exact implementation commit contains both authored audio files and does
  not depend on unstaged source files for the reviewed focused behavior.

## Clean verification

An archive of exact commit `4458bbc` was built with the workspace dependency
tree mounted read-only for resolution:

- `npm run build`: PASS
- `node --test tests/music-controller.test.mjs tests/rendered-html.test.mjs`:
  **13/13 PASS**
- `git diff --check 9584ebe..4458bbc`: PASS

The passing suite does not cover I1's browser URL normalization or I2's
in-flight pause race, so these Important findings prevent acceptance.
