# Final production-boundary rereview

**Verdict: PASS**

Scope was limited to the remaining `resumeFacing` production-boundary finding
from `final-rereview.md`, against implementation commit `4c922f2`. No broad
branch review or package-wide gate was repeated.

## Finding disposition

### Terrier impact direction across the production boundary

**ADDRESSED.**

- `app/trash-dash-game.tsx:246` now owns `resumeFacing` on the production
  `Enemy` shape as `1 | -1 | null`.
- `app/trash-dash-game.tsx:2026` explicitly copies `next.resumeFacing` after
  the behavior transition. The `"resumeFacing" in next` guard preserves an
  intentional `null`, so recovery can clear the field rather than retaining a
  stale direction.
- The existing behavior helper remains coherent: wall contact records the
  opposite facing, impact preserves it through recovery, and recovery consumes
  it to emit a reversed 420px/s charge before clearing it
  (`app/level-two-enemies.mjs:156-190`). Production then derives the rendered
  facing from that reversed velocity, so the state and presentation agree.
- `tests/terrier-animation-integrity.test.mjs:218-265` now covers the actual
  production ownership and copy statement plus a runtime-equivalent boundary:
  `charge -> impact (resumeFacing=-1) -> recover -> charge (facing=-1,
  vx=-420)`. This closes the gap where the earlier pure-helper test could pass
  despite production dropping the field.
- The implementation diff adds only the optional field, the guarded copy, the
  focused regression, and its task-report note. It does not alter terrier
  source/destination geometry, collision bounds, animation cells, timing, or
  unrelated enemy behavior.

## Focused verification

- `node --test tests/terrier-animation-integrity.test.mjs tests/level-two-enemies.test.mjs`
  — 36 passed, 0 failed.
- `node --test tests/terrier-animation-integrity.test.mjs tests/level-two-enemies.test.mjs tests/level-two-runtime.test.mjs tests/level-two-fixture.test.mjs`
  — 45 passed, 0 failed.
- `git diff 4c922f2^..4c922f2 --check` — passed.
- Read-only mutation probe — removing the production copy causes the old
  boundary to retain `resumeFacing=null` instead of `-1`; the new source
  assertion detects that mutation. This demonstrates the regression is
  mutation-sensitive rather than satisfied only by helper behavior.

## Assessment

The last Important finding from the V2 final review is closed. The intended
impact lifecycle is now preserved across the real production copy boundary,
the reversed charge is reachable, and focused Level 2 structure/runtime tests
show no related regression. This narrow rereview does not revise the broader
campaign's separately documented `CANNOT VERIFY` runtime limitations.
