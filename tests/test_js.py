import os
import shutil
import subprocess
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent


def test_node_tests():
    node = shutil.which("node")
    if node is None:
        if os.environ.get("CI"):
            pytest.fail("node is required in CI but was not found")
        pytest.skip("node not installed; skipping JavaScript tests")
    result = subprocess.run(
        [
            node,
            "--test",
            *sorted(str(p) for p in (ROOT / "tests" / "js").glob("*.mjs")),
        ],
        check=False,
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stdout + result.stderr
