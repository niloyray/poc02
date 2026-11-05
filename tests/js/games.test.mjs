import assert from "node:assert";
import test from "node:test";

import { games } from "../../app/static/js/games.js";

test("every game has title, description and path", () => {
  assert.ok(games.length > 0);
  for (const g of games) {
    for (const key of ["title", "description", "path"]) {
      assert.equal(typeof g[key], "string");
      assert.ok(g[key].trim().length > 0, `${key} is empty`);
    }
  }
});

test("paths are unique", () => {
  const paths = games.map((g) => g.path);
  assert.equal(new Set(paths).size, paths.length);
});
