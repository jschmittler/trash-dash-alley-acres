# Soundtrack Workflow

## Supported modes

- Score one level: brief, exploration loop, and boss arrangement.
- Score the game: brief all levels, review the intended album, resolve repetition/drift, then create in narrative order.
- Audit the soundtrack: classify every level and boss track without changing audio.
- Rescore one level: compare the current implementation with prior intent and apply the lowest sufficient change.
- Rescore the game: audit first, apply justified classifications, listen as one album, then update the bible.

## Inspect before composing

Inspect the rendered palette, lighting, backgrounds/foregrounds, characters, enemies, props, animation, boss art, movement cadence, encounter density, hazards, route pacing, expected duration, transitions, mechanics, and narrative role. Inspect current SFX/music implementation and existing approved masters, briefs, manifest, and soundtrack bible. Record decisions as evidence → emotional interpretation → musical choice.

When rendered evidence is unavailable, inspect implementation and assets, label the limitation, and do not present inference as observation.

## Soundtrack bible

Define global emotional identity, production aesthetic, core instrument families and exceptions, melodic/harmonic/rhythmic/percussion language, recurring hero/danger/boss/victory/narrative motifs, boss-transformation rules, loudness/dynamic targets, looping/transition conventions, and prohibited styles or clichés. Later tracks inherit this DNA; do not invent an unrelated genre per level.

## Level Music Brief

Before audio generation, record observed evidence; emotional tone and energy; tempo range and target BPM; meter; key/mode; instrumentation; motif; rhythmic/harmonic character; intensity arc; expected loop duration; global/recurring motif relationship; boss transformation plan; elements to avoid; and unresolved assumptions.

## Exploration loop

- Target roughly 60–120 seconds unless actual level pacing justifies otherwise.
- Write for repeated listening: memorable but not exhausting or intrusive.
- Avoid long noninteractive intros/outros.
- Make ending harmony, rhythm, ambience, and tails reconnect naturally to the opening.
- Preserve headroom and spectral space for player, enemy, pickup, hazard, and UI feedback.

## Boss arrangement

Derive it recognizably from the level theme through melody, harmony, rhythm, instrumentation, or recurring motif. Increase urgency through tempo, percussion, density, subdivision, bass motion, register, dissonance, countermelody, or harmonic rhythm—not volume or playback speed alone. Let the actual boss silhouette, mechanics, phases, arena, and narrative role determine the transformation.

## Rescore assessment

Compare current rendered implementation and gameplay with the previous brief, bible, track, and boss arrangement. Document visual, gameplay, emotional, pacing, instrumentation, tempo, motif, boss, and soundtrack-wide changes. Classify exploration and boss separately:

- Level 0: no change.
- Level 1: loop points, gain, EQ, dynamics, transition, encoding, or integration only.
- Level 2: preserve melody/harmony/tempo/core identity; change instrumentation, percussion, density, texture, or orchestration.
- Level 3: retain a recognizable motif and global identity; allow major tempo, harmony, structure, rhythm, intensity, and instrumentation changes.
- Level 4: new composition because the old track no longer represents the game; retain mandatory global motifs.

## Outputs and revision safety

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

Preserve high-quality masters. Archive the previous approved master before replacement. Do not bump versions for Level 0. Manifest records title, level, role, version history, rescore classification/reason, evidence changes, BPM, key/mode, meter, instrumentation, motifs, intensity, duration, loop points, format, loudness, boss relationship, generation notes, paths, and build/date metadata.

## Validation

Verify the game loads and plays intended files; exploration and boss music fit observed art/motion/pacing; boss remains related and more urgent; tracks belong to one soundtrack; loops have no unintended silence, clicks, discontinuities, tail cuts, or abrupt restarts; loudness is compatible; SFX stay readable; paths and metadata match exported bytes; and rescoring solves the documented mismatch. If runtime playback, listening, rendered inspection, or loop validation is unavailable, leave it open.
