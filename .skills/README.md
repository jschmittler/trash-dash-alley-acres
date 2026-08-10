# Trash Dash Skills

These are mandatory project instructions and the only canonical Trash Dash skill system. Begin at `../AGENTS.md`, declare the applicable skills, then read each selected `SKILL.md`. Detailed material lives only in one-level-deep `references/` folders or explicitly linked project guides.

## Registry

| Skill | Location | Governs | Mandatory When | Related Skills |
|---|---|---|---|---|
| Sprite / Art Asset | `sprite-art/SKILL.md` | Art direction, silhouette, source quality, alpha preparation, source sheets, state-art completeness | Source artwork is generated, redrawn, revised, or audited | Rendering, Animation, Placement, Visual QA |
| Rendering / Asset Integrity | `rendering-asset-integrity/SKILL.md` | Aspect ratio, native/visible bounds, source/destination rectangles, uniform scale, anchors, clipping, pixel-safe rendering | Any visual asset is added, changed, processed, loaded, positioned, animated, scaled, or rendered | Sprite Art, Animation, Placement, Overlap, Visual QA |
| Animation / Motion Sprites | `animation/SKILL.md` | State coverage, frame geometry, timing, transitions, pivots, anchors, ground contact, effects | Anything visual animates or gameplay state changes rendered motion | Sprite Art, Rendering, Placement, Visual QA |
| Environment Placement / Z-Order | `environment-placement/SKILL.md` | Grounding, platform exclusion, world placement, layers, parallax, attachment, arena composition | World position, support, environment layout, layering, or boss-arena composition changes | Rendering, Overlap, Visual QA |
| Overlap Prevention / Spatial QA | `overlap-prevention/SKILL.md` | Occupied bounds, exclusion regions, clustering, duplicate prevention, minimum spacing, procedural rejection | Multiple objects or spatial relationships are involved | Rendering, Placement, Visual QA |
| Visual QA | `visual-qa/SKILL.md` | Running-game verification, source/runtime comparison, screenshots, regressions, audit status | After meaningful visual work or during visual diagnosis | All visual skills |
| Conductor | `conductor/SKILL.md` | Level scoring, loops, boss variants, art/gameplay analysis, continuity, rescore, manifests, audio integration | Music/audio is composed, integrated, audited, or rescored | Visual QA when rendered evidence informs music |

## Dependency model

```text
SOURCE ART
   |
   v
SPRITE / ART
   |
   v
RENDERING / ASSET INTEGRITY
   |
   +----------+-----------+
   |          |           |
   v          v           v
ANIMATION   PLACEMENT   EFFECTS/OBJECTS
   |          |
   |          v
   |       OVERLAP QA
   |          |
   +----------+
        |
        v
     VISUAL QA

CONDUCTOR
    |
    v
VISUAL QA
```

Rendering / Asset Integrity is the mandatory middle layer for every visual asset. Visual QA is the final verification gate.

## Applicability examples

```text
New sprite: Sprite Art → Rendering Integrity → Visual QA
Animated character: Sprite Art → Rendering Integrity → Animation → Placement/Overlap when applicable → Visual QA
Environment prop: Sprite Art → Rendering Integrity → Placement → Overlap Prevention → Visual QA
Distorted runtime asset: Rendering Integrity → supporting skills identified by root cause → Visual QA
Sprinkler/body effect: Sprite Art if source is wrong → Rendering Integrity → Animation → Placement → Overlap → Visual QA
New level music: Conductor → Visual QA for rendered-level evidence → audio implementation validation
Rescore: Conductor + Visual QA
```

## Reusable prompt header

```text
SKILLS REQUIREMENT:

Before implementation, read AGENTS.md and the canonical Trash Dash skills registry.
Determine all applicable skills and follow them throughout this task.
Any work involving visual assets MUST use Rendering / Asset Integrity.
Any meaningful visual change MUST finish with Visual QA.
Do not treat these as advisory instructions.
```
