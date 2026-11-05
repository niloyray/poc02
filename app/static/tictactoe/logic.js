// Pure tic-tac-toe rules. No DOM access; randomness is passed in.

export const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export const MODES = ["two", "easy", "hard"];

export function newGame() {
  return { board: Array(9).fill(null), turn: "X", status: "playing", line: null };
}

export function winner(board) {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { player: board[a], line: [...line] };
    }
  }
  return null;
}

export function legalMoves(board) {
  const moves = [];
  for (let i = 0; i < 9; i++) if (board[i] === null) moves.push(i);
  return moves;
}

export function play(state, index) {
  if (state.status !== "playing") return state;
  if (!Number.isInteger(index) || index < 0 || index > 8) return state;
  if (state.board[index] !== null) return state;
  const board = state.board.slice();
  board[index] = state.turn;
  const w = winner(board);
  if (w) return { board, turn: state.turn, status: "won", line: w.line };
  if (legalMoves(board).length === 0) {
    return { board, turn: state.turn, status: "draw", line: null };
  }
  return { board, turn: state.turn === "X" ? "O" : "X", status: "playing", line: null };
}

const other = (p) => (p === "X" ? "O" : "X");

// Score from `me`'s point of view; faster wins and slower losses score better.
function minimax(board, toMove, me, depth) {
  const w = winner(board);
  if (w) return w.player === me ? 10 - depth : depth - 10;
  const moves = legalMoves(board);
  if (moves.length === 0) return 0;
  let best = toMove === me ? -Infinity : Infinity;
  for (const m of moves) {
    board[m] = toMove;
    const s = minimax(board, other(toMove), me, depth + 1);
    board[m] = null;
    best = toMove === me ? Math.max(best, s) : Math.min(best, s);
  }
  return best;
}

export function bestMove(board, player) {
  const work = board.slice();
  let bestScore = -Infinity;
  let move = null;
  for (const m of legalMoves(work)) {
    work[m] = player;
    const s = minimax(work, other(player), player, 1);
    work[m] = null;
    if (s > bestScore) {
      bestScore = s;
      move = m;
    }
  }
  return move;
}

export function easyMove(board, rng) {
  const moves = legalMoves(board);
  if (moves.length === 0) return null;
  return moves[Math.floor(rng() * moves.length)];
}

export function computerMove(state, mode, rng) {
  if (state.status !== "playing") return null;
  if (mode === "easy") return easyMove(state.board, rng);
  if (mode === "hard") return bestMove(state.board, state.turn);
  return null;
}

export function emptyTally() {
  return { x: 0, o: 0, draws: 0 };
}

export function recordResult(tally, state) {
  if (state.status === "draw") return { ...tally, draws: tally.draws + 1 };
  if (state.status === "won") {
    const key = state.board[state.line[0]] === "X" ? "x" : "o";
    return { ...tally, [key]: tally[key] + 1 };
  }
  return tally;
}

export function parseTally(text) {
  try {
    const t = JSON.parse(text);
    const ok = (n) => Number.isInteger(n) && n >= 0;
    if (t && ok(t.x) && ok(t.o) && ok(t.draws)) {
      return { x: t.x, o: t.o, draws: t.draws };
    }
  } catch {
    // fall through
  }
  return emptyTally();
}
