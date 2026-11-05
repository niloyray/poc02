# Feature Specification: Add the hangman game

**Story**: POC02-5 | **Branch**: `POC02-5-add-the-hangman-game` | **Status**: Draft
**Depends on**: POC02-2 (scaffold and hub), POC02-3 (tic-tac-toe), POC02-4 (breakout), all merged.

## Goal

A player can play hangman in the browser: guess a hidden word one letter at a time before a figure is fully drawn, so the hub has a word game alongside tic-tac-toe and breakout. It has the same shape as the other games, runs entirely in the browser and loads nothing from external hosts.

## User-visible behaviour

- **Secret word**: picked at random from a built-in list of 100 common English words and shown as one blank per letter.
- **Guessing**: a correct guess reveals every place the letter appears. A wrong guess adds one part to the figure.
- **Figure**: an inline SVG with six parts (head, body, two arms, two legs), one shown per wrong guess.
- **Text state**: wrong guesses made and guesses left (out of six) are shown as text, so play does not depend on seeing the drawing.
- **End of game**: revealing every letter wins. The sixth wrong guess loses, and a lost game shows the word. No further guesses count after the end.
- **On-screen keyboard**: 26 real buttons, A to Z. A guessed letter's button is disabled and marked as right or wrong by more than colour (for example a symbol or text), not by colour alone.
- **Physical keyboard**: pressing a letter key guesses that letter, in either case. Other keys do nothing.
- **Status line**: playing, won, lost and the word are announced to screen readers through an `aria-live` region.
- **New game**: a button picks another word, never the one just played.
- **Tally**: wins and losses are kept in `localStorage`, shown on the page, survive a reload and can be reset.
- **Layout**: the shared stylesheet, a link back to the hub, and no horizontal scrolling at 360 px wide. The keyboard and buttons are usable by touch.
- **Hub**: a Hangman card (title, one-line description, link to `hangman/`) appears from the registry. `GET /hangman/` returns the game page.

## Acceptance criteria

- [ ] The hub shows a Hangman card built from the registry, and `GET /hangman/` returns the game page.
- [ ] The word list has exactly 100 unique words, each 4 to 7 letters, lower case a to z, and a test fails if any of that stops being true.
- [ ] A correct guess reveals every occurrence of the letter; a wrong guess adds one figure part and reduces guesses left by one.
- [ ] Guessing a letter again, pressing a key that is not a letter, or guessing after the game has ended changes nothing. Upper-case input behaves as lower case.
- [ ] The game is won when every letter is revealed and lost at the sixth wrong guess; a lost game shows the word.
- [ ] A new game never picks the word just played; the tally survives a page reload and can be reset.
- [ ] The whole game can be played with the physical keyboard alone, and with the on-screen buttons alone on a 360 px wide screen without horizontal scrolling.
- [ ] The status line is in an `aria-live` region; guessed buttons are disabled and marked right or wrong by more than colour.
- [ ] Node tests (`tests/js/hangman.test.mjs`, run by `node --test` through pytest) cover: word-list rules, correct and wrong guesses, repeated letters in a word, repeated and invalid guesses, upper-case input, win, loss, no moves after the end, and `pickWord` with an injected random source.
- [ ] `tests/test_app.py` checks the hangman page and its scripts. `uv run pytest` and `uvx ruff check .` pass. Nothing is loaded from an external host.

## Constraints

- Files: `app/static/hangman/words.js`, `logic.js`, `ui.js`, `index.html`; one registry entry in `app/static/js/games.js` (nothing else changed there); `tests/js/hangman.test.mjs`; `tests/test_app.py`. Follow `app/static/tictactoe/` and `tests/js/tictactoe.test.mjs`.
- `words.js` is an ES module exporting the list: no proper nouns, abbreviations or offensive words.
- `logic.js` never touches the DOM and exports `newGame(word)` (word, guessed letters, wrong count 0, status playing), `guess(state, letter)`, `pickWord(words, random, previous)` (random source is a parameter) and one constant for the limit of six wrong guesses.
- Plain ES modules, no framework, build step or npm dependencies. No change to the FastAPI application.

## Out of scope

- Loading words from the server, an API, or any file other than the built-in module.
- Difficulty levels, hints, categories, or word lists in other languages.
- A two-player mode where one person types the secret word.
- Sound and animation.
- Changes to the FastAPI application, or to the tic-tac-toe and breakout games.

## Open questions

Reasonable defaults are noted. None of these blocks planning.

1. Does the tally count a game abandoned by pressing new game mid-play? Default: no, only won and lost games count.
2. What if `localStorage` is unavailable or holds bad data? Default: play continues with the tally in memory, starting at 0 wins and 0 losses.
3. What if the list has only one distinct word, or `previous` is not in the list? Default: not reachable with the 100-word list; `pickWord` accepts any `previous`, including none on the first game.
