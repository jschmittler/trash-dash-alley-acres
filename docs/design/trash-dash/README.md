# Trash Dash - Codex Import Master Bundle

This package is the consolidated handoff bundle for the Trash Dash project. It combines the previously approved Codex import package with later approved work: main characters, items, power-ups, UI splash screens, end-of-level reward, and dynamic level layout blueprints.

## Source-of-truth rule
Use only files under `reference/` as the approved visual source of truth unless a file is explicitly marked as superseded in documentation. Files under `archive/` are not the current source of truth. They exist only as historical reference.

## Important implementation note
The level layout images are directional. They are intended to guide pacing, route variety, enemy placement patterns, traversal identity, and set piece composition. They are not 1:1 collision maps. Codex should interpret them through the game's current technical structure and the project's skills, rules, and runtime constraints.
## Multi-part distribution

Because the complete source-of-truth package is large, it is also distributed as numbered ZIP parts. Every part uses the same internal root folder, `trash-dash-codex-import-master-2026-08-11/`. Import the parts into one shared destination and merge by path. Do not create a separate repository folder for each ZIP.

Import `00-core-docs-and-manifests.zip` first, followed by approved parts `01` through `09`. Parts `10` through `12` contain historical or superseded material and must remain under `archive/`; they are included for completeness but never override `reference/`.
