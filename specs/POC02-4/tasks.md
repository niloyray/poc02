# Tasks: Add the breakout game

Story POC02-4. Ordered; each task is small. Do not touch `.github/`, `.specify/`, `.claude/`, `CLAUDE.md`, `app/main.py`, the hub, the registry or the tic-tac-toe game. Do not commit or push.

## Phase 1: Rules (`logic.js`) with tests first

- [ ] T001 Create `tests/js/breakout.test.mjs` with tests for `newGame()` (paddle centred, ball attached, 8x5 bricks, score 0, 3 lives, level 1) and wall bounces (left, right, top). They fail until T002–T003 exist.
- [ ] T002 Write the core of `app/static/breakout/logic.js`: `CONFIG`, `clamp`, `buildBricks`, `newGame`, and `step` handling the paddle (target and direction, clamped in bounds), the attached ball following the paddle, launch, and pause (pure, never mutates the input).
- [ ] T003 In `app/static/breakout/logic.js` add ball movement with internal sub-stepping (at most `MAX_SUBSTEP` units per sub-step) and wall bounces.
- [ ] T004 Extend `tests/js/breakout.test.mjs`: paddle bounds (far left, far right, held direction), ball follows the paddle while attached, launch, pause freezes everything, and `step` purity (input not mutated, same inputs give equal states).
- [ ] T005 In `app/static/breakout/logic.js` add the paddle bounce (angle by hit position, centre straight up, edges steep, always upward, only when moving downward).
- [ ] T006 Extend `tests/js/breakout.test.mjs`: paddle bounce at the centre, left edge and right edge, and `vy < 0` after every hit.
- [ ] T007 In `app/static/breakout/logic.js` add brick collisions (remove the brick, add 10 points, reflect on the axis of least penetration, one brick per sub-step).
- [ ] T008 Extend `tests/js/breakout.test.mjs`: brick hit removes the brick, raises the score, reflects the ball on the right axis.
- [ ] T009 In `app/static/breakout/logic.js` add life loss (re-attach the ball, status `ready`), game over (status `gameover`, steps ignored, `restart` input gives `newGame()`), and level clear (rebuild bricks, speed x1.1 capped at 2x, keep score and lives, ball re-attached).
- [ ] T010 Extend `tests/js/breakout.test.mjs`: life loss, third miss gives game over, restart resets everything, level clear (new bricks, level + 1, faster ball, speed cap, score and lives kept), and a large time step (for example 0.5 s) that must not carry the ball through a brick or through the paddle.
- [ ] T011 Run `node --test tests/js/` and fix failures in `app/static/breakout/logic.js` or the test file.

## Phase 2: Page and game loop

- [ ] T012 Replace the placeholder `app/static/breakout/index.html`: shared stylesheet, `<style>` for the responsive canvas (`max-width: 100%`, aspect ratio, `touch-action: none`) and controls, `<h1>`, `role="status"` text for score, lives and level outside the canvas, labelled `<canvas>`, Pause and Restart `<button>`s, `<noscript>` line, `<script type="module" src="game.js">`, link back to `../`. No external hosts.
- [ ] T013 Write `app/static/breakout/game.js`: canvas setup with logical 480x640 size, devicePixelRatio scaling and resize handling, and the draw function (bricks, paddle, ball, paused and game-over overlays). Initialise only when `document` exists.
- [ ] T014 In `app/static/breakout/game.js` add the loop: `requestAnimationFrame`, fixed 1/120 s step accumulator, frame time capped at 0.1 s, one-shot inputs consumed by the first step of a frame.
- [ ] T015 In `app/static/breakout/game.js` add input: mouse and pointer/touch drag mapped to logical x through `getBoundingClientRect()`, ArrowLeft/ArrowRight held-key direction, Space, click and tap to launch, P to pause.
- [ ] T016 In `app/static/breakout/game.js` add the Pause/Resume button, auto-pause on `visibilitychange` with accumulator and timestamp reset on resume, the Restart button shown after game over, and status text updates only when a value changes.

## Phase 3: Verify

- [ ] T017 Run `uv run pytest` and `uvx ruff check .`; fix failures only in files this story owns (`app/static/breakout/*`, `tests/js/breakout.test.mjs`).
- [ ] T018 Check by reading that `app/static/breakout/` loads nothing from an external host, `logic.js` never references `document`, `window` or canvas, and the Pause, Restart and Back controls are native focusable elements.
- [ ] T019 Confirm `git status` shows changes only under `app/static/breakout/`, `tests/js/breakout.test.mjs` and `specs/POC02-4/`, and none under `.github/`, `.specify/`, `.claude/` or `CLAUDE.md`.
