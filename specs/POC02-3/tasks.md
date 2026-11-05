# Tasks: Add the tic-tac-toe game

Story POC02-3. Ordered; each task is small. Do not touch `.github/`, `.specify/`, `.claude/`, `CLAUDE.md`, `app/main.py`, the hub or the breakout page. Do not commit or push.

## Phase 1: Rules (`logic.js`) with tests first

- [x] T001 Create `tests/js/tictactoe.test.mjs` with tests for all eight winning lines (X and O), a draw, ignored illegal moves (occupied cell, move after the end, bad index), and turn order without mutating the input. They fail until T002–T004 exist.
- [x] T002 Write the core of `app/static/tictactoe/logic.js`: `LINES`, `MODES`, `newGame`, `winner`, `legalMoves`, `play` (pure, returns the same state for illegal moves).
- [x] T003 Add `bestMove` (minimax, prefers faster wins, deterministic ties), `easyMove(board, rng)` and `computerMove(state, mode, rng)` to `app/static/tictactoe/logic.js`.
- [x] T004 Add the tally helpers `emptyTally`, `recordResult`, `parseTally` to `app/static/tictactoe/logic.js` (corrupt or invalid data gives zeros).
- [x] T005 Extend `tests/js/tictactoe.test.mjs`: exhaustive "minimax never loses" with the computer as O and as X (opponent plays every possible move), `easyMove` with a stub rng, and tally helper cases (counted once, corrupt text).
- [x] T006 Run `node --test tests/js/` and fix failures in `app/static/tictactoe/logic.js` or the test file.

## Phase 2: Page and UI

- [x] T007 Replace the placeholder `app/static/tictactoe/index.html`: shared stylesheet, `<style>` for grid and `win` highlight, mode `<select>`, `role="status"` live region, nine-button grid container, Restart and Reset tally buttons, tally readout, `<noscript>` line, `<script type="module" src="ui.js">`, link back to `../`. No external hosts.
- [x] T008 Write `app/static/tictactoe/ui.js`: render the board with accessible names ("Row r, column c, empty|X|O"), the status text and the winning-line highlight; wire cell clicks to `play` and the computer reply (human is X); init only if `document` exists.
- [x] T009 In `app/static/tictactoe/ui.js` wire the mode change and Restart to `newGame` (X first), and count each finished game once; unfinished games are never counted.
- [x] T010 In `app/static/tictactoe/ui.js` add tally persistence in `localStorage` with try/catch fallback to an in-memory zero tally, the render of the tally, and the Reset tally button.

## Phase 3: Verify

- [x] T011 Run `uv run pytest` and `uvx ruff check .`; fix failures only in files this story owns (`app/static/tictactoe/*`, `tests/js/tictactoe.test.mjs`).
- [x] T012 Check by reading that `app/static/tictactoe/` loads nothing from an external host, and that every cell, the mode select, Restart and Reset are native focusable controls (keyboard-only play).
- [x] T013 Confirm `git status` shows changes only under `app/static/tictactoe/`, `tests/js/tictactoe.test.mjs` and `specs/POC02-3/`, and none under `.github/`, `.specify/`, `.claude/` or `CLAUDE.md`.
