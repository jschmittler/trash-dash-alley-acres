# Mobile Browser Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Trash Dash comfortable and resilient in mobile browsers while preserving the desktop game cabinet and controls.

**Architecture:** Keep gameplay input mapped to the existing keyboard-code state machine. Improve the browser experience at the shell boundary with safe-area-aware responsive CSS, a dedicated touch sprint action, visibility/input cleanup, and explicit mobile viewport metadata.

**Tech Stack:** React 19, TypeScript, HTML Canvas, CSS media queries, browser Fullscreen/Screen Orientation APIs, Node test runner.

## Global Constraints

- Desktop remains the primary layout and interaction target.
- Mobile supports portrait play, with landscape/fullscreen recommended for the 16:9 game view.
- Touch controls must keep pointer capture and release held input on cancellation, tab hiding, orientation changes, and fullscreen exit.
- No gameplay physics or sprite rendering changes in this pass.

### Task 1: Mobile shell and touch controls

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/trash-dash-game.tsx`
- Modify: `app/globals.css`

- [x] Add mobile viewport metadata and theme color.
- [x] Add a dedicated touch sprint control and release handling.
- [x] Center the 16:9 canvas within portrait play space and improve notch-safe control sizing.
- [x] Add fullscreen vendor fallback styles and touch interaction safeguards.

### Task 2: Browser lifecycle resilience

**Files:**
- Modify: `app/mobile-experience.mjs`
- Modify: `app/trash-dash-game.tsx`
- Test: `tests/mobile-experience.test.mjs`

- [x] Observe visibility changes alongside resize/orientation/fullscreen signals.
- [x] Clear held keys and pause when the page is backgrounded.
- [x] Verify listeners are installed and removed symmetrically.

### Task 3: Regression verification and local mobile preview

**Files:**
- Modify: `tests/rendered-html.test.mjs`

- [x] Assert viewport metadata, mobile controls, portrait centering, and fullscreen styles.
- [x] Run the full unit/build/lint/Pages checks.
- [x] Open the local game at `http://localhost:3003/` for mobile-focused browser testing.

