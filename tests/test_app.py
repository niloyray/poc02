import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_hub():
    r = client.get("/")
    assert r.status_code == 200
    assert "Game Hub" in r.text


def test_healthz():
    r = client.get("/healthz")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


@pytest.mark.parametrize("path", ["/tictactoe/", "/breakout/"])
def test_game_pages(path):
    r = client.get(path)
    assert r.status_code == 200
    assert "Back to the hub" in r.text


@pytest.mark.parametrize(
    ("path", "ctype"),
    [
        ("/js/games.js", "javascript"),
        ("/css/site.css", "text/css"),
    ],
)
def test_assets(path, ctype):
    r = client.get(path)
    assert r.status_code == 200
    assert ctype in r.headers["content-type"]


def test_unknown_404():
    assert client.get("/nope").status_code == 404
