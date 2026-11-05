export const games = [
  {
    title: "Tic-tac-toe",
    description: "Three in a row wins.",
    path: "tictactoe/",
  },
  {
    title: "Breakout",
    description: "Bounce the ball and clear the bricks.",
    path: "breakout/",
  },
  {
    title: "Hangman",
    description: "Guess the word before the figure is drawn.",
    path: "hangman/",
  },
];

if (typeof document !== "undefined") {
  const container = document.getElementById("games");
  if (container) {
    for (const game of games) {
      const link = document.createElement("a");
      link.className = "card";
      link.href = game.path;
      const title = document.createElement("h2");
      title.textContent = game.title;
      const desc = document.createElement("p");
      desc.textContent = game.description;
      link.append(title, desc);
      container.append(link);
    }
  }
}
