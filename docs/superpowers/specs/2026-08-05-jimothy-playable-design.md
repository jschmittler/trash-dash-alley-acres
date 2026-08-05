# Design: Jimothy playable character and character selection

## Goal

Add Jimothy as a fully playable alternate raccoon while preserving the existing hero raccoon behavior. Players choose a character before a run, and the selected character remains active through normal gameplay, power-ups, damage, the boss fight, and victory.

## Scope

This feature includes:

- A reusable playable-character profile system.
- A character selection screen between the title screen and gameplay.
- A production Jimothy atlas with parity across small and large forms.
- Shared gameplay rules with character-specific rendering, dimensions, and animation manifests.
- Desktop keyboard and mobile touch support for selection and confirmation.
- Automated coverage for atlas integrity, selection state, animation routing, and gameplay regressions.

This feature does not include simultaneous multiplayer, alternating turns, character-specific statistics, or Jimothy-specific level abilities. Those can be added later without replacing the profile system.

## Character profile architecture

The game will use a `PlayableCharacter` profile as the source of truth for player presentation and dimensions. Each profile contains an id, display name, atlas source, small/large render dimensions, small/large hitboxes, and an animation manifest. The world stores the selected character id and resolves the profile through a central registry.

The physics loop remains shared. Movement acceleration, gravity, collision, damage rules, checkpoints, power-ups, boss logic, and victory logic continue to operate on the same player state. Rendering and animation selection read the active profile rather than assuming the original raccoon atlas.

## Animation parity

Jimothy's public atlas will provide these states.

Small form: idle, walk, run, jump, fall, land, hurt, skid, defeat, and victory.

Large form: idle, walk, run, jump, fall, land, paw swipe, hurt, shrink, glide, skid, and victory.

The current private Jimothy atlas remains the source for the existing idle, walk, run, jump, fall, hurt, paw-swipe, roll, forage, eat, and groom motion where it is visually suitable. Missing states will be generated or revised to match the same 192px cell grid, transparent margins, right-facing convention, and normalized foot baseline. Each animation receives explicit draw width, draw height, vertical offset, frame count, FPS, loop behavior, and attack-active frames.

Optional Jimothy-only flavor animations such as forage, eat, and groom may be used in the selection preview or future non-gameplay moments, but they are not required by the gameplay state machine.

## Character selection flow

The screen flow becomes:

1. Title screen.
2. Character selection screen.
3. Ready confirmation using the selected character's name.
4. Gameplay.

The selection screen presents one card per available profile, an animated idle preview, display name, short flavor text, selected-card focus, and a confirm action. Left/right and A/D keyboard input move focus; Enter/Space confirms. Mobile users can tap cards and a confirm button. The screen must work in portrait and landscape layouts without clipping.

Jimothy is selectable once his parity atlas and profile pass validation. Future unavailable profiles can be represented without changing the screen architecture.

## Power-ups and lifecycle

Both characters support the existing taco and glider systems. A taco changes the player from small to large using the selected profile's dimensions and large-form animations. Damage uses the selected profile's hurt and shrink states, then respawn or game-over behavior remains shared. The large-form paw-swipe is Jimothy's attack equivalent to the hero raccoon's tail swipe. The large-form glide state is used while the glider is active. Boss entry, boss damage, defeat, and victory use the selected profile's states.

## Asset quality gates

Before Jimothy is enabled in runtime:

- Every required frame must contain non-empty alpha pixels.
- No frame may touch a 192px cell edge.
- Baselines must stay within the profile's declared tolerance.
- Left/right rendering must be produced by a horizontal flip, not a second inconsistent sheet.
- Attack-active frames must be explicitly declared.
- Small and large forms must have stable hitbox-to-feet alignment.

The existing test that asserts Jimothy is absent will be replaced with public-atlas and runtime-profile assertions.

## Testing strategy

Automated tests will cover:

- Jimothy atlas dimensions, transparency, frame coverage, and baseline bounds.
- Profile registry completeness and selected-character persistence across a run reset.
- Animation routing for movement, jumping, falling, landing, attack, glide, hurt, shrink, defeat, and victory.
- Character selection keyboard, pointer, touch, and confirmation behavior.
- Existing hero raccoon animation and gameplay regression coverage.
- Responsive selection layout and rendered HTML markers.

Manual browser verification will cover a full Jimothy run: selection, movement, taco transformation, glider, damage/respawn, boss transition, boss fight, and victory at desktop and mobile viewport sizes.

## Non-goals and future extensions

This pass does not add multiplayer, per-character stats, unique Jimothy abilities, or online character data. The profile registry intentionally leaves room for those features later.
