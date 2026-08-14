# Pit Recovery, Enemy Scale, and Touch Device Design

## Scope

This change fixes three independent runtime defects in Trash Dash:

1. Falling into a gap must resolve visibly rather than leaving the player offscreen during the terminal-life delay.
2. Fox, squirrel, and terrier sprites must be at least 1.5× their existing runtime size, preserve aspect ratio, and retain their current collision geometry.
3. The touch deck must only render for coarse-pointer, no-hover touch devices, never merely because a desktop browser window is narrow.

## Root causes

- Terminal pit falls set an offscreen player to a timed game-over sequence, so no visible death or transition occurs during the delay.
- Fox configuration declares an 82×72 size but the draw path destructures only its second dimension and draws 72×72. Squirrel and terrier draw through Level 2 geometry at 76×76 and 82×82 respectively.
- The `@media (max-width: 760px)` rule sets `.touch-controls` to `display: flex`; it is broader than the later touch-capability query and affects narrow desktop windows.

## Approved behavior

### Pit recovery

- A non-terminal pit fall continues to consume one paw and respawn at the active checkpoint.
- A terminal pit fall immediately moves into the game-over flow instead of maintaining an offscreen defeat wait. The player is no longer left below the visible stage.

### Enemy presentation

- Fox, squirrel, and terrier use one uniform 1.5× scale factor applied to both runtime destination axes.
- The resulting canonical destinations are fox 108×108, squirrel 114×114, and terrier 123×123.
- Sprite source rectangles, alpha, frame selection, anchors, animation timing, collisions, patrols, and attack geometry remain unchanged.

### Touch deck eligibility

- Base and narrow-width desktop CSS keep the touch deck hidden.
- The deck becomes visible only when `hover: none` and `pointer: coarse` are both true. Existing portrait and landscape positioning rules remain intact.

## Verification

- Add focused automated tests for immediate terminal pit resolution, canonical 1.5× enemy draw geometry, and touch-media eligibility.
- Run focused non-UI tests and a production build after implementation.
- Before any automated browser/UI verification, wait for the user to perform a manual local test and explicitly report the result.
- After that approval, verify a desktop viewport has no touch deck, a touch viewport has the deck, the enlarged enemies remain uniformly scaled and grounded, and a terminal pit fall reaches Game Over without an offscreen freeze.
