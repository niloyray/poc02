# Implementation Plan: Add the hangman game

**Story**: POC02-5 | **Branch**: `POC02-5-add-the-hangman-game` | **Spec**: `specs/POC02-5/spec.md`

## Summary

Add a hangman game under `app/static/hangman/` as plain ES modules, shaped like `app/static/tictactoe/`: `words.js` (the 100-word list), `logic.js` (pure rules, no DOM), `ui.js` (DOM, keyboard, tally) and `index.html`. Add one entry to the registry in `app/static/js/games.js`. Tests: `tests/js/hangman.test.mjs` (picked up by `tests/test_js.py`, which globs `tests/js/*.mjs`) and an extended `tests/test_app.py`. No change to the FastAPI app (static files are already served).

## Technical Context

- **Language**: JavaScript (ES modules, browser and Node 20+); no framework, build step or npm dependencies.
- **Testing**: `node --test` via pytest (`uv run pytest`); lint `uvx ruff check .`.
- **Constraints**: nothing loaded from an external host (checked by `tests/test_site.py`); shared `../css/site.css`; no edits to `app/main.py`, tic-tac-toe, breakout, `.github/`, `.specify/`, `.claude/` or `CLAUDE.md`. In `games.js` only the registry entry is added.
- **Constitution check**: `.specify/memory/constitution.md` defines no gates for this repo; `CLAUDE.md` boundaries are respected.
- **Tooling note**: the Spec Kit setup scripts are PowerShell and `pwsh` is not available, so plan and tasks are written directly to the required paths. No numbered folder exists, so no clean-up is needed. No research.md, data-model.md or contracts are produced (the stage may write only plan.md and tasks.md).

## Resolved open questions (spec defaults)

1. Only won and lost games count in the tally; pressing New game mid-play records nothing.
2. If `localStorage` is unavailable, throws, or holds bad data, play continues with an in-memory tally of 0 wins and 0 losses.
3. `pickWord` accepts any `previous` (including `undefined` on the first game); it is only guaranteed to avoid `previous` when the list has another word.

## Design

### `words.js`

`export const WORDS = [...]`: exactly 100 unique, common English words, 4 to 7 letters, lower-case a to z only, no proper nouns, abbreviations or offensive words. Some words must contain repeated letters (e.g. "apple", "yellow", "button") to exercise the reveal-all rule.

### `logic.js` (pure, never touches the DOM)

- `export const MAX_WRONG = 6`.
- State: `{ word, guessed: [letters in guess order], wrong: number, status: 'playing' | 'won' | 'lost' }`. Wrong guesses are derived as `guessed` letters not in `word` (helper `wrongLetters(state)`), and `wrong` equals their count.
- `newGame(word)`: `{ word, guessed: [], wrong: 0, status: 'playing' }`.
- `guess(state, letter)`: returns a new state, never mutates. Returns the same `state` object unchanged when: status is not `playing`; `letter` is not a single character a to z after lower-casing (`String(letter).toLowerCase()`); or the letter is already guessed. A letter in the word is added to `guessed`; if all distinct letters of the word are now guessed, status is `won`. A letter not in the word is added and `wrong` increments; at `wrong === MAX_WRONG`, status is `lost`.
- Helpers: `maskedWord(state)` (array of letter or `null` per position; on `lost` the UI shows the full word), `wrongLetters(state)`, `guessesLeft(state)` (`MAX_WRONG - wrong`).
- `pickWord(words, random, previous)`: `random` is a function returning [0, 1). Filters out `previous`, picks `candidates[floor(random() * candidates.length)]` with the index clamped to `length - 1`; if filtering leaves nothing, falls back to the full list.
- Tally helpers modelled on tic-tac-toe: `emptyTally()` → `{ wins: 0, losses: 0 }`, `recordResult(tally, state)` (win or loss only, else unchanged), `parseTally(text)` (returns `emptyTally()` on bad JSON or non-non-negative-integer fields).

### `ui.js`

- Imports `WORDS` and `logic.js`; initialises only when `document` exists.
- Tally persisted under key `poc02.hangman.tally` with try/catch around every `localStorage` call (same pattern as tic-tac-toe).
- Keyboard: 26 `<button type="button">` created for a to z, each with visible upper-case text. When guessed, the button gets `disabled` and a visible mark appended to its text and `aria-label`: "✓" with "correct" or "✗" with "wrong", plus a CSS class for colour as extra, not the only, cue.
- Physical keyboard: one `keydown` listener on `document`; ignore events with `ctrlKey`, `metaKey` or `altKey`, and `key` not matching `/^[a-zA-Z]$/` (this also ignores Enter, Space and Tab, so buttons keep native behaviour). Matching keys call the same handler as button clicks.
- Rendering: masked word as spaced blanks; text "Wrong guesses: X, Y" (or "none") and "Guesses left: n of 6"; an inline SVG with six parts (`head`, `body`, `arm-left`, `arm-right`, `leg-left`, `leg-right`), part `i` shown when `wrong > i` (via the `hidden` attribute / a class), with a gallows always shown. `<svg role="img" aria-label>` is kept brief because the text state carries the information.
- Status line: `<p id="status" role="status" aria-live="polite">` with "Playing: guess a letter", "You won! The word was X" or "You lost. The word was X". Updated on change only.
- Result recording: on the transition from `playing` to `won`/`lost` record the tally once and save it.
- New game button: `pickWord(WORDS, Math.random, state.word)`. Reset tally button: `emptyTally()` and save. Tally text "Wins: n · Losses: n".

### `index.html`

Same structure as `app/static/tictactoe/index.html`: `../css/site.css`, a `<style>` block for page-specific styling (keyboard grid with `flex-wrap` / `grid-template-columns: repeat(auto-fit, minmax(2.5rem, 1fr))`, min 44 px touch targets, `max-width: 100%`, so there is no horizontal scroll at 360 px), `<h1>`, SVG, word, text state, status region, keyboard container, New game and Reset tally buttons, tally paragraph, `<noscript>`, `<a href="../">Back to the hub</a>`, `<script type="module" src="ui.js">`. No external hosts.

### Registry

Append `{ title: "Hangman", description: "Guess the word before the figure is drawn.", path: "hangman/" }` to `games` in `app/static/js/games.js`. Nothing else in that file changes.

## Testing strategy

`tests/js/hangman.test.mjs` (`node:test`, import from `app/static/hangman/`, style as `tictactoe.test.mjs`):

- Word list: length 100, unique, each matches `/^[a-z]{4,7}$/` (the failing-if-broken rule).
- `newGame`: word kept, no guesses, wrong 0, status `playing`.
- Correct guess reveals all occurrences (word with a repeated letter); wrong guess adds a wrong count and reduces guesses left.
- Repeated guess, invalid input (digit, symbol, empty, multi-character, non-string), and guesses after the end return the same state and change nothing.
- Upper-case input behaves as lower case.
- Win when all letters revealed; loss at the sixth wrong guess; no moves after either; `guess` does not mutate its input.
- `pickWord` with an injected random source (0, just under 1, a mid value), never returns `previous`, works with `previous` undefined and not in the list.
- Tally helpers: `recordResult` counts only finished games; `parseTally` handles bad data.

`tests/test_app.py`: parametrize `test_game_pages` with `/hangman/`; add a test that `/hangman/` references `ui.js` and the scripts `/hangman/ui.js`, `/hangman/logic.js`, `/hangman/words.js` return 200 with a javascript content type; add a check that `/js/games.js` contains `hangman/`. Existing `tests/test_site.py` keeps covering external hosts and links.

## Risks

1. **Repeated letters and win detection**: counting guesses rather than distinct letters would never or wrongly win. Mitigation: win test is "every distinct letter of the word is in `guessed`"; tests use words with repeated letters.
2. **Input handling at the edges**: upper case, `Shift`/`Enter`/`Space`, key repeat, browser shortcuts (Ctrl+R), or a focused button receiving Space while a letter key also fires. Mitigation: one validated path through `guess`, modifier keys ignored, repeated guesses are no-ops, tests for invalid input.
3. **Accessibility beyond colour**: guessed-state marked only by colour, or chatty live region. Mitigation: symbol plus text in the button label, `disabled`, status updated on change only.
4. **Tally corruption or double count**: storage missing/bad data, or recording the result on every render. Mitigation: try/catch, `parseTally` validation, record only on the `playing` → finished transition.
5. **Layout at 360 px**: 26 buttons overflowing. Mitigation: wrapping grid with `max-width: 100%`; verify manually at 360 px.
6. **Word list quality**: duplicates, wrong length, or unsuitable words slipping in. Mitigation: the list test plus review of the final list.

## Quickstart (manual validation)

1. `uv run uvicorn app.main:app --reload`; open `/` and confirm the Hangman card, then `/hangman/`.
2. Play to a win and to a loss with the physical keyboard only, then with the on-screen buttons only at 360 px wide (no horizontal scrolling). Confirm guessed buttons are disabled and marked ✓/✗, the figure grows one part per wrong guess, and a loss shows the word.
3. Reload and confirm the tally is kept; reset it; press New game several times and confirm the word never repeats back-to-back.
4. `uv run pytest` and `uvx ruff check .` pass.
