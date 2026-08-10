# Task 5 Report: Jimothy Victory Normalization

Status: DONE

## Applicable project skills

- Rendering / Asset Integrity
- Sprite / Art Asset
- Animation / Motion Sprites
- Environment Placement / Z-Order
- Visual QA
- Browser control for running-game inspection

The canonical registry, every selected skill, and each routed reference were read before implementation. The in-app browser workflow was read before runtime inspection.

## Root cause

Task 1 had already normalized Jimothy's actual runtime destination to 84×84 in small form and 110×110 in large form. There was no existing victory multiplier. The remaining pop came from source scale inside the fixed 192×192 crop: the generic authored-strip path independently expanded each high-resolution victory pose until it nearly filled the cell.

Measured pre-fix atlas alpha bounds were:

- `small_idle:0`: 140×119 at x26..165, y65..183.
- `small_victory`: 190×170, 189×183, 142×183, and 149×183, all ending on row 183.

The destination and collision stayed constant while the visible body became as much as 35.7% wider and 53.8% taller than the idle source envelope. This is why the supplied runtime reference looked enlarged.

## RED evidence

The production-facing tests were written before the repair. The first focused run failed three gates:

```text
node --test tests/player-animation.test.mjs tests/jimothy-player-atlas.test.mjs

5 pass, 3 fail
- victory source was 1774×887 instead of a canonical 768×192 four-cell strip
- victory frame 0 was 190px wide instead of matching idle's 140px body width
- playerAnimationDrawRect was absent, so runtime anchor/destination ownership was not testable
```

The final tests measure real PNG alpha bounds, compare idle/victory destination dimensions, compare source and destination baselines, check bottom-center registration, compare both form scales, preserve the hitbox contract, verify the real runtime consumes the shared helper, and reject victory-side scale/destination overrides.

## Source and atlas repair

- Reframed the four approved Jimothy victory poses into a 4×1 transparent 192px-cell master at one shared nearest-neighbor pixel scale.
- Preserved the squat rounded gray body, face mask, compact legs, and bob tail. Poses were not independently scaled.
- New actual visible bounds are 140×126, 140×136, 112×144, and 112×137.
- Every frame is centered within 1px of x96 and ends at opaque row 183 for logical baseline 184.
- Added `JIMOTHY_VICTORY_CONTRACT` with the source layout, baseline, bottom-center anchor, 140px canonical side-profile width, 144px victory motion height, and 84/110 form destinations.
- The builder now extracts exact 192px victory cells and rejects a noncanonical source layout, oversized visible body, baseline drift, or center-anchor drift.
- The private atlas, private contact sheet, public motion atlas, and public contact sheet rebuild from the same output.

## Runtime contract

`playerAnimationDrawRect(player, animation)` is now the one runtime and debug-overlay owner for player destination geometry. It derives the rectangle only from the selected form animation and the actor's bottom-center anchor. Victory has no draw multiplier, conditional destination, or exception table.

The inventory records `FORM_CANONICAL` 84/110 destinations with an empty `stateExceptions` list. Player collision is unchanged:

- small: 32×46 body, `{ x: 4, y: 3, w: 24, h: 43 }` hitbox;
- large: 38×58 body, `{ x: 4, y: 4, w: 30, h: 54 }` hitbox.

The source-to-destination scale remains uniform on both axes: 84/192 = 0.4375 for small and 110/192 = 0.5729167 for large. Frame 0 visible width is 61.25 world pixels small and 80.2083 world pixels large before and during the transition. Raised victory poses legitimately extend the motion envelope without changing pixel scale.

## Determinism

Two consecutive `node concepts/jimothy/build-atlas.mjs` runs produced identical hashes:

```text
jimothy-victory-source.png                 310f514daf21071a5db136ab6761e020e45ebae3b482f9fe396e37891e845a8e
jimothy-animation-atlas.png                89d9eb8762952e67219a682d616fa94f5e94c586f164d5ebc58e56a1d678dc32
jimothy-animation-contact-sheet.png        89d9eb8762952e67219a682d616fa94f5e94c586f164d5ebc58e56a1d678dc32
jimothy-hero-motion.png                     89d9eb8762952e67219a682d616fa94f5e94c586f164d5ebc58e56a1d678dc32
jimothy-hero-contact-sheet.png              89d9eb8762952e67219a682d616fa94f5e94c586f164d5ebc58e56a1d678dc32
```

## Running-game Visual QA

Route: `/?victoryTest=level2&victoryTransitionTest=jimothy&visualQa=task5-jimothy-victory&debugVisuals=1`, entered through title and **Start as Jimothy** at the normal 1280×720 desktop viewport.

The development-only transition fixture freezes the authored player/camera position, then enables the ordinary existing exit condition after 1.8 seconds. It owns no animation size or renderer branch. Consecutive evidence:

- `task-5-before-victory.jpg`: `large_idle`, fixed camera/player, yellow 110×110 destination, cyan 38×58 collision, magenta bottom-center ground anchor.
- `task-5-during-victory.jpg`: `large_victory`, same camera/player, same yellow destination, cyan collision, and magenta anchor.

Observed: the normalized squat/bob-tail Jimothy silhouette transitions without the supplied enlargement, baseline pop, destination pop, collision change, clipping, blur, or warning/error log. The holy dumpster reveal changes as expected after the real victory condition; the camera and player registration remain fixed for comparison.

## Verification

- Focused RED-to-GREEN suite: 16/16 passed.
- Related player/inventory/asset/victory matrix: 51/51 passed.
- `npm test`: production build passed; canonical skill validation passed; 315/315 tests passed.
- `npm run lint`: zero errors; one pre-existing `<img>` performance warning in `trash-dash-game.tsx`.
- `git diff --check`: passed.
- Runtime warning/error log: empty.

## Concerns

None blocking. The supplied reference was a dark runtime crop rather than an authoring master, so approved existing victory pixels were normalized instead of redrawn. Unrelated dirty/untracked work was preserved and excluded from Task 5 staging.
