# Mobile Viewport and Input Foundation Design

## Objective

Deliver the first mobile-roadmap slice without reducing desktop quality. The game will gain a player-controlled fullscreen action, landscape guidance on touch-first phones, safe-area-aware layout, and resilient touch-input cleanup. Rotation, fullscreen transitions, browser interruption, and rejected browser APIs must never reset a run or leave movement stuck.

This slice does not optimize image payloads, redesign the level, add a PWA, or claim broad mobile readiness. Those remain later roadmap workstreams.

## Player experience

### Desktop

- The existing 16:9 cabinet remains the reference layout.
- A compact Fullscreen control joins Pause and Mute in the HUD.
- Entering or leaving fullscreen preserves the current run, score, timer, camera, and input state.
- Unsupported fullscreen browsers hide or disable the action without affecting the rest of the HUD.

### Touch-first landscape

- The stage uses the usable dynamic viewport without stretching the 16:9 canvas.
- The HUD and touch controls remain inside device safe areas.
- Controls stay in left and right thumb zones and do not cover the player’s starting position or central hazards.
- A fullscreen action is available after a player gesture. When fullscreen succeeds, the game makes a best-effort request for landscape orientation lock.

### Touch-first portrait

- Before active play, a lightweight orientation panel recommends rotating to landscape.
- The player may dismiss the recommendation and continue in the existing portrait control-deck layout.
- The prompt does not repeatedly interrupt the same mounted session after dismissal.
- If the player rotates to landscape, the prompt disappears automatically.

## Architecture

### Browser-capability state

`TrashDashGame` will track a small browser-experience state:

- whether the primary pointer is coarse/touch-first;
- whether the viewport is portrait;
- whether the document is currently fullscreen;
- whether fullscreen is supported;
- whether the portrait recommendation was dismissed.

Capability and orientation detection will use browser APIs only inside effects so server rendering remains safe. Media-query listeners and fullscreen listeners will be removed during cleanup.

### Fullscreen flow

1. The player presses Fullscreen.
2. The game requests fullscreen on the game cabinet, falling back to the page root only if the cabinet cannot request it.
3. If fullscreen succeeds and orientation locking is available, the game requests landscape orientation as a best effort.
4. Rejection from either API is non-fatal. The game remains playable and displays no blocking error.
5. `fullscreenchange` updates the control label between Fullscreen and Exit Fullscreen.
6. Leaving fullscreen clears held input and safely pauses an active run. The player explicitly resumes from the existing pause overlay.

The orientation lock is never treated as guaranteed because iOS Safari and some embedded browsers do not expose it.

### Input lifecycle

All held inputs will be cleared through one shared cleanup function. It will run on:

- window blur;
- document visibility becoming hidden;
- fullscreen exit;
- orientation transition;
- pointer cancellation;
- lost pointer capture;
- component cleanup.

Each touch button will release only its own virtual key during normal pointer-up/cancel/lost-capture handling. Global interruptions clear every key. This preserves simultaneous move + jump/action input while preventing stuck state.

### Layout and safe areas

CSS will define safe-area custom properties using `env(safe-area-inset-*)` with zero fallbacks. The page, HUD, overlays, touch controls, and portrait guidance will consume the relevant inset.

Mobile playing height will prefer `100dvh`, retain `100svh` as a fallback, and avoid a hard minimum height that can force controls below short landscape viewports. Landscape touch layouts will keep the canvas centered at 16:9 and use the remaining safe space for controls only when necessary.

The canvas logical resolution remains 960×540 in this slice. Any lower mobile resolution tier requires measured evidence from the later performance workstream.

## Component boundaries

### Browser experience helpers

Small helpers will isolate browser-specific behavior from gameplay state:

- media-query subscription and initial evaluation;
- fullscreen capability and state checks;
- best-effort fullscreen/orientation requests;
- common held-input cleanup.

Helpers must not mutate world state directly. `TrashDashGame` decides when a transition should pause gameplay.

### Orientation recommendation

The recommendation is a DOM overlay adjacent to the existing game-state overlay system, not canvas art. It contains:

- a short “Rotate for the best view” message;
- a Rotate/Fullscreen primary action when fullscreen is available;
- a “Play in portrait” secondary action.

It appears only for touch-first portrait conditions and never covers pause, game-over, or victory overlays.

## Error handling

- Fullscreen and orientation promises are caught locally.
- Unsupported APIs do not produce console errors or rejected-promise noise.
- A failed fullscreen request leaves the normal page layout intact.
- Layout events never recreate the world or restart the timer.
- Hidden/blurred documents clear input and pause active gameplay.
- Returning to a visible page does not resume automatically.

## Accessibility

- Fullscreen uses a real button with a state-specific accessible label.
- The orientation recommendation is readable without relying on an icon or color.
- Dismissal and fullscreen actions are keyboard reachable.
- Existing focus styles, reduced-motion behavior, pause, and mute remain intact.
- The recommendation does not lock portrait users out of the game.

## Verification strategy

### Automated checks

- Existing Sites production build and rendered-shell tests pass.
- Existing GitHub Pages production build and repository-base-path tests pass.
- Source-level or extracted-helper tests verify that interruption paths clear held keys and fullscreen rejection is handled.
- Rendered output retains Start, Pause, Mute, canvas, and touch-control accessibility labels and adds the Fullscreen control.
- CSS assertions cover dynamic viewport and safe-area declarations.

### Browser playtest

Golden path:

1. Load the game and start a run.
2. Enter fullscreen from the HUD.
3. Move and jump, then leave fullscreen.
4. Confirm the game pauses, no key remains held, and Resume continues the same run.

Relevant edge probes:

- Press Fullscreen repeatedly while a request is pending.
- Reject or run without fullscreen/orientation support.
- Hold a touch control while the page blurs, rotates, or exits fullscreen.
- Use move + jump simultaneously and release them in either order.
- Dismiss portrait guidance and confirm it stays dismissed for the mounted session.

### Manual real-device follow-up

Browser automation is a fast smoke check, not proof of mobile input quality. After the feature is deployed, complete a short pass on iPhone Safari and Android Chrome covering portrait guidance, rotation, fullscreen support/fallback, simultaneous touch input, background/restore, and safe areas.

## Acceptance criteria

- Desktop visuals and keyboard gameplay remain unchanged apart from the new compact Fullscreen action.
- Fullscreen entry and exit do not reset the current world.
- Exiting fullscreen or losing visibility pauses active gameplay and clears held input.
- Touch-first portrait players see dismissible landscape guidance and can still play in portrait.
- Touch-first landscape play respects safe areas and fits within the usable viewport.
- Unsupported or rejected fullscreen/orientation APIs do not block play or create unhandled errors.
- Simultaneous touch movement and jump/action remain functional.
- Both production build pipelines and their tests pass.
- The browser golden path is played successfully before the feature is called complete.
