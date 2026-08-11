# Trash Dash Design Source of Truth

Before modifying enemies, bosses, level layouts, foreground props, sprite/animation systems, or visual presentation, read:

- `docs/design/trash-dash/docs/game/DECISIONS.md`
- `docs/design/trash-dash/docs/game/levels.md`
- `docs/design/trash-dash/docs/game/enemies.md`
- `docs/design/trash-dash/docs/game/foreground-assets.md`
- `docs/design/trash-dash/manifests/asset-manifest.json`

Use visual references under `docs/design/trash-dash/reference/`. Files under `archive/` are noncanonical.

Character creation, animation, level creation, enemy layout, prop placement, and visual-audit skills must consult these sources before implementation. Do not use a source sprite sheet directly as a runtime atlas until its frame boundaries, alpha, anchors, collision geometry, and required states have been validated.
