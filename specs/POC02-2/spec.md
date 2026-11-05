# Feature Specification: Scaffold the FastAPI game site and hub page

**Story**: POC02-2 (idea S1, release 1 of 3)
**Status**: Draft
**Input**: As a visitor, I want to open the site and see a hub page listing the available games so that I can pick one to play.

## Goal

Create the foundation of the poc02 game site in an empty repository: a small FastAPI application that serves a static site, a hub page that lists the games, placeholder pages for the two games, the test harness, and a container image. The two game stories (tic-tac-toe, breakout) build on this and are moved to Ready only after this story is merged.

## User-visible behaviour

- **Hub page** (`/`): shows one card per game, built in the browser from a registry (an ES module listing each game's title, description and path). The registry lists tic-tac-toe (`tictactoe/`) and breakout (`breakout/`). Each card links to its game page.
- **Game pages** (`/tictactoe/`, `/breakout/`): placeholder pages that name the game, say it is coming, and link back to the hub. The game stories replace them.
- **Health check** (`GET /healthz`): status 200, JSON body `{"status": "ok"}`.
- **Everything else** is served from `app/static/` at the site root; a folder path serves its `index.html`. An unknown path returns 404.
- **Look and feel**: one shared stylesheet for the hub and the game pages. Usable at phone width (no horizontal scrolling at 360 px) and follows the device's light or dark colour scheme.
- **Self-contained**: no page loads a script, font, stylesheet or image from an external host.
- **Server scope**: no database, no login, no other endpoints, no server-side templates.

## Deliverables (from the story)

`app/main.py`, `app/static/index.html`, `app/static/js/games.js`, `app/static/css/site.css`, `app/static/tictactoe/index.html`, `app/static/breakout/index.html`, `pyproject.toml` (Python 3.12; fastapi, uvicorn; dev group pytest and httpx; committed `uv.lock`), `package.json` (only `"private": true` and `"type": "module"`), `Dockerfile`, a README section, and tests `tests/test_app.py`, `tests/test_site.py`, `tests/test_js.py`, `tests/js/games.test.mjs`.

## Tests required

- **`tests/test_app.py`** (FastAPI test client, no network or database): `/` returns the hub page; `/healthz` returns the health body; each game page and each static asset returns 200, with a JavaScript content type for `.js` files; an unknown path returns 404.
- **`tests/test_site.py`** (reads `app/static/`): every internal link, script and stylesheet reference in the HTML resolves to a file; every registry game has a page; no HTML page references an external host.
- **`tests/test_js.py`**: runs `node --test` over `tests/js/` and fails if any Node test fails. If Node is missing, it fails when `CI` is set and skips with a clear message otherwise.
- **`tests/js/games.test.mjs`**: every registry entry has title, description and path, and paths are unique.

## Acceptance criteria

- [ ] `GET /` returns the hub page, which lists tic-tac-toe and breakout as cards built from the registry file; each card links to that game's page.
- [ ] `GET /tictactoe/` and `GET /breakout/` each return a placeholder page that names the game and links back to the hub.
- [ ] `GET /healthz` returns 200 with a JSON body whose `status` field is `ok`; an unknown path returns 404.
- [ ] One shared stylesheet styles the hub and the game pages; no horizontal scrolling at 360 px width; follows the light or dark colour scheme of the device.
- [ ] No page loads a script, font, stylesheet or image from an external host, and `tests/test_site.py` fails if one is added.
- [ ] `uv run pytest`, `uvx ruff check .` and `uvx ruff format --check .` all pass; server tests use the test client with no network or database; the Node tests run through `tests/test_js.py`, which fails instead of skipping when `CI` is set and Node is missing.
- [ ] `docker build` succeeds, and the container runs the FastAPI application with uvicorn as a non-root user and serves the hub page on port 8080.
- [ ] The README explains how to run the site locally (`uv run uvicorn app.main:app --reload`) and how to run the tests.
- [ ] `.github/`, `.specify/`, `.claude/` and `CLAUDE.md` are unchanged.

## Out of scope

- Any game rules or gameplay (separate stories).
- A database, a login, server-side storage of scores, or any endpoint other than the health check and the static files.
- Server-side HTML templates.
- A JavaScript framework, bundler or npm dependency.
- Changes to `.github/`, `.specify/`, `.claude/` or `CLAUDE.md`.

## Assumptions

- The platform CI runs `uv sync --all-groups`, `uvx ruff check .`, `uvx ruff format --check .`, `uv run pytest -q` and, when a Dockerfile exists, `docker build`. It has no Node setup step and uses the Node that the GitHub runner image ships.
- CI also starts a Postgres service and sets `DATABASE_URL`; this project ignores both.
- Any setting comes from an environment variable; no secrets are added to the repository.
- The Docker image's listen address and port (`0.0.0.0:8080`) are fixed by the story.

## Open questions

None blocking. For the reviewer to confirm:

1. Should an unknown path return FastAPI's default JSON 404 body or a custom HTML page? Assumed: the default, since only the status code is specified.
2. Should the hub show a friendly message if the registry cannot be loaded (for example, JavaScript disabled)? Assumed: a short fallback line is acceptable but not required.
