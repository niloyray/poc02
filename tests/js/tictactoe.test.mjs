import assert from "node:assert";
import test from "node:test";

import {
  LINES,
  bestMove,
  computerMove,
  easyMove,
  emptyTally,
  newGame,
  parseTally,
  play,
  recordResult,
} from "../../app/static/tictactoe/logic.js";

function playAll(moves) {
  return moves.reduce((s, m) => play(s, m), newGame());
}

test("all eight lines win for X", () => {
  assert.equal(LINES.length, 8);
  for (const line of LINES) {
    const rest = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((i) => !line.includes(i));
    const s = playAll([line[0], rest[0], line[1], rest[1], line[2]]);
    assert.equal(s.status, "won");
    assert.equal(s.turn, "X");
    assert.deepEqual(s.line, line);
  }
});

test("all eight lines win for O", () => {
  for (const line of LINES) {
    const rest = [0, 1, 2, 3, 4, 5, 6, 7, 8].filter((i) => !line.includes(i));
    // X plays two cells off the line and one more that cannot complete a line for X first.
    const xMoves = pickXMoves(line, rest);
    const s = playAll([
      xMoves[0],
      line[0],
      xMoves[1],
      line[1],
      xMoves[2],
      line[2],
    ]);
    assert.equal(s.status, "won");
    assert.equal(s.turn, "O");
    assert.deepEqual(s.line, line);
  }
});

// Choose three cells off `line` that do not contain a full winning line.
function pickXMoves(line, rest) {
  for (let a = 0; a < rest.length; a++) {
    for (let b = a + 1; b < rest.length; b++) {
      for (let c = b + 1; c < rest.length; c++) {
        const set = [rest[a], rest[b], rest[c]];
        const full = LINES.some((l) => l.every((i) => set.includes(i)));
        if (!full) return set;
      }
    }
  }
  throw new Error("no X moves found");
}

test("draw is detected", () => {
  const s = playAll([0, 1, 2, 4, 3, 5, 7, 6, 8]);
  assert.equal(s.status, "draw");
  assert.equal(s.line, null);
});

test("illegal moves change nothing", () => {
  const s = playAll([0]);
  assert.strictEqual(play(s, 0), s);
  assert.strictEqual(play(s, -1), s);
  assert.strictEqual(play(s, 9), s);
  assert.strictEqual(play(s, 1.5), s);
  const won = playAll([0, 3, 1, 4, 2]);
  assert.strictEqual(play(won, 8), won);
  const draw = playAll([0, 1, 2, 4, 3, 5, 7, 6, 8]);
  assert.strictEqual(play(draw, 0), draw);
});

test("turn order alternates and input is not mutated", () => {
  const s0 = newGame();
  const s1 = play(s0, 4);
  const s2 = play(s1, 0);
  const s3 = play(s2, 8);
  assert.deepEqual([s0.turn, s1.turn, s2.turn, s3.turn], ["X", "O", "X", "O"]);
  assert.deepEqual(s0.board, Array(9).fill(null));
  assert.equal(s1.board[4], "X");
  assert.equal(s2.board[0], "O");
});

// The opponent tries every move; the computer replies with bestMove.
// Returns the number of lines of play the opponent wins.
function opponentWins(state, computer) {
  if (state.status === "won") return state.turn === computer ? 0 : 1;
  if (state.status === "draw") return 0;
  if (state.turn === computer) {
    return opponentWins(play(state, bestMove(state.board, computer)), computer);
  }
  let total = 0;
  for (let i = 0; i < 9; i++) {
    const next = play(state, i);
    if (next !== state) total += opponentWins(next, computer);
  }
  return total;
}

test("minimax never loses as O (opponent first)", () => {
  assert.equal(opponentWins(newGame(), "O"), 0);
});

test("minimax never loses as X (computer first)", () => {
  assert.equal(opponentWins(newGame(), "X"), 0);
});

test("minimax takes an immediate win and blocks", () => {
  const win = playAll([0, 3, 1, 4]);
  assert.equal(bestMove(win.board, "X"), 2);
  const block = playAll([0, 4, 1]);
  assert.equal(bestMove(block.board, "O"), 2);
});

test("easyMove uses the rng over legal moves", () => {
  const s = playAll([0, 1]);
  assert.equal(easyMove(s.board, () => 0), 2);
  assert.equal(easyMove(s.board, () => 0.999999), 8);
  assert.equal(computerMove(s, "easy", () => 0), 2);
  assert.equal(computerMove(s, "two", () => 0), null);
  assert.notEqual(computerMove(s, "hard", () => 0), null);
});

test("tally counts finished games once", () => {
  let t = emptyTally();
  t = recordResult(t, newGame());
  assert.deepEqual(t, { x: 0, o: 0, draws: 0 });
  t = recordResult(t, playAll([0, 3, 1, 4, 2]));
  t = recordResult(t, playAll([0, 3, 1, 4, 8, 5]));
  t = recordResult(t, playAll([0, 1, 2, 4, 3, 5, 7, 6, 8]));
  assert.deepEqual(t, { x: 1, o: 1, draws: 1 });
});

test("corrupt tally text parses to zeros", () => {
  const zero = { x: 0, o: 0, draws: 0 };
  const bad = ["", "nope", "null", '{"x":-1,"o":0,"draws":0}', '{"x":1}'];
  for (const text of bad) assert.deepEqual(parseTally(text), zero);
  assert.deepEqual(parseTally('{"x":2,"o":1,"draws":3}'), { x: 2, o: 1, draws: 3 });
});
