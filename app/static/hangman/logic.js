export const MAX_WRONG = 6;
export const PARTS = ["head", "body", "arm-left", "arm-right", "leg-left", "leg-right"];

export function partsShown(state) {
  return PARTS.slice(0, Math.min(Math.max(state.wrong, 0), PARTS.length));
}

export function newGame(word) {
  return { word, guessed: [], wrong: 0, status: "playing" };
}

export function wrongLetters(state) {
  return state.guessed.filter((l) => !state.word.includes(l));
}

export function guessesLeft(state) {
  return MAX_WRONG - state.wrong;
}

export function maskedWord(state) {
  return [...state.word].map((l) => (state.guessed.includes(l) ? l : null));
}

export function guess(state, letter) {
  if (state.status !== "playing") return state;
  const l = String(letter).toLowerCase();
  if (!/^[a-z]$/.test(l)) return state;
  if (state.guessed.includes(l)) return state;
  const guessed = [...state.guessed, l];
  if (state.word.includes(l)) {
    const won = [...new Set(state.word)].every((c) => guessed.includes(c));
    return { ...state, guessed, status: won ? "won" : "playing" };
  }
  const wrong = state.wrong + 1;
  return { ...state, guessed, wrong, status: wrong >= MAX_WRONG ? "lost" : "playing" };
}

export function pickWord(words, random, previous) {
  let candidates = words.filter((w) => w !== previous);
  if (candidates.length === 0) candidates = words;
  const i = Math.min(Math.floor(random() * candidates.length), candidates.length - 1);
  return candidates[i];
}

export function emptyTally() {
  return { wins: 0, losses: 0 };
}

export function recordResult(tally, state) {
  if (state.status === "won") return { ...tally, wins: tally.wins + 1 };
  if (state.status === "lost") return { ...tally, losses: tally.losses + 1 };
  return tally;
}

export function parseTally(text) {
  try {
    const t = JSON.parse(text);
    const ok = (n) => Number.isInteger(n) && n >= 0;
    if (t && ok(t.wins) && ok(t.losses)) return { wins: t.wins, losses: t.losses };
  } catch {
    // fall through
  }
  return emptyTally();
}
