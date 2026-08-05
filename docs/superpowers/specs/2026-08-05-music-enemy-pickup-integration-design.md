# Music, Enemy, and Pickup Integration Design

## Objective

Integrate the supplied `raccoon_rush_loop.wav` as gameplay music and finish the in-progress enemy, trash-pickup, and taco-power-up asset update from the parallel asset workflow. The result must preserve the existing desktop experience, obey browser audio restrictions, avoid unnecessary mobile transfer cost, and keep all animated art aligned with gameplay bodies.

This slice does not redesign enemy AI, rebalance the full level, add multiple music tracks, or introduce a settings screen. Those remain separate roadmap work.

## Source assets

### Music

- Source: `/Users/jamesschmittler/Downloads/raccoon_rush_loop.wav`
- Properties: 24 seconds, stereo, 44.1 kHz, 16-bit PCM, approximately 4.2 MB of audio data.
- Runtime derivative: an AAC/M4A file stored under `public/assets/audio/` at a browser-appropriate bitrate.
- The uncompressed WAV remains outside the runtime bundle. The repository will contain the optimized derivative used by the game.

### Generated pixel art

- `public/assets/generated/enemy-variety-motion.png`: 768×2304, twelve rows of four 192×192 animation cells.
- `public/assets/generated/trash-pickups-motion.png`: 768×768, four rows of four 192×192 animation cells.
- `public/assets/generated/taco-power-motion.png`: 768×192, one row of four 192×192 animation cells.
- `scripts/build-sprite-atlases.py` records how chroma-keyed source art was normalized into the runtime atlases.

The `.summer/` working directory is tool state, not a game asset, and will not be included in this feature commit.

## Music behavior

### Start and loop

Music is silent on initial page load and the title screen. Pressing **Start Rummaging** creates or reuses an `HTMLAudioElement`, sets the optimized asset URL, enables looping, rewinds to the start, and begins playback from that player gesture.

The music element is separate from the existing `AudioContext` used for synthesized sound effects. This keeps long-form streaming audio out of decoded in-memory buffers and uses the browser’s normal media pipeline.

### Pause and resume

- Entering the paused state pauses music without changing its current position.
- Resuming gameplay continues from the saved position.
- Page blur, hidden visibility, rotation interruption, and fullscreen exit already route active gameplay into the paused state; music follows that state.
- Starting a new run rewinds music to zero and plays from the beginning.
- Game-over and victory overlays pause at the end of the active run. Starting another run restarts the loop.

### Mute

The existing Mute control governs both synthesized sound effects and background music. Muting sets the music element’s muted state immediately. Unmuting during active play retries playback if the browser previously rejected it.

Music volume will be intentionally lower than effects so jumps, impacts, pickups, and warnings remain readable. The first implementation uses a fixed music volume rather than adding a volume-settings interface.

### Failure handling

`play()` promises are always handled. If autoplay policy, decoding, or another browser condition rejects playback:

- the game continues normally;
- no blocking error or unhandled rejection appears;
- the next Start, Resume, or Unmute player action retries playback.

Component cleanup pauses the element, clears its source, and releases the reference.

## Enemy integration

The new atlas supplies these four-frame enemies:

1. Bat
2. Wasp
3. Mosquito
4. Moth
5. Snake
6. Spider
7. Rat
8. Hedgehog
9. Fox
10. Crow
11. Boar
12. Frog

Each enemy receives:

- an explicit gameplay-body width and height;
- a four-frame atlas row;
- a bottom-center drawing anchor to its body;
- horizontal flipping based on velocity;
- patrol bounds consistent with existing enemies.

Flying enemies use a small sine-wave vertical offset around a stable `surfaceY` baseline. Ground enemies remain locked to their assigned surface so their feet do not clip through terrain. Fox and boar may use a faster patrol speed, but no new combat logic is added in this slice.

The level receives spaced examples of the new enemies from the opening woodland through the junkyard. Placement must avoid unavoidable damage chains and must not obscure the boss encounter.

## Pickup integration

### Trash

Existing generic trash pickups rotate deterministically among four visual rows: can, bottle, banana peel, and apple core. Each uses a four-frame animation plus the existing gentle two-pixel hover motion. The pickup kind remains `trash`; art variety does not change scoring or collision behavior.

### Taco power-up

The taco replaces the previous bag-style large-form token. It uses a four-frame animation and the same gentle hover treatment. Collecting it immediately activates the large raccoon form, displays “Taco power!”, and preserves the existing score and sound-effect behavior.

### Bottle cap

The bottle-cap glider pickup is unchanged in this slice.

## Loading and asset paths

All new images and music use the existing base-aware `assetUrl()` helper so ChatGPT Sites and the GitHub Pages repository subpath both resolve correctly.

The first implementation continues to preload the sprite atlases with the existing asset group. Music uses browser media loading and does not block the Start button. Progressive sprite loading remains part of the later mobile-performance workstream.

If a required sprite atlas fails, the current loading state remains visible and the failure is treated as a build/test blocker. Music failure is non-blocking because it is an enhancement rather than required gameplay state.

## Accessibility and browser behavior

- The Mute button retains its state-specific accessible label.
- No music starts before a player gesture.
- Hidden or interrupted tabs do not continue playing music.
- Resuming remains explicit; the game and music never resume automatically after interruption.
- Reduced-motion preferences do not disable essential sprite animation but continue suppressing nonessential interface transitions.

## Verification strategy

### Automated checks

- Confirm the optimized music derivative exists in the repository and production artifacts.
- Confirm the runtime references the base-aware music URL, `loop`, fixed volume, handled `play()` promise, pause/resume lifecycle, and shared mute state.
- Confirm all three generated atlases and the atlas-building script exist.
- Confirm the enemy union, atlas rows, draw sizes, placements, flying-enemy set, and direction flipping cover all twelve types.
- Confirm trash pickup rows and taco animation are referenced and the legacy bag power-up is removed from runtime behavior.
- Confirm grounded and flying baseline expressions remain distinct.
- Run lint, the Sites production build/tests, and the GitHub Pages production build/tests.

### Browser playtest

Golden path:

1. Load the title screen and confirm it remains silent.
2. Press Start Rummaging and confirm music begins.
3. Pause and confirm music pauses; resume and confirm it continues.
4. Mute and unmute during play and confirm both music and effects follow the control.
5. Restart and confirm the music loop rewinds.
6. Traverse far enough to inspect multiple new ground and flying enemies, animated trash variations, and the taco power-up.

Relevant edge probes:

- Reject or simulate failure of the first music `play()` request; gameplay must continue and a later player action must retry.
- Pause/resume repeatedly without creating overlapping music instances.
- Background and restore the page while holding movement; game and music remain paused until explicit resume.
- Confirm moving enemies flip to face their travel direction and remain aligned with ground or flight baseline.
- Confirm animated pickups remain centered on their collision locations and do not visually change identity after loading.

Audio presence and subjective balance require a human listening pass. Browser state and error handling can be automated, but the feature is not considered complete until the supplied track is audibly checked during real gameplay.

## Acceptance criteria

- Title screen is silent; gameplay starts the music from a player gesture.
- Music loops, pauses, resumes, restarts, and mutes with the documented game states.
- Music failure never blocks gameplay or creates an unhandled promise rejection.
- The runtime audio derivative is substantially smaller than the 4.2 MB WAV.
- All twelve new enemy types render from the generated atlas, animate, face their movement direction, and maintain appropriate ground or flight alignment.
- Trash pickups use four stable animated identities with gentle hovering.
- The taco animation replaces the old large-form token and activates the intended power-up.
- Existing raccoon, original enemies, bottle cap, boss, terrain, and desktop controls remain functional.
- Both production build targets, automated tests, lint, and the browser gameplay walkthrough pass.
