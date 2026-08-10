# Task 7 re-review — Level 2 acceptance corrective package

Verdict: **PASS**

Reviewed range: `3816a0e..9ef0c5f`

## Critical finding C1 — closed

- The committed lamp source is exactly 192×256. Runtime destination geometry
  is now derived as 156×208, so both axes use the same 0.8125 scale.
- Direct alpha inspection confirms the committed source silhouette is
  `{ x: 41, y: 7, w: 111, h: 248 }`. `lampPostVisibleDrawRect` projects those
  measured bounds through the same runtime draw rectangle; its bottom remains
  within the declared two-pixel ground-contact tolerance and its center remains
  on the bottom-center ground anchor.
- `lamp-post` is now a canonical inventory record with its complete source
  rectangle, actual runtime destination, measured visible bounds, grounded
  contract, and a dedicated `level-two-lamp-post` draw-family binding.
- World-placement validation now evaluates the projected alpha-visible lamp
  bounds. The moth fixture's 12-pixel authored shift clears the adjacent
  poolside ledge while retaining legal contact with `obstacle-lawn`.
- The focused assertions compare actual helper output and source dimensions;
  they no longer encode the former independently distorted 96×208 rectangle.

## Important finding I1 — closed

- `sprinkler-water` and `hydrant-water` now use dedicated effect records rather
  than inheriting the grounded-prop contract.
- Both records declare `FREE_ANCHOR`, a named `{ x: 0, y: 0 }` emitter origin,
  and `named-emitter-envelope` as their only allowed relationship. Neither
  record claims `walkable-surface` or ground contact.
- Right- and left-facing runtime bounds are derived directly from
  `sprinklerWaterDrawRect` and `hydrantWaterDrawRect`. Their contract visual and
  placement bounds are the exact mirrored motion envelopes of those helpers.

## Verification

- Inspected the exact committed diff `3816a0e..9ef0c5f`; no unrelated runtime
  repair was used to satisfy C1 or I1.
- Rechecked the committed lamp file directly: 192×256 canvas and 111×248
  alpha-visible silhouette at source coordinate 41,7, with its last opaque row
  at y=254.
- Clean archive of `9ef0c5f`, using only installed dependencies, passed:

```text
node --test tests/level-two-props.test.mjs \
  tests/visual-inventory.test.mjs \
  tests/world-placement.test.mjs \
  tests/asset-integrity.test.mjs
```

Result: **40/40 PASS**.

- Post-fix browser appearance remains accurately marked **CANNOT VERIFY** in
  the implementation report. No static or automated evidence is promoted to a
  dynamic visual PASS.

## Remaining Critical / Important findings

None.
