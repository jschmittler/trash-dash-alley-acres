# Trash Dash Skills Audit

## Canonical Location

The single authoritative project skill directory is:

`.skills/`

Fresh-session routing is:

`AGENTS.md → .skills/README.md → applicable canonical SKILL.md files → optional one-level-deep references`

## Canonical Skills

| Skill | Exact path |
|---|---|
| Sprite / Art Asset | `.skills/sprite-art/SKILL.md` |
| Rendering / Asset Integrity | `.skills/rendering-asset-integrity/SKILL.md` |
| Animation / Motion Sprites | `.skills/animation/SKILL.md` |
| Environment Placement / Z-Order | `.skills/environment-placement/SKILL.md` |
| Overlap Prevention / Spatial QA | `.skills/overlap-prevention/SKILL.md` |
| Visual QA | `.skills/visual-qa/SKILL.md` |
| Conductor | `.skills/conductor/SKILL.md` |

## Existing Skills Found

### Canonical-looking material present before normalization

- `AGENTS.md`
- `.skills/README.md`
- Seven `.skills/*/SKILL.md` files and seven `agents/openai.yaml` files
- `scripts/validate-skills.mjs`

These established the intended location but were not self-contained: several canonical skills linked into a second active-looking library, required applicability links were incomplete, and validation checked markers rather than resolving the whole graph.

### Parallel active-looking skill library

- `skills/game-asset-library/game-art-contract.md`
- `skills/game-asset-library/game_asset_director_SKILL.md`
- `skills/game-asset-library/player_character_creator_SKILL.md`
- `skills/game-asset-library/enemy_creator_SKILL.md`
- `skills/game-asset-library/boss_creator_SKILL.md`
- `skills/game-asset-library/item_creator_SKILL.md`
- `skills/game-asset-library/npc_creator_SKILL.md`
- `skills/game-asset-library/vfx_creator_SKILL.md`
- `skills/game-asset-library/level_creator_SKILL.md`
- `skills/game-asset-library/conductor_SKILL.md`
- `tests/game-asset-library.test.mjs`, which enforced the second library rather than the canonical tree

### Other rule and instruction material

- `.summer/pixel-anchor.md`: duplicate pixel, anchor, scale, effects, and QA rules.
- `docs/guides/parallax-backgrounds.md`: current specialist background manual.
- `docs/guides/enemy-placement-and-grounding.md`: current specialist encounter/support manual.
- `docs/visual-audit.md`: current evidence tracker.
- `docs/asset-manifest.md`: current source/runtime ownership map.
- `DESIGN.md`, `PRODUCT.md`, and concept READMEs/PROMPTS: product, art, and source-family context rather than standalone skills.
- `docs/superpowers/plans/`, `docs/superpowers/specs/`, `docs/superpowers/reports/`, and `.superpowers/`: historical plans, decisions, evidence, and execution ledgers.

No repository-local `CODEX.md`, `CLAUDE.md`, `.agents/`, `.codex/`, `rules/`, or standalone `instructions/` skill system was found.

## Skills Merged

- The shared `game-art-contract.md` and `.summer/pixel-anchor.md` rules were merged into Sprite Art, Rendering Integrity, Animation, Placement, Overlap, Visual QA, `sprite-art/references/source-art-contract.md`, and `rendering-asset-integrity/references/runtime-visual-contract.md`.
- Player, enemy, boss, item, NPC, animated-object, platform, and VFX state coverage was merged into Sprite Art and `animation/references/entity-state-coverage.md`.
- Level Creator and boss-arena placement rules were merged into Environment Placement and `environment-placement/references/level-arena-placement.md`.
- Enemy grouping, size classes, negative space, occupied bounds, duplicate prevention, and procedural rejection were merged into Overlap Prevention and `overlap-prevention/references/composition-and-encounters.md`.
- The full Conductor workflow—level briefs, soundtrack bible, loop/boss pair, Level 0–4 rescoring, masters/archive/manifest, loudness, looping, and runtime validation—was merged into the canonical Conductor skill and `conductor/references/soundtrack-workflow.md`.
- Existing parallax and enemy-grounding manuals remain current specialist guides and are explicitly reachable from the appropriate canonical skills.

## Skills Created

The seven canonical directories existed at the start of this normalization pass. This pass created their missing self-contained reference layer:

- `.skills/sprite-art/references/source-art-contract.md`
- `.skills/rendering-asset-integrity/references/runtime-visual-contract.md`
- `.skills/animation/references/entity-state-coverage.md`
- `.skills/environment-placement/references/level-arena-placement.md`
- `.skills/overlap-prevention/references/composition-and-encounters.md`
- `.skills/conductor/references/soundtrack-workflow.md`

It also created the machine-checkable regression suite at `tests/skill-system.test.mjs`.

## Deprecated / Removed Copies

- Every file under `skills/game-asset-library/` is now explicitly marked `DEPRECATED / HISTORICAL`.
- Former `*_SKILL.md` files no longer contain YAML skill frontmatter and cannot masquerade as active skills.
- `skills/README.md` points all work to the canonical registry.
- `.summer/pixel-anchor.md` is a compatibility pointer rather than a duplicate contract.
- Canonical skills no longer depend on the historical library.
- `concepts/jimothy/README.md` no longer incorrectly claims that playable Jimothy is unintegrated.

Historical files were retained for provenance rather than deleted. Older plans and reports may truthfully mention the library that existed when they were written; they are evidence, not current routing instructions.

## Cross References

The validator resolves every `SKILL.md` reference. Required relationships are:

- Sprite Art → Rendering, Animation, Visual QA.
- Rendering → Sprite Art, Animation, Placement, Overlap, Visual QA.
- Animation → Sprite Art, Rendering, Placement, Visual QA.
- Placement → Rendering, Overlap, Visual QA.
- Overlap → Rendering, Placement, Visual QA.
- Visual QA → Sprite Art, Rendering, Animation, Placement, Overlap.
- Conductor → Visual QA.

All paths are repository-relative. Canonical skills contain no absolute local-machine paths or conversation-dependent references.

## AGENTS.md Integration

`AGENTS.md` requires a fresh agent to read the root instructions, registry, determine applicability, declare the chosen skill set, read every applicable file, use multiple skills when necessary, and finish meaningful visual work with Visual QA.

Routing is automatic by work type: all visual work uses Rendering Integrity; source changes add Sprite Art; animation adds Animation; placement/layering adds Environment Placement; spatial relationships add Overlap Prevention; music uses Conductor; rescoring uses Conductor and Visual QA.

## Mandatory Visual Workflow

```text
Visual task
→ Rendering / Asset Integrity
→ Sprite Art, Animation, Placement, and/or Overlap as applicable
→ Visual QA in the running game
```

Systemic root causes take priority over per-object scale, offset, crop, or layer patches.

## Validator

Run:

```bash
npm run validate:skills
```

The validator checks the registry, exact canonical directory set, every non-empty `SKILL.md`, frontmatter names/descriptions, UI metadata, mandatory cross-references, relative link resolution, every canonical Markdown reference file for portability, AGENTS routing, registry paths, local-machine paths, conversation-dependent language, and active skill-like files outside `.skills/`. `npm test` runs it through both `pretest` and the existing test path; `tests/skill-system.test.mjs` exercises failure fixtures.

## Current Visual Audit Skill Set

The current Level 1 + Level 2 rendering audit uses:

- `.skills/rendering-asset-integrity/SKILL.md`
- `.skills/sprite-art/SKILL.md`
- `.skills/animation/SKILL.md`
- `.skills/environment-placement/SKILL.md`
- `.skills/overlap-prevention/SKILL.md`
- `.skills/visual-qa/SKILL.md`

## Remaining Problems

- Skill architecture: none known after validator and cross-reference verification.
- Current visual audit: the post-normalization desktop and mobile-landscape browser sample is complete and recorded in `docs/visual-audit.md`; real-device mobile testing remains a separate release check.
- Historical documents contain old file names, prior command outputs, and some absolute screenshot/source paths. They are retained evidence and are not reachable as active skills.
- `PRODUCT.md` still describes the original one-level product scope while Levels 1 and 2 are implemented; this is product-documentation drift, not a skill-routing conflict.
