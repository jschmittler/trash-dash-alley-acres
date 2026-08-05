# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated: use the existing Sites/Vinext React and TypeScript scaffold, with an HTML5 Canvas game surface and no external game engine.

## Users

Casual desktop and mobile players who want a short, immediately understandable browser platformer that can be completed in a few minutes.

## Product Purpose

“Trash Dash: Alley Acres” is a playable one-level side-scrolling platform game starring an original raccoon. Success means a player can start without instructions beyond the opening prompts, learn the controls through play, transform, glide, defeat the trash-bag monster, and reach the recycling depot finish.

## Positioning

The game turns scavenged trash into both the collectible economy and the raccoon’s power progression: gathering and recycling changes what the character can do.

## Operating Context

The game is played directly in a browser, primarily with a keyboard on desktop and large touch controls on mobile. A complete run should take roughly three to five minutes.

## Capabilities and Constraints

- One original woodland-to-junkyard level with a checkpoint and finish state.
- Walking, running, variable jumping, stomping, tail attacks, damage, small/large forms, and limited gliding.
- Keyboard and touch input, pause, restart, mute, local high score, and best-time persistence.
- Use the supplied raccoon sprite atlas as the visual source of truth; keep the original source unchanged.
- No copied Nintendo geometry, characters, names, symbols, music, sound effects, or visual assets.
- The hosted version must run on ChatGPT Sites and remain playable without external runtime services.

## Brand Commitments

- Product name: Trash Dash: Alley Acres.
- Original late-16-bit pixel-art sensibility.
- Rounded gray raccoon with cream markings, striped tail, teal utility belt, and orange neckerchief.
- Bright woodland terrain transitioning into a playful junkyard.
- Voice is playful, concise, and action-oriented.

## Evidence on Hand

- Supplied generated sprite atlas: `public/assets/raccoon-sprite-source.png` after it is copied into the project.
- The atlas includes character animation, glider, trash pickups, recycling crates, enemies, terrain, plants, and parallax scenery.
- No licensed music, third-party sound effects, commercial claims, or user data are supplied or required.

## Product Principles

1. Teach through safe play before testing the mechanic.
2. Keep movement forgiving and readable.
3. Make every power-up visibly change the raccoon’s possibilities.
4. Reward curiosity without making secrets necessary to finish.
5. Preserve the supplied character artwork as the personality of the game.

## Accessibility & Inclusion

Support keyboard and touch controls, visible focus states, reduced-motion preferences, mute, pause-on-blur, non-color-only status cues, and no rapid flashing.
