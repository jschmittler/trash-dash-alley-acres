# Trash Dash Existing Music Integration Confirmation

**Date:** 2026-08-09
**Scope:** Level 0 soundtrack decision; integration confirmation and two
runtime/controller repairs only. No music was generated, replaced, remixed,
mastered, rescored, or evaluated for artistic quality.

## Existing track-role truth

Only two authored music files currently ship. The runtime now owns this truth
in one immutable `GAME_MUSIC_TRACKS` table instead of embedding filenames in
separate lifecycle paths.

| Level | Role | Existing runtime URL | Relationship / gap |
| --- | --- | --- | --- |
| Level 1 | Exploration | `assets/audio/raccoon-rush-loop.m4a` | Authored exploration loop |
| Level 1 | Trash Heap Tyrant | `assets/audio/trash-heap-tyrant-loop.m4a` | Authored boss loop |
| Level 2 | Exploration | `assets/audio/raccoon-rush-loop.m4a` | Shares the Level 1 exploration track |
| Level 2 | Brutus | `assets/audio/trash-heap-tyrant-loop.m4a` | Shares the Level 1 boss track; no distinct Brutus track exists |

The shared Level 2 assignments are recorded as current implementation truth,
not an endorsement of soundtrack fit. A future full audio analysis may assess
them; this pass deliberately did not create missing music.

## Reproduced integration defects and repairs

1. A same-source switch returned immediately without applying the current mute
   state or resuming a paused element. Same-track requests now reuse the single
   element, apply mute, and safely retry `play()`.
2. The direct pre-activated Brutus route bypassed arena-entry switching and
   therefore started exploration music inside the boss arena. Initial music
   selection now derives the canonical role from the active test route. Normal
   campaign arena entry still switches through the level-specific boss role.
3. Short fades used an implicit global timer, which made lifecycle coverage
   nondeterministic. The controller now accepts an injected wait function while
   retaining the same production default and twelve-step fade.
4. Independent review found that browser `src` / `currentSrc` values normalize
   to absolute URLs while the runtime requests base-path URLs. Source identity
   is now canonicalized, so equivalent browser URLs reuse the existing player;
   a distinct canonical URL still creates a replacement.
5. Independent review also found that pause or mute during a nonzero fade only
   reached the outgoing player. A single music owner now owns current and
   pending players, propagates pause/resume/mute to both, cancels stale fades by
   generation, and prevents a cancelled incoming source from becoming current.

No audio bytes, loudness, encoding, loop points, or mix settings changed.

## Deterministic controller and runtime evidence

`tests/music-controller.test.mjs` now covers:

- immutable Level 1/Level 2 exploration and boss role resolution;
- loop, preload, fixed `0.32` volume, and no playback before creation;
- start, pause, resume, restart, and mute preservation;
- playback/autoplay rejection without an escaping rejection;
- pause, source removal, load, and disposal;
- zero-duration and deterministic short fades;
- same-track reuse without creating another player or listener;
- browser-shaped absolute URL reuse plus a distinct-URL mutation case;
- pause and mute during an injected nonzero fade, including state after the
  incoming player settles and resumes;
- cancellation of an in-flight fade during restart, with the stale source
  disposed and only the replacement active;
- rejected replacement cleanup while the current player remains alive;
- repeated exploration/boss switching with every predecessor disposed and
  exactly one final player left active; and
- source-level runtime use of the canonical role resolver for initial and
  arena-entry music.

Focused controller and rendered-shell matrix: **17/17 PASS**; Pages artifact
verification: **1/1 PASS**. The shared full package suite: **293/293 PASS**.
Skill validation, production
build, and lint also pass; lint retains one unrelated `no-img-element` warning.

## Running-browser evidence

The local game was exercised at `http://localhost:3000/` after explicit user
gestures. Browser-observed resource inventory and visible game state showed:

- standard Level 1 start requested
  `http://localhost:3000/assets/audio/raccoon-rush-loop.m4a`;
- pausing stopped game time, mute changed to the visible **Sound** state,
  explicit resume advanced game time again, and unmute remained functional;
- `?bossTest=arena&audioQa=task9` observed both the exploration and
  `trash-heap-tyrant-loop.m4a` boss resources after arena entry;
- after the repair, `?bossTest=brutus&audioQa=task9` observed only the
  canonical boss resource on its pre-activated arena start;
- restarting the Brutus fixture returned to an active run at `0:01`; and
- every sampled route/state returned an empty warning/error console log.

The controller surface cannot inspect the detached `new Audio()` element's
private playback state, and this pass did not perform a subjective listening
session. Audible output, seamless-loop clicks/tails, loudness balance against
SFX, exact pause position, concurrent acoustic output, and a forced live
autoplay rejection are therefore **CANNOT VERIFY** from browser observation.
Deterministic fake-audio coverage proves the corresponding controller state
and cleanup behavior but is not promoted to an audible-quality PASS.

The independent-review repairs were therefore rechecked deterministically with
a browser-shaped fake rather than promoted to a new live-listening claim. No
timer or browser observation was allowed to block the pass.

## Known gaps and deferred work

- Level 2 has no distinct exploration or Brutus score.
- No soundtrack bible/manifest version was changed because this is a Level 0
  no-rescore confirmation.
- Subjective music fit, album continuity, loop editing, loudness, spectral
  balance, and SFX masking belong to the separately deferred full audio pass.
- Real-device mobile audio interruptions and browser background/restore remain
  outside this desktop-browser confirmation.
