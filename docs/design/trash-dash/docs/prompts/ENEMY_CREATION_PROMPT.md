# Reusable Trash Dash Enemy Creation Prompt

Create a new **Trash Dash standard enemy** using the established hand-painted, expressive, trash-built visual language of the approved character references.

## Inputs
- Level: `[LEVEL NUMBER + NAME]`
- Enemy name: `[NAME]`
- Gameplay role: `[ROLE]`
- Defining behavior: `[ONE CORE BEHAVIOR]`
- Attack: `[ATTACK]`
- Environment: `[ENVIRONMENT / LEVEL REFERENCE]`
- Props/projectiles: `[IF ANY]`

## Phase 1 - Character concept sheet
Generate one polished concept-art sheet showing the enemy's definitive design plus small behavior studies. The design must belong naturally to the specified level and use environmental junk, wear, materials, and color cues from that level without becoming visually noisy. Maintain a bold silhouette and readable face/attack direction at gameplay scale.

Show at minimum: primary full-body design, idle personality, locomotion posture, attack anticipation, attack execution, recovery/vulnerable posture, hit reaction, defeat idea, key prop/projectile if applicable, and a few material/detail callouts.

Do not redesign unrelated characters. Do not make the sheet a literal gameplay screenshot.

## Phase 2 - Full animation source sheet, only after concept approval
Using the approved design unchanged, produce the most complete possible sprite-reference sheet to minimize animator invention in Codex.

Include every state actually required by gameplay. For a ground enemy, consider: idle/stand, walk/patrol, run/chase if applicable, anticipation, attack startup, active attack frames, follow-through, recovery, turn/reorientation if needed, hit/react, stunned/vulnerable if applicable, defeat, and environmental interaction states. For a flying enemy, replace walk/run with hover, patrol flight, fast flight/dash, banking/turn, dive/climb as appropriate.

For projectiles or props, include separate held/start, release, travel/spin, impact, break/debris, and recovery/effect frames where relevant. Include reusable FX such as dust, leaves, sparks, feathers, gas, web, goo, speed streaks, or impact bursts only when they belong to the character.

Keep the character facing the same gameplay direction unless a turn state is intentionally shown. Preserve consistent scale, proportions, costume, grounding/hover height, silhouette, and visual anchors across all rows. Exaggerate anticipation and follow-through enough for side-scrolling readability.

The sheet is animation source art, not a runtime atlas. Favor clean separation between poses and enough unique transition poses that Codex does not need to invent missing movement.
