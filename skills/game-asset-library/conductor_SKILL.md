# DEPRECATED / HISTORICAL — Conductor Snapshot

This is not an active project skill. Use `../../.skills/conductor/SKILL.md` and its canonical reference. The remaining text is preserved only as pre-normalization history.

# Conductor

Act as the game's music director. Read the game before writing music. Create a
cohesive soundtrack whose level loops and boss arrangements reflect the current
rendered game, not generic genre assumptions.

Load the available music-generation skill or audio tooling only when audio must
actually be created. Do not claim audio was generated, integrated, or playtested
without producing and verifying the corresponding artifacts.

## Source of truth

Treat the implemented and rendered game as the primary source of truth.

Never score or rescore solely from asset filenames, level numbers, folder names,
or textual descriptions. Inspect the rendered level whenever the environment
supports it. A visually bright cartoon playground must not receive generic
“forest music” merely because its files are named `forest_*`.

When rendered evidence is unavailable, inspect the implementation and current
assets, state that runtime visual verification is missing, and avoid pretending
that inferred mood is observed fact. When evidence conflicts, prioritize the
current playable experience, then document the discrepancy.

## Supported modes

- **Score one level:** create its Level Music Brief, exploration loop, and boss
  arrangement.
- **Score the game:** brief every level first, review the briefs as one album,
  resolve drift or repetition, then create tracks in narrative order.
- **Audit the soundtrack:** classify every level and boss track without changing
  audio.
- **Rescore one level:** compare the current level with its previous musical
  intent, choose the lowest sufficient rescore level, then revise only what is
  needed.
- **Rescore the game:** audit all tracks, apply justified classifications, and
  update the soundtrack bible after hearing the complete result.

## Inspect before composing

1. Inspect playable screenshots or the rendered level, including background,
   foreground, palette, lighting, characters, enemies, props, animation, and
   boss art.
2. Inspect player movement, encounter density, hazards, route pacing, expected
   level duration, transitions, boss mechanics, and narrative purpose.
3. Inspect existing SFX and music implementation so the score leaves space for
   gameplay feedback.
4. Read existing Level Music Briefs, the soundtrack manifest, current masters,
   and `audio/music/soundtrack-bible.md` when present.
5. Identify reusable player, danger, victory, location, character, and boss
   motifs before inventing new ones.
6. Write observations as: visual/gameplay evidence → emotional interpretation →
   musical decision. Keep evidence distinct from inference.

## Establish the soundtrack bible

On the first scoring pass, create `audio/music/soundtrack-bible.md`. Define:

- global emotional identity and production aesthetic;
- core instrument families and intentional exceptions;
- melodic, harmonic, rhythmic, and percussion language;
- recurring hero, danger, boss, victory, and narrative motifs;
- boss-transformation rules;
- loudness and dynamic targets;
- looping and transition conventions;
- styles, instruments, production treatments, and clichés to avoid.

All later music inherits this DNA. Do not independently invent a new genre for
each level. Update the bible only when the soundtrack-wide decision genuinely
changes, not merely to rationalize a drifting track.

## Create a Level Music Brief

Before generating audio, create or update
`audio/music/briefs/[level-id]-music-brief.md` with:

- observed visual and gameplay evidence;
- emotional tone, energy, and musical personality;
- tempo range, target BPM, meter, key or mode;
- instrumentation, primary motif, rhythmic and harmonic character;
- intensity arc and expected loop duration;
- relationship to global musical DNA and existing motifs;
- boss-arrangement transformation plan;
- elements to avoid;
- unresolved assumptions and unavailable runtime evidence.

## Compose the level pair

### Exploration loop

- Target roughly 60–120 seconds unless actual level pacing justifies otherwise.
- Write for repeated listening: memorable but not exhausting or intrusive.
- Use a clear, restrained motif and no long non-interactive intro or outro.
- Make the ending harmony, rhythm, ambience, and tail reconnect naturally to the
  opening.
- Preserve headroom and frequency space for player, enemy, pickup, and UI SFX.

### Boss arrangement

- Derive it recognizably from the level theme through melody, harmony, rhythm,
  instrumentation, or a recurring motif.
- Increase urgency through composition or arrangement: tempo, percussion,
  density, subdivision, bass movement, register, dissonance, countermelody, or
  harmonic rhythm.
- Do not make a “boss version” by only increasing volume or playback speed.
- Let the boss's actual appearance, mechanics, phase structure, arena, and
  narrative role determine the transformation.

## Rescore mode

Before rescoring:

1. Inspect the current rendered implementation and gameplay.
2. Read the previous Level Music Brief and soundtrack bible.
3. Listen to or inspect the current theme and boss arrangement.
4. Compare the current level with the evidence and intent that informed the
   existing score.
5. Write a Rescore Assessment documenting visual, gameplay, emotional, pacing,
   instrumentation, tempo, motif, boss, and soundtrack-wide changes.
6. Classify exploration and boss music separately.

Use the lowest classification that solves the demonstrated mismatch:

- **Level 0 — No change:** the score still represents the current game. Do not
  regenerate audio.
- **Level 1 — Mix / implementation change:** preserve composition; adjust loop
  points, gain, EQ, dynamics, transitions, encoding, or integration only.
- **Level 2 — Light arrangement:** preserve melody, harmony, tempo, and core
  identity; adjust instrumentation, percussion, density, texture, or
  orchestration.
- **Level 3 — Major arrangement:** preserve a recognizable primary motif and
  soundtrack identity while allowing major tempo, harmony, structure, rhythm,
  intensity, and instrumentation changes.
- **Level 4 — Full rescore:** create a new composition because the old one no
  longer represents the level; retain mandatory global and recurring motifs.

Preserve useful musical continuity. A level may require a new boss arrangement
without changing exploration music, or the reverse.

For `audit the soundtrack`, return a classification and evidence-based reason
for every level and boss without modifying files. For `rescore the game`, audit
first, apply only approved classifications, compare the whole album, and update
the soundtrack bible after the final listening pass.

## Outputs and revision safety

Use:

```text
audio/music/[level-id]-theme.ogg
audio/music/[level-id]-boss.ogg
audio/music/masters/[level-id]-theme-v[number].*
audio/music/masters/[level-id]-boss-v[number].*
audio/music/archive/[level-id]-theme-v[number].*
audio/music/archive/[level-id]-boss-v[number].*
audio/music/briefs/[level-id]-music-brief.md
audio/music/soundtrack-bible.md
audio/music/soundtrack-manifest.json
```

Preserve high-quality masters when supported. Never overwrite the previous
master without archiving it. Do not archive or bump versions for Level 0.

For each exploration and boss track, record in the manifest:

- title, level, role, current version, and previous version;
- rescore classification and evidence-based reason;
- visual, gameplay, emotional, and musical changes;
- BPM, key or mode, meter, instrumentation, motifs, and intensity;
- duration, loop start, loop end, format, and loudness where measurable;
- boss relationship, generation notes, source/master path, runtime path, and
  date or build metadata when available.

Update the Level Music Brief after a rescore so future comparisons use the new
approved intent.

## Validate in context

Before claiming completion:

1. Verify the implemented game loads and plays the intended files.
2. Play the current level with the theme and the boss encounter with its
   arrangement when local runtime access exists.
3. Verify the music fits observed art, motion, pacing, emotion, and encounter
   intensity.
4. Verify the boss arrangement remains recognizably related and meaningfully
   more urgent.
5. Verify the result belongs to the broader soundtrack and does not duplicate a
   neighboring level's identity without purpose.
6. Verify seamless looping: no unintended silence, click, discontinuity, tail
   cutoff, or abrupt restart.
7. Verify compatible perceived loudness, sufficient headroom, and audible SFX.
8. Verify metadata, manifest paths, archived revisions, and loop points match
   the actual exported files.
9. For a rescore, verify the change solves the exact mismatch documented in the
   Rescore Assessment.

New files alone do not prove a score or rescore works. If runtime playback,
rendered-level inspection, audio listening, or loop validation is unavailable,
report that limitation explicitly and leave the corresponding validation open.

## Handoff

Provide the evidence-to-music interpretation, Level Music Brief, soundtrack
bible decisions, track paths, boss relationship, manifest changes, loop and
loudness validation, archive/version actions, integration result, and unresolved
assumptions.
