import re
from html.parser import HTMLParser
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


class SvgCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.depth = 0
        self.elements = []

    def handle_starttag(self, tag, attrs):
        if tag == "svg":
            self.depth += 1
        elif self.depth:
            self.elements.append((tag, dict(attrs)))

    def handle_startendtag(self, tag, attrs):
        if self.depth and tag != "svg":
            self.elements.append((tag, dict(attrs)))

    def handle_endtag(self, tag):
        if tag == "svg":
            self.depth -= 1


def test_hangman_figure_parts_use_class_not_hidden():
    html = (STATIC / "hangman" / "index.html").read_text()
    parser = SvgCollector()
    parser.feed(html)
    assert parser.elements
    for tag, attrs in parser.elements:
        assert "hidden" not in attrs, f"<{tag}> uses hidden inside the SVG"
    by_id = {a["id"]: a for _, a in parser.elements if "id" in a}
    ids = ["head", "body", "arm-left", "arm-right", "leg-left", "leg-right"]
    for name in ids:
        assert f"part-{name}" in by_id, name
        assert "part" in by_id[f"part-{name}"].get("class", "").split()
    gallows = [a for _, a in parser.elements if "id" not in a]
    assert len(gallows) == 4
    for attrs in gallows:
        assert "part" not in attrs.get("class", "").split()
    assert re.search(r"#figure\s+\.part:not\(\.shown\)\s*\{\s*display:\s*none", html)
