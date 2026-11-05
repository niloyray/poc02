# Implementation Plan: Add the tic-tac-toe game

**Story**: POC02-3 | **Branch**: `POC02-3-add-the-tic-tac-toe-game` | **Spec**: `specs/POC02-3/spec.md`

## Summary

Replace the placeholder `app/static/tictactoe/index.html` with a playable game made of two plain ES modules: `logic.js` (pure rules, minimax, no DOM) and `ui.js` (DOM, mode selection, tally, localStorage). Tests are Node tests in `tests/js/tictactoe.test.mjs`, already picked up by `tests/test_js.py`. No server change.

## Technical Context

- **Language**: JavaScript (ES modules, browser and Node 20+), no framework, no build step, no npm dependencies.
- **Storage**: `localStorage` (key `poc02.tictactoe.tally`), guarded by try/catch.
- **Testing**: `node --test` via pytest (`uv run pytest`); lint `uvx ruff check .`.
- **Constraints**: nothing from an external host; shared `../css/site.css`; no edits to `app/main.py`, hub, registry, breakout, `.github/`, `.specify/`, `.claude/`, `CLAUDE.md`.
- **Constitution check**: `.specify/memory/constitution.md` is an unfilled template, so there are no gates. `CLAUDE.md` boundaries are respected.
- **Tooling note**: the Spec Kit setup script is PowerShell and `pwsh` is not available here, so the plan was written directly to the required paths. There is no numbered folder to clean up.

## Design

### `logic.js` (pure)

- Board: array of 9 entries `'X' | 'O' | null`. Index `i` maps to row `floor(i/3)+1`, column `i%3+1`.
- Exports:
  - `LINES`: the eight winning index triples.
  - `newGame()`: `{board, turn: 'X', status: 'playing', line: null}`.
  - `winner(board)`: `{player, line}` or `null`.
  - `play(state, index)`: returns a new state. An occupied cell, an out-of-range index or a finished game returns the same state unchanged. Otherwise it places the mark, then sets `won` with the line, `draw`, or flips the turn.
  - `legalMoves(board)`.
  - `bestMove(board, player)`: minimax with depth preference (win sooner, lose later). Ties are broken by the lowest index, so it is deterministic.
  - `easyMove(board, rng)`: `legalMoves[floor(rng() * n)]`, with `rng` a parameter returning a number in `[0,1)`.
  - `computerMove(state, mode, rng)`: dispatches on `'easy'` or `'hard'`.
  - `MODES = ['two', 'easy', 'hard']`.
- Tally helpers, also pure: `emptyTally()`, `recordResult(tally, state)` (increments only for a finished state), `parseTally(text)` (returns an empty tally for corrupt data or negative or non-integer values).

### `ui.js` (DOM)

- Builds from `index.html`: a mode `<select>` (a native control, keyboard-friendly), a status `<p role="status" aria-live="polite">`, a 3×3 grid of nine `<button>` elements, Restart, Reset tally, and a tally readout.
- Each cell has `aria-label` "Row r, column c, empty|X|O". Winning cells get a `win` class. After the end, the buttons stay focusable and moves are ignored by the logic.
- Flow: a click calls `play`. In easy or hard mode the human is X, and after the human's move, if the game is still playing, the computer (O) replies at once. Each finished game is recorded exactly once, at the transition to a finished state, then the tally is saved and rendered.
- Changing the mode or pressing Restart calls `newGame()`. An unfinished game is never counted.
- X always moves first, including after a restart.
- Storage failures (unavailable or corrupt) fall back to an in-memory tally starting at zero.
- Rendering rebuilds labels without moving focus, so keyboard play is not interrupted.
- Initialisation runs only when `document` exists, so the module can be imported safely.

### `index.html`

Links `../css/site.css`. The grid and cell styling (including the `win` highlight) goes in a `<style>` element in the page, because `site.css` is shared and out of scope. It loads `ui.js` with `<script type="module">`, has a `<noscript>` line, and a link back to the hub (`../`).

## Testing strategy (`tests/js/tictactoe.test.mjs`, `node:test`)

- All eight winning lines for X and O are detected, and `line` is correct.
- A draw is detected from a full board with no line.
- Illegal moves (occupied cell, move after a win or a draw, bad index) leave the state deep-equal.
- Turn order alternates X, O, X, … and the original state is not mutated.
- Minimax never loses: exhaustive search over every opponent move sequence, with the computer as O (opponent first) and as X (computer first); assert that no reachable terminal state is a win for the opponent. `easyMove` is tested with a stub rng.
- Tally helpers: counted once, corrupt text parsed to zero.
- Site checks already in `tests/test_site.py` (no external hosts, links resolve) must continue to pass.

## Risks

1. **Exhaustive minimax test runtime**: the full tree is small (under 600k nodes with pruning of the opponent's branches only), so it is fine, but a naive `bestMove` called at every node can be slow. Mitigation: minimax on an array board, and the test explores only the opponent branching.
2. **Double counting or a lost result** around the computer reply and restart. Mitigation: record only on the transition into a finished state, inside one function.
3. **Accessibility regressions** (live region not announcing, labels stale). Mitigation: update the text and labels in one render function; manual keyboard check in the quickstart below.

## Quickstart (manual validation)

1. `uv run uvicorn app.main:app --reload`, open `/tictactoe/`.
2. Play with the keyboard only (Tab, Space or Enter, arrow keys on the mode select) in each mode; confirm status, highlight, tally, reload persistence and reset.
3. `uv run pytest` and `uvx ruff check .` pass.
