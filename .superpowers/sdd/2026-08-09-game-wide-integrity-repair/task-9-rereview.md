# Task 9 re-review — music integration fix round 1

**Verdict: FAIL**

Reviewed fix commit `3c9e752` against prior review commit `a14dc54`, the Task 9
brief and plan, the updated implementation/audio reports, and the focused
controller/runtime tests. No audio bytes, scoring metadata, or subjective audio
quality were reviewed.

## Important finding

### I1 — A second transition can orphan and stack the first pending player

The new owner correctly publishes one incoming player as `pending`, and
`replace()` correctly disposes both `current` and `pending`. However,
`owner.switch()` starts a new generation without disposing an already-pending
player. When a second switch settles before the first blocked fade step, its
`onReplacementReady` callback overwrites `pending`. The first incoming player
remains playing but is no longer reachable through `current` or `pending`; it is
disposed only after its old injected wait eventually resolves.

Deterministic reproduction with the first nonzero fade blocked and a second
zero-fade switch completed:

```text
before release:
  owner.current = /boss-b
  stale /boss-a paused = false
  winner /boss-b paused = false
  active = [/boss-a, /boss-b]

after release:
  owner.current = /boss-b
  stale /boss-a paused = true
  active = [/boss-b]
```

This still violates Task 9's no-concurrent-playback/no-stacked-player
requirement and the fix report's claim that the owner cancels stale generations.
Dispose or otherwise retain ownership of the prior `pending` player immediately
when a newer `switch()` invalidates it, and add a controlled overlapping-switch
test that asserts only the winner is active before the stale wait is released.

## Verified fixes

- Original I1 is fixed for the runtime's browser-absolute versus base-path
  root-relative identity: an equivalent request reuses the existing player,
  while the distinct boss URL creates a replacement.
- Original I2 is fixed for pause/mute during a nonzero fade: both `current` and
  `pending` receive lifecycle state, the settled incoming player remains paused
  and muted, and resume reaches it.
- `replace()` invalidates a blocked transition, disposes the stale pending
  player, restarts one replacement, and does not leak a rejected `play()`
  promise.
- Runtime music creation, pause, resume, mute, switch, restart, and teardown now
  delegate to the centralized owner.
- No audio files or rescore metadata changed in the fix range.

## Clean verification

An archive of exact commit `3c9e752` was built with the workspace dependency
tree mounted read-only for resolution:

- `npm run build`: PASS
- `node --test tests/music-controller.test.mjs tests/rendered-html.test.mjs`:
  **16/16 PASS**
- `git diff --check a14dc54..3c9e752`: PASS

The focused suite does not cover the overlapping `owner.switch()` race above,
so its green result does not clear the remaining Important finding.
