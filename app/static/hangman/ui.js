import { WORDS } from "./words.js";
import {
  MAX_WRONG,
  PARTS,
  emptyTally,
  guess,
  guessesLeft,
  maskedWord,
  newGame,
  parseTally,
  partsShown,
  pickWord,
  recordResult,
  wrongLetters,
} from "./logic.js";

const KEY = "poc02.hangman.tally";

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
  const wordEl = document.getElementById("word");
  const wrongEl = document.getElementById("wrong-letters");
  const leftEl = document.getElementById("guesses-left");
  const statusEl = document.getElementById("status");
  const keyboardEl = document.getElementById("keyboard");
  const tallyEl = document.getElementById("tally");
  const figureEl = document.getElementById("figure");
  const buttons = new Map();
  let state = newGame(pickWord(WORDS, Math.random, undefined));
  let tally = loadTally();

  for (const letter of "abcdefghijklmnopqrstuvwxyz") {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = letter.toUpperCase();
    b.setAttribute("aria-label", letter.toUpperCase());
    b.addEventListener("click", () => onGuess(letter));
    keyboardEl.appendChild(b);
    buttons.set(letter, b);
  }

  function statusText() {
    const w = state.word.toUpperCase();
    if (state.status === "won") return "You won! The word was " + w;
    if (state.status === "lost") return "You lost. The word was " + w;
    return "Playing: guess a letter";
  }

  function render() {
    const shown =
      state.status === "lost"
        ? [...state.word]
        : maskedWord(state).map((l) => l ?? "_");
    wordEl.textContent = shown.join(" ").toUpperCase();
    const wrongs = wrongLetters(state);
    wrongEl.textContent =
      "Wrong guesses: " + (wrongs.length ? wrongs.map((l) => l.toUpperCase()).join(", ") : "none");
    leftEl.textContent = "Guesses left: " + guessesLeft(state) + " of " + MAX_WRONG;
    const drawn = partsShown(state);
    for (const p of PARTS) {
      document.getElementById("part-" + p).classList.toggle("shown", drawn.includes(p));
    }
    figureEl.setAttribute(
      "aria-label",
      "Hangman figure: " + drawn.length + " of " + PARTS.length + " parts drawn",
    );
    for (const [letter, b] of buttons) {
      const done = state.guessed.includes(letter);
      const good = state.word.includes(letter);
      const base = letter.toUpperCase();
      b.disabled = done || state.status !== "playing";
      b.classList.toggle("correct", done && good);
      b.classList.toggle("wrong", done && !good);
      b.textContent = done ? base + (good ? " ✓" : " ✗") : base;
      b.setAttribute(
        "aria-label",
        done ? base + (good ? ", correct" : ", wrong") : base,
      );
    }
    const text = statusText();
    if (statusEl.textContent !== text) statusEl.textContent = text;
    tallyEl.textContent = "Wins: " + tally.wins + " · Losses: " + tally.losses;
  }

  function onGuess(letter) {
    const next = guess(state, letter);
    if (next === state) return;
    const wasPlaying = state.status === "playing";
    state = next;
    if (wasPlaying && state.status !== "playing") {
      tally = recordResult(tally, state);
      saveTally(tally);
    }
    render();
  }

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!/^[a-zA-Z]$/.test(e.key)) return;
    onGuess(e.key);
  });
  document.getElementById("new-game").addEventListener("click", () => {
    state = newGame(pickWord(WORDS, Math.random, state.word));
    render();
  });
  document.getElementById("reset-tally").addEventListener("click", () => {
    tally = emptyTally();
    saveTally(tally);
    render();
  });
  render();
}

if (typeof document !== "undefined") init();
