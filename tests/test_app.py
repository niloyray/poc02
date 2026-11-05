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


@pytest.mark.parametrize("path", ["/tictactoe/", "/breakout/", "/hangman/", "/jumble/"])
def test_game_pages(path):
    r = client.get(path)
    assert r.status_code == 200
    assert "Back to the hub" in r.text


@pytest.mark.parametrize("name", ["ui.js", "logic.js", "words.js"])
def test_hangman_scripts(name):
    assert "ui.js" in client.get("/hangman/").text
    r = client.get(f"/hangman/{name}")
    assert r.status_code == 200
    assert "javascript" in r.headers["content-type"]


def test_hub_lists_hangman():
    assert "hangman/" in client.get("/js/games.js").text


@pytest.mark.parametrize("name", ["ui.js", "logic.js", "words.js"])
def test_jumble_scripts(name):
    assert "ui.js" in client.get("/jumble/").text
    r = client.get(f"/jumble/{name}")
    assert r.status_code == 200
    assert "javascript" in r.headers["content-type"]


def test_hub_lists_jumble():
    assert "jumble/" in client.get("/js/games.js").text


def test_jumble_page_accessibility():
    html = client.get("/jumble/").text
    assert '<label for="answer">' in html
    for attr in (
        'maxlength="7"',
        'autocorrect="off"',
        'autocapitalize="off"',
        'spellcheck="false"',
    ):
        assert attr in html
    assert 'aria-live="polite"' in html


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
