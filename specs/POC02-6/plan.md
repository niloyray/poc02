# Implementation Plan: Draw the hangman figure one part per wrong guess

**Story**: POC02-6 | **Branch**: `POC02-6-draw-the-hangman-figure-one-part-per-wro` | **Spec**: `specs/POC02-6/spec.md`

## Summary

Defect fix. The six figure parts are SVG elements toggled with the HTML `hidden` attribute, which SVG ignores. Replace it with a CSS class mechanism, move the "which parts to show" decision into a pure function in `logic.js`, make `ui.js` use it, keep the SVG's accessible name in step, and add Node and pytest regression checks. No change to rules, word list, keyboard, tally, FastAPI app or other games.

## Technical Context

- **Language**: JavaScript (plain ES modules, browser and Node 20+); Python tests with pytest. No framework, build step or npm dependency.
- **Testing**: `node --test` via pytest (`tests/test_js.py` globs `tests/js/*.mjs`); `uv run pytest`, `uvx ruff check .`, `uvx ruff format --check .`.
- **Constraints**: nothing from an external host; `logic.js` never touches the DOM; files touched are only those listed in the spec: `app/static/hangman/index.html`, `ui.js`, `logic.js`, `tests/js/hangman.test.mjs`, `tests/test_site.py`.
- **Constitution check**: `.specify/memory/constitution.md` defines no gates for this repo; `CLAUDE.md` boundaries are respected.
- **Tooling note**: the Spec Kit setup scripts are PowerShell and `pwsh` is not available, so plan and tasks are written directly to the required paths. No numbered folder exists. No research.md, data-model.md, contracts or quickstart are produced (this stage may write only plan.md and tasks.md).

## Resolved open questions (spec defaults)

1. Accessible name is `"Hangman figure: N of 6 parts drawn"` for every N from 0 to 6, with no special case at 0 or 6.
2. Shared class is `part`; the fixed "shown" class is `shown`. The `logic.js` function is `partsShown(state)`.

## Design

### `logic.js` (pure)

- `export const PARTS = ["head", "body", "arm-left", "arm-right", "leg-left", "leg-right"]` (drawing order; the names match the id suffixes `part-<name>`).
- `export function partsShown(state)` returns `PARTS.slice(0, clamp(state.wrong, 0, PARTS.length))` as a new array. Correct guesses leave `wrong` unchanged, so the result is unchanged; `newGame` gives `[]`; the sixth wrong guess gives all six. It does not mutate state.

### `index.html`

- Remove `hidden` from the six parts (`part-head`, `part-body`, `part-arm-left`, `part-arm-right`, `part-leg-left`, `part-leg-right`) and add `class="part"` to each. The four gallows lines get no class and stay always visible.
- Add to the existing `<style>` block: `#figure .part:not(.shown) { display: none; }`.
- Initial `aria-label` on the `<svg>` becomes `Hangman figure: 0 of 6 parts drawn`, so it is correct before the script runs.

### `ui.js`

- Delete the local `PARTS` constant; import `partsShown` (and `PARTS` for the id lookup) from `logic.js`.
- In `render()`: compute `const shown = partsShown(state)`; for each name in `PARTS`, `document.getElementById("part-" + name).classList.toggle("shown", shown.includes(name))`. Never set `hidden`.
- In `render()` also set the figure's `aria-label` to `"Hangman figure: " + shown.length + " of " + PARTS.length + " parts drawn"`. New game calls `render()` already, so the figure returns to the bare gallows with the "0 of 6" name.

### Tests

- `tests/js/hangman.test.mjs`: `partsShown` for 0..6 wrong guesses using real `guess` calls (a fixed word, letters known to be absent); correct guess leaves the result equal; `newGame` gives `[]`; the result is a fresh array and state is not mutated. Existing tests stay untouched.
- `tests/test_site.py`: parse `app/static/hangman/index.html` with stdlib `html.parser`; collect elements inside `<svg>`. Assert none has a `hidden` attribute, and that the six ids each exist and carry class `part`. Also assert the style block contains a rule hiding `.part` unless `.shown`, and that the gallows lines have no `part` class. Ruff-format clean.

## Risks

- **Python SVG check**: `html.parser` treats `<line ... />` as a start-end tag and lower-cases attribute names; the test must track svg depth and handle `handle_startendtag` so elements inside the SVG are not missed (a silent miss would defeat the regression test). Mitigation: assert the six ids were actually found.
- **CSS specificity**: `#figure .part:not(.shown)` beats any presentation attribute; verify visually via the quickstart-style manual check (play a game, see 0→6 parts).
- **Stale accessible name**: set in `render()` only, which runs after every guess, new game and tally reset.
