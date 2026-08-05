# Dumpster Goal Sprite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate and package an isolated 8-frame animated pixel-art dumpster concept for later post-boss use.

**Architecture:** Generate two chroma-key source sheets (ambient idle and stink loop), remove the key color locally, and assemble the approved 4×2 atlas with a small build script. Keep all deliverables under `concepts/dumpster/`; no application imports or public assets are modified.

**Tech Stack:** Built-in image generation, local chroma-key removal helper, Python/Pillow atlas assembly, shell validation.

## Global Constraints

- Canvas: 768×384 pixels; four columns by two rows; 192×192 per frame.
- Use the established dark navy outline, clustered pixel shading, transparent background, and nearest-neighbor presentation.
- Row 1 is ambient idle; row 2 is the stink loop.
- Do not copy into `public/` or reference from application code, tests, manifests, or production output.

---

### Task 1: Create the private concept workspace

**Files:**
- Create: `concepts/dumpster/README.md`
- Create: `concepts/dumpster/PROMPTS.md`
- Create: `concepts/dumpster/source/`

- [ ] **Step 1: Write the frame map and isolation notes**

Document the 192×192 frame grid, row timing suggestions, and the explicit rule that this concept is not game-integrated.

- [ ] **Step 2: Record generation prompts**

Save the exact prompts used for the idle and stink source sheets, including the reference roles and negative constraints.

- [ ] **Step 3: Verify the workspace is private**

Run `rg -n "dumpster" app public tests || true` and confirm no existing runtime references are being added.

### Task 2: Generate and clean the sprite art

**Files:**
- Create: `concepts/dumpster/source/dumpster-idle-key.png`
- Create: `concepts/dumpster/source/dumpster-stink-key.png`
- Create: `concepts/dumpster/sheets/dumpster-idle.png`
- Create: `concepts/dumpster/sheets/dumpster-stink.png`

- [ ] **Step 1: Generate the two 4×1 source sheets**

Use a flat `#00ff00` background, request four evenly spaced 192×192 frames, and keep the dumpster’s footprint and camera angle locked across each sheet.

- [ ] **Step 2: Remove the chroma key**

Run the installed helper with `--auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill` for both sources.

- [ ] **Step 3: Inspect and validate the cleaned sheets**

Confirm RGBA output, transparent corners, no green fringe, and visibly distinct frame motion.

### Task 3: Assemble and document the final atlas

**Files:**
- Create: `concepts/dumpster/build-atlas.py`
- Create: `concepts/dumpster/dumpster-animation-atlas.png`
- Modify: `concepts/dumpster/README.md`

- [ ] **Step 1: Write the deterministic atlas builder**

Use Pillow to place four idle frames at row 0 and four stink frames at row 1 into a 768×384 RGBA canvas, preserving nearest-neighbor pixels.

- [ ] **Step 2: Run the builder**

Run `python3 concepts/dumpster/build-atlas.py` and confirm the final file dimensions are exactly `768x384`.

- [ ] **Step 3: Add the final frame map**

Document frame indices 0–3 as idle and 4–7 as stink, with suggested 140–180ms timing and loop behavior.

### Task 4: Verify isolation and hand off for review

**Files:**
- Verify: `concepts/dumpster/dumpster-animation-atlas.png`
- Verify: `app/`, `public/`, `tests/`, and production output

- [ ] **Step 1: Validate the atlas programmatically**

Check PNG mode `RGBA`, dimensions `768x384`, all eight 192×192 cells non-empty, and transparent corners.

- [ ] **Step 2: Scan for unintended integration**

Run `rg -n "dumpster|dumpster-animation" app public tests .next dist 2>/dev/null || true` and confirm only the private concept path contains the new asset.

- [ ] **Step 3: Run repository hygiene checks**

Run `git diff --check` and review `git status --short` to ensure no unrelated files changed.

- [ ] **Step 4: Present the atlas for user approval**

Show the final PNG and link the README; do not move or copy the concept into any runtime asset directory.
