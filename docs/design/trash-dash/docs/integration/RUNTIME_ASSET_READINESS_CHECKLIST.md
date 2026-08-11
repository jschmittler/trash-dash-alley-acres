# Runtime Asset Readiness Checklist

Use this after the design-source import and before any generated sheet becomes a runtime atlas.

For every enemy, boss, or interactive foreground object:

1. Verify source image dimensions and alpha behavior.
2. Identify every usable pose/frame and exclude presentation labels, backgrounds, gutters, captions, scale guides, and decorative callouts.
3. Map frames to the actual runtime state machine. Do not invent a state just because a pose exists, and do not silently substitute unrelated poses for a required state.
4. Record frame order, frame duration, loop/one-shot behavior, interruptibility, and return state.
5. Define one stable visual anchor per character and explicit foot/ground or hover anchors.
6. Define hurtboxes, hitboxes, collision boxes, projectile release points, and interaction points independently from transparent sprite bounds.
7. Keep aspect ratio and displayed scale consistent across states. Never squeeze a frame to fit a box.
8. Separate reusable FX and projectiles from character atlases when practical.
9. Validate attack active frames against the visible contact/release moment.
10. Validate walk/run/flight speed against the visual cycle.
11. Confirm all required transitions can play without visible snapping or missing in-between poses.
12. Test direction flipping, z-order, grounding/hover height, platform collision, enemy-to-enemy spacing, and responsive 16:9 rendering in live gameplay.
13. Add automated checks that fail on missing frame registrations, bad asset paths, placeholder textures, or incomplete required states.
14. Perform a real uninterrupted gameplay pass. Static fixtures alone are not sufficient acceptance evidence.

A source sheet is **REFERENCE COMPLETE** when it contains enough approved visual material to build the state machine. It is **RUNTIME COMPLETE** only after the extracted atlas and gameplay implementation pass this checklist.
