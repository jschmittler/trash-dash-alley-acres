# Canonical Source Readiness and Atlas Extraction Design

**Date:** 2026-08-11

**Status:** Approved design; implementation planning pending

## Objective

Establish an auditable source-to-runtime readiness system for the approved Trash Dash master import and prove a deterministic atlas-extraction pipeline on shared assets plus Level 1. The pipeline must preserve the imported reference package unchanged, reject unsafe or ambiguous extraction, and produce review-only candidate atlases and contact sheets without wiring them into gameplay.

## Scope

The readiness ledger covers every approved shared and Level 1 reference file in `docs/design/trash-dash/reference/`, including directional concepts and layout material that are not atlas candidates.

The first extraction slice covers:

- Regular and powered Trashy sprite-reference sheets.
- Regular and powered Jimothy sprite-reference sheets.
- Approved collectible and power-up sprite-reference sheets.
- Taco Power and Kite Power splash sprite-reference sheets.
- The approved dumpster reward sprite-reference sheet.
- Level 1 Spider, Pigeon, Mosquito, Pilfer/Opossum, Snake, and Toxic Trashbag boss sprite-reference sheets.

The Level 1 foreground sheet, gameplay-tile board, environment concepts, character concepts, and dynamic layout blueprint receive readiness records. They are not promoted into candidate atlases unless they contain separable runtime art and have an explicit reviewed recipe.

This pass does not modify `app/`, `public/assets/`, runtime animation tables, collisions, spawn data, level definitions, or renderer behavior.

## Authority and Immutability

Files under `docs/design/trash-dash/reference/` are the approved visual source of truth. The extraction pipeline reads but never edits them. Files under `docs/design/trash-dash/archive/` remain historical and are excluded from extraction recipes.

Every readiness record stores the source SHA-256 from the authoritative import manifest. A build fails when the source byte hash differs from the recorded value. Source changes therefore require an explicit approval and recipe review rather than silently altering generated output.

## Selected Approach

Use manifest-driven explicit extraction. Each runtime candidate owns reviewed crop rectangles and state metadata. A deterministic Node.js builder using the existing Sharp dependency extracts those rectangles, removes presentation backgrounds where the recipe explicitly defines a safe method, normalizes complete silhouettes into fixed cells, and writes candidate atlases and labeled contact sheets.

Automated row or object inference is not authoritative because the approved sheets contain variable spacing, labels, shadows, glow, debris, and detached effects. Manual image-editor output is not authoritative because it is not reproducible. Detection may assist recipe authoring, but committed recipes remain explicit and deterministic.

## Project Layout

```text
concepts/canonical-import/
├── README.md
├── readiness.json
├── extraction-recipes.json
├── build-candidate-atlases.mjs
└── generated/
    ├── shared/
    │   ├── <asset>-candidate-atlas.png
    │   └── <asset>-contact-sheet.png
    └── level-01/
        ├── <entity>-candidate-atlas.png
        └── <entity>-contact-sheet.png

tests/
└── canonical-import-readiness.test.mjs
```

Generated outputs are review artifacts. Their location deliberately distinguishes them from shipped files in `public/assets/generated/`.

## Readiness Record Model

Each entry in `readiness.json` contains:

- `id`: stable kebab-case identifier.
- `sourcePath`: repository-relative authoritative path.
- `sha256`: expected source digest.
- `dimensions`: source width and height in pixels.
- `approval`: `approved` for this slice.
- `category`: manifest category such as `main_characters`, `enemies_and_bosses`, `environments`, `foreground_assets`, `collectibles_and_powerups`, `powerup_splash_ui`, `end_level_reward`, `interactive_platforms_and_hazards`, or `dynamic_level_layouts`.
- `role`: specific source role such as `sprite_reference`, `concept_reference`, `environment_direction`, `foreground_board`, or `layout_blueprint`.
- `disposition`: `runtime_candidate` or `directional_reference`.
- `readiness`: `source_verified`, `recipe_required`, `candidate_extracted`, `qa_passed`, or `blocked`.
- `referenceComplete`: whether the approved source communicates the intended identity and state direction.
- `runtimeComplete`: always `false` in this pass because no candidate is exercised by the running game.
- `recipeId`: extraction recipe identifier when applicable.
- `derivedOutputs`: candidate atlas and contact-sheet paths when generated.
- `blockers`: concrete reasons extraction or promotion cannot proceed.
- `notes`: state gaps, effect separation requirements, and review evidence.

`historical_only` is reserved for future ledger expansion if archived provenance is recorded. No historical file may have an extraction recipe.

## Extraction Recipe Model

Each entry in `extraction-recipes.json` contains:

- `id` and matching `sourceId`.
- `cell`: fixed candidate cell width and height.
- `columns`: atlas column count.
- `canonicalFacing`: authored facing or `not_applicable`.
- `anchor`: `FEET`, `BOTTOM_CENTER`, `LOGICAL_CENTER`, or another named contract-defined anchor.
- `baseline`: integer pixel row inside each candidate cell when grounding applies.
- `background`: explicit removal method and parameters. Unsupported presentation backgrounds block extraction.
- `states`: ordered named states with loop recommendation, frame duration recommendation, interruptibility recommendation, and ordered frames.
- Each frame's source crop rectangle, destination cell, logical anchor, event tags, and whether it is body, effect, or combined reference art.
- `effectPolicy`: whether effects remain combined for review or are emitted into a separate candidate atlas.
- `requiredStates` and `missingStates`: an explicit state-coverage assessment based on actual game mechanics and the canonical skills.

The pipeline does not invent frames, duplicate unrelated poses to fill state gaps, or infer state timing from global clocks. Timing values are recommendations for later runtime integration, not gameplay changes.

## Extraction Data Flow

1. Load and schema-check the readiness ledger and recipe file.
2. Confirm each recipe points to one approved `runtime_candidate` source.
3. Verify the source exists, dimensions match, and SHA-256 is unchanged.
4. Validate crop rectangles, atlas cells, state ordering, unique output names, and effect ownership.
5. Extract each reviewed source rectangle.
6. Apply only the recipe's declared background-removal operation.
7. Inspect alpha bounds and reject empty, clipped, contaminated, or unsafe crops.
8. Scale only with nearest-neighbor sampling and one uniform factor when normalization is required.
9. Place each complete silhouette by its declared logical anchor into the fixed candidate cell.
10. Emit the candidate atlas and a labeled contact sheet.
11. Recompute output metadata and update no handwritten source or recipe field automatically.

## Failure Policy

The builder fails closed for:

- Source checksum or dimension drift.
- Missing files, duplicate IDs, duplicate output paths, or unknown categories.
- Crops outside source bounds or destination cells outside the atlas.
- Empty crops or frames with no visible alpha.
- Unintended visible alpha touching a candidate cell boundary.
- Nonuniform scaling or fractional source rectangles.
- Missing anchor/baseline metadata for grounded actors.
- Body and effect duplication across output cells.
- Missing required state declarations.
- Historical or directional-only sources referenced by extraction recipes.
- Presentation backgrounds that cannot be removed without damaging intended artwork.

When extraction is unsafe, the readiness record is `blocked` with a specific reason. The builder does not emit a compromised candidate.

## Visual and Animation Contracts

Candidate actors preserve one canonical scale within each gameplay form. Larger poses reserve a larger source or motion envelope instead of receiving state-specific runtime scaling. Grounded frames use a stable feet/baseline anchor; flying frames use a documented logical center or attachment origin. Horizontal flipping is allowed only when the authored facing and asymmetric accessories remain valid.

Body art and emitted effects are separated when their bounds, timing, scale, or layer differ. Combined presentation frames may remain as reference-only cells, but they cannot be treated as runtime-complete body frames.

The readiness ledger records applicable idle, locomotion, jump, land, hit, attack, defeat, victory, glide, transformation, boss phase, and special states. It records absent required art instead of substituting unrelated frames.

## Verification

`tests/canonical-import-readiness.test.mjs` validates:

- Ledger and recipe schema and stable unique identifiers.
- Exact agreement with approved shared and Level 1 manifest paths.
- Source checksums and dimensions.
- Recipe-to-source authority and disposition.
- Crop and destination bounds.
- Required metadata, frame ordering, and state declarations.
- Populated visible alpha and transparent safety margins.
- Stable grounded baselines and valid logical anchors.
- Uniform scaling and integer pixel geometry.
- Deterministic candidate atlas and contact-sheet bytes across consecutive builds.
- No generated candidate is placed under `public/assets/`.

Review includes native-scale and enlarged inspection of every candidate frame and contact sheet. Static extraction can be marked `qa_passed` only for source-to-candidate fidelity. Runtime scale, motion, transitions, collision alignment, and in-game appearance remain `CANNOT VERIFY` because this pass does not add runtime consumers.

## Documentation and Commands

`concepts/canonical-import/README.md` documents source authority, candidate status, rebuild commands, recipe conventions, promotion gates, and known blockers. `package.json` receives a focused build command and focused test command for the canonical import pipeline. The project asset manifest receives a short entry distinguishing these review candidates from shipped runtime atlases.

## Acceptance Criteria

- Every approved shared and Level 1 reference has exactly one readiness record.
- Every emitted frame is backed by an explicit reviewed crop recipe.
- Imported reference files remain byte-identical to the approved master checksums.
- Candidate builds are deterministic and all focused tests pass.
- Each emitted candidate atlas has a corresponding contact sheet and state metadata.
- Unsafe sources are blocked with actionable reasons rather than approximated.
- No candidate is consumed by gameplay or placed in production asset folders.
- Static QA evidence is recorded accurately, with all runtime behavior left `CANNOT VERIFY`.

## Follow-on Boundary

A separate runtime-integration pass may promote selected candidates into `public/assets/generated/`, define final animation tables, connect renderer consumers, align collisions and effects, and perform running-game Visual QA. Promotion requires an approved candidate, resolved blockers, explicit runtime metadata, focused automated tests, and observation in the running game.
