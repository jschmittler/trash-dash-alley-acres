# Task 9 re-review 3 — stale music-volume ownership

**Verdict: PASS**

Reviewed fix commit `9bc082d` from prior review commit `3203d98`, limited to
the stale-volume ownership race and regression coverage requested for Task 9.
No audio bytes, score selection, mix quality, or unrelated gameplay behavior
were reviewed.

## Race verification

- Two nonzero fades can be blocked independently after publishing distinct
  pending players.
- Starting the winning fade synchronously disposes the stale incoming player
  and transfers `pending` ownership without stacking playback.
- Releasing only the stale fade cannot change the winner-owned outgoing
  volume, `current`, `pending`, pause state, or mute state.
- Releasing the winning fade completes its remaining steps, promotes the
  winner, clears `pending`, and disposes the outgoing player.
- A direct `switchGameMusic()` cancellation still restores the outgoing player
  to `MUSIC_VOLUME` when that standalone transition owns its cleanup.

The implementation routes cancellation restoration through `onCancelled`.
Direct callers retain the safe restoring default. The owner wrapper permits
restoration and user cancellation callbacks only when both the transition
generation and outgoing-player identity still match current ownership. A stale
continuation therefore disposes only its own incoming player and cannot mutate
state owned by the newer transition.

## Regression verification

The focused suite remains green for canonical browser URL reuse, published
pending-player lifecycle, pause/mute propagation, replacement and restart
cancellation, rejected playback containment, sequential disposal, and the
no-stacked-player invariant. The runtime still resolves exploration and boss
roles through the canonical track table.

## Clean evidence

Built an archive of exact commit `9bc082d` with the workspace dependency tree
mounted only for module resolution:

- `npm run build`: PASS
- `node --test tests/music-controller.test.mjs tests/rendered-html.test.mjs`:
  **18/18 PASS**
- Deterministic direct-controller cancellation probe: PASS; the owned outgoing
  volume returned from `MUSIC_VOLUME * 11 / 12` to `MUSIC_VOLUME` without
  disposing or pausing that outgoing player.
- `git diff --check 3203d98..9bc082d`: PASS

No Critical or Important findings remain in the requested Task 9 scope.
