# Dumpster Cartoon Style Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the private dumpster concept atlas with a compact side-view 16-bit cartoon prop matching the raccoon hero and enemy sprites.

**Architecture:** Generate two new four-frame chroma-key rows using the existing hero/enemy sheets as style anchors, clean the backgrounds, then reuse the dependency-free atlas builder to produce the 4×2 sheet. Update only private concept documentation and source files; runtime assets and code remain unchanged.

**Tech Stack:** Built-in image generation, local chroma-key helper, Python standard-library PNG compositor.

## Global Constraints

- Keep the 768×384 RGBA atlas layout with 192×192 cells.
- Use a chunky side-view silhouette, dark navy contour, clustered 16-bit shading, and bright readable accents.
- Keep the body footprint, baseline, and camera angle stable across all eight cells.
- Do not add any asset to `public/`, application code, tests, or production output.

---

### Task 1: Regenerate cartoon-style source rows

**Files:**
- Replace: `concepts/dumpster/source/dumpster-idle-key.png`
- Replace: `concepts/dumpster/source/dumpster-stink-key.png`
- Replace: `concepts/dumpster/sheets/dumpster-idle.png`
- Replace: `concepts/dumpster/sheets/dumpster-stink.png`
- Modify: `concepts/dumpster/PROMPTS.md`

- [ ] **Step 1: Generate the idle and stink source rows**

Use the hero sheet and enemy atlas as style references. Request four side-view frames on a uniform `#00ff00` background, with chunky outlines, clustered shading, simple graffiti, overflowing trash, and no realistic perspective or gradients.

- [ ] **Step 2: Remove the chroma key**

Run the installed helper on both source rows with soft matte and despill, saving RGBA cleaned rows in `concepts/dumpster/sheets/`.

- [ ] **Step 3: Normalize each row to four 192×192 cells**

Crop each generated panel, resize with nearest-neighbor, and build exact 768×192 rows while keeping the dumpster baseline and footprint stable.

- [ ] **Step 4: Record the revised prompts**

Append the exact generation prompts and reference roles to `PROMPTS.md`.

### Task 2: Rebuild and validate the private atlas

**Files:**
- Replace: `concepts/dumpster/dumpster-animation-atlas.png`
- Modify: `concepts/dumpster/README.md`
- Verify: `concepts/dumpster/build-atlas.py`

- [ ] **Step 1: Rebuild the atlas**

Run `python3 concepts/dumpster/build-atlas.py` and confirm the output is 768×384 RGBA with idle row 0 and stink row 1.

- [ ] **Step 2: Check style and footprint**

Visually inspect the atlas beside `public/assets/generated/player-hero-motion.png` and `public/assets/generated/enemy-variety-motion.png`; confirm the dumpster reads as a compact 16-bit cartoon prop and all eight cells share the same baseline.

- [ ] **Step 3: Update concept documentation**

Note the revised cartoon style, stable side-view footprint, and that the atlas remains concept-only.

### Task 3: Verify isolation and handoff

**Files:**
- Verify: `concepts/dumpster/`
- Verify: `app/`, `public/`, `tests/`, `.next/`, and `dist/`

- [ ] **Step 1: Validate the final PNG**

Check dimensions 768×384, mode RGBA, all eight 192×192 cells non-empty, transparent corners, and no residual key-green pixels.

- [ ] **Step 2: Scan for runtime references**

Run `rg -n -i --hidden --glob '!node_modules' 'dumpster|dumpster-animation|concepts/dumpster' app public tests .next dist 2>/dev/null || true` and confirm no runtime references.

- [ ] **Step 3: Run hygiene checks**

Run `git diff --check` and review `git status --short`, preserving unrelated worktree changes.
