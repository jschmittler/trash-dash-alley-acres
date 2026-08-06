# Design: Dumpster holy-grail redesign

## Goal

Replace the current dumpster runtime art with a polished, grounded, side-on 16-bit prop that matches the hero and enemy sprite language. Before the boss is defeated it is dark, motionless, and ominous. After the boss is defeated the same silhouette becomes a bright, celebratory holy-grail destination with a restrained glow and sparkle animation.

## Visual direction

The approved direction combines the side-on alley prop silhouette with the holy-grail reveal treatment.

The dumpster must remain visually consistent with the rest of the game:

- Side-on silhouette with no three-quarter camera angle.
- Chunky 16-bit pixel clusters and dark navy contour.
- Dark olive steel body, visible lid, trash load, graffiti marks, and wheels.
- Stable footprint and contact point across every frame.
- No gradients, perspective shift, floating shadow, or scene baked into the sprite.

## Runtime states

The prop has two explicit visual states:

### Sealed state

- Used before the boss is defeated.
- Darkened, low-saturation palette.
- Fully static: one frame, no lid bob or body movement.
- Grounded to the level's platform baseline.
- Readable as an ominous destination without competing with enemies.

### Holy-grail state

- Used after the boss is defeated.
- Reuses the exact sealed-state silhouette and footprint.
- Restores full brightness and saturated accent colors.
- Adds a slow golden aura pulse.
- Adds restrained sparkle/holy-light frames around the prop.
- Keeps the dumpster body itself nearly stationary; only aura and sparkle layers animate.

The state transition changes palette and effects, not geometry. This prevents the goal from appearing to jump, float, or change camera angle when the boss ends.

## Asset pipeline

Generate a new transparent atlas from two controlled source rows:

- `dumpster-sealed.png`: one static side-on frame repeated or exported as a single canonical cell.
- `dumpster-holy.png`: four frames of aura/sparkle treatment using the same body silhouette and baseline.

The atlas uses 192×192 cells with explicit baseline metadata. The body and wheels must sit on the same baseline in every cell. The effect layer may extend upward but may not alter the body contact point.

The public runtime asset should be a dedicated generated atlas, not a mixture of older dumpster versions. The old angled source sheets and their runtime references are removed from the active path, while concept files can remain archived for reference.

## Rendering architecture

Create a focused dumpster-render module that owns:

- Sealed/holy state selection.
- Grounded destination rectangle.
- Static sealed frame selection.
- Slow holy animation timing.
- Optional aura alpha/pulse calculation.

The game renderer consumes this module and draws the prop at a single explicit baseline. It must not infer sizing from the source atlas or stretch a square cell into an arbitrary shape.

## Transition behavior

When `bossDefeated` changes from false to true:

1. Keep the dumpster body at the exact same world x, y, width, and height.
2. Crossfade from sealed palette to bright palette over a short easing interval.
3. Start the holy aura and sparkle loop after the crossfade begins.
4. Keep the game world and player physics unchanged.

If the player reloads into a victory/debug state, the holy-grail state should render immediately without replaying the transition.

## Validation

Automated tests will verify:

- Atlas dimensions and transparent cell boundaries.
- Non-empty sealed and holy frames.
- Stable body baseline and wheel contact point.
- Sealed state returns a static frame at every elapsed time.
- Holy state loops slowly and deterministically.
- Draw rectangle bottom equals the level ground baseline.
- Sealed-to-holy transition preserves geometry.
- Public runtime code references only the new dumpster atlas.

Manual browser verification will cover the boss runway before defeat, the post-boss reveal, a victory debug state, and a reload into the victory state.

## Non-goals

This pass does not redesign the level layout, boss, character sprites, or dumpster concept documentation beyond what is necessary to replace the active runtime asset.
