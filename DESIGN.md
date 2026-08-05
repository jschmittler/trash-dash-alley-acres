---
name: Trash Dash: Alley Acres
description: A pocket-sized late-16-bit raccoon platformer built directly into the browser.
colors:
  sky: "#73d8f4"
  ink: "#172a2b"
  cream: "#fff4ce"
  leaf: "#2d8b43"
  leaf-dark: "#175c37"
  orange: "#f28b2d"
  teal: "#087c86"
  teal-dark: "#07515b"
  danger: "#c84f3c"
  panel: "#163c3c"
typography:
  display:
    fontFamily: "Bungee, sans-serif"
    fontSize: "clamp(2.2rem, 7vw, 5.8rem)"
    fontWeight: 400
    lineHeight: 0.88
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Nunito Sans, sans-serif"
    fontSize: "1rem"
    fontWeight: 750
    lineHeight: 1.45
  label:
    fontFamily: "Nunito Sans, sans-serif"
    fontSize: "0.66rem"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.08em"
rounded:
  control: "11px"
  action: "13px"
  panel: "14px"
  stage: "16px"
spacing:
  xs: "6px"
  sm: "8px"
  md: "10px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.action}"
    padding: "0 20px"
    height: "48px"
  button-utility:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.cream}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "38px"
  game-stage:
    backgroundColor: "{colors.sky}"
    rounded: "{rounded.stage}"
---

# Design System: Trash Dash: Alley Acres

## Overview

**Creative North Star: "The Pocket Cartridge"**

Trash Dash should feel like a complete late-16-bit game world held directly in the browser. The interface recedes behind the playable artifact: a compact equipment-like HUD and a large pixel stage, with the supplied raccoon artwork providing personality and visual authority.

The system is bright, tactile, and legible rather than nostalgic for its own sake. Woodland greens give way to teal recycling metal and a distant junkyard skyline, while orange consistently identifies momentum, transformation, and primary action. Generic dashboard chrome, decorative glass, and web-page section scaffolds are outside this world.

**Key Characteristics:**

- The playable pixel world owns the viewport.
- Teal utility surfaces frame sky, leaf, dirt, and orange action color.
- Controls are chunky, short-labeled, and thumb-friendly.
- Animation is purposeful and tied to gameplay state.
- Desktop uses a 16:9 cabinet; portrait play adds a dedicated pocket-control deck.

## Colors

The palette combines clear outdoor color with the darker enamel and metal of a recycling depot.

### Primary

- **Recycling Teal** (`#087c86`): utility controls, touch inputs, and active interface surfaces.
- **Momentum Orange** (`#f28b2d`): primary actions, title emphasis, and transformation cues.

### Secondary

- **Canopy Green** (`#2d8b43`): foliage and environmental life.
- **Deep Leaf** (`#175c37`): grounded plant depth and supporting action states.
- **Open Sky** (`#73d8f4`): the dominant playfield atmosphere.

### Neutral

- **Snack Cream** (`#fff4ce`): primary interface text and warm highlights.
- **Raccoon Ink** (`#172a2b`): high-contrast text and dark outline logic.
- **Cabinet Panel** (`#163c3c`): HUD and protected overlay surfaces.
- **Deep Teal** (`#07515b`): background support and pressed states.

**The Orange Means Go Rule.** Reserve orange for titles, the strongest action, pickups, and celebratory state; it should not become general decoration.

## Typography

**Display Font:** Bungee (sans-serif fallback)  
**Body Font:** Nunito Sans (sans-serif fallback)

**Character:** Bungee supplies the compact, block-built voice of a cartridge title. Nunito Sans keeps HUD numbers, instructions, and mobile controls friendly and immediately readable.

### Hierarchy

- **Display** (400, `clamp(2.2rem, 7vw, 5.8rem)`, 0.88): title screens and terminal states only.
- **Headline** (400, `clamp(1.65rem, 5vw, 3.4rem)`, 1): pause, game-over, and victory messages.
- **Body** (750, `clamp(0.92rem, 1.8vw, 1.08rem)`, 1.45): concise game explanation, limited to roughly 46 characters.
- **Label** (900, `0.66rem`, `0.08em`, uppercase): HUD categories and compact status.

**The Cartridge Voice Rule.** Use the display face for identity and decisive state changes, never for paragraphs or dense instruction.

## Layout

Desktop centers a cabinet up to 1280px wide with a compact HUD above a 16:9 canvas. The canvas uses a fixed 960×540 logical resolution and nearest-neighbor scaling. The HUD keeps brand, trash, score, time, paws, glider, and utility actions in one scan line.

Below 760px, the title remains inside the 16:9 stage. Active portrait play expands the cabinet to the remaining viewport height and reserves everything below the canvas for the touch-control deck. Left/right sit in the lower-left thumb zone; action/jump sit in the lower-right. Never stretch the canvas to fill portrait height.

## Elevation & Depth

Depth is structural: the cabinet and overlays lift over a deep teal field, while the game art creates its own parallax layers. Shadows are soft and downward, never neon halos or hard offset blocks.

### Shadow Vocabulary

- **Cabinet lift** (`0 24px 60px rgb(0 8 8 / 45%)`): the game stage against the page field.
- **HUD lift** (`0 12px 28px rgb(1 13 14 / 32%)`): compact interface separation.
- **Control lift** (`0 5px 12px rgb(1 22 24 / 26%)`): actionable elements at rest.

## Shapes

The stage uses a 16px radius and HUD panels use 14px. Primary buttons use 13px; compact controls use 11px. These corners are chunky but not pill-shaped. A subtle three-pixel inset stage line echoes a screen bezel without competing with the artwork.

## Components

### Buttons

- **Shape:** compact rounded rectangles, 11–13px radius.
- **Primary:** orange with dark ink, minimum 48px desktop height.
- **Utility:** teal with cream text and short action labels.
- **Hover / Focus:** slight upward lift; a three-pixel warm yellow focus ring with clear offset.
- **Touch:** 46px controls and a larger 54px jump target in portrait.

### Cards / Containers

There are no generic content cards. The HUD, protected state overlay, game stage, and touch deck are the only major containers; each corresponds to a real game function.

### Navigation

Navigation is replaced by game-state controls. Pause and Mute remain available in the HUD; state overlays provide one primary continuation action and, where useful, one restart action.

### Game Stage

The canvas uses crisp pixel scaling and a smooth camera. Player and enemy art is anchored bottom-center to its physics body. The opening uses a woodland horizon; the junkyard layer crossfades near the checkpoint.

## Do's and Don'ts

### Do:

- **Do** let the supplied sprite artwork lead every playable screen.
- **Do** keep physics bodies slightly forgiving while anchoring visible sprites to a shared baseline.
- **Do** use orange sparingly for primary action, pickup energy, and success.
- **Do** keep portrait controls outside the 16:9 playfield.
- **Do** express progression through environment art as well as mechanics.

### Don't:

- **Don't** wrap the game in generic website navigation, marketing sections, or equal-sized cards.
- **Don't** stretch, smooth, or blur pixel assets.
- **Don't** use Nintendo characters, symbols, music, level geometry, or copied audiovisual language.
- **Don't** obscure the stage with touch controls.
- **Don't** position sprite art with per-frame guessed offsets when a bottom-center anchor is available.
