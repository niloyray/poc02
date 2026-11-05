# Feature Specification: Draw the hangman figure one part per wrong guess

**Story**: POC02-6 | **Branch**: `POC02-6-draw-the-hangman-figure-one-part-per-wro` | **Status**: Draft
**Depends on**: POC02-5 (hangman), merged and released. This is a defect fix.

## Goal

The hangman figure builds up one part per wrong guess, so a player can see how close they are to losing. Today the whole figure (head, body, both arms, both legs) is drawn from the first moment and never changes. Only the text line "Guesses left" reflects wrong guesses.

Cause: the six parts are SVG elements that carry the HTML `hidden` attribute, and the game script sets `hidden` on them. The `hidden` attribute has no effect on SVG elements, so all six parts are always visible. No test caught it because the Node tests cover the rules only, not what is drawn.

## User-visible behaviour

- **Start of a game**: only the gallows (the four lines) is visible. None of the six parts is.
- **Wrong guess**: exactly one more part appears, in this order: head, body, left arm, right arm, left leg, right leg.
- **Correct guess**: the figure does not change.
- **Sixth wrong guess**: the complete figure is visible and the game is lost.
- **New game**: the figure returns to the bare gallows.
- **Accessible name**: the figure says how much is drawn, for example "Hangman figure: 2 of 6 parts drawn". It updates with each wrong guess.

## Acceptance criteria

- [ ] At the start of a game only the gallows is visible; none of the six body parts is.
- [ ] Each wrong guess makes exactly one more part visible, in the order head, body, left arm, right arm, left leg, right leg; a correct guess does not change the figure.
- [ ] After the sixth wrong guess the complete figure is visible and the game is lost.
- [ ] New game returns the figure to the bare gallows.
- [ ] The figure's accessible name states the number of parts drawn out of six (for example "Hangman figure: 2 of 6 parts drawn") and matches what is visible.
- [ ] Parts are shown and hidden with a CSS class: the six parts share one class that hides them unless they also carry a "shown" class. The gallows stays always visible.
- [ ] No element inside the page's SVG has the `hidden` attribute, and all six parts carry the shared class; a pytest check on the hangman page fails if that stops being true (`tests/test_site.py`).
- [ ] `logic.js` exports one function that returns the names of the parts to show for a state, in drawing order; the UI uses it instead of its own list of parts.
- [ ] Node tests (`tests/js/hangman.test.mjs`) cover the parts shown at 0, 1, 2, 3, 4, 5 and 6 wrong guesses, and all existing tests still pass.
- [ ] `uv run pytest` and `uvx ruff check .` pass, and `uvx ruff format --check .` passes for Python files. Nothing is loaded from an external host.

## Constraints

- Files touched: `app/static/hangman/index.html` (remove `hidden` from the parts ids `part-head`, `part-body`, `part-arm-left`, `part-arm-right`, `part-leg-left`, `part-leg-right`; add the shared class and a style rule), `app/static/hangman/ui.js`, `app/static/hangman/logic.js`, `tests/js/hangman.test.mjs`, `tests/test_site.py`.
- `logic.js` never touches the DOM. Plain ES modules, no framework, build step or npm dependencies.

## Out of scope

- Animation or a redesign of the figure.
- Changes to the rules, the word list, the keyboard or the tally.
- Changes to the FastAPI application or to the other games.

## Open questions

Reasonable defaults are noted. None of these blocks planning.

1. Exact wording of the accessible name when 0 or 6 parts are drawn. Default: the same pattern ("0 of 6 parts drawn", "6 of 6 parts drawn").
2. Name of the shared class and of the function exported from `logic.js`. Default: left to the plan; the "shown" class name is fixed by the story.
