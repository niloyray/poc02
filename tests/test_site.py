import re
from pathlib import Path

import pytest

STATIC = Path(__file__).resolve().parent.parent / "app" / "static"
PAGES = sorted(STATIC.rglob("*.html"))
REF = re.compile(r'(?:href|src)="([^"]*)"')
EXTERNAL = re.compile(r"(?:https?:)?//", re.IGNORECASE)


def resolve(page: Path, ref: str) -> Path:
    ref = ref.split("#")[0].split("?")[0]
    target = (page.parent / ref).resolve()
    return target / "index.html" if ref.endswith("/") or target.is_dir() else target


@pytest.mark.parametrize("page", PAGES, ids=lambda p: str(p.relative_to(STATIC)))
def test_references_resolve(page):
    for ref in REF.findall(page.read_text()):
        if ref.startswith(("#", "mailto:")) or not ref.split("#")[0]:
            continue
        assert not EXTERNAL.match(ref), f"{page}: external reference {ref}"
        assert resolve(page, ref).is_file(), f"{page}: broken reference {ref}"


@pytest.mark.parametrize("page", PAGES, ids=lambda p: str(p.relative_to(STATIC)))
def test_no_external_host(page):
    assert not re.search(r"""(?:src|href)=["'](?:https?:)?//""", page.read_text())


def test_registry_games_have_pages():
    js = (STATIC / "js" / "games.js").read_text()
    paths = re.findall(r'path:\s*"([^"]+)"', js)
    assert paths
    for p in paths:
        assert (STATIC / p / "index.html").is_file(), p
