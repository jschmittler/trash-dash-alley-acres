# Playable Character Presentation Scale Design

## Scope

Increase the rendered presentation size of both playable characters—Trashy and Jimothy—in their small and large forms by a uniform factor of 1.5, without changing movement, collision, or attack behavior.

## Current rendering path

- `app/player-animation.mjs` declares canonical destination sizes for every Trashy animation: 84×84 for small and 110×110 for large.
- Jimothy inherits the same form dimensions through its animation manifest and the shared `playerAnimationDrawRect` bottom-center anchor.
- `app/playable-character.mjs` mirrors those draw dimensions in both profiles. Physics dimensions and hitboxes are independent and remain unchanged.

## Options considered

1. **Approved: scale all canonical presentation destinations.** Set small to 126×126 and large to 165×165 in every animation and profile; preserve the existing bottom-center anchor and collision sizes.
2. Scale only the currently selected character. This would create inconsistent character choice presentation.
3. Scale the collision boxes alongside sprites. This would alter platforming, reach, enemy contact, and encounter difficulty.

## Approved behavior

- Trashy and Jimothy small form: 126×126 runtime destination for every state.
- Trashy and Jimothy large form: 165×165 runtime destination for every state.
- Source frames, animation timing, state selection, attack timing, anchors, collision boxes, physics dimensions, and camera logic remain unchanged.
- The shared bottom-center render anchor keeps feet grounded through idle, locomotion, jumping, attack, damage, transformation, glide, and victory states.

## Verification

- Add focused assertions covering both profiles, both forms, and all reachable animation states at 126×126/165×165.
- Verify collision data remains unchanged.
- Run focused non-UI tests and a production build.
- Wait for the user’s manual local test before running any automated browser/UI checks; then inspect both characters and forms in the running game and update `docs/visual-audit.md`.
