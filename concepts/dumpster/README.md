# Dumpster holy-grail source art

This folder contains the approved, project-bound source rows for the redesigned
boss-goal dumpster. The prop is a strict side-on 16-bit sprite: one silhouette,
one wheel/contact baseline, and two lighting states.

## Source rows

- `source/dumpster-sealed-key.png`: four-panel chroma-key row for the pre-boss
  state. The dumpster is dark, sealed, and motionless.
- `source/dumpster-holy-key.png`: four-panel chroma-key row for the post-boss
  state. The body geometry is locked to the sealed row while a warm gold aura
  and sparse pixel sparkles vary from frame to frame.
- `dumpster-source-contact-sheet.png`: stacked review sheet (sealed on top,
  holy below) used to check silhouette and baseline consistency.

Both source rows are `1774×887` PNGs with a uniform `#00ff00` background. The
asset pipeline keys that background, trims each panel, and places the result in
transparent `192×192` atlas cells with the contact point at pixel `183`.

## Acceptance notes

- Strict side profile; no three-quarter or diagonal camera angle.
- Body, lid, trash load, wheels, width, height, and contact point stay aligned
  between all eight frames.
- Sealed state is dark and static; holy state changes only brightness/effects.
- Hard pixel clusters, dark navy contour, three-tone cel shading, and no
  anti-aliasing or gradients.
- No scenery, floor plane, cast shadow, text, labels, logos, or extra props.

Run `node concepts/dumpster/build-sheets.mjs` followed by
`python3 concepts/dumpster/build-atlas.py` to rebuild both the review atlas in
this folder and the canonical runtime copy at
`public/assets/generated/dumpster-holy-atlas.png`.
