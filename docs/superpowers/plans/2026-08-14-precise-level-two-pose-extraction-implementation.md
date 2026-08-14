# Precise Level Two Pose Extraction Implementation Plan

**Goal:** Rebuild squirrel and terrier rows from measured state-specific source rectangles.

**Architecture:** Replace uniform crop assumptions in `UPDATED_SHEET_POSE_MAP` with explicit `{left, top, width, height}` entries and normalize each family from locomotion primary bounds while preserving baseline and existing state rows.

## Tasks

1. Add failing alpha/state tests for distinct terrier charge silhouettes and fixed squirrel locomotion/throw body width.
2. Measure complete source rectangles for upright/run/action/stun poses; update the map and builder’s family-scale selection.
3. Rebuild `level2-enemy-motion.png`, run focused asset tests and production build.
4. Pause for user manual testing before browser/UI verification.
