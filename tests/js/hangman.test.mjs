import assert from "node:assert";
import test from "node:test";

import { WORDS } from "../../app/static/hangman/words.js";
import {
  MAX_WRONG,
  emptyTally,
  guess,
  guessesLeft,
  maskedWord,
  newGame,
  parseTally,
  pickWord,
  recordResult,
  wrongLetters,
} from "../../app/static/hangman/logic.js";

function guessAll(state, letters) {
  return [...letters].reduce((s, l) => guess(s, l), state);
}

test("word list: 100 unique words of 4-7 lower-case letters", () => {
  assert.equal(WORDS.length, 100);
  assert.equal(new Set(WORDS).size, 100);
  for (const w of WORDS) assert.match(w, /^[a-z]{4,7}$/);
});

test("newGame starts clean", () => {
  const s = newGame("apple");
  assert.equal(s.word, "apple");
  assert.deepEqual(s.guessed, []);
  assert.equal(s.wrong, 0);
  assert.equal(s.status, "playing");
  assert.equal(guessesLeft(s), MAX_WRONG);
});

test("correct guess reveals every occurrence", () => {
  const s = guess(newGame("apple"), "p");
  assert.deepEqual(maskedWord(s), [null, "p", "p", null, null]);
  assert.equal(s.wrong, 0);
});

test("wrong guess counts and reduces guesses left", () => {
  const s = guess(newGame("apple"), "z");
  assert.equal(s.wrong, 1);
  assert.equal(guessesLeft(s), 5);
  assert.deepEqual(wrongLetters(s), ["z"]);
});

test("upper case equals lower case", () => {
  assert.deepEqual(guess(newGame("apple"), "P"), guess(newGame("apple"), "p"));
});

test("guess does not mutate input", () => {
  const s = newGame("apple");
  const copy = structuredClone(s);
  guess(s, "a");
  guess(s, "z");
  assert.deepEqual(s, copy);
});

test("repeated and invalid guesses return the same state", () => {
  const s = guess(newGame("apple"), "a");
  assert.equal(guess(s, "a"), s);
  for (const bad of ["1", "!", "", "ab", 5, null, undefined]) {
    assert.equal(guess(s, bad), s);
  }
});

test("win when all distinct letters revealed", () => {
  const s = guessAll(newGame("apple"), "aple");
  assert.equal(s.status, "won");
  assert.equal(guess(s, "z"), s);
});

test("loss at the sixth wrong guess", () => {
  const s = guessAll(newGame("apple"), "zxcvb");
  assert.equal(s.status, "playing");
  const lost = guess(s, "q");
  assert.equal(lost.status, "lost");
  assert.equal(lost.wrong, MAX_WRONG);
  assert.equal(guess(lost, "a"), lost);
});

test("pickWord uses the injected random source", () => {
  const words = ["a", "b", "c", "d"];
  assert.equal(pickWord(words, () => 0, undefined), "a");
  assert.equal(pickWord(words, () => 0.999999, undefined), "d");
  assert.equal(pickWord(words, () => 0.5, undefined), "c");
  assert.equal(pickWord(words, () => 1, undefined), "d");
});

test("pickWord never returns previous when another word exists", () => {
  const words = ["a", "b", "c"];
  for (const r of [0, 0.3, 0.6, 0.999]) {
    assert.notEqual(pickWord(words, () => r, "b"), "b");
  }
  assert.equal(pickWord(words, () => 0, "zzz"), "a");
  assert.equal(pickWord(["a"], () => 0, "a"), "a");
});

test("tally helpers", () => {
  const t = emptyTally();
  assert.deepEqual(recordResult(t, newGame("apple")), t);
  assert.deepEqual(recordResult(t, guessAll(newGame("apple"), "aple")), { wins: 1, losses: 0 });
  assert.deepEqual(recordResult(t, guessAll(newGame("apple"), "zxcvbq")), { wins: 0, losses: 1 });
  assert.deepEqual(parseTally('{"wins":2,"losses":3}'), { wins: 2, losses: 3 });
  for (const bad of ["nope", "null", '{"wins":-1,"losses":0}', '{"wins":1.5,"losses":0}', "{}"]) {
    assert.deepEqual(parseTally(bad), emptyTally());
  }
});
