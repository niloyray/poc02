# Implementation Plan: Add the word jumble game

**Story**: POC02-7 | **Branch**: `POC02-7-add-the-word-jumble-game` | **Spec**: `specs/POC02-7/spec.md`

## Summary

Add a word jumble game under `app/static/jumble/` as plain ES modules, shaped like `app/static/hangman/`: `words.js` (own 100-word list), `logic.js` (pure rules, no DOM), `ui.js` (DOM, input, tally) and `index.html`. Add one entry to the registry in `app/static/js/games.js`. Tests: `tests/js/jumble.test.mjs` (picked up by `tests/test_js.py`, which globs `tests/js/*.mjs`) and an extended `tests/test_app.py`. No change to the FastAPI app (static files are already served).

## Technical Context

- **Language**: JavaScript (ES modules, browser and Node 20+); no framework, build step or npm dependencies.
- **Testing**: `node --test` via pytest (`uv run pytest`); lint `uvx ruff check .` and `uvx ruff format --check .`.
- **Constraints**: nothing loaded from an external host (checked by `tests/test_site.py`); shared `../css/site.css`; no edits to `app/main.py`, other games, `.github/`, `.specify/`, `.claude/` or `CLAUDE.md`. In `games.js` only the registry entry is added.
- **Tooling note**: Spec Kit setup scripts are PowerShell and may be unavailable, so plan and tasks are written directly to the required paths (as for earlier stories). No numbered folder exists. No research.md, data-model.md or contracts are produced.
- **Existing tests**: `tests/test_site.py` and `tests/js/games.test.mjs` are checked for registry counts/page lists during the verify task; they are adjusted only if they count entries.

## Resolved open questions

1. **Messages** (modelled on hangman):
   - playing: `Playing: unscramble the letters. Tries left: n of 3`
   - wrong: `Not it. Tries left: n of 3`
   - invalid/blank: `Type the word using the letters a to z only.`
   - solved: `Solved! The word was WORD`
   - missed: `Missed. The word was WORD`
2. **Shuffle** always returns an order different from both the word and the order currently shown (`scramble` takes an optional third argument `avoid`).
3. **Storage key**: `poc02.jumble.tally`, value `{ "solved": n, "missed": n }`.
4. Next word during an unfinished round records a miss; after a finished round it records nothing extra (the result was recorded at the end of the round). Shuffle and invalid input never touch the tally.
5. If `localStorage` is unavailable, throws, or holds bad data, play continues with an in-memory tally of 0 and 0.

## Design

### `words.js`

`export const WORDS = [...]`: exactly 100 unique, common English words, 4 to 7 letters, lower case a to z, no proper nouns, abbreviations or offensive words. No two words share the same sorted letters; words that have another common English anagram (stale/least/steal, and similar such as "post", "listen", "later", "dear", "evil", "night"-style pairs) are excluded. Every word has at least two distinct letters, so a different order always exists. The list-rules test checks everything testable; "no other common anagram" is checked by review of the final list.

### `logic.js` (pure, never touches the DOM)

- `export const MAX_TRIES = 3` (the one constant for the limit) and `export const MAX_LENGTH = 7` (also used by the page for `maxlength`).
- `scramble(word, random, avoid)`: `random` returns [0, 1). Fisher-Yates over the letters using `random`, index clamped to the valid range, so any source (including constant 0 or 0.999...) finishes. Accept the result if it differs from `word` and from `avoid` (when given); try a bounded number of times (e.g. 20). If still not accepted (constant source), fall back deterministically: enumerate distinct arrangements of the letters in a fixed order and return the first not equal to `word` or `avoid`. Returns a string with the same multiset of letters. Never loops forever; never returns `word`.
- State: `{ word, letters: string, wrong: number (wrong answers so far), status: 'playing' | 'solved' | 'missed' }`.
- `newRound(word, random)`: `{ word, letters: scramble(word, random), wrong: 0, status: 'playing' }`.
- `shuffle(state, random)`: new state with `letters: scramble(state.word, random, state.letters)`; returns the same state object unchanged when not `playing` (after the end there is nothing to shuffle). Costs no tries.
- `answer(state, text)`: returns the same `state` object when status is not `playing`, when `text` is not a string, or when `text.trim().toLowerCase()` does not match `/^[a-z]+$/` (blank, digits, symbols, inner spaces). Otherwise a right word (equal to `state.word`) gives status `solved`; anything else increments `wrong`, and at `wrong === MAX_TRIES` status is `missed`. Only the secret word is right, never another word with the same letters. Never mutates.
- `triesLeft(state)`: `MAX_TRIES - wrong`. `lettersList(state)`: letters as array. `lettersText(state)`: `Letters: t, o, r, c, k, e`.
- `giveUp(state)`: for an unfinished round returns `{...state, status: 'missed'}`; otherwise the same state. Used by Next word.
- `pickWord(words, random, previous)`: identical behaviour to hangman (filter out `previous`, clamp the index, fall back to the full list if nothing is left).
- Tally helpers as in hangman with different field names: `emptyTally()` → `{ solved: 0, missed: 0 }`, `recordResult(tally, state)` (solved or missed only, else unchanged), `parseTally(text)` (`emptyTally()` on bad JSON or non-non-negative-integer fields).

### `ui.js`

- Imports `WORDS` and `logic.js`; initialises only when `document` exists. Uses `Math.random`.
- Tally persisted under `poc02.jumble.tally`, try/catch around every `localStorage` call (same helper pattern as hangman).
- Tiles: one `<span class="tile">` per letter in a container (upper-case text); the container also has the text form from `lettersText` in a visible `<p id="letters">`, so the letters are available as text.
- Form: `<form id="answer-form">` with `<label for="answer">Your answer</label>`, `<input id="answer" type="text" maxlength="7" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">` and a submit button, so Enter works with no extra key handling. On submit: `answer(state, input.value)`; if the state object is unchanged, show the invalid-input message when the round is playing (nothing else changes); otherwise update state, clear the field, keep the focus (`input.focus()`), and on the `playing` to finished transition record the tally once and save. A wrong answer shows the wrong message.
- Shuffle button: `shuffle(state, Math.random)`, re-render, no tally change.
- Next word button: if the round is `playing`, `giveUp` it and record the miss once; then `newRound(pickWord(WORDS, Math.random, state.word), Math.random)`; re-render; focus the field.
- After the round ends the input and Submit/Shuffle are disabled; Next word stays enabled.
- Status: `<p id="status" role="status" aria-live="polite">` with the messages above, updated on change only. Tries text `Tries left: n of 3` in its own `<p id="tries-left">`.
- Tally text `Solved: n · Missed: n`; Reset tally button calls `emptyTally()` and saves.

### `index.html`

Same structure as `app/static/hangman/index.html`: `../css/site.css`, a `<style>` block (tiles as a wrapping flex row with `gap`, min 44 px touch targets, `max-width: 100%`, input `max-width: 100%`, no horizontal scroll at 360 px), `<h1>Word jumble</h1>`, tiles, letters text, form, tries text, status region, Shuffle / Next word / Reset tally buttons, tally paragraph, `<noscript>`, `<a href="../">Back to the hub</a>`, `<script type="module" src="ui.js">`. No SVG, no external hosts.

### Registry

Append `{ title: "Word jumble", description: "Unscramble the letters to find the word.", path: "jumble/" }` to `games` in `app/static/js/games.js`. Nothing else in that file changes.

## Testing strategy

`tests/js/jumble.test.mjs` (`node:test`, style as `hangman.test.mjs`):

- Word list: length 100, unique, each matches `/^[a-z]{4,7}$/`, at least two distinct letters, and no two words have equal sorted letters.
- `scramble`: same sorted letters for every word in the list with `Math.random` and a seeded source; never equals the word; honours `avoid`; injected source gives a reproducible result; constant sources (0, 0.5, just under 1) finish and differ from the word; words with repeated letters work.
- `newRound`: word kept, letters differ from the word, wrong 0, `playing`.
- `shuffle`: same letters, different from the word and the previous order, no tries cost, no change after the end.
- `answer`: right word wins; upper case and surrounding spaces win; wrong word costs one try; third wrong loses; an anagram of the word that is not the word is wrong; blank, digits, symbols, inner space and non-string return the same state object; after solved or missed returns the same state; input is not mutated.
- `giveUp`, `triesLeft`, `lettersText`.
- `pickWord` with injected random (0, just under 1, mid), never returns `previous`, works with `previous` undefined and not in the list, single-word list.
- Tally helpers: `recordResult` counts only finished rounds; `parseTally` handles bad data; `MAX_TRIES` equals 3.

`tests/test_app.py`: add `/jumble/` to `test_game_pages`; add a test that `/jumble/` references `ui.js` and that `/jumble/ui.js`, `/jumble/logic.js`, `/jumble/words.js` return 200 with a javascript content type; add a check that `/js/games.js` contains `jumble/`; check the page has the label, `maxlength="7"`, `autocorrect="off"`, `autocapitalize="off"`, `spellcheck="false"` and an `aria-live` region. Existing `tests/test_site.py` keeps covering external hosts and links.

## Risks

1. **Word list quality (riskiest)**: 100 words that are common, family-friendly, and free of anagram partners cannot be machine-verified against a dictionary. The test catches duplicates, length and in-list anagrams only; a missed outside anagram (e.g. "least") makes a correct answer score as wrong. Mitigation: pick unambiguous words, review each against the stale/least/steal pattern, keep a margin of candidates during selection.
2. **`scramble` termination and correctness**: a constant random source can yield the word forever; repeated letters make rejection likely. Mitigation: bounded attempts plus a deterministic enumeration fallback; the list rule of at least two distinct letters; tests with constant sources.
3. **Shuffle contract**: avoiding the current order as well as the word, for words with few arrangements. Mitigation: the fallback enumeration respects both; tests for every list word.
4. **Input handling**: case, spaces, Enter versus button, focus after a wrong answer, answers after the end. Mitigation: one validated path through `answer`, form submit for Enter, tests for invalid input.
5. **Tally double counting**: Next word during play plus end-of-round recording. Mitigation: record only on the `playing` to finished transition, including the give-up path, in one helper.
6. **Layout at 360 px and accessibility**: tiles or input overflowing; chatty live region. Mitigation: wrapping flex, `max-width: 100%`, status updated on change only, letters and tries also as text.

## Quickstart (manual validation)

1. `uv run uvicorn app.main:app --reload`; open `/` and confirm the Word jumble card, then `/jumble/`.
2. Play to a solve and to a loss using the keyboard only (type, Enter, Tab to buttons); repeat at 360 px wide with no horizontal scrolling. Confirm focus stays in the field after a wrong answer, and the loss shows the word.
3. Press Shuffle several times (tiles change, tries unchanged, never the word). Press Next word mid-round and confirm Missed goes up and the word changes.
4. Reload and confirm the tally is kept; reset it.
5. `uv run pytest`, `uvx ruff check .` and `uvx ruff format --check .` pass.
