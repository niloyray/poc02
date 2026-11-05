# poc02

Onboarded to the AINS AI-native SDLC platform (niloyray/ains-platform). Stories: Jira project `POC02`.

How a story flows: Jira story with label `ai-native` moved to **Ready** → the orchestrator claims it → spec agent (gate G1 in Jira: move to **Planning**) → plan agent (gate G2: move to **Implementing**) → implement agent → PR ready → CI (`ci` check) → review agent posts a review → a human approves the PR (gate G3) → squash merge → release: image to GHCR, **staging** (G4) and **production** (G5) environment approvals → Jira **Done**.

Human lane: branch `<JIRA-KEY>-<slug>`, open a PR, add the label `ai-review` for an agent review, same CI and gates.

Conventions: see `CLAUDE.md`. Specs per story: `specs/<JIRA-KEY>/`.

## Game site

A small FastAPI app serving a static game hub from `app/static/`.

Run locally:

```
uv run uvicorn app.main:app --reload
```

Tests and lint (Node is needed for the JavaScript tests):

```
uv run pytest
uvx ruff check .
uvx ruff format --check .
```

Docker:

```
docker build -t poc02 .
docker run --rm -p 8080:8080 poc02
```

The hub is at http://localhost:8080/ and the health check at `/healthz`.
