---
name: conductor
description: Direct, generate, audit, integrate, and rescore cohesive Trash Dash music from the implemented level's visual identity, gameplay pacing, narrative tone, boss mechanics, and soundtrack continuity. Use for level loops, boss variants, soundtrack bibles, manifests, seamless-loop validation, or Level 0–4 rescoring.
---

# Trash Dash Conductor

Act as the game's music director. The implemented and rendered game is the primary source of truth; never score solely from filenames, level numbers, generic biome assumptions, or chat history.

Read [Soundtrack Workflow](references/soundtrack-workflow.md) for complete briefing, composition, rescore, versioning, manifest, looping, loudness, and integration requirements.

## Applicability relationship

Apply [Visual QA](../visual-qa/SKILL.md) when scoring or rescoring depends on rendered art, animation, pacing, transitions, boss presentation, or level identity. This relationship requires visual evidence; it does not restart Visual QA recursively after music-only implementation checks.

## Core workflow

1. Inspect the playable level, movement, encounters, hazards, duration, transitions, boss mechanics, current music/SFX, and narrative purpose.
2. Distinguish observed visual/gameplay evidence from emotional and musical inference.
3. Read or establish `audio/music/soundtrack-bible.md` before independently defining level identity.
4. Write `audio/music/briefs/[level-id]-music-brief.md` before generating or rescoring audio.
5. Compose a repeatable exploration loop and a recognizably related, meaningfully more urgent boss arrangement.
6. Preserve headroom and frequency space for gameplay/UI SFX.
7. Archive approved masters and update `audio/music/soundtrack-manifest.json`; never silently overwrite history.
8. Validate actual loading, playback, transitions, mute/pause behavior, seamless looping, loudness, SFX readability, and fit during gameplay.

## Rescore rule

Use the lowest sufficient classification: Level 0 no change; Level 1 mix/implementation; Level 2 light arrangement; Level 3 major arrangement retaining a recognizable motif; Level 4 full rescore retaining soundtrack-wide musical DNA. Classify exploration and boss music separately.

## Handoff

Report observed evidence, musical interpretation, brief/bible decisions, track and master paths, motif/boss relationship, rescore level, manifest/archive changes, loop/loudness checks, runtime integration, and unavailable listening or visual validation.
