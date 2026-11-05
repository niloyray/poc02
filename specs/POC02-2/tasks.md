# Tasks: Scaffold the FastAPI game site and hub page

Story POC02-2. Ordered; each task is small. Do not touch `.github/`, `.specify/`, `.claude/`, `CLAUDE.md`.

## Phase 1: Project setup

- [x] T001 Create `pyproject.toml` (Python 3.12; dependencies fastapi, uvicorn; dev group pytest, httpx; pytest `testpaths = ["tests"]`) and `package.json` (only `"private": true`, `"type": "module"`).
- [x] T002 Create an empty `app/__init__.py` and the directories `app/static/{css,js,tictactoe,breakout}` and `tests/js/`.
- [x] T003 Check `.gitignore` does not exclude `uv.lock` or `app/static/`; fix only if it does (`.gitignore`).

## Phase 2: Static site

- [x] T004 [P] Write the registry in `app/static/js/games.js`: export `games` with tic-tac-toe (`tictactoe/`) and breakout (`breakout/`), each with title, description, path. Render one card link per game into `#games` only if `document` exists.
- [x] T005 [P] Write the shared stylesheet `app/static/css/site.css`: no horizontal scroll at 360 px, `color-scheme: light dark`, system fonts, no external URLs.
- [x] T006 Write the hub page `app/static/index.html`: links `css/site.css`, loads `js/games.js` as a module, has a `#games` container and a `<noscript>` fallback line (depends on T004, T005).
- [x] T007 [P] Write the placeholder `app/static/tictactoe/index.html`: names the game, says it is coming, links to the stylesheet and back to the hub.
- [x] T008 [P] Write the placeholder `app/static/breakout/index.html` with the same shape.

## Phase 3: Server

- [x] T009 Write `app/main.py`: register `.js` as `text/javascript`, `GET /healthz` returning `{"status": "ok"}`, then mount `StaticFiles(html=True)` at `/` last, with the directory resolved from `__file__`.
- [x] T010 Run `uv lock` to produce the committed `uv.lock` (`uv.lock`).

## Phase 4: Tests

- [x] T011 [P] Write `tests/js/games.test.mjs`: every entry has non-empty title, description, path; paths unique.
- [x] T012 [P] Write `tests/test_js.py`: run `node --test tests/js/`; fail on a non-zero code; node missing means fail if `CI` is set, else skip with a clear message.
- [x] T013 [P] Write `tests/test_app.py`: TestClient checks for `/`, `/healthz`, both game pages, each static asset (JS content type), and an unknown path returning 404.
- [x] T014 [P] Write `tests/test_site.py`: all internal links, scripts and stylesheets resolve; every registry game has a page; no external host in any HTML.
- [x] T015 Run `uv sync --all-groups`, `uv run pytest`, `uvx ruff check .` and `uvx ruff format --check .`; fix any failures in the files above.

## Phase 5: Container and docs

- [x] T016 Write `Dockerfile` (python 3.12 slim, `uv sync --frozen --no-dev`, copy `app/`, non-root user, `EXPOSE 8080`, uvicorn on `0.0.0.0:8080`) and `.dockerignore`.
- [x] T017 Append a section to `README.md`: run locally (`uv run uvicorn app.main:app --reload`), run tests and lint, build and run the Docker image.
- [x] T018 If Docker is available, run `docker build .` and check that the container serves `/` on 8080 as non-root; otherwise note it was not verified (`Dockerfile`). NOT VERIFIED: Docker is not installed in the agent sandbox.
- [x] T019 Confirm `git status` shows no changes under `.github/`, `.specify/`, `.claude/` or `CLAUDE.md`.
