# Reusable Trash Dash Boss Creation Prompt

Create a new **Trash Dash boss** that feels like the exaggerated culmination of its level's mechanics and visual language.

## Inputs
- Level: `[LEVEL NUMBER + NAME]`
- Boss name/title: `[NAME + TITLE]`
- Core personality: `[PERSONALITY]`
- Arena: `[ARENA]`
- Core mechanics: `[2-4 MECHANICS]`
- Damage/phase structure: `[IF LOCKED, OTHERWISE SAY TBD]`
- Defeat reveal: `[IF KNOWN]`

## Phase 1 - Boss concept sheet
Generate one polished concept-art sheet with a large definitive boss design and smaller panels for signature attacks, telegraphs, vulnerable openings, personality/taunt, damage progression, arena interaction, and defeat reveal. The boss should read instantly as larger and more dangerous than standard enemies while remaining comic, expressive, and non-graphic.

Reuse level mechanics where appropriate so the boss feels like a payoff rather than an unrelated minigame. Do not invent phase rules that are marked TBD.

## Phase 2 - Full boss animation source sheet, only after approval
Using the approved design unchanged, create a dense but readable source sheet covering: idle/personality loop, walk/heavy movement, run/charge if used, attack telegraphs, each attack startup/active/follow-through/recovery sequence, projectile/summon release states, arena-interaction states, hit reactions, stunned/vulnerable windows, damage-progression variants where visible, enraged loop if applicable, defeat sequence, and post-defeat/reveal states.

Include separate effect/projectile libraries needed to animate the fight: debris, shockwaves, suction rings, impact bursts, projectiles, summon cues, environmental effects, broken armor/parts, or other boss-specific elements.

Maintain stable scale and silhouette through all states. Clearly separate anticipation, active frames, and recovery. Give Codex enough transition poses to implement each attack without fabricating major missing animation.
