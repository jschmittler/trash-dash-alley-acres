# Task 8 review — responsive acceptance

Verdict: **FAIL**

Reviewed range: `d6f0216..36df516`

## Critical findings

None.

## Important findings

### I1 — Four committed 844×390 screenshots are stale pre-fix evidence

The implementation and current runtime do preserve a 16:9 stage, but four files
committed as Task 8 after-evidence visibly retain the reproduced stretched
layout:

- `task8-level1-landscape-844x390.png`
- `task8-boss1-landscape-844x390.png`
- `task8-brutus-landscape-844x390.png`
- `task8-victory2-landscape-844x390.png`

In each image, the bordered stage spans approximately x=14..831 and y=89..367,
or about 817×278 (2.94:1). That is the exact broken geometry documented under
VIS-009. By contrast, `task8-level2-landscape-844x390.png` shows the corrected
centered 494×278 stage. The Task 8 report calls all named images representative
post-fix static evidence, and `docs/visual-audit.md` directs readers to the
whole `task8-*` set as fresh verification. The evidence set therefore
contradicts both the implemented fix and the audit closure.

Required repair: recapture the four named routes after the final CSS change at
844×390, confirm each stage/canvas pair measures about 494.219×277.992 with no
overflow, replace the stale files, and keep the report/audit claim scoped to
the genuinely post-fix captures. This is an evidence repair; no responsive
runtime code change is required by this finding.

## Verified implementation behavior

- Exact clean archive of `36df516` builds and passes `npm test`: **224/224**.
- Clean focused responsive/route matrix after build: **24/24**.
- Current live Level 1 at 844×390: stage and canvas
  **494.21875×277.9921875**, ratio **1.777815**, page scroll **844×390**.
- Current live Level 2 at 844×390: same stage/canvas dimensions and ratio,
  page scroll **844×390**, browser warning/error log **[]**.
- Current live Level 2 at 1024×640: stage and canvas
  **938.6640625×527.9921875**, ratio **1.777799**, page scroll **1024×640**.
- The base CSS derives width from available `svh`/`dvh`, keeps `height: auto`,
  and retains `aspect-ratio: 16 / 9`; gameplay geometry is unchanged.
- Both levels use the same cabinet/stage/canvas shell. The touch deck includes
  left, right, dash, action, and jump, with safe-area variables and 48px minimum
  targets in the existing responsive rules.
- `changeScreen` centrally clears held and newly pressed inputs. Blur, hidden
  visibility, orientation changes, fullscreen exit, explicit fullscreen exit,
  restart, and route/screen changes reach the same clearing behavior.
- Fullscreen orientation-lock rejection is caught and cannot prevent a
  successful fullscreen result.
- Real coarse-pointer multitouch, physical safe-area cutouts, native rotation,
  background/restore, and phone fullscreen remain accurately labeled
  **CANNOT VERIFY** with a concrete manual-device checklist.
- The exact commit is self-contained relative to `d6f0216`; unrelated dirty
  worktree files are not required by the clean archive.

## Review conclusion

The responsive and input-lifecycle implementation is acceptable. Task 8 cannot
receive PASS until its committed visual evidence is made consistent with the
post-fix runtime and the audit's evidence claims.
