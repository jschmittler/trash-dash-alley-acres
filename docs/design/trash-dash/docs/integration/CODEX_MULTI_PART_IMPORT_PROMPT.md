# Codex multi-part import prompt

I am attaching the Trash Dash master handoff as multiple ZIP files because the complete package is too large for a single transfer.

## Parts expected

Approved source-of-truth parts:
1. `trash-dash-master-part-01-core-shared-approved.zip`
2. `trash-dash-master-part-02-levels-01-02-characters-approved.zip`
3. `trash-dash-master-part-03-levels-03-04-characters-approved.zip`
4. `trash-dash-master-part-04-levels-05-06-characters-approved.zip`
5. `trash-dash-master-part-05-levels-01-03-environments-approved.zip`
6. `trash-dash-master-part-06-levels-04-06-environments-approved.zip`
7. `trash-dash-master-part-07-foreground-and-gameplay-tiles-approved.zip`
8. `trash-dash-master-part-08-dynamic-level-layouts-approved.zip`

Historical archive parts, never current source of truth:
9. `trash-dash-master-part-09-archive-alternates.zip`
10. `trash-dash-master-part-10-archive-superseded-heroes.zip`
11. `trash-dash-master-part-11-archive-superseded-layouts.zip`

## Import procedure

1. Before editing the game, inspect git status, repository structure, current `AGENTS.md`, `.skills/`, and existing Trash Dash design/reference folders.
2. Create one temporary staging location outside runtime asset folders.
3. Extract every attached ZIP into the same staging parent. Each part shares the root folder:
   `trash-dash-codex-import-master-2026-08-11/`
4. Merge matching directories. Do not create eleven parallel package roots.
5. If the same path appears more than once, confirm the bytes are identical before accepting the merge. Do not silently overwrite a differing file.
6. Wait until all parts are present before validating or implementing anything.
7. Read, in order:
   - `README.md`
   - `docs/game/APPROVED_ASSET_POLICY.md`
   - `docs/game/DECISIONS.md`
   - `docs/game/MAIN_CHARACTERS.md`
   - `docs/game/ITEMS_POWERUPS_UI_REWARDS.md`
   - `docs/game/LEVEL_LAYOUT_GUIDANCE.md`
   - `docs/game/enemies.md`
   - `docs/game/levels.md`
   - `docs/game/foreground-assets.md`
   - `docs/integration/CODEX_MASTER_IMPORT_PROMPT.md`
8. Treat `reference/` as approved unless a document explicitly marks a subfolder as superseded.
9. Treat all of `archive/` and `reference/level-layouts/superseded-canonical-v1/` as historical only. Never select runtime assets from those locations.
10. Treat `reference/level-layouts/dynamic-approved/` as the current level-layout direction.

## Critical interpretation rule

The level layout blueprints and all other concept artifacts are directional design inputs. They are not literal collision maps or instructions to bypass the game architecture. Consult the project's installed skills for character creation, sprite/animation preparation, level creation, enemy layout, prop placement, grounded platform construction, visual auditing, collision, camera, parallax, responsive layout, and performance. Adapt the approved visual direction to the actual runtime structure while preserving the approved identity and behavior of the work.

## Required validation before implementation

- Confirm Parts 1 through 8 are present and readable.
- Confirm Parts 9 through 11 are isolated as archive material.
- Confirm every approved path listed in `manifests/APPROVED_FILES.txt` exists after the merge.
- Verify hashes using `manifests/SHA256SUMS_MASTER.txt`.
- Confirm all six levels have environment art, enemies, bosses, foreground assets, and current dynamic layout blueprints.
- Confirm Trashy and Jimothy each have approved regular and powered-up concept/sprite references.
- Confirm collectible, Taco Power, Kite Power, splash-screen, and end-reward assets exist.
- Report any missing, corrupt, conflicting, or duplicated files before changing gameplay.

## Implementation boundaries

Do not begin runtime implementation during the import and validation pass. First return:
1. final staging/install path,
2. received parts,
3. missing parts,
4. validation results,
5. approval/archive separation confirmation,
6. AGENTS and skills references that need updating,
7. recommended implementation sequence,
8. git diff summary if any repository documentation was changed.

Only proceed to gameplay or asset integration after I explicitly approve the audit.
