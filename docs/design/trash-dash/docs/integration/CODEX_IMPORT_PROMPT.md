# Codex Import Prompt - Trash Dash Design Source of Truth

I am attaching the `trash-dash-codex-import-2026-08-10-v2` package. Install it into the current Trash Dash repository as a canonical design/reference layer.

## Safety first
1. Inspect the repository root, current `AGENTS.md`, `.skills/` structure, existing design docs, asset directories, and git status before changing anything.
2. Do not modify gameplay code, runtime sprites, levels, spawn tables, enemy behavior, or existing production assets during this import pass.
3. Do not delete existing boss assets unless they are being safely superseded by the packaged references. This v2 package includes approved Level 1 boss and Brutus reference sheets.
4. If a destination path already exists, diff it. Preserve newer project-specific rules and merge rather than blindly overwrite.

## Install location
Prefer:
`docs/design/trash-dash/`

Copy the package contents there while preserving its internal structure. If the project already has a canonical Trash Dash design root, use that location instead and update internal references consistently.

## Integration
- Merge the provided `AGENTS_SOURCE_OF_TRUTH_SNIPPET.md` into the repository's appropriate `AGENTS.md`.
- Update the existing character/enemy creation, animation/sprite, level creation, enemy layout, prop placement, and visual-audit skills so they explicitly consult the canonical docs and manifest before making changes.
- Do not duplicate full documents inside skills. Reference the canonical paths.
- Treat `archive/` as noncanonical.
- Treat `reference/characters/**/sprites/*.png` as animation source sheets requiring extraction/validation, not ready-to-use atlases.

## Validation
After copying:
- verify every path listed in `manifests/asset-manifest.json` exists,
- verify SHA-256 hashes against `manifests/SHA256SUMS.txt`,
- report any missing/corrupt files,
- confirm Levels 1-6 reference galleries are accessible,
- confirm every Level 1-6 boss has concept art plus sprite reference art,
- confirm Level 1 and 2 standard enemies have concept/sprite references,
- confirm Levels 3-6 common enemies and secret Level 6 content remain accessible and correctly linked.

## Final report
Return:
1. final install path,
2. files copied,
3. AGENTS/skills files updated,
4. any conflicts merged,
5. validation results,
6. git diff summary.

Do not proceed to runtime implementation until I explicitly ask.
