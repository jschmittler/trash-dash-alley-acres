# Precise Level Two Pose Extraction Design

## Goal

Replace grid-assumed enemy crops with measured source-sheet pose rectangles so squirrel and terrier animate with complete, readable state-specific silhouettes.

## Approved Pose Ownership

- Terrier upright walking poses feed locomotion; the four low running poses with dust feed charge; alert/snarl poses feed wake; stunned/down poses feed impact, hit, recovery, and defeat.
- Squirrel walking/running poses feed locomotion; four upright acorn-action poses feed anticipation, release, follow-through, and recovery; stunned/down poses feed hit and defeat.

## Extraction Contract

- Define every source rectangle independently from observed alpha bounds; never infer a fixed grid.
- Green background becomes transparent; preserve art, outlines, dust, acorns, debris, and impact effects.
- Use each family’s locomotion body bounds as its one uniform scale reference. Align body feet to the shared baseline. Throw frames may occupy more vertical envelope above the body, but their body size may not shrink.
- Preserve existing state timing, output cell ownership, collision, runtime draw size, and horizontal-flip behavior.

## Verification

- Test full silhouette, safe margin, green-free alpha, distinct terrier locomotion/charge primary shapes, squirrel throw body-size equality with locomotion, and fixed feet registration.
- Run non-UI tests and build, then wait for user manual test before browser validation.
