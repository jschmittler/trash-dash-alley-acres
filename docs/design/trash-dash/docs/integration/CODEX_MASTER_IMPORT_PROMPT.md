You are updating the Trash Dash project using the bundled approved asset package.

Primary objective:
Integrate the approved visual direction, approved sprites, approved level layouts, approved items, approved UI splash screens, and approved reward assets into the project without blindly copying layouts 1:1. Respect the project's current engine structure and the skills already installed in the Codex project.

Source-of-truth rules:
1. Treat `reference/` as the approved source of truth.
2. Treat `archive/` and `reference/level-layouts/superseded-canonical-v1/` as non-authoritative history only.
3. Use the docs under `docs/game/` to understand approval status and interpretation rules.
4. Preserve all previously approved enemies, bosses, environments, and foreground assets already included in the bundle.
5. Use the approved main-character package under `reference/main-characters/` as the current authoritative source for Trashy and Jimothy.

Implementation rules:
- The dynamic level layouts are directional and must be adapted to the actual game structure.
- Do not assume the layout images are exact collision maps.
- Use the project's skills and implementation rules for spacing, scale, layering, collision, parallax, animation state usage, and readability.
- Keep the game mechanically coherent and technically shippable.
- Preserve the approved consistent dumpster reward across all levels.
- Replace legacy placeholder collectibles with the approved trash collectibles.
- Replace placeholder power-up visuals and splash screens with the approved Taco Power and Kite Power assets.
- Ensure enemy rosters in each level match that level's approved enemy set, and keep bosses confined to their intended boss encounter areas.

Execution checklist:
1. Read `README.md` and all `docs/game/*.md` files.
2. Inventory `reference/` and confirm approved assets by category.
3. Compare the current in-project assets and note which ones are missing, outdated, or placeholder.
4. Integrate approved hero, enemy, boss, item, power-up, UI, reward, and tile assets.
5. Rework each level using the dynamic layout blueprints as directional guides.
6. Validate enemy placement, traversal readability, collisions, and visual consistency.
7. Produce a short report listing what was updated, what remains directional, and any implementation compromises caused by runtime constraints.
