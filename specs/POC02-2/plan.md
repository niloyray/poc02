# Implementation Plan: Scaffold the FastAPI game site and hub page

**Branch**: `POC02-2-scaffold-the-fastapi-game-site-and-hub-p` | **Spec**: `specs/POC02-2/spec.md`

## Summary

A minimal FastAPI app serves `app/static/` at the site root plus `GET /healthz`. The hub page builds its cards in the browser from an ES module registry (`app/static/js/games.js`). Two placeholder game pages, one shared stylesheet, pytest suites (including a Node test runner wrapper) and a non-root Docker image complete the scaffold.

## Technical Context

- **Language/Version**: Python 3.12; browser JavaScript (ES modules, no bundler)
- **Dependencies**: fastapi, uvicorn (runtime); pytest, httpx (dev group). Ruff via `uvx` only. `package.json` has only `"private": true` and `"type": "module"`.
- **Storage**: none
- **Testing**: `uv run pytest` (FastAPI TestClient; `node --test tests/js/` via subprocess); `uvx ruff check .`; `uvx ruff format --check .`
- **Target**: container on `0.0.0.0:8080`, uvicorn, non-root user
- **Constitution**: `.specify/memory/constitution.md` is an unfilled template; no gates apply. CLAUDE.md boundaries are respected (no edits to `.github/`, `.specify/`, `.claude/`, `CLAUDE.md`).

## Design decisions

1. **Static serving**: `app/main.py` creates `app = FastAPI()`, defines `/healthz` first, then mounts `StaticFiles(directory=<app/static>, html=True)` at `/` last, so the route wins and folder paths serve `index.html`. Unknown paths give Starlette's default 404 (spec open question 1: default accepted). The directory is resolved relative to `__file__`.
2. **JS content type**: Starlette uses `mimetypes`; on minimal images `.js` may map to `text/plain`. Call `mimetypes.add_type("text/javascript", ".js")` in `main.py` to guarantee it, and test it.
3. **Registry**: `games.js` exports `games` (array of `{title, description, path}`). `index.html` has an inline-free `<script type="module">` reference to a small hub script, or the module itself exports a render function. To keep the file list to the spec's deliverables, the hub page uses an inline-free approach: `index.html` loads `js/games.js`, and `games.js` renders cards only when a `#games` element exists in `document`. The Node test imports it without a DOM, so rendering is guarded by `typeof document !== "undefined"`.
4. **Hub fallback** (open question 2): a `<noscript>` line in `index.html`.
5. **Styling**: `site.css` uses a fluid single-column layout, `box-sizing: border-box`, `color-scheme: light dark` and `prefers-color-scheme` custom properties; no fixed widths above 360 px. System fonts only.
6. **Tests**:
   - `test_app.py`: TestClient; `/`, `/healthz`, the game pages, assets (`.js` content type), unknown path 404.
   - `test_site.py`: parses `app/static/**/*.html` with `html.parser`, resolves `href`/`src` to files (root-absolute and relative, folder → `index.html`), checks that every registry path in `games.js` has a page (registry parsed by regex), and fails on `http(s)://` or `//` references.
   - `test_js.py`: `shutil.which("node")`; missing → `pytest.fail` when `CI` is set, else `pytest.skip`; otherwise run `node --test tests/js/` and assert return code 0.
   - `tests/js/games.test.mjs`: `node:test` and `node:assert`; imports `../../app/static/js/games.js`.
7. **Packaging**: `pyproject.toml` (`requires-python = ">=3.12"`, `[dependency-groups] dev`), a committed `uv.lock` generated with `uv lock`, and a ruff section is optional. Also add `[tool.pytest.ini_options] testpaths = ["tests"]`.
8. **Docker**: `python:3.12-slim` base; copy `uv` from the official image or use pip; `uv sync --frozen --no-dev`; copy `app/`; create and switch to a non-root user; `EXPOSE 8080`; `CMD uvicorn app.main:app --host 0.0.0.0 --port 8080`. Add a `.dockerignore`.
9. **README**: append a section covering local run (`uv run uvicorn app.main:app --reload`), tests, lint and Docker.

## Project structure

```text
app/__init__.py
app/main.py
app/static/index.html
app/static/css/site.css
app/static/js/games.js
app/static/tictactoe/index.html
app/static/breakout/index.html
tests/test_app.py  tests/test_site.py  tests/test_js.py  tests/js/games.test.mjs
pyproject.toml  uv.lock  package.json  Dockerfile  .dockerignore  README.md
```

## Risks

- Docker build and non-root runtime cannot be verified without Docker in the agent sandbox; the lockfile must be consistent with `pyproject.toml`.
- `.js` content type depends on the platform mimetypes (mitigated by explicit registration).
- Cards rendered in the browser are not covered by Python tests, so the registry and DOM guard need care.
- `.gitignore` must not exclude `uv.lock` or `app/static/`.
