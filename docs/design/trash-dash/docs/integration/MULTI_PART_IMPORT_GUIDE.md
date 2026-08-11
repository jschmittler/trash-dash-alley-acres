# Trash Dash Multi-Part Import Guide

## Why the package is split

The complete bundle is too large for a reliable single upload. The numbered archives reconstruct the same source-of-truth package when merged into one directory.

## Required approved parts

- `00-core-docs-and-manifests.zip`
- `01-approved-heroes-items-ui-rewards.zip`
- `02-approved-foreground-and-gameplay-tiles.zip`
- `03-approved-dynamic-level-layouts.zip`
- `04-approved-characters-levels-01-02.zip`
- `05-approved-characters-levels-03-04.zip`
- `06-approved-characters-levels-05-06.zip`
- `07-approved-environments-levels-01-02.zip`
- `08-approved-environments-levels-03-04.zip`
- `09-approved-environments-levels-05-06.zip`

## Historical completeness parts

- `10-archive-visual-alternates-and-replaced-sheets.zip`
- `11-archive-previous-main-character-package.zip`
- `12-archive-previous-layout-package.zip`

The historical parts are included because the handoff preserves rejected and superseded history, but Codex must never treat them as implementation sources.

## Correct extraction behavior

All ZIP files contain the same top-level directory. Extract or merge them into one location. Do not produce folders such as `part-01/`, `part-02/`, or separate design roots.

## Recommended workflow

1. Protect current work with a clean commit or checkpoint.
2. Import part `00` and read the docs.
3. Import approved parts `01` through `09`.
4. Import archive parts `10` through `12`.
5. Run manifest and checksum validation.
6. Review the git diff.
7. Commit the source-of-truth import separately.
8. Begin implementation only after explicit approval.
