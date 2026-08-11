# Codex Multipart Import Prompt - Trash Dash Master Bundle

I am attaching the Trash Dash master handoff as multiple ZIP files because the complete archive is too large for a single upload.

## Expected required parts
Upload all eight required parts before beginning:

1. `trash-dash-00-core-docs-manifests.zip`
2. `trash-dash-01-shared-heroes-items-ui-reward.zip`
3. `trash-dash-02-level-01.zip`
4. `trash-dash-03-level-02.zip`
5. `trash-dash-04-level-03.zip`
6. `trash-dash-05-level-04.zip`
7. `trash-dash-06-level-05.zip`
8. `trash-dash-07-level-06.zip`

## Optional historical parts
These preserve rejected, replaced, or superseded work. They are not required for implementation and must remain non-authoritative:

9. `trash-dash-08-archive-superseded-images.zip`
10. `trash-dash-09-archive-legacy-main-characters.zip`
11. `trash-dash-10-archive-legacy-level-layouts.zip`

## Import procedure

1. Inspect the repository root, current `AGENTS.md`, `.skills/`, design documentation, asset directories, and git status before changing anything.
2. Create a temporary staging directory outside production runtime asset folders.
3. Extract every required ZIP into the same staging parent. Each archive contains the same root folder:
   `trash-dash-codex-import-master-2026-08-11/`
4. Merge by path. Do not rename level folders or flatten the directory structure.
5. If the optional archive ZIPs are provided, extract them into the same root. Their files already live under `archive/` and must never override `reference/`.
6. Read, in order:
   - `README.md`
   - `MULTIPART_README.md`
   - `docs/game/APPROVED_ASSET_POLICY.md`
   - `docs/game/MAIN_CHARACTERS.md`
   - `docs/game/ITEMS_POWERUPS_UI_REWARDS.md`
   - `docs/game/LEVEL_LAYOUT_GUIDANCE.md`
   - `docs/game/enemies.md`
   - `docs/game/levels.md`
   - `docs/game/foreground-assets.md`
   - `docs/integration/CODEX_MASTER_IMPORT_PROMPT.md`
7. Verify that all required part names match `manifests/MULTIPART_PARTS.json`.
8. After all required parts are extracted, validate files against:
   - `manifests/APPROVED_FILES.txt`
   - `manifests/APPROVAL_STATUS.tsv`
   - `manifests/SHA256SUMS_MASTER.txt`
   - `manifests/MASTER_ASSET_CATEGORIES.json`
9. Report any missing, duplicate, conflicting, corrupt, or unexpectedly overwritten files before implementation.

## Authority rules

- `reference/` is the approved source of truth.
- `archive/` is historical only.
- `reference/level-layouts/dynamic-approved/` is the current approved layout direction.
- Layout blueprints are directional, not literal collision maps or exact runtime coordinates.
- Use the project's installed skills and runtime rules to adapt all artifacts to the actual engine, camera, collision model, animation system, spacing rules, and performance constraints.
- Preserve approved character identities, enemy rosters, bosses, collectibles, power-ups, splash screens, grounded platform language, environment themes, foreground assets, and the same end-of-level dumpster reward across all levels.
- Bosses belong only in their boss encounters. Standard enemies must match the approved roster for their level.
- Do not use rejected or superseded art merely because it is available in an archive part.

## Installation destination

Prefer:
`docs/design/trash-dash/`

If the project already uses a canonical Trash Dash design root, merge into that location instead and update path references consistently.

## This pass is import and audit only

Do not modify gameplay code, runtime atlases, spawn tables, collisions, level scripts, or production assets until the import is validated and I explicitly ask for implementation.

## Final report

Return:
1. required parts received,
2. optional parts received,
3. final staging or install path,
4. file and checksum validation results,
5. approval-policy confirmation,
6. AGENTS and skills references that should be updated,
7. conflicts or missing files,
8. recommended implementation order,
9. git diff summary if anything was installed into the repository.
