# Semantic Parallax Background Manual

## Purpose

This manual defines a repeatable method for building layered 2D side-scroller backgrounds that feel deep without producing opacity seams, split landmarks, floating trees, abrupt transitions, or foreground clutter.

The central rule is:

> Assign depth by object meaning, never by image height.

A complete tree, building, bridge, fence, or mountain belongs to one plane. Do not derive depth by cutting a finished painting into horizontal bands.

## 1. The three-plane contract

| Plane | Contains | Transparency | Relative motion | Grounding rule |
| --- | --- | --- | ---: | --- |
| Far | Sky, clouds, distant mountains, distant skyline, distant forest mass | Opaque | Slowest | Fills the complete viewport; no contact line required |
| Middle | Whole landmarks, whole mid-distance trees, fences, utility poles, warehouses, bridges | Transparent | Moderate | Every substantial independent silhouette shares the background contact line |
| Close | Foreground framing trunks, reeds, rocks, low vegetation, edge silhouettes | Transparent | Fastest | Extends to or below the viewport edge and hides selected middle contact edges without blocking gameplay |

Trash Dash uses the following relative rates in `app/level-background.mjs`:

```js
far: 0.018
middle: 0.055
close: 0.13
```

These values are project-specific. In another game, keep the ordering and roughly a 1:3:7 ratio before tuning.

## 2. Failure history and what each failure taught us

### Failure: one flattened background moved as a single image

**Symptom:** The environment looked static and had no convincing depth.

**Root cause:** Sky, distant scenery, landmarks, and foreground framing were already flattened together.

**Fix:** Author independent depth plates. Parallax requires independent visual information; code cannot recover true depth from a flattened painting.

### Failure: horizontal alpha masks created “layers”

**Symptom:** Trees and buildings blended or ghosted as the camera moved. The top of a tree moved at one speed while its trunk moved at another.

**Root cause:** A finished painting was copied three times and faded by Y coordinate. Objects crossing a mask boundary existed in multiple moving planes.

**Fix:** Create semantic plates in which every object is wholly owned by one plane. Add a regression test that rejects row-wide opacity bands.

### Failure: the environment transition happened twice

**Symptom:** Crossing one chapter boundary produced two visible fades or a reset-like flash.

**Root cause:** More than one transition calculation or drawing path handled the same boundary.

**Fix:** Resolve one boundary-centered blend value and draw the left and right chapter sets once. The blend must be monotonic from 0 to 1.

### Failure: transition cuts were abrupt

**Symptom:** A background changed instantly even though the camera was moving smoothly.

**Root cause:** Chapter selection used a hard zone switch.

**Fix:** Blend over a world-space distance and ease the blend. Trash Dash uses a smoothstep curve around each zone boundary.

### Failure: chroma-key fringes remained around foliage

**Symptom:** Thin neon magenta or green pixels outlined leaves, fences, and tree branches.

**Root cause:** Generated anti-aliased edge pixels were similar to, but not exactly, the chroma-key color.

**Fix:** Remove the key by color relationship, not exact equality. Inspect edges at 200–400% zoom. Pixel-art output uses hard alpha; do not leave a soft colored matte.

### Failure: generated middle plates looked like object catalogs

**Symptom:** Trees, lamps, fences, and buildings were individually complete but rested on different invisible rows, so some appeared to float.

**Root cause:** Image generation arranged objects like a sprite sheet rather than one coherent environment.

**Fix:** Detect substantial connected silhouettes and normalize their lowest visible pixels to a shared middle-layer baseline. Small airborne details remain in place.

### Failure: normalizing the close plate blocked the scene

**Symptom:** A foreground wall or vegetation strip became grounded but covered most midground detail.

**Root cause:** The close plate was treated like a row of middle landmarks.

**Fix:** Normalize independent middle objects only. Keep the close plate as framing and deliberate occlusion, extending below the viewport where appropriate.

### Failure: changes were correct on disk but absent in the browser

**Symptom:** The preview displayed an older asset revision.

**Root cause:** Browser and image caching obscured the new files.

**Fix:** Use cache-busted preview URLs during review and reload after asset generation. Confirm loaded dimensions and browser diagnostics before judging the art.

## 3. Authoring specification

### Canvas and style

For Trash Dash Level 1:

- Output size: 2048 × 716 pixels.
- Viewpoint: strict side-on, orthographic-feeling 2D composition.
- Rendering: polished 16-bit pixel-art language.
- Edges: hard pixel clusters; no anti-aliasing or blur.
- Shading: three-to-four value groups; no smooth gradients.
- Sampling: nearest-neighbor whenever resized or drawn.
- Middle/close key color: a flat color absent from the artwork, currently `#FF00FF`.

For another game, pick dimensions large enough to tile beyond the widest viewport and record them in one asset contract file.

### Far-plane prompt checklist

- Name only distant scenery.
- Explicitly exclude foreground trunks, landmarks, ground props, characters, pickups, and text.
- Request a fully opaque panorama.
- Keep the lower horizon quiet enough to sit behind later layers.
- Make the side edges visually compatible for horizontal repetition.

### Middle-plane prompt checklist

- Name complete landmarks and mid-distance vegetation.
- State that every object must be whole and appear on this plate only.
- Require a shared invisible ground line near the lower part of the canvas.
- Request a flat chroma-key background in all empty regions.
- Exclude sky, near framing objects, characters, pickups, and UI text.

### Close-plane prompt checklist

- Use only a few strong framing silhouettes.
- Concentrate tall objects near the side edges.
- Keep the central gameplay-reading area open.
- Extend low vegetation or terrain below the visible viewport edge.
- Exclude major landmarks that need to remain readable.

## 4. Semantic ownership test

Before importing, answer these questions for every large object:

1. What is it?
2. Is it distant atmosphere, a readable landmark, or close framing?
3. Which single plane owns it?
4. Does any recognizable part of it appear on another plane?

If the answer to question 4 is yes, revise the plates. Opacity is not a substitute for ownership.

Common assignments:

- Mountain, moon, far skyline → far.
- Mill, waterwheel, fence, utility pole, apartment building → middle.
- Edge tree trunk, near reed bed, large foreground rock → close.

## 5. Asset processing pipeline

1. Preserve generated source files outside the runtime asset directory.
2. Remove the chroma key from middle and close plates.
3. Inspect alpha edges for colored spill.
4. Identify substantial connected components in the middle plate.
5. Move each substantial component vertically until its lowest visible pixel meets the declared baseline.
6. Do not normalize tiny components such as stars, fireflies, smoke flecks, or detached glow particles.
7. Keep the close plate's authored vertical composition unless a specific framing object is visibly floating.
8. Resize with nearest-neighbor sampling.
9. Export far as RGB/opaque and moving plates as RGBA.
10. Validate dimensions, alpha shape, and baseline before loading the browser.

Trash Dash implementation references:

- `scripts/install-semantic-parallax.mjs`
- `scripts/parallax-baseline.mjs`
- `tests/level-one-backgrounds.test.mjs`

The current source baseline is 610 before final resizing; it becomes row 603 in the 2048 × 716 runtime plate. Those are asset-specific measurements, not universal constants.

## 6. Runtime integration

### Draw order

```text
far → middle → close → gameplay geometry → actors → effects/UI
```

Gameplay geometry should hide contact pixels where the scene calls for occlusion. Close scenery must not cover platforms, enemies, pickups, tutorial text, or the player's landing targets.

### Tiling

- Tile each plane independently.
- Avoid obvious unique objects at both horizontal edges unless repetition is intentional.
- Verify seams while moving, not only in a still frame.
- Do not scale one plane differently to conceal a seam; correct the asset.

### Zone transitions

- Store chapter boundaries in declarative level data.
- Calculate one eased blend at the nearest boundary.
- Draw both complete layer sets using `1 - blend` and `blend`.
- Do not start a second transition when the first is still inside its blend range.
- Confirm the blend remains monotonic even when the player reverses direction.

## 7. Automated checks

Every background set should fail the build when any of these conditions is false:

- Base, far, middle, and close files exist.
- All plates meet the declared minimum dimensions.
- Far is opaque.
- Middle and close include both transparent and visible pixels.
- Moving plates contain object-shaped alpha, not uniform opacity by row.
- Every substantial middle component ends on the declared baseline within a small tolerance.
- Parallax speed ordering is `far < middle < close`.
- Boundary blending crosses from 0 to 1 once without resetting.

Recommended additional checks for future levels:

- Detect opaque pixels touching unintended canvas edges.
- Compare deterministic output hashes when source inputs have not changed.
- Store a small contact sheet of all three plates over a checkerboard.
- Render a scripted camera sweep and compare key frames in visual regression tests.

## 8. Visual QA pass

Perform this scan for every chapter:

### Static inspection

- Far fills the entire viewport at the tallest supported aspect ratio.
- No chroma-key color remains around silhouettes.
- Whole trees and structures exist on only one plane.
- Middle object bottoms meet the game ground or disappear behind gameplay geometry.
- Close objects frame the scene without covering traversal information.
- Repeated tiles do not create a visible vertical seam.

### Motion inspection

- Walk slowly for one viewport width.
- Run for one viewport width.
- Reverse direction inside the chapter.
- Watch a tall object from first appearance until it leaves the screen.
- Confirm its canopy, trunk, base, and shadow move together.
- Confirm the far plane never exposes an empty band at the top or bottom.

### Boundary inspection

- Approach every chapter transition from both directions.
- Cross once at walking speed and once at running speed.
- Stop directly inside the blend range.
- Confirm there is one transition, no flash, no repeated fade, and no layer that changes early.

### Viewport inspection

- Desktop default viewport.
- Wide desktop viewport.
- Minimum supported mobile landscape viewport.
- Fullscreen landscape.

## 9. Review sheet

Use this table during an art review:

| Stage | Far fills screen | Whole middle objects | Middle grounded | Close framing safe | No key fringe | Tiling clean | Transition clean |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Stage name | Pass/Fail | Pass/Fail | Pass/Fail | Pass/Fail | Pass/Fail | Pass/Fail | Pass/Fail |

Any failure blocks approval. Record a screenshot and the world X coordinate so the correction can be reproduced.

## 10. Release checklist

- [ ] Each recognizable object has exactly one semantic owner plane.
- [ ] Far, middle, and close plates are independently authored.
- [ ] Runtime files use the declared dimensions and nearest-neighbor processing.
- [ ] Chroma-key edges are clean at high zoom.
- [ ] Substantial middle components share the measured contact baseline.
- [ ] Close framing hides intended seams without hiding gameplay.
- [ ] Parallax speeds are visibly distinct but not distracting.
- [ ] Each boundary transitions once with an eased, monotonic blend.
- [ ] All desktop and mobile landscape scans pass.
- [ ] Automated asset and transition tests pass.

## Project examples

- Layer speeds and transition math: `app/level-background.mjs`
- Level chapter boundaries: `app/level-one.mjs`
- Asset installation and key cleanup: `scripts/install-semantic-parallax.mjs`
- Connected-component baseline normalization: `scripts/parallax-baseline.mjs`
- Background asset regression tests: `tests/level-one-backgrounds.test.mjs`
- Transition regression tests: `tests/level-background.test.mjs`

