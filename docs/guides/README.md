# Trash Dash Worldbuilding Guides

These guides preserve the production rules developed while building Level 1. They are written to work in two contexts:

1. Future Trash Dash levels can reuse the current Canvas renderer, asset pipeline, and encounter data.
2. Other side-scrolling games can adopt the same contracts while substituting their own dimensions and engine code.

## The shared principle: visible art needs a declared contact line

A sprite or background object is not grounded because its image rectangle touches a coordinate. It is grounded when its **lowest intended visible contact pixel** is registered to a declared world surface.

That principle applies at three scales:

- Background landmarks have a semantic plane and a background baseline.
- Decorative props have measured visible bounds and a prop baseline.
- Ground enemies have normalized feet and a supporting collision surface.

Transparent padding, atlas-cell size, and generated-image composition are never authoritative placement data.

## Manuals

- [Semantic Parallax Background Manual](./parallax-backgrounds.md) — authoring, separating, processing, transitioning, grounding, and visually checking layered environments.
- [Enemy Placement and Grounding Manual](./enemy-placement-and-grounding.md) — encounter pacing, density, clustering, spawn activation, support surfaces, patrol bounds, and runtime checks.

## Adoption sequence for a new level

1. Block out collision surfaces and route choices before placing enemies or painting landmarks.
2. Define the level's visual chapters and encounter beats in declarative data.
3. Author backgrounds as semantic far, middle, and close plates.
4. Register substantial middle-layer objects to the background contact line.
5. Classify each enemy as grounded, platform-bound, flying, or arena-bound.
6. Place encounter groups using the density and reaction-space budgets.
7. Resolve every grounded patrol against a real support surface.
8. Run automated asset, surface, encounter, and transition checks.
9. Perform a full-speed visual scan at every chapter and encounter boundary.
10. Test once at desktop size and once at the smallest supported mobile landscape size.

## Definition of done

A level is not ready because individual screenshots look correct. It is ready when:

- parallax movement preserves whole objects and believable depth;
- visual chapter transitions happen once and remain smooth while moving;
- background contact edges meet the ground or are intentionally occluded;
- enemies spawn in readable groups with recovery space;
- grounded enemies never leave their supporting surface;
- flying enemies use deliberate flight bands rather than accidental ground offsets;
- large enemies receive isolated encounter space and a bypass or sufficient reaction time;
- the boss runway and arena obey their special population rules; and
- the automated and manual checklists in both manuals pass.

