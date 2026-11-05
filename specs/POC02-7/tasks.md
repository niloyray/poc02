# Tasks: Add the word jumble game

Story POC02-7. Ordered; each task is small. Touch only the files named in each task. Do not touch `.github/`, `.specify/`, `.claude/`, `CLAUDE.md`, `app/main.py` or the other games. Do not commit or push.

## Phase 1: Word list with its test

- [x] T001 Create `tests/js/jumble.test.mjs` with word-list tests importing `WORDS` from `app/static/jumble/words.js`: length 100, all unique, each matches `/^[a-z]{4,7}$/`, each has at least two distinct letters, and no two words have equal sorted letters. They fail until T002.
- [x] T002 Create `app/static/jumble/words.js` exporting `WORDS`: 100 common English words as specified in the plan (no proper nouns, abbreviations, offensive words, or words with another common English anagram such as stale/least/steal). Review each word by hand for outside anagrams.

## Phase 2: Rules, tests first

- [x] T003 In `tests/js/jumble.test.mjs` add `scramble` tests: same letters for every list word, never equals the word, honours `avoid`, reproducible with an injected source, finishes with constant sources 0, 0.5 and 0.9999, works with repeated letters. They fail until T004.
- [x] T004 Create `app/static/jumble/logic.js` with `MAX_TRIES = 3`, `MAX_LENGTH = 7` and `scramble(word, random, avoid)` (Fisher-Yates with clamped index, bounded attempts, deterministic enumeration fallback). No DOM access.
- [x] T005 In `tests/js/jumble.test.mjs` add round tests: `newRound` (word kept, letters differ from the word, wrong 0, `playing`), `shuffle` (same letters, differs from word and previous order, no try cost, unchanged after end), `triesLeft`, `lettersText`. They fail until T006.
- [x] T006 In `app/static/jumble/logic.js` add `newRound`, `shuffle`, `triesLeft`, `lettersList` and `lettersText`.
- [x] T007 In `tests/js/jumble.test.mjs` add `answer` and `giveUp` tests: right word solves; upper case and surrounding spaces solve; wrong word costs one try; third wrong answer gives `missed`; an anagram that is not the word is wrong; blank, digit, symbol, inner space and non-string input return the same state object; no change after solved or missed; input state is not mutated; `giveUp` marks an unfinished round missed and leaves a finished one alone. They fail until T008.
- [x] T008 In `app/static/jumble/logic.js` add `answer` and `giveUp`.
- [x] T009 In `tests/js/jumble.test.mjs` add `pickWord` tests (injected random 0, just under 1, mid value; never returns `previous`; `previous` undefined or not in list; single-word list) and tally tests (`emptyTally`, `recordResult` counts only finished rounds, `parseTally` on bad JSON and bad fields, `MAX_TRIES` is 3). They fail until T010.
- [x] T010 In `app/static/jumble/logic.js` add `pickWord`, `emptyTally`, `recordResult` and `parseTally` (as in `app/static/hangman/logic.js`, fields `solved` and `missed`).
- [x] T011 Run `node --test tests/js/` and fix failures in `app/static/jumble/logic.js`, `app/static/jumble/words.js` or `tests/js/jumble.test.mjs`; all existing tests must still pass.

## Phase 3: Page, UI and hub entry

- [x] T012 In `tests/test_app.py` add `/jumble/` to `test_game_pages`; add tests that `/jumble/` references `ui.js` and `/jumble/ui.js`, `/jumble/logic.js`, `/jumble/words.js` return 200 with a javascript content type; that `/js/games.js` contains `jumble/`; and that the page has a label for the answer field, `maxlength="7"`, `autocorrect="off"`, `autocapitalize="off"`, `spellcheck="false"` and an `aria-live` region. They fail until T013 to T015.
- [x] T013 Create `app/static/jumble/index.html` as described in the plan: shared stylesheet, `<style>` for wrapping tiles and 360 px layout, tiles container, `#letters`, labelled form with the input attributes, `#tries-left`, `#status` with `role="status" aria-live="polite"`, Shuffle / Next word / Reset tally buttons, tally paragraph, `<noscript>`, back link, `<script type="module" src="ui.js">`. No SVG, no external hosts.
- [x] T014 Create `app/static/jumble/ui.js`: tally load/save under `poc02.jumble.tally` with try/catch, tiles and letters text, form submit (invalid message, wrong message, clear and refocus), Shuffle, Next word (miss recorded once for an unfinished round, new word different from the last), Reset tally, disabled controls after the round ends, status updated on change only, tally recorded once on the `playing` to finished transition.
- [x] T015 In `app/static/js/games.js` append the entry `{ title: "Word jumble", description: "Unscramble the letters to find the word.", path: "jumble/" }` to `games`; change nothing else in the file.

## Phase 4: Verify

- [x] T016 Run `uv run pytest`, `uvx ruff check .` and `uvx ruff format --check .`; fix failures in the files from T001 to T015. If `tests/test_site.py` or `tests/js/games.test.mjs` count registry entries or list game pages, adjust only those counts. Confirm nothing is loaded from an external host.
- [x] T017 Manual check of `/jumble/` in a browser (serve with the app) following the plan quickstart: keyboard-only play, 360 px width without horizontal scroll, Shuffle never shows the word, Next word mid-round counts a miss, tally survives reload and resets, loss shows the word. Fix any gap in `app/static/jumble/ui.js` or `app/static/jumble/index.html`.
