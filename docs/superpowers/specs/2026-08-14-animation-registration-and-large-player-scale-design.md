# Animation Registration and Large Player Scale Design

## Goal

Repair the terrier’s visible locomotion, stabilize squirrel throw presentation, and reduce only powered-up Trashy and Jimothy by 20%.

## Approved Behavior

- Terrier charge/locomotion uses four distinct complete run poses from the supplied dog sheet; standing frames are limited to sleep/sit/wake/recovery only.
- Squirrel locomotion determines the canonical body scale. Throw cells retain that exact body scale and ground anchor, with transparent headroom above non-throwing cells rather than shrinking the throw body to fit.
- Small player forms remain 126×126. Every large player form, including Jimothy’s victory contract and every large animation state, becomes 132×132.
- Preserve all gameplay state selection, frame timing, physics, collision, attack timing, projectile attachment, and canvas anchor contracts.

## Verification

- Test terrier charge cells for distinct complete run silhouettes and fixed baseline.
- Test squirrel locomotion/throw primary-body width and baseline equality while allowing a taller throw envelope.
- Test player small 126 and large 132 destinations across both profiles and all reachable states; collision remains unchanged.
- Run non-UI tests and production build, then wait for the user manual test before browser/UI validation.
