# Implementation Plan: Add the breakout game

**Story**: POC02-4 | **Branch**: `POC02-4-add-the-breakout-game` | **Spec**: `specs/POC02-4/spec.md`

## Summary

Replace the placeholder `app/static/breakout/index.html` with a playable breakout game made of two plain ES modules: `logic.js` (pure rules, no DOM or canvas) and `game.js` (canvas rendering, input, fixed-timestep loop). Tests are Node tests in `tests/js/breakout.test.mjs`, already picked up by `tests/test_js.py` (it globs `tests/js/*.mjs`). No server change.

## Technical Context

- **Language**: JavaScript (ES modules, browser and Node 20+), no framework, no build step, no npm dependencies.
- **Testing**: `node --test` via pytest (`uv run pytest`); lint `uvx ruff check .`.
- **Constraints**: nothing from an external host (checked by `tests/test_site.py`); shared `../css/site.css`; no edits to `app/main.py`, hub, registry, tic-tac-toe, `.github/`, `.specify/`, `.claude/` or `CLAUDE.md`.
- **Constitution check**: `.specify/memory/constitution.md` is not filled in, so there are no gates. `CLAUDE.md` boundaries are respected.
- **Tooling note**: the Spec Kit setup scripts are PowerShell and `pwsh` is not available here, so the plan and tasks were written directly to the required paths. There is no numbered folder to clean up.

## Resolved open questions (spec defaults)

1. Grid of 8 columns by 5 rows, equal points (10) per brick.
2. Ball speed is multiplied by 1.1 per level, capped at 2x the starting speed.
3. Restart after game over is a full new game (`newGame()`).
4. The paddle moves while the ball rests; it is frozen while paused.

## Design

### Constants (exported from `logic.js` as `CONFIG`)

Logical size `WIDTH = 480`, `HEIGHT = 640`. Paddle 80 x 12 at `y = 600`, paddle keyboard speed 420 units/s. Ball radius 7, start speed 320 units/s, `SPEED_FACTOR = 1.1`, `MAX_SPEED_FACTOR = 2`. Bricks: 8 columns x 5 rows, 52 x 18 each with 6 gap, top offset 60, 10 points. Lives 3. `MAX_SUBSTEP = 4` units (less than the ball radius and the brick height) is the largest distance the ball may move in one internal sub-step.

### `logic.js` (pure)

- State: `{paddle:{x,y,w,h}, ball:{x,y,vx,vy,r,speed,attached}, bricks:[{x,y,w,h,alive}], score, lives, level, status}`; `x` of the paddle is its centre. `status` is `'ready' | 'playing' | 'paused' | 'gameover'`. `'ready'` means the ball is resting on the paddle.
- Exports:
  - `CONFIG`.
  - `newGame()`: paddle centred, ball attached on top of it, full brick grid, score 0, 3 lives, level 1, status `'ready'`.
  - `buildBricks()`: the brick grid.
  - `step(state, input, dt)`: returns a new state, never mutates the input. `input = { target?: number, direction?: -1|0|1, launch?: boolean, pause?: boolean, restart?: boolean }`. `target` is an x position in logic units (mouse or touch); `direction` is the arrow-key direction, applied as `direction * paddleSpeed * dt`.
  - `clamp`, plus small helpers for the paddle bounce angle.
- `step` behaviour:
  - `pause` toggles `playing` and `paused`; while `paused` or `gameover` nothing else moves (a `restart` input on game over returns `newGame()`).
  - Paddle: set from `target` or moved by `direction`, then clamped so it stays fully inside `[0, WIDTH]`. If the ball is attached, it follows the paddle centre.
  - `launch` when `ready` sets status `playing` and gives the ball a velocity straight up with magnitude `ball.speed`.
  - Physics when `playing`: `dt` is split into `n = ceil(speed * dt / MAX_SUBSTEP)` equal sub-steps, so one large time step cannot carry the ball through a brick or the paddle. Each sub-step moves the ball, then resolves in order: left, right and top walls (reflect and push back inside); paddle (only when moving downward and the ball overlaps the paddle top: set the angle from the hit position, `offset = (ball.x - paddle.x) / (w/2)` clamped to [-1, 1], angle `offset * 60°` from vertical, velocity rebuilt at `ball.speed` with `vy < 0`, so the ball always leaves upward); bricks (first alive brick overlapped: mark it dead, add 10, reflect `vy` or `vx` by the axis of smaller penetration; at most one brick per sub-step).
  - Miss: ball centre below `HEIGHT + r` costs a life. With lives left the ball is re-attached on the paddle, status `'ready'`; with none, status `'gameover'`.
  - Level clear: when no brick is alive, `level += 1`, bricks rebuilt, `ball.speed = min(base * 1.1^(level-1), base * 2)`, ball re-attached on the paddle, status `'ready'`. Score and lives carry over.
  - The horizontal speed is bounded so the ball never travels purely horizontally (minimum `|vy|` is `speed * cos 60° = speed / 2`).
- Rules never read time or randomness, so they are fully deterministic and testable.

### `game.js` (DOM, canvas, loop)

- Imports `logic.js`. Initialises only when `document` exists so the module can be imported safely.
- Canvas: internal size `WIDTH * dpr` by `HEIGHT * dpr` with `ctx.setTransform(dpr * scale, ...)`, CSS `width: 100%; max-width: 480px; height: auto; aspect-ratio: 3 / 4`. Re-measured on `resize`. The canvas has `touch-action: none` so touch drag does not scroll.
- Loop: `requestAnimationFrame` with an accumulator. Frame time is capped at 0.1 s, the fixed step is 1/120 s, and the accumulator drains in whole steps. Pending one-shot inputs (launch, pause, restart) are consumed by the first step of a frame; `target` is the latest pointer position; `direction` is derived from the held arrow keys.
- Input: `mousemove` and `pointermove` over the canvas (client x converted to logic units), `keydown` / `keyup` for ArrowLeft, ArrowRight, Space (launch, with `preventDefault`), `P` (pause); `pointerdown` and tap launch; touch drag moves the paddle through pointer events.
- Pause: the P key, a native Pause/Resume `<button>`, and `visibilitychange` (when `document.hidden`, send `pause` if playing). The accumulator and last-timestamp are reset on resume so there is no catch-up burst.
- Rendering: bricks, paddle, ball, and a canvas overlay for Paused and Game over (with the score). Colours are chosen in `game.js`; no external assets.
- Status text: a `<p role="status" aria-live="polite">` outside the canvas shows "Score: n, Lives: n, Level: n" plus the state (ready, paused, game over). It is updated only when a value changes, so a screen reader is not spammed each frame. A visible Restart `<button>` (shown after game over, native and focusable) sends `restart`.

### `index.html`

Links `../css/site.css`. Page-specific styling (canvas sizing, controls) goes in a `<style>` element, because `site.css` is shared and out of scope. Contains `<h1>`, the status paragraph, the `<canvas>` with an `aria-label`, Pause and Restart buttons, a `<noscript>` line, `<script type="module" src="game.js">`, and a link back to the hub (`../`). At 360 px wide there is no horizontal overflow (canvas is `max-width: 100%`).

## Testing strategy (`tests/js/breakout.test.mjs`, `node:test`)

Tests build states by hand from `newGame()` (placing ball, bricks and paddle) and call `step`.

- Walls: left, right and top reflect the ball and keep it inside.
- Paddle: centre hit sends the ball straight up; edge hits send it out at a steep angle in the right direction; `vy` is always negative after a hit; the ball never leaves horizontally.
- Bricks: a hit removes the brick and adds 10; ball velocity reflects on the correct axis; only one brick is removed per hit.
- Paddle bounds: `target` far left and far right, and held `direction`, stay inside `[0, WIDTH]`; the ball follows the paddle while attached.
- Lives and game over: a missed ball costs one life and re-attaches; the third miss gives `gameover`; `restart` gives a fresh `newGame()`; steps after game over change nothing.
- Level clear: removing the last brick increments the level, rebuilds bricks, raises the speed by 10%, caps it at 2x, and keeps score and lives.
- Pause: `pause` toggles, nothing moves while paused, and the paddle is frozen.
- No tunneling: one large `dt` (for example 0.5 s) with the ball aimed at a brick and at the paddle ends with the brick removed or the ball bounced, not on the other side.
- Purity: `step` does not mutate its input; two runs with the same inputs give deep-equal states.
- Site checks already in `tests/test_site.py` (no external hosts, links resolve) must continue to pass.

## Risks

1. **Tunneling and corner collisions** with a large `dt` or a high level speed. Mitigation: internal sub-stepping so each sub-step moves at most `MAX_SUBSTEP` units, with a dedicated large-`dt` test and a speed-cap test.
2. **Ball sticking or oscillating** inside the paddle, a wall or a brick (reflecting twice). Mitigation: push the ball out to the surface on each collision, only bounce off the paddle when moving downward, and handle one brick per sub-step.
3. **Loop and pause bugs**: a hidden tab producing a huge frame time, or a burst of steps after resume. Mitigation: frame-time cap, accumulator reset on resume, pause on `visibilitychange`.
4. **High-DPI and scaling** pointer mapping going wrong. Mitigation: convert pointer x using `getBoundingClientRect()` and the logical width, and verify manually at 360 px.
5. **Accessibility**: live-region chatter. Mitigation: update the status text only on change.

## Quickstart (manual validation)

1. `uv run uvicorn app.main:app --reload`, open `/breakout/`.
2. Move the paddle by mouse, arrow keys and touch emulation; launch with click, tap and Space; confirm bounces, bricks and score, losing three lives, the game-over screen and Restart, and level up after clearing the bricks.
3. Pause with P and the button; switch tabs and confirm the game is paused on return.
4. Narrow the window to 360 px and confirm no horizontal scrolling.
5. `uv run pytest` and `uvx ruff check .` pass.
