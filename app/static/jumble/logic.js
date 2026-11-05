export const MAX_TRIES = 3;
export const MAX_LENGTH = 7;

const ATTEMPTS = 20;

function shuffled(word, random) {
  const a = [...word];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.min(Math.max(Math.floor(random() * (i + 1)), 0), i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.join("");
}

// First arrangement of the letters (in sorted order) not equal to word or avoid.
function fallback(word, avoid) {
  const letters = [...word].sort();
  const used = new Array(letters.length).fill(false);
  const cur = [];
  let found = null;
  function walk() {
    if (found !== null) return;
    if (cur.length === letters.length) {
      const s = cur.join("");
      if (s !== word && s !== avoid) found = s;
      return;
    }
    for (let i = 0; i < letters.length; i++) {
      if (used[i] || (i > 0 && letters[i] === letters[i - 1] && !used[i - 1])) continue;
      used[i] = true;
      cur.push(letters[i]);
      walk();
      cur.pop();
      used[i] = false;
      if (found !== null) return;
    }
  }
  walk();
  return found ?? word;
}

export function scramble(word, random, avoid) {
  for (let n = 0; n < ATTEMPTS; n++) {
    const s = shuffled(word, random);
    if (s !== word && s !== avoid) return s;
  }
  return fallback(word, avoid);
}

export function newRound(word, random) {
  return { word, letters: scramble(word, random), wrong: 0, status: "playing" };
}

export function shuffle(state, random) {
  if (state.status !== "playing") return state;
  return { ...state, letters: scramble(state.word, random, state.letters) };
}

export function triesLeft(state) {
  return MAX_TRIES - state.wrong;
}

export function lettersList(state) {
  return [...state.letters];
}

export function lettersText(state) {
  return "Letters: " + lettersList(state).join(", ");
}

export function answer(state, text) {
  if (state.status !== "playing" || typeof text !== "string") return state;
  const t = text.trim().toLowerCase();
  if (!/^[a-z]+$/.test(t)) return state;
  if (t === state.word) return { ...state, status: "solved" };
  const wrong = state.wrong + 1;
  return { ...state, wrong, status: wrong >= MAX_TRIES ? "missed" : "playing" };
}

export function giveUp(state) {
  return state.status === "playing" ? { ...state, status: "missed" } : state;
}

export function pickWord(words, random, previous) {
  let candidates = words.filter((w) => w !== previous);
  if (candidates.length === 0) candidates = words;
  const i = Math.min(Math.floor(random() * candidates.length), candidates.length - 1);
  return candidates[i];
}

export function emptyTally() {
  return { solved: 0, missed: 0 };
}

export function recordResult(tally, state) {
  if (state.status === "solved") return { ...tally, solved: tally.solved + 1 };
  if (state.status === "missed") return { ...tally, missed: tally.missed + 1 };
  return tally;
}

export function parseTally(text) {
  try {
    const t = JSON.parse(text);
    const ok = (n) => Number.isInteger(n) && n >= 0;
    if (t && ok(t.solved) && ok(t.missed)) return { solved: t.solved, missed: t.missed };
  } catch {
    // fall through
  }
  return emptyTally();
}
