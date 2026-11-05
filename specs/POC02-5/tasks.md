# Tasks: Add the hangman game

Story POC02-5. Ordered; each task is small. Do not touch `.github/`, `.specify/`, `.claude/`, `CLAUDE.md`, `app/main.py`, tic-tac-toe or breakout. Do not commit or push.

## Phase 1: Word list and rules (`words.js`, `logic.js`) with tests first

- [x] T001 Create `tests/js/hangman.test.mjs` with the word-list test (exactly 100 words, unique, each `/^[a-z]{4,7}$/`) and `newGame(word)` tests (word kept, no guesses, wrong 0, status `playing`). They fail until T002–T003 exist.
- [x] T002 Create `app/static/hangman/words.js` exporting `WORDS`: 100 unique common English words, 4 to 7 letters, lower-case a to z, several with repeated letters, no proper nouns, abbreviations or offensive words.
- [x] T003 Create `app/static/hangman/logic.js` with `MAX_WRONG = 6` and `newGame(word)`, plus helpers `maskedWord`, `wrongLetters`, `guessesLeft`. No DOM access.
- [x] T004 Extend `tests/js/hangman.test.mjs`: correct guess reveals every occurrence (word with repeated letter), wrong guess adds one wrong and reduces guesses left, upper-case input equals lower case, `guess` does not mutate its input.
- [x] T005 In `app/static/hangman/logic.js` add `guess(state, letter)` (lower-casing, valid a to z only, correct and wrong handling, win and loss, unchanged state for repeated, invalid or post-end guesses).
- [x] T006 Extend `tests/js/hangman.test.mjs`: repeated guess, invalid input (digit, symbol, empty, multi-character, non-string) and guess after the end return the same state; win when all letters revealed; loss at the sixth wrong guess; no moves after win or loss.
- [x] T007 In `app/static/hangman/logic.js` add `pickWord(words, random, previous)` (random source is a parameter, never returns `previous` when another word exists, index clamped) and the tally helpers `emptyTally`, `recordResult`, `parseTally`.
- [x] T008 Extend `tests/js/hangman.test.mjs`: `pickWord` with injected random values (0, just under 1, mid), excluding `previous`, `previous` undefined or not in the list; tally helpers (only finished games counted, bad data gives an empty tally).
- [x] T009 Run `node --test tests/js/` and fix failures in `app/static/hangman/logic.js`, `app/static/hangman/words.js` or `tests/js/hangman.test.mjs`.

## Phase 2: Page and UI

- [x] T010 Create `app/static/hangman/index.html`: shared stylesheet `../css/site.css`, `<style>` for a wrapping keyboard grid with touch-sized buttons and no horizontal overflow at 360 px, `<h1>`, inline SVG gallows with six hidden parts (head, body, two arms, two legs), word display, text state (wrong guesses, guesses left), `role="status" aria-live="polite"` status line, keyboard container, New game and Reset tally buttons, tally paragraph, `<noscript>`, `<a href="../">Back to the hub</a>`, `<script type="module" src="ui.js">`. No external hosts.
- [x] T011 Create `app/static/hangman/ui.js`: initialise only when `document` exists; build 26 real letter buttons; render the masked word, wrong guesses, guesses left, SVG parts and status text (the word is shown on a loss); guessed buttons are disabled and marked ✓ or ✗ in text and `aria-label`, not by colour alone.
- [x] T012 In `app/static/hangman/ui.js` add the physical keyboard (`keydown` on `document`, letters in either case only, ignoring Ctrl/Meta/Alt combinations and non-letter keys), the New game button (using `pickWord(WORDS, Math.random, previousWord)`), and the tally (key `poc02.hangman.tally`, try/catch around `localStorage`, recorded once on the transition to won or lost, Reset tally button, shown on the page).

## Phase 3: Hub and tests of the site

- [x] T013 Add one entry `{ title: "Hangman", description: "Guess the word before the figure is drawn.", path: "hangman/" }` to the `games` array in `app/static/js/games.js`; change nothing else in that file.
- [x] T014 Update `tests/test_app.py`: add `/hangman/` to the parametrized `test_game_pages`; add a test that `/hangman/ui.js`, `/hangman/logic.js` and `/hangman/words.js` return 200 with a javascript content type and that the page references `ui.js`; add a test that `/js/games.js` lists `hangman/`.

## Phase 4: Verify

- [x] T015 Run `uv run pytest` and `uvx ruff check .`; fix failures only in files this story owns (`app/static/hangman/*`, `app/static/js/games.js` registry entry, `tests/js/hangman.test.mjs`, `tests/test_app.py`).
- [x] T016 Check by reading that `app/static/hangman/` loads nothing from an external host, `logic.js` and `words.js` never reference `document`, `window` or `localStorage`, and the letter keys and buttons are native focusable `<button>` elements.
- [x] T017 Confirm `git status` shows changes only in `app/static/hangman/`, `app/static/js/games.js`, `tests/js/hangman.test.mjs`, `tests/test_app.py` and `specs/POC02-5/`, none in `.github/`, `.specify/`, `.claude/` or `CLAUDE.md`, and that `git diff app/static/js/games.js` shows only the one added entry.
