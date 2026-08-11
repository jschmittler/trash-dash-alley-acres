# Step-by-Step Codex Import

1. Download `trash-dash-codex-import-2026-08-10.zip`.
2. Open the Trash Dash project in Codex. Make sure you are on the intended repo/branch and that important uncommitted work is saved.
3. Attach the ZIP to the Codex conversation, or unzip it locally somewhere Codex can access.
4. Open `docs/integration/CODEX_IMPORT_PROMPT.md` from the package and paste its contents into Codex.
5. Let Codex inspect the repository **before** it copies anything. It should report the existing `AGENTS.md`, `.skills/`, design-doc layout, and git state.
6. Have Codex install the package under `docs/design/trash-dash/` unless the repo already has an established canonical design location.
7. Require Codex to merge the AGENTS snippet and update skills by reference, not by duplicating the documents.
8. Require the manifest/hash validation in the import prompt. Do not skip it.
9. Review Codex's git diff. This import should primarily add documentation/reference assets and small AGENTS/skill-reference edits. It should not change gameplay.
10. Commit the source-of-truth import as its own commit before asking Codex to implement Levels 3-6 or rebuild sprite atlases.

After that commit, future Codex prompts can refer directly to paths like `docs/design/trash-dash/docs/game/enemies.md` or `docs/design/trash-dash/reference/environments/level-06/` without re-uploading the art.
