# Dismiss Pocket Controls Design

## Context

During play, the `touch-deck-hint` card displays "Pocket controls" and its two-line instruction copy in the middle of the game stage. The card is currently rendered for the entire `playing` screen and obscures gameplay.

## Options considered

1. Remove the instruction card completely. This eliminates obstruction but removes first-time guidance.
2. Move the card into a persistent corner. This preserves guidance but still competes with the game HUD and touch deck.
3. Show it only as an onboarding hint, then dismiss it after player input. This keeps the guidance when it is useful and clears the playfield as soon as the player begins playing.

## Decision

Use option 3. The hint appears when a gameplay session begins and is dismissed by the player's first keyboard or touch gameplay input. The touch-control buttons remain visible and functional. Starting a new gameplay session resets the hint so that each session gets a brief, unobtrusive control reminder.

## Implementation boundaries

- `app/trash-dash-game.tsx` owns the hint visibility state and dismissal from existing input paths.
- `tests/mobile-experience.test.mjs` verifies that the hint is conditional and remains outside the touch-control deck.
- No art assets, world layout, or control mappings change.

## Acceptance criteria

- The Pocket Controls card does not remain over the game after the player first uses a keyboard or touch game control.
- The five touch controls remain rendered and preserve their existing input mappings.
- Beginning another gameplay session makes the one-time hint available again.
- Existing responsive touch-deck tests continue to pass.
