# Tasks: Draw the hangman figure one part per wrong guess

Story POC02-6. Ordered; each task is small. Touch only the files named in each task. Do not touch `.github/`, `.specify/`, `.claude/`, `CLAUDE.md`, `app/main.py` or the other games. Do not commit or push.

## Phase 1: Rule function with tests first

- [ ] T001 In `tests/js/hangman.test.mjs` import `partsShown` and `PARTS` from `logic.js` and add tests: `partsShown` returns `[]` for a new game; after 1, 2, 3, 4, 5 and 6 wrong guesses (real `guess` calls with letters absent from the word) it returns the first N of `head, body, arm-left, arm-right, leg-left, leg-right` in order; a correct guess leaves the result equal; the result is a new array and state is not mutated. They fail until T002.
- [ ] T002 In `app/static/hangman/logic.js` add `export const PARTS` (the six names in drawing order) and `export function partsShown(state)` returning `PARTS.slice(0, min(max(state.wrong, 0), 6))`. No DOM access.
- [ ] T003 Run `node --test tests/js/` and fix failures in `app/static/hangman/logic.js` or `tests/js/hangman.test.mjs`; all existing tests must still pass.

## Phase 2: Regression test for the page

- [ ] T004 In `tests/test_site.py` add a hangman test using stdlib `html.parser` on `app/static/hangman/index.html`: track `<svg>` depth (handle start-end tags), assert no element inside the SVG has a `hidden` attribute, the six ids `part-head`, `part-body`, `part-arm-left`, `part-arm-right`, `part-leg-left`, `part-leg-right` are all found and carry class `part`, and the four gallows lines carry no `part` class. Also assert the page's `<style>` contains a rule hiding `.part` unless `.shown`. It fails until T005.

## Phase 3: Page and UI

- [ ] T005 In `app/static/hangman/index.html` remove `hidden` from the six part elements and add `class="part"` to each; add `#figure .part:not(.shown) { display: none; }` to the `<style>` block; set the `<svg>` `aria-label` to `Hangman figure: 0 of 6 parts drawn`.
- [ ] T006 In `app/static/hangman/ui.js` remove the local `PARTS` constant, import `PARTS` and `partsShown` from `logic.js`, and in `render()` toggle the `shown` class on each `part-<name>` element from `partsShown(state)` (never set `hidden`) and set the `#figure` `aria-label` to `Hangman figure: <n> of 6 parts drawn`.

## Phase 4: Verify

- [ ] T007 Run `uv run pytest`, `uvx ruff check .` and `uvx ruff format --check .`; fix failures in `tests/test_site.py`, `tests/js/hangman.test.mjs` or the files from T002, T005, T006. Confirm nothing is loaded from an external host.
- [ ] T008 Manual check of `app/static/hangman/index.html` in a browser (serve with the app): bare gallows at start; one part per wrong guess in the right order; no change on a correct guess; full figure on loss; New game returns to the bare gallows; accessible name matches. Fix any gap in `app/static/hangman/ui.js` or `app/static/hangman/index.html`.
