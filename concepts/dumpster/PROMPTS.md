# Dumpster holy-grail generation prompts

These are the exact built-in image-generation prompts used for the approved
source rows. A flat chroma-key background is intentional: the pipeline removes
`#00ff00` locally and preserves a clean alpha channel.

## Shared acceptance checklist

- Use a strict side-on silhouette; never a three-quarter view or perspective
  shift.
- Render four evenly spaced panels on a single `1774×887` row.
- Keep body width/height, lid angle, trash load, wheels, and ground contact
  identical in every panel and across both rows.
- Use a dark navy outline, chunky 16-bit pixel clusters, limited palette,
  three-tone cel shading, hard stepped edges, and no anti-aliasing.
- Leave generous chroma-key margin around every panel. Do not touch the cell
  edges or add a floor plane, contact shadow, scenery, text, or labels.

## Sealed source row

> Create a polished 16-bit horizontal four-frame sprite sheet for a side-on
> dumpster goal prop in a browser platformer. Show one compact old steel
> dumpster in strict side profile, facing right, with a closed lid, two visible
> caster wheels, tightly packed trash just below the lid, dents, rust, grime,
> and non-legible graffiti marks. Use a dark pre-boss palette of deep olive,
> charcoal, muted rust, and dark navy outlines. Render exactly four evenly
> spaced panels on a perfectly flat uniform `#00ff00` chroma-key background.
> Lock the camera, silhouette, scale, lid, trash, wheel positions, and contact
> baseline. Only tiny lid-settle or trash-bag-wobble differences are allowed;
> the prop must read as dark and motionless. Use hard pixel edges, no gradients,
> no perspective, no scenery, no shadow, no text, no logos, and no extra props.

## Holy-grail source row

> Transform the supplied sealed four-frame side-on dumpster row into the
> post-boss holy-grail reveal row. Preserve the exact body geometry, side
> profile, scale, lid, trash load, wheels, and contact baseline. Change only the
> lighting and effects: restore brighter olive and warm highlights, add a
> restrained golden aura, and add sparse pale-yellow pixel sparkles that vary
> gently per frame. Render exactly four evenly spaced panels on a perfectly flat
> uniform `#00ff00` chroma-key background. Keep the body grounded and motionless;
> the aura may extend upward but must not move or deform the body. Use crisp
> 16-bit pixel clusters, hard stepped edges, no gradients or anti-aliasing, no
> perspective, no scenery, no shadow, no text, no logos, and no extra props.

## Negative constraints

Do not output alternate camera angles, floating bodies, changed wheel/contact
positions, duplicate dumpsters, frame borders, labels, captions, UI, scenery,
floor planes, cast shadows, smoke, blur, painterly texture, smooth vector
curves, or any background color other than the exact flat `#00ff00` key. Never
use `#00ff00` in the dumpster or aura itself.
