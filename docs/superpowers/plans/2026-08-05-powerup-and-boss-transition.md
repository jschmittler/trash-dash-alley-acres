# Power-Up Takeover and Boss Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make major power-ups feel unmistakable with animated pixel-text bursts and smooth the camera handoff into the final boss arena.

**Architecture:** Keep timing in pure modules (`powerup-announcement.mjs` and `boss-transition.mjs`) with focused unit tests. The Canvas loop pauses for 0.5 seconds while a non-interactive React pixel-text burst animates for 0.9 seconds, and boss entry eases the camera from its current position to the fixed arena viewport.

**Tech Stack:** React/Vinext, TypeScript, HTML Canvas, CSS animations, Node test runner.

## Global Constraints

- Taco and glider notices pause gameplay behind a full-stage, non-interactive pixel-text flash.
- Notices pause gameplay for 0.5 seconds and fade away naturally by 0.9 seconds.
- Boss camera transition uses a 0.9-second smoothstep ease and preserves the locked arena.
- This pass does not redesign the win screen.

---

### Task 1: Add deterministic announcement and transition state

**Files:**
- Create: `app/powerup-announcement.mjs`
- Create: `app/boss-transition.mjs`
- Test: `tests/powerup-announcement.test.mjs`
- Test: `tests/boss-transition.test.mjs`

- [x] Define copy, duration, and progress clamping for taco and glider notices.
- [x] Define camera transition creation and eased advancement with completion state.
- [x] Add both test files and include them in the package test script.

### Task 2: Integrate the takeover UI and boss handoff

**Files:**
- Modify: `app/trash-dash-game.tsx`
- Modify: `app/globals.css`
- Modify: `tests/rendered-html.test.mjs`

- [x] Pause the Canvas update loop for the brief power-up hit-stop while the pixel-text flash animates.
- [x] Use the takeover for taco transformation and glider acquisition.
- [x] Ease the boss camera from its current position into the fixed arena camera.
- [x] Add development-only preview shortcuts for taco, cap, and boss transition checks.
- [x] Verify tests, builds, lint, browser screenshots, and runtime logs.
