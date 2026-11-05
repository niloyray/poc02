import test from "node:test";
import assert from "node:assert/strict";
import { WORDS } from "../../app/static/jumble/words.js";
import {
  MAX_TRIES,
  answer,
  emptyTally,
  giveUp,
  lettersText,
  newRound,
  parseTally,
  pickWord,
  recordResult,
  scramble,
  shuffle,
  triesLeft,
} from "../../app/static/jumble/logic.js";

const sorted = (w) => [...w].sort().join("");

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

test("word list rules", () => {
  assert.equal(WORDS.length, 100);
  assert.equal(new Set(WORDS).size, 100);
  for (const w of WORDS) {
    assert.match(w, /^[a-z]{4,7}$/);
    assert.ok(new Set(w).size >= 2, w);
  }
  assert.equal(new Set(WORDS.map(sorted)).size, 100, "anagram pair in list");
});

test("scramble keeps letters and never returns the word", () => {
  for (const rnd of [Math.random, seeded(1)]) {
    for (const w of WORDS) {
      const s = scramble(w, rnd);
      assert.equal(sorted(s), sorted(w));
      assert.notEqual(s, w);
    }
  }
});

test("scramble honours avoid and injected random", () => {
  for (const w of WORDS) {
    const first = scramble(w, seeded(7));
    assert.equal(first, scramble(w, seeded(7)));
    const next = scramble(w, seeded(7), first);
    assert.notEqual(next, first);
    assert.notEqual(next, w);
    assert.equal(sorted(next), sorted(w));
  }
});

test("scramble finishes with constant sources and repeated letters", () => {
  for (const c of [0, 0.5, 0.9999]) {
    for (const w of [...WORDS, "aab", "abab"]) {
      const s = scramble(w, () => c);
      assert.notEqual(s, w);
      assert.equal(sorted(s), sorted(w));
      const t = scramble(w, () => c, s);
      assert.notEqual(t, w);
      assert.notEqual(t, s);
    }
  }
});

test("newRound and shuffle", () => {
  const r = newRound("rocket", seeded(3));
  assert.equal(r.word, "rocket");
  assert.notEqual(r.letters, "rocket");
  assert.equal(r.wrong, 0);
  assert.equal(r.status, "playing");
  const s = shuffle(r, seeded(4));
  assert.equal(sorted(s.letters), sorted("rocket"));
  assert.notEqual(s.letters, "rocket");
  assert.notEqual(s.letters, r.letters);
  assert.equal(s.wrong, 0);
  const done = { ...r, status: "solved" };
  assert.equal(shuffle(done, seeded(4)), done);
});

test("triesLeft and lettersText", () => {
  assert.equal(triesLeft({ wrong: 1 }), 2);
  assert.equal(lettersText({ letters: "torcke" }), "Letters: t, o, r, c, k, e");
  assert.equal(MAX_TRIES, 3);
});

test("answer", () => {
  const r = { word: "tunnel", letters: "nunlet", wrong: 0, status: "playing" };
  assert.equal(answer(r, "tunnel").status, "solved");
  assert.equal(answer(r, "  TuNNeL ").status, "solved");
  const w1 = answer(r, "wrong");
  assert.equal(w1.wrong, 1);
  assert.equal(w1.status, "playing");
  assert.equal(r.wrong, 0);
  const w2 = answer(w1, "nope");
  const w3 = answer(w2, "nunlet");
  assert.equal(w3.wrong, 3);
  assert.equal(w3.status, "missed");
  const anagram = answer({ ...r, word: "stale" }, "least");
  assert.equal(anagram.wrong, 1);
  for (const bad of ["", "   ", "abc1", "a b", "ab!", 5, null, undefined]) {
    assert.equal(answer(r, bad), r);
  }
  const solved = answer(r, "tunnel");
  assert.equal(answer(solved, "wrong"), solved);
  assert.equal(answer(w3, "tunnel"), w3);
});

test("giveUp", () => {
  const r = newRound("rocket", seeded(1));
  assert.equal(giveUp(r).status, "missed");
  const solved = { ...r, status: "solved" };
  assert.equal(giveUp(solved), solved);
});

test("pickWord", () => {
  const w = ["a", "b", "c"];
  assert.equal(pickWord(w, () => 0, undefined), "a");
  assert.equal(pickWord(w, () => 0, "a"), "b");
  assert.equal(pickWord(w, () => 0.9999, "c"), "b");
  assert.equal(pickWord(w, () => 0.5, "zzz"), "b");
  assert.equal(pickWord(["x"], () => 0.5, "x"), "x");
  for (const p of WORDS.slice(0, 20)) {
    assert.notEqual(pickWord(WORDS, Math.random, p), p);
  }
});

test("tally helpers", () => {
  const t = emptyTally();
  assert.deepEqual(t, { solved: 0, missed: 0 });
  const base = { word: "a", letters: "a", wrong: 0 };
  assert.deepEqual(recordResult(t, { ...base, status: "solved" }), { solved: 1, missed: 0 });
  assert.deepEqual(recordResult(t, { ...base, status: "missed" }), { solved: 0, missed: 1 });
  assert.equal(recordResult(t, { ...base, status: "playing" }), t);
  assert.deepEqual(parseTally('{"solved":2,"missed":3}'), { solved: 2, missed: 3 });
  for (const bad of ["x", "null", '{"solved":-1,"missed":0}', '{"solved":1.5,"missed":0}', "{}"]) {
    assert.deepEqual(parseTally(bad), emptyTally());
  }
});
