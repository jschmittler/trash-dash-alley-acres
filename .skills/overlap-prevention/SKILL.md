---
name: overlap-prevention
description: Audit and prevent unintended overlap, crowding, clipping, occlusion, duplicate placement, and invalid spacing among Trash Dash sprites, props, platforms, enemies, pickups, effects, backgrounds, and UI. Use whenever multiple visual, motion, collision, or composition footprints share a scene or procedural placement is involved.
---

# Trash Dash Overlap Prevention / Spatial QA

Read [Composition and Encounters](references/composition-and-encounters.md) for category padding, clustering, encounter density, exclusion regions, and deterministic placement rules.

## Applicability relationships

- Always apply [Rendering / Asset Integrity](../rendering-asset-integrity/SKILL.md) so checks use meaningful visible bounds.
- Also apply [Environment Placement / Z-Order](../environment-placement/SKILL.md) for world coordinates, supports, layers, and platform relationships.
- Finish meaningful visual changes with [Visual QA](../visual-qa/SKILL.md).

## Spatial contract

1. Distinguish texture, visible-alpha, render, collision, motion/effect, and expanded composition bounds.
2. Use full visible/motion bounds for prop overlap and platform intersections; use gameplay collision only for gameplay contact.
3. Define exclusion regions, category-aware minimum spacing, duplicate/repeated-asset spacing, and negative-space budgets centrally.
4. Reject overlapping sibling props, platform intersections, unreachable pickups, embedded scenery, duplicate hero props, and effects detached from emitters.
   For persistent arena and landmark props, duplicate prevention is a lifecycle contract rather than a one-frame count. Deterministically assert the same single identity after entry, retry, checkpoint recovery, phase transitions, defeat, exit, and re-entry, including incoming objects around viewport transitions.
5. Keep grounded patrols on named supports and flying actors inside authored bands using their largest complete silhouettes.
6. Small enemies may form readable pairs/trios; large enemies own isolated spaces; boss arenas contain no ordinary encounter population.
7. Procedural placement must validate every candidate, choose the nearest semantically appropriate legal result, or skip. Never accept an invalid fallback.
8. Add deterministic assertions for every recurring spatial contract and re-run them after bounds, scale, platform, or geometry changes.

## Project guide

Read `../../docs/guides/enemy-placement-and-grounding.md` for the complete encounter teaching, support, patrol, and population rules.

## Handoff

Report relationships checked, bounds and padding used, exclusion regions, duplicates or overlaps corrected, population/density findings, procedural rejection behavior, assertions added, and representative runtime views inspected.
