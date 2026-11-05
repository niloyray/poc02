# Feature Specification: Add the word jumble game

**Story**: POC02-7 | **Branch**: `POC02-7-add-the-word-jumble-game` | **Status**: Draft
**Depends on**: POC02-2 to POC02-6 (hub, tic-tac-toe, breakout, hangman), merged and released.

## Goal

A player sees the letters of a word in a mixed-up order and types the word. The hub gets a fourth game and a second word game. It is built in the same shape as hangman (`app/static/hangman/`, `tests/js/hangman.test.mjs`): its own folder, rules without DOM access, its own word list, one file for rendering and input, Node tests for the rules.

## User-visible behaviour

- **Hub**: a "Word jumble" card with a one-line description links to `jumble/`. `GET /jumble/` returns the game page, which has a link back to the hub.
- **Round start**: a secret word is picked at random from the game's own list. Its letters are shown as separate tiles in an order that is never the word itself.
- **Answering**: the player types in a labelled text field and submits with a button or the Enter key. The field is limited to 7 characters and has autocorrect, autocapitalise and spellcheck switched off.
  - Right word (any letter case, spaces around it ignored): the round is solved.
  - Wrong word: costs one of three tries; the page says so, the field is cleared and keeps the focus. The third wrong answer loses the round and shows the word.
  - Blank input, or anything other than the letters a to z: costs nothing; the page says what is expected.
  - Only the secret word is right, even if the letters spell another word.
  - After the round has ended, answers change nothing.
- **Shuffle**: mixes the same letters again. Costs nothing; never shows the word itself.
- **Next word**: starts a new round with a different word than the one just played. Used during an unfinished round, it counts that round as missed.
- **Tally**: solved and missed words are shown, kept in the browser (own storage key) across reloads, and can be reset.
- **Accessibility**: the letters are also available as text (for example "Letters: t, o, r, c, k, e"); the tries left are shown as text; the result (playing, solved, missed and the word) is announced through an aria-live region. The game works with the keyboard alone and on a 360 px wide screen without horizontal scrolling.

## Word list

100 words, own module, not shared with hangman. Each is 4 to 7 letters, lower case, a to z only, no duplicates, common English words, no proper nouns, abbreviations or offensive words. No two words are anagrams of each other, and words with another common English anagram (such as "stale", "least", "steal") are left out, so each jumble has one answer.

## Acceptance criteria

- [ ] The hub shows a Word jumble card built from the registry (one new entry in `app/static/js/games.js`, nothing else changed there), and `GET /jumble/` returns the game page.
- [ ] The word list has exactly 100 unique words, each 4 to 7 letters, lower case a to z, and no two are anagrams of each other; a Node test fails if any of that stops being true.
- [ ] Each round shows all letters of the secret word in an order that is never the word itself; Shuffle shows another order and costs nothing.
- [ ] `scramble(word, random)` keeps the same letters, never returns the word, takes the random source as a parameter, and finishes for any random source, including a constant one.
- [ ] The secret word, in any letter case and with surrounding spaces, wins the round; a wrong answer costs one of three tries; the third wrong answer loses the round and shows the word.
- [ ] Blank input, input that is not letters only, and answers after the round has ended leave the state unchanged.
- [ ] `pickWord(words, random, previous)` and Next word never return the word just played; Next word during an unfinished round counts it as missed.
- [ ] The limit of three wrong answers is one exported constant; tally helpers work as in hangman.
- [ ] The tally of solved and missed words survives a page reload and can be reset.
- [ ] The answer field has a visible label, autocorrect/autocapitalise/spellcheck off, and a 7-character limit. Letters text, tries left text and the aria-live result are present.
- [ ] The game can be played with the keyboard alone and at 360 px width without horizontal scrolling.
- [ ] Node tests (`tests/js/jumble.test.mjs`) cover the word-list rules, scramble (same letters, never the word, injected random source, constant random source), right and wrong answers, upper-case input, invalid input, loss at the third wrong answer, no moves after the end, and pickWord.
- [ ] `tests/test_app.py` checks the jumble page and its scripts; existing tests are adjusted only if they count registry entries or list game pages.
- [ ] `uv run pytest`, `uvx ruff check .` and `uvx ruff format --check .` pass. Nothing is loaded from an external host.

## Constraints

- New files: `app/static/jumble/{words.js,logic.js,ui.js,index.html}`, `tests/js/jumble.test.mjs`. Changed: `app/static/js/games.js` (one entry), `tests/test_app.py`.
- `logic.js` never touches the DOM and rules stay in the browser. Plain ES modules, no framework, build step or npm dependencies; the shared stylesheet is used.
- Any SVG element is hidden with a CSS class, never the `hidden` attribute.
- `.github/`, `.specify/`, `.claude/` and `CLAUDE.md` are not edited.

## Out of scope

- Loading words from the server, an API or another file; sharing or changing the hangman word list.
- Hints, timer, difficulty levels, categories, other languages, accepting other valid anagrams.
- Drag-and-drop tiles, sound, animation.
- Changes to the FastAPI application or to tic-tac-toe, breakout and hangman.

## Open questions

Reasonable defaults are noted. None blocks planning.

1. Wording of the messages (wrong answer, invalid input, result). Default: left to the plan, modelled on hangman.
2. Whether Shuffle may return the order currently shown. Default: no, "another order" means different from the current one.
3. Name of the localStorage key. Default: a jumble-specific key following the hangman pattern.
