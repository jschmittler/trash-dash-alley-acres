# Roadmap Addition: Mobile-Friendly Web Experience

## Priority and intent

Trash Dash remains a **desktop-browser-first** game during the current roadmap. Mobile is a parallel quality track: each desktop milestone should avoid creating new mobile regressions, and low-risk improvements that benefit both platforms should be included along the way. A dedicated mobile hardening milestone begins after the desktop core loop, level pacing, and game-feel work are stable.

The target is a browser game that starts reliably on a shared link, strongly prefers landscape play, uses the available screen safely, responds well to simultaneous thumb input, and maintains smooth, legible gameplay on representative phones and tablets.

## Current baseline

- The game already has pointer-based touch buttons, `touch-action: none`, pause-on-window-blur behavior, a fixed 960×540 canvas, responsive HUD rules, `100svh`, and `viewport-fit=cover` on the GitHub Pages entry.
- The layout switches primarily at a 760px width breakpoint. This does not fully describe touch capability, phone orientation, browser chrome, foldables, or tablets.
- Portrait play places the 16:9 canvas above a dedicated control deck. Landscape has no purpose-built layout or safe-area tuning.
- There is no player-facing fullscreen control, orientation guidance, or best-effort orientation lock.
- Gameplay loads roughly 10–11 MB of rendered PNG art before the Start button becomes available. The unused source atlas is larger still, but is not part of the runtime load list.
- Touch cleanup handles pointer-up and pointer-cancel, but still needs real-device validation for multi-touch, interrupted gestures, browser navigation gestures, and lost pointer capture.

## Workstream A — Mobile guardrails during desktop milestones

Add these checks to every incremental desktop release:

1. Keep keyboard controls and the 16:9 desktop cabinet as the reference experience.
2. Run responsive smoke checks at phone portrait, phone landscape, tablet portrait, and tablet landscape sizes.
3. Confirm Start, Pause, Resume, Restart, Mute, movement, jump/glide, and action remain reachable by touch.
4. Confirm no HUD item, overlay, or control is clipped by notches, rounded corners, browser toolbars, or home indicators.
5. Do not add large blocking assets without recording their transfer size and load impact.
6. Record mobile regressions separately unless they prevent starting or completing a run; start/completion blockers are release blockers on every platform.

### Exit criteria

- Automated production builds continue to pass.
- Each desktop milestone has a short mobile smoke-test result in its pull request or release notes.
- No new mobile start, input, layout, or completion blocker is knowingly shipped.

## Workstream B — Landscape and fullscreen foundation

1. Add an in-game **Fullscreen** control that calls the browser Fullscreen API only after a player gesture.
2. When fullscreen begins, request a landscape orientation lock where the browser supports it; treat rejection or lack of support as a normal fallback.
3. Add a concise pre-play rotate prompt when a phone is held in portrait. Do not trap the player: allow portrait play with a clear “Play anyway” path.
4. Build a dedicated landscape layout that maximizes the 16:9 stage and positions controls in comfortable left/right thumb zones without covering hazards or HUD information.
5. Apply safe-area padding with `env(safe-area-inset-top/right/bottom/left)` to the HUD, overlays, and touch controls.
6. Use dynamic viewport units with resilient fallbacks so expanding and collapsing mobile browser chrome does not move controls offscreen.
7. Recalculate layout on `resize`, `orientationchange`, and relevant `visualViewport` changes without resetting the run.

### Exit criteria

- A player can enter and exit fullscreen without losing game state or leaving a virtual button stuck.
- Landscape fills the usable screen without stretching the 16:9 game world.
- Portrait guidance is understandable and dismissible.
- Controls remain clear of safe areas on notched iPhones and gesture-navigation Android phones.
- Rotation during play pauses safely, relayouts once, and resumes only after player confirmation.

## Workstream C — Touch controls and mobile game feel

1. Treat touch capability and coarse pointers as input signals instead of assuming every narrow viewport is a phone.
2. Harden input release handling for `pointerup`, `pointercancel`, `lostpointercapture`, page visibility changes, focus changes, and interrupted multi-touch gestures.
3. Validate true simultaneous input: move + jump, move + held glide, and move + action.
4. Increase active touch regions without making the visible controls unnecessarily large. Preserve at least a 48×48 CSS-pixel target, with jump as the strongest target.
5. Add optional left-handed control mirroring and a simple control-opacity setting after the default layout tests well.
6. Prevent double-tap zoom, text selection, pull-to-refresh, and browser back/forward gestures inside the control surface while preserving normal browser behavior outside the game.
7. Add subtle pressed-state and vibration feedback where supported; vibration must be optional and never required to understand an action.

### Exit criteria

- A full run can be completed using touch only.
- Ten repeated multi-touch trials produce no stuck movement or missed release.
- The player can reliably run-jump and glide while steering on iOS Safari and Android Chrome.
- Touch controls do not cover the player, common landing zones, boss tells, or critical HUD status.

## Workstream D — Mobile loading and frame performance

Follow a measure-first loop. Capture a baseline before changing asset formats, canvas resolution, or update behavior, then make one attributable optimization at a time.

1. Measure first input delay, time until Start is enabled, frame-time distribution, long frames, memory pressure, and asset transfer size on real devices.
2. Remove the source sprite atlas and other authoring-only files from production artifacts while retaining them in the repository.
3. Test lossless WebP/optimized PNG output for large backgrounds and atlases; keep crisp edges and transparent pixel boundaries.
4. Prioritize the title and opening-area assets. Lazy-load later environment and boss art before the camera reaches those sections.
5. Avoid per-frame allocations and redundant React state work in the animation loop; pause updates when the page is hidden.
6. Compare the current 960×540 internal canvas with a lower mobile quality tier only if profiling shows fill rate or memory bandwidth is the dominant cost.
7. Add a small loading-progress indicator and a retry state for failed or interrupted asset requests.

### Initial performance budgets

- Start enabled within 3 seconds on a representative mid-range phone over a good 4G connection after a cold load.
- At least 55 FPS during ordinary play on the reference mid-range device, with a 30 FPS minimum during the busiest encounter.
- No recurring frame-time spike above 50 ms during ordinary traversal.
- No mobile browser tab reload caused by memory pressure during two consecutive runs.
- Initial required transfer target below 5 MB, with later-area assets loaded progressively.

These are starting budgets, not guesses to optimize toward blindly. Record the reference devices and measured baselines before accepting or revising them.

## Workstream E — Real-device compatibility and release gates

Use browser emulation for quick layout checks, but use real hardware for input, fullscreen, orientation, audio, memory, and performance decisions.

### Reference matrix

- Current iPhone Safari, including one notched device.
- Current Android Chrome on a mid-range phone.
- One older or lower-memory Android phone.
- iPad Safari or an equivalent tablet-sized touch device.
- Desktop Chrome, Safari, and Firefox remain the primary regression matrix.

### Test route

On every reference mobile device:

1. Open the public GitHub Pages link from a fresh tab.
2. Start in portrait, follow or dismiss orientation guidance, then rotate to landscape.
3. Enter fullscreen if supported.
4. Complete movement, run-jump, glide, action, pause/resume, mute, damage/respawn, and restart checks.
5. Play through at least the checkpoint and boss; perform a full completion on iPhone Safari and Android Chrome.
6. Background and restore the browser, rotate twice, and confirm state and controls recover.
7. Capture browser/version, device, orientation, load time, approximate FPS or frame symptoms, control issues, and screenshots in the test note.

### Mobile-ready release gate

- Zero critical or high-severity issues in start, touch input, orientation recovery, fullscreen recovery, or level completion.
- Performance budgets pass on the named reference devices, or any exception is documented with a fallback quality tier.
- The public build has been tested from the production URL, not only a local server.
- Desktop keyboard behavior and desktop visual quality remain unchanged unless an explicitly approved improvement affects both.

## Later opportunities, not current blockers

- Installable PWA shell and offline replay after the first successful load.
- Gamepad support for phones/tablets paired with controllers.
- Optional control-size and control-position calibration.
- Battery-saver or 30 FPS quality mode for older devices.
- Mobile-specific share/victory card.
- Native iOS or Android packaging. The near-term target remains the mobile web browser.

## Recommended order in the main roadmap

1. Continue the desktop core-loop and game-feel milestones.
2. Apply Workstream A guardrails to every release immediately.
3. Implement Workstream B as the first dedicated mobile slice because it establishes the viewport contract for later touch and performance work.
4. Implement and test Workstream C in small input-focused changes.
5. Baseline and optimize Workstream D one measured bottleneck at a time.
6. Complete Workstream E before describing the game as mobile-friendly in public sharing copy.
