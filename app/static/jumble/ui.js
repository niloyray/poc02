import { WORDS } from "./words.js";
import {
  MAX_TRIES,
  answer,
  emptyTally,
  giveUp,
  lettersList,
  lettersText,
  newRound,
  parseTally,
  pickWord,
  recordResult,
  shuffle,
  triesLeft,
} from "./logic.js";

const KEY = "poc02.jumble.tally";

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
  const tilesEl = document.getElementById("tiles");
  const lettersEl = document.getElementById("letters");
  const form = document.getElementById("answer-form");
  const input = document.getElementById("answer");
  const submitBtn = document.getElementById("submit");
  const shuffleBtn = document.getElementById("shuffle");
  const triesEl = document.getElementById("tries-left");
  const statusEl = document.getElementById("status");
  const tallyEl = document.getElementById("tally");
  let state = newRound(pickWord(WORDS, Math.random, undefined), Math.random);
  let tally = loadTally();
  let message = "";

  function statusText() {
    const w = state.word.toUpperCase();
    if (state.status === "solved") return "Solved! The word was " + w;
    if (state.status === "missed") return "Missed. The word was " + w;
    return message || "Playing: unscramble the letters. Tries left: " + triesLeft(state) + " of " + MAX_TRIES;
  }

  function render() {
    tilesEl.replaceChildren(
      ...lettersList(state).map((l) => {
        const t = document.createElement("span");
        t.className = "tile";
        t.textContent = l.toUpperCase();
        return t;
      }),
    );
    lettersEl.textContent = lettersText(state);
    triesEl.textContent = "Tries left: " + triesLeft(state) + " of " + MAX_TRIES;
    const over = state.status !== "playing";
    input.disabled = over;
    submitBtn.disabled = over;
    shuffleBtn.disabled = over;
    const text = statusText();
    if (statusEl.textContent !== text) statusEl.textContent = text;
    tallyEl.textContent = "Solved: " + tally.solved + " · Missed: " + tally.missed;
  }

  function finish(prev) {
    if (prev.status === "playing" && state.status !== "playing") {
      tally = recordResult(tally, state);
      saveTally(tally);
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const prev = state;
    const next = answer(prev, input.value);
    if (next === prev) {
      if (prev.status === "playing") {
        message = "Type the word using the letters a to z only.";
        render();
        input.focus();
      }
      return;
    }
    state = next;
    message = state.status === "playing" ? "Not it. Tries left: " + triesLeft(state) + " of " + MAX_TRIES : "";
    finish(prev);
    input.value = "";
    render();
    input.focus();
  });
  shuffleBtn.addEventListener("click", () => {
    state = shuffle(state, Math.random);
    render();
  });
  document.getElementById("next-word").addEventListener("click", () => {
    const prev = state;
    state = giveUp(prev);
    finish(prev);
    state = newRound(pickWord(WORDS, Math.random, prev.word), Math.random);
    message = "";
    input.value = "";
    render();
    input.focus();
  });
  document.getElementById("reset-tally").addEventListener("click", () => {
    tally = emptyTally();
    saveTally(tally);
    render();
  });
  render();
}

if (typeof document !== "undefined") init();
