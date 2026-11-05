# Feature Specification: Add the tic-tac-toe game

**Story**: POC02-3 | **Branch**: `POC02-3-add-the-tic-tac-toe-game` | **Status**: Draft
**Depends on**: POC02-2 (scaffold and hub page), already merged.

## Goal

A player can play tic-tac-toe in the browser, either against a friend on the same device or against the computer, so they can play alone or with company. The game replaces the placeholder page left by the scaffold story. It runs entirely in the browser and loads nothing from external hosts.

## User-visible behaviour

- **Modes**: the player picks one of three modes: two players, computer easy, or computer hard. Easy plays a random legal move. Hard plays perfectly. Changing the mode starts a new game. Against the computer the person plays X and moves first.
- **Board**: nine real buttons in a 3×3 grid. Each button has an accessible name giving its position and content, for example "Row 1, column 2, empty" or "Row 2, column 2, X".
- **Status line**: a live region, announced to screen readers, that shows whose turn it is. At the end it shows "X wins", "O wins" or "Draw".
- **Winning line**: when someone wins, the three winning cells are highlighted.
- **Illegal moves**: a move on an occupied cell, or any move after the game has ended, changes nothing.
- **Restart**: a button starts a new game in the current mode.
- **Tally**: X wins, O wins and draws are counted, shown on the page and kept in localStorage so they survive a reload. A button resets the tally to zero. Each finished game is counted once.
- **Keyboard**: mode selection, every cell, restart and tally reset can be used with the keyboard alone.
- **Navigation**: the page uses the shared stylesheet and has a link back to the hub.

## Acceptance criteria

- [ ] The player can choose two players, computer easy or computer hard, and changing the mode starts a new game.
- [ ] A move on an occupied cell, or any move after the game has ended, changes nothing.
- [ ] A win or a draw is detected, shown in the status line and announced to screen readers. The three winning cells are highlighted.
- [ ] In hard mode the computer never loses, whatever the player does.
- [ ] Restart starts a new game. The tally of X wins, O wins and draws survives a page reload and can be reset.
- [ ] The whole game, including mode selection and restart, can be played with the keyboard alone.
- [ ] Node tests (`tests/js/tictactoe.test.mjs`, run by `node --test` through pytest) cover:
  - all eight winning lines;
  - a draw;
  - ignored illegal moves;
  - turn order;
  - minimax never losing against every possible line of play by the opponent, moving first or second.
- [ ] `uv run pytest` and `uvx ruff check .` pass. Nothing is loaded from an external host.

## Constraints

- Files: `app/static/tictactoe/logic.js`, `ui.js` and `index.html`, plus `tests/js/tictactoe.test.mjs`.
- `logic.js` holds the rules, never touches the DOM and takes the random source as a parameter so tests are repeatable.
- Plain ES modules with no framework, build step or npm dependencies.
- No change to the server.

## Out of scope

- Playing over the network or against a remote player.
- Board sizes other than 3×3.
- Sound, and animation beyond the winning-line highlight.
- Changes to the FastAPI application, new endpoints, or game rules on the server.
- Changes to the hub page, the registry or the breakout game.

## Open questions

Reasonable defaults are noted. None of these blocks planning.

1. Who moves first after a restart in two-player mode? Default: X always moves first.
2. If localStorage is unavailable or holds corrupt data, should the game still work? Default: yes, with the tally starting at zero and not persisted.
3. If the mode is changed mid-game, should an unfinished game count in the tally? Default: no, only finished games count.
