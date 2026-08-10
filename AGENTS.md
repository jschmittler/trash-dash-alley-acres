# Trash Dash Project Instructions

## Trash Dash Skills

The canonical skill registry is `.skills/README.md`. The `.skills/` directory is the only authoritative project skill system. Historical files elsewhere are not active instructions.

Before substantial implementation work, Codex MUST:

1. Read `AGENTS.md`.
2. Read `.skills/README.md`.
3. Determine which skills apply.
4. Read every applicable `SKILL.md` before modifying code or assets.
5. Apply multiple skills when necessary.
6. Run Visual QA after meaningful visual changes.

Conversation history is not a substitute for repository instructions. If a prompt conflicts with a canonical skill, stop and identify the conflict before implementation.

### Mandatory Skill Routing

Any visual asset work MUST use Rendering / Asset Integrity by reading `.skills/rendering-asset-integrity/SKILL.md`.

This includes sprites, characters, enemies, bosses, props, platforms, backgrounds, foregrounds, hazards, effects, sprite sheets, transparency, scaling, anchors, texture loading, rendering, and animation frames.

- If source artwork changes, ADD Sprite / Art Asset: `.skills/sprite-art/SKILL.md`.
- If anything animates, ADD Animation / Motion Sprites: `.skills/animation/SKILL.md`.
- If world position, grounding, layering, or environment layout changes, ADD Environment Placement / Z-Order: `.skills/environment-placement/SKILL.md`.
- If multiple objects or spatial relationships are involved, ADD Overlap Prevention / Spatial QA: `.skills/overlap-prevention/SKILL.md`.
- After meaningful visual work MUST use Visual QA: `.skills/visual-qa/SKILL.md`.
- For music/audio work USE Conductor: `.skills/conductor/SKILL.md`.
- For rescoring USE Conductor + Visual QA.

### Skill Declaration

Before substantial implementation, output or record the applicable skill set and actually read those files before editing.

Example:

```text
Applicable Trash Dash skills:
- Rendering / Asset Integrity
- Sprite / Art Asset
- Animation / Motion Sprites
- Environment Placement / Z-Order
- Visual QA
```

For any visual task, Rendering / Asset Integrity must appear. For meaningful visual work, Visual QA must appear.

### Validation

Run `npm run validate:skills` after changing project skills, references, the registry, or these instructions. The normal `npm test` command includes the validator and canonical skill-system tests.
