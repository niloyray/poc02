# Feature Specification: Add the breakout game

**Story**: POC02-4 | **Branch**: `POC02-4-add-the-breakout-game` | **Status**: Draft
**Depends on**: POC02-2 (scaffold and hub page), already merged. Independent of the tic-tac-toe story.

## Goal

A player can play breakout in the browser: move a paddle to bounce a ball and clear a wall of bricks, so the site has an arcade game. The game replaces the placeholder page left by the scaffold story. It runs entirely in the browser and loads nothing from external hosts.

## User-visible behaviour

- **Play area**: a canvas with a fixed logical size (for example 480 by 640 units), so the rules do not depend on the screen. The canvas scales to the available width, keeps its aspect ratio and stays sharp on high-density screens. At 360 px wide there is no horizontal scrolling.
- **Paddle**: moved by the mouse, by the left and right arrow keys, and by touch drag. It never leaves the play area.
- **Start of a life**: the ball rests on the paddle and follows it. A click, a tap or the space bar launches it.
- **Bounces**: the ball bounces off the left, right and top walls, the paddle and the bricks. The bounce angle off the paddle depends on where it hits: the centre sends the ball straight up, the edges send it out at a steep angle. The ball never leaves the paddle horizontally.
- **Bricks and score**: a hit brick disappears and adds to the score.
- **Lives**: the player has three. A ball that passes the paddle costs one life and the next life starts with the ball on the paddle. With no lives left, a game-over screen shows the score and a restart control.
- **Levels**: when every brick is cleared, the next level starts with the bricks rebuilt and a faster ball, up to a maximum speed.
- **Pause**: the P key and a button pause and resume the game. The game also pauses itself when the browser tab is hidden.
- **Frame-rate independence**: the rules advance in fixed time steps, so play is the same at any frame rate.
- **Status text**: score, lives and level are shown as text outside the canvas, readable by a screen reader.
- **Navigation**: the page uses the shared stylesheet and has a link back to the hub.

## Acceptance criteria

- [ ] The paddle follows the mouse, the left and right arrow keys and a touch drag, and stays inside the play area.
- [ ] The ball bounces off the walls, the paddle and the bricks; a hit brick disappears and raises the score; the bounce angle off the paddle varies with the hit position.
- [ ] Missing the ball costs one of three lives; with none left a game-over screen shows the score and a restart control.
- [ ] Clearing every brick starts the next level with the bricks rebuilt and a faster ball.
- [ ] The game pauses and resumes with the P key and with a button, and pauses itself when the tab is hidden.
- [ ] Score, lives and level are shown as text outside the canvas, and the canvas scales to a 360 px wide screen without horizontal scrolling.
- [ ] Node tests (`tests/js/breakout.test.mjs`, run by `node --test` through pytest) cover:
  - wall, paddle and brick collisions;
  - the paddle staying in bounds;
  - life loss, level clear and game over;
  - one large time step not carrying the ball through a brick or the paddle.
- [ ] `uv run pytest` and `uvx ruff check .` pass. Nothing is loaded from an external host.

## Constraints

- Files: `app/static/breakout/logic.js`, `game.js` and `index.html`, plus `tests/js/breakout.test.mjs`.
- `logic.js` holds the rules and never touches the DOM or canvas. It exports `newGame()` (paddle, ball, brick grid, score 0, three lives, level 1, status) and `step(state, input, dt)` (input: paddle target or direction, launch, pause).
- `game.js` handles rendering, input and the loop: `requestAnimationFrame` with a fixed-timestep accumulator and a capped frame time.
- Plain ES modules with no framework, build step or npm dependencies. No change to the server.

## Out of scope

- Power-ups, multi-ball and bricks that take several hits.
- Sound effects.
- A high-score table.
- Changes to the FastAPI application, new endpoints, or game rules on the server.
- Changes to the hub page, the registry or the tic-tac-toe game.

## Open questions

Reasonable defaults are noted. None of these blocks planning.

1. Brick layout and scoring: how many rows and columns, and are points equal per brick? Default: equal points per brick in a grid of about 8 columns by 5 rows.
2. Maximum ball speed and the speed increase per level? Default: about 10% faster per level, capped at roughly twice the starting speed.
3. After game over, does restart reset score and level to the starting values? Default: yes, a full new game.
4. Should the paddle be controllable while paused or while the ball rests? Default: movable while the ball rests, frozen while paused.
