# Task 7 review — Level 2 and Brutus acceptance

Verdict: **FAIL**

Reviewed range: `0aba089..ed60dae`

## Critical findings

### C1 — VIS-002 still horizontally compresses the lamp post and the canonical inventory cannot detect it

The new standalone lamp asset is 192×256, but `LAMP_POST_RENDER_METRICS`
declares a 96×208 destination (`app/level-two-props.mjs:65-70`) and the runtime
draws that entire image directly into the unequal-axis rectangle
(`app/trash-dash-game.tsx:2612-2623`). That applies scale X = 0.5 and scale Y =
0.8125. Direct alpha measurement of the committed asset gives a 111×248
opaque silhouette, so the runtime changes that silhouette from aspect 0.448 to
approximately 0.275. This contradicts the Task 7 fixed-aspect requirement and
the audit's statement that VIS-002 "preserved aspect ratio through a single
declared render policy."

The regression remains invisible because the new lamp asset is absent from
`IMPLEMENTED_VISUAL_INVENTORY` and from every record list in
`RUNTIME_DRAW_FAMILY_MANIFEST` (`app/visual-inventory.mjs:440-462`). The lamp
test only asserts the chosen 96×208 constants and source-token presence
(`tests/level-two-props.test.mjs:159-169,303-310`); the uniform-scale test at
lines 313-331 omits the lamp entirely. Consequently, the task's claimed
inventory closure and its claimed aspect-ratio verification are both false for
this newly shipped sprite.

Required repair: either rebuild/crop the runtime lamp asset so its declared
native cell has the same aspect as its intended 96×208 destination, or derive a
single uniform destination scale from the current source and update its world
placement/emitter accordingly. Add a canonical inventory record and draw-family
binding, then make the fixed-aspect test compare the actual lamp source crop to
the actual runtime destination rather than asserting hand-picked dimensions.

## Important findings

### I1 — Water effects claim emitter origins but retain ground-contact geometry

`legacyPropRecord` labels records with `effectOrigin` as using a "named emitter
origin," but then always spreads `grounded(...)` into the visual contract
(`app/visual-inventory.mjs:340-361`). Thus the new `sprinkler-water` and
`hydrant-water` records (`app/visual-inventory.mjs:366-368`) are exported with
`anchorPolicy: GROUND_CONTACT`, `allowedZones: ["walkable-surface"]`, and
ground-relative visual bounds of `{-66,-132,132,132}` and
`{-72,-144,144,144}`.

Those are not the runtime relationships. `sprinklerWaterDrawRect` is anchored
at the nozzle with right-facing bounds `{-4,-66,132,132}` and the mirrored
equivalent; `hydrantWaterDrawRect` uses `{-4,-72,144,144}` and its mirror. The
rendered composition is visually attached, but the authoritative contracts are
not truthful and cannot validate effect placement independently from the body,
as Task 7 requires.

Required repair: give effect records emitter-relative free-anchor geometry,
effect-appropriate allowed/forbidden zones, and mirrored bounds derived from
the same render helpers used by runtime. Add assertions for contract anchor
policy and exact origin-relative bounds, not only aspect ratio and presence of
an `effectOrigin` property.

## Verification performed

- Clean archive created from `ed60dae`; no dirty-worktree files were available.
- Focused Level 2/Brutus, placement, arena, inventory, and asset-integrity
  matrix: **144/144 PASS**.
- Production build: PASS.
- Lint: PASS with zero errors and the one reported pre-existing `<img>` warning.
- Rebuilt Level 2 props, lamp, enemy atlas, and all three contact sheets in the
  clean archive. Before/after SHA-256 hashes were identical to the task report.
- Inspected the prop, lamp, and enemy contact sheets plus interaction, moth, and
  Brutus runtime screenshots. Apart from the measured lamp compression above,
  the checked static captures show clean hard alpha, grounded bodies, coherent
  platform/collider registration, and no obvious duplicated body/effect cells.
- Dynamic traversal/action/facing/feel remains correctly reported **CANNOT
  VERIFY**; no visual PASS was inferred from static routes.

