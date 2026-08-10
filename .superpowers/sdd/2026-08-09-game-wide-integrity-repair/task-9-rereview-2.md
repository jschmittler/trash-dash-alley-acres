# Task 9 re-review 2 — music integration fix round 2

**Verdict: FAIL**

Reviewed fix commit `fd81281` from prior review commit `50e14d0`, the Task 9
brief, both updated Task 9 reports, the controller implementation, and the
focused controller/runtime tests. No audio bytes, scoring metadata, or
subjective audio quality were reviewed.

## Important finding

### I1 — A cancelled fade can still overwrite the winning fade's outgoing volume

The new `owner.switch()` preamble correctly pauses, removes, and clears an
already-published pending player synchronously. The added zero-fade overlap
test proves that the stale incoming player is no longer stacked while its old
wait is blocked.

However, the cancelled `switchGameMusic()` continuation is not fully inert.
Its cancellation branch still executes:

```js
if (current) current.volume = MUSIC_VOLUME;
```

Both overlapping switches capture the same outgoing `current`. If the winning
second switch also has a nonzero fade, releasing the stale first wait during
the winner's fade changes that shared outgoing player's volume from the
winner-controlled fade value back to full volume. Deterministic reproduction
against exact commit `fd81281`:

```text
before stale release:
  outgoing volume = 0.29333333333333333
  winning pending source = /boss-b
  stale /boss-a is already paused and removed

after stale release, while winner remains blocked in its first fade step:
  outgoing volume = 0.32
  expected unchanged = 0.29333333333333333
  winning pending source = /boss-b
```

This creates a transient volume bump and contradicts the implementation
report's claim that the stale continuation cannot alter ownership, replay, or
state. Make cancellation cleanup conditional on still owning the transition,
or move outgoing-volume restoration into the owner at invalidation so a stale
continuation cannot mutate an outgoing player now controlled by a newer fade.
Add a two-nonzero-fade controlled test that blocks both first fade steps and
asserts the outgoing volume is unchanged when only the stale wait is released.

## Verified behavior

- A newer switch synchronously disposes the previously published pending
  player before the stale injected wait resolves.
- With the new winner using a zero fade, exactly one player remains active;
  pause and mute reach that winner, and the stale incoming player cannot regain
  ownership or playback.
- Same-source canonical URL reuse and distinct-source replacement remain
  covered and pass.
- Replacement/disposal, rejected playback containment, restart cancellation,
  mute, pause, and resume coverage remain green.
- No audio assets or rescore metadata changed in the fix range.

## Clean verification

Built an archive of exact commit `fd81281` with the workspace dependency tree
mounted read-only for module resolution:

- `npm run build`: PASS
- `node --test tests/music-controller.test.mjs tests/rendered-html.test.mjs`:
  **17/17 PASS**
- `git diff --check 50e14d0..fd81281`: PASS

The committed overlap test uses a zero-fade winner, so it does not exercise the
remaining stale-volume mutation during a newer nonzero fade.
