# Worldbuilding Instruction Manuals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the proven background-art and enemy-placement workflows as reusable manuals for future Trash Dash levels and other side-scrolling games.

**Architecture:** Keep the two systems in separate guides because art-layer construction and encounter simulation have different inputs and validation gates. Connect them with a small index that defines the shared world contact-line contract and routes future contributors to the correct checklist.

**Tech Stack:** Markdown documentation, HTML Canvas/TypeScript project examples, Sharp-based image validation, Node test runner.

## Global Constraints

- Record observed failures and their root causes, not only the final settings.
- Separate reusable rules from Trash Dash-specific coordinates and file paths.
- Every rule must have a visual check, an automated check, or both.
- Ground enemies must remain attached to one supporting surface for their complete patrol.
- Background objects must belong wholly to one semantic depth plane.

---

### Task 1: Background construction manual

**Files:**
- Create: `docs/guides/parallax-backgrounds.md`

**Interfaces:**
- Consumes: the current three-plane renderer, semantic asset installer, background regression tests, and the five Level 1 background plates.
- Produces: a reusable authoring, processing, integration, and QA workflow.

- [x] **Step 1: Record the failure history and root causes**
- [x] **Step 2: Define semantic far, middle, and close plane contracts**
- [x] **Step 3: Document chroma-key cleanup, nearest-neighbor sizing, and baseline normalization**
- [x] **Step 4: Add runtime transition, parallax, and visual scan procedures**
- [x] **Step 5: Add reusable acceptance criteria and a release checklist**

### Task 2: Enemy placement and grounding manual

**Files:**
- Create: `docs/guides/enemy-placement-and-grounding.md`

**Interfaces:**
- Consumes: Level 1 encounter data, surface-aware patrol resolution, spawn activation, animation baseline rules, and existing tests.
- Produces: a reusable encounter-density, clustering, surface-binding, patrol, and QA standard.

- [x] **Step 1: Record the enemy placement and movement failure history**
- [x] **Step 2: Define enemy size classes, clustering limits, and reaction-space budgets**
- [x] **Step 3: Define grounded, platform, flying, and boss movement contracts**
- [x] **Step 4: Document declarative encounter data and surface resolution**
- [x] **Step 5: Add automated and manual acceptance gates**

### Task 3: Guide index and verification

**Files:**
- Create: `docs/guides/README.md`

**Interfaces:**
- Consumes: both completed manuals.
- Produces: one entry point for future level and game work.

- [x] **Step 1: Add the shared contact-line principle and guide links**
- [x] **Step 2: Add a short adoption sequence for new projects**
- [x] **Step 3: Scan for missing sections and unresolved placeholders**
- [x] **Step 4: Verify Markdown links and project file references**

