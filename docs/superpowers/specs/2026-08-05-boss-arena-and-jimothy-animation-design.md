# Boss Arena and Jimothy Animation Design

## Goal

Give Trash Dash's final trash-bag boss the same normalized, explicit animation architecture as the hero; turn the final encounter into a contained, readable arena with its own ominous music; and prepare Jimothy to the same asset standard while keeping him completely private and unintegrated.

## Approved direction

This work preserves the existing boss identity, palette, proportions, and three-hit encounter. It uses the same hybrid rebuild chosen for the hero: recover the strongest existing poses, generate only the missing action poses, normalize every frame into fixed cells, and drive rendering from a pure animation manifest. Jimothy keeps his established charcoal-gray, pear-shaped design and existing 12-state concept coverage.

## Boss animation architecture

The canonical boss atlas uses 256×256 transparent cells and right-facing source art. Runtime mirroring handles left-facing motion. Every pose shares one foot baseline and a stable optical center.

| State | Frames | Behavior |
| --- | ---: | --- |
| idle | 4 | Heavy breathing and bag-knot sway |
| walk | 6 | Grounded patrol cycle |
| windup | 3 | Crouch and readable charge telegraph |
| charge | 4 | Fast forward attack |
| recover | 3 | Braking and vulnerable recovery |
| hit | 4 | Complete recoil with impact stars |
| rage | 4 | One-shot transition after the second hit |
| defeat | 6 | Collapse and flatten before victory |

`app/boss-animation.mjs` owns the manifest, selector, frame timing, charge-active frames, and sequence durations. The boss entity stores explicit state, state elapsed time, attack cooldown, arena bounds, and whether its rage transition has played. Hit and defeat sequences take priority over movement. Charge collision exists only on declared active frames.

## Encounter and arena flow

The last ordinary enemy moves earlier in the level. The stretch from world x=5480 to the arena trigger at x=5680 is a quiet runway with no enemies, giving the player time to see the arena and prepare. Crossing the trigger:

1. Marks the arena active permanently for the current run.
2. Deactivates every non-boss enemy still alive.
3. Clamps the camera to the fixed arena viewport from x=5640 to x=6600.
4. Clamps the player to the arena's left and right walls so retreat is impossible.
5. Constrains the boss to the same combat space.
6. Starts the boss music and displays a short encounter title.

The boss idles until arena entry. It then alternates patrol and telegraphed charges. The second successful hit triggers a brief rage animation and shortens its next attack cooldown. The third hit commits the defeat sequence; only after that sequence finishes does the exit open and the existing level-complete flow resume.

Pit behavior remains unchanged and immediate. Restarting or leaving gameplay restores the normal level track.

## Music

The boss track is a 60-second instrumental loop: 104 BPM, D minor, 4/4, low cello ostinato, detuned industrial percussion, bowed-metal swells, and a sparse bass-synth pulse; dark, ominous, and driving without vocals or a melodic resolution. Runtime music control supports switching sources with a short volume fade so arena entry does not click or overlap tracks.

## Jimothy private pipeline

Jimothy remains under `concepts/jimothy/`. A private `jimothy-animation.mjs` manifest names all 12 existing rows and their timing. The atlas builder is upgraded to isolate each pose, align every frame to a shared eight-pixel foot margin, and produce `jimothy-animation-contact-sheet.png`. Tests verify dimensions, transparent margins, frame population, deterministic output, and the absence of any Jimothy reference from `app/` and `public/`.

## Testing and acceptance

- Pure tests cover boss state priority, frame timing, charge hit frames, arena activation, camera/player clamps, and defeat gating.
- Image tests cover every boss and Jimothy cell, transparent borders, deterministic atlas builds, and contact-sheet generation.
- Integration tests require canonical boss assets and boss music while rejecting the old raw boss render path and all Jimothy runtime references.
- Local playtesting covers the quiet runway, one-way arena entry, absence of ordinary enemies, camera/player lock, music transition, walk/charge/hit/rage/defeat sequences, three-hit victory, restart, pit behavior, and browser console diagnostics.

## Non-goals

- Jimothy does not enter the game, public assets, preload list, enemy union, level data, or deployment artifact.
- The boss keeps three health and does not gain projectiles or additional phases.
- The broader level layout, checkpoint system, hero hierarchy, and mobile-control design remain unchanged.
