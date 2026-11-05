import {
  MODES,
  computerMove,
  emptyTally,
  newGame,
  parseTally,
  play,
  recordResult,
} from "./logic.js";

const KEY = "poc02.tictactoe.tally";

function loadTally() {
  try {
    const text = window.localStorage.getItem(KEY);
    return text === null ? emptyTally() : parseTally(text);
  } catch {
    return emptyTally();
  }
}

function saveTally(tally) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(tally));
  } catch {
    // storage unavailable: keep the in-memory tally
  }
}

function init() {
  const modeEl = document.getElementById("mode");
  const statusEl = document.getElementById("status");
  const boardEl = document.getElementById("board");
  const tallyEl = document.getElementById("tally");
  const cells = [];
  let state = newGame();
  let tally = loadTally();

  for (let i = 0; i < 9; i++) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "cell";
    b.addEventListener("click", () => onCell(i));
    boardEl.appendChild(b);
    cells.push(b);
  }

  function render() {
    state.board.forEach((v, i) => {
      const r = Math.floor(i / 3) + 1;
      const c = (i % 3) + 1;
      cells[i].textContent = v ?? "";
      cells[i].setAttribute("aria-label", "Row " + r + ", column " + c + ", " + (v ?? "empty"));
      cells[i].classList.toggle("win", state.line !== null && state.line.includes(i));
    });
    if (state.status === "won") statusEl.textContent = state.turn + " wins";
    else if (state.status === "draw") statusEl.textContent = "Draw";
    else statusEl.textContent = state.turn + "'s turn";
    tallyEl.textContent =
      "X wins: " + tally.x + " · O wins: " + tally.o + " · Draws: " + tally.draws;
  }

  // Apply a move; record the result once, on the transition to a finished game.
  function move(i) {
    const next = play(state, i);
    if (next === state) return;
    const wasPlaying = state.status === "playing";
    state = next;
    if (wasPlaying && state.status !== "playing") {
      tally = recordResult(tally, state);
      saveTally(tally);
    }
  }

  function onCell(i) {
    if (state.status !== "playing") return;
    const vsComputer = modeEl.value !== "two";
    if (vsComputer && state.turn !== "X") return;
    move(i);
    if (vsComputer && state.status === "playing") {
      const m = computerMove(state, modeEl.value, Math.random);
      if (m !== null) move(m);
    }
    render();
  }

  function restart() {
    state = newGame();
    render();
  }

  modeEl.addEventListener("change", restart);
  document.getElementById("restart").addEventListener("click", restart);
  document.getElementById("reset-tally").addEventListener("click", () => {
    tally = emptyTally();
    saveTally(tally);
    render();
  });
  if (!MODES.includes(modeEl.value)) modeEl.value = "two";
  render();
}

if (typeof document !== "undefined") init();
