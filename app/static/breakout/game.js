// Rendering, input and the fixed-timestep loop. Rules live in logic.js.
import { CONFIG, newGame, step } from "./logic.js";

const STEP = 1 / 120;
const MAX_FRAME = 0.1;

function init() {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const statusEl = document.getElementById("status");
  const pauseBtn = document.getElementById("pause");
  const restartBtn = document.getElementById("restart");

  let state = newGame();
  let target = null;
  let direction = 0;
  const held = { left: false, right: false };
  const pending = { launch: false, pause: false, restart: false };
  let last = null;
  let acc = 0;
  let shownText = "";

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth || CONFIG.WIDTH;
    const scale = cssWidth / CONFIG.WIDTH;
    canvas.width = Math.round(CONFIG.WIDTH * scale * dpr);
    canvas.height = Math.round(CONFIG.HEIGHT * scale * dpr);
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    draw();
  }

  function draw() {
    const { WIDTH, HEIGHT } = CONFIG;
    ctx.fillStyle = "#101828";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    const colours = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];
    state.bricks.forEach((b, i) => {
      if (!b.alive) return;
      ctx.fillStyle = colours[Math.floor(i / CONFIG.COLS) % colours.length];
      ctx.fillRect(b.x, b.y, b.w, b.h);
    });
    const p = state.paddle;
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(p.x - p.w / 2, p.y, p.w, p.h);
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, state.ball.r, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    if (state.status === "paused" || state.status === "gameover") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.font = "bold 40px sans-serif";
      const title = state.status === "paused" ? "Paused" : "Game over";
      ctx.fillText(title, WIDTH / 2, HEIGHT / 2 - 10);
      if (state.status === "gameover") {
        ctx.font = "24px sans-serif";
        ctx.fillText(`Score: ${state.score}`, WIDTH / 2, HEIGHT / 2 + 30);
      }
    }
  }

  function updateText() {
    const labels = {
      ready: "press space or tap to launch",
      playing: "playing",
      paused: "paused",
      gameover: "game over",
    };
    const text = `Score: ${state.score}, Lives: ${state.lives}, Level: ${state.level}, ${labels[state.status]}`;
    if (text !== shownText) {
      shownText = text;
      statusEl.textContent = text;
    }
    pauseBtn.textContent = state.status === "paused" ? "Resume" : "Pause";
    pauseBtn.disabled = state.status === "gameover";
    restartBtn.hidden = state.status !== "gameover";
  }

  function frame(now) {
    if (last === null) last = now;
    const dt = Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    acc += dt;
    while (acc >= STEP) {
      const input = {
        target: target ?? undefined,
        direction,
        launch: pending.launch,
        pause: pending.pause,
        restart: pending.restart,
      };
      pending.launch = pending.pause = pending.restart = false;
      state = step(state, input, STEP);
      acc -= STEP;
    }
    draw();
    updateText();
    requestAnimationFrame(frame);
  }

  function resetClock() {
    last = null;
    acc = 0;
  }

  function toLogical(clientX) {
    const rect = canvas.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * CONFIG.WIDTH;
  }

  function requestPause() {
    pending.pause = true;
    resetClock();
  }

  canvas.addEventListener("pointermove", (e) => {
    target = toLogical(e.clientX);
  });
  canvas.addEventListener("pointerdown", (e) => {
    target = toLogical(e.clientX);
    if (state.status === "ready") pending.launch = true;
  });
  canvas.addEventListener("pointerup", () => {
    target = null;
  });
  canvas.addEventListener("pointercancel", () => {
    target = null;
  });

  function setDirection() {
    direction = (held.right ? 1 : 0) - (held.left ? 1 : 0);
    if (direction !== 0) target = null;
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") held.left = true;
    else if (e.key === "ArrowRight") held.right = true;
    else if (e.key === " " || e.code === "Space") {
      if (e.target === document.body || e.target === canvas) {
        e.preventDefault();
        pending.launch = true;
      }
    } else if (e.key === "p" || e.key === "P") requestPause();
    else return;
    setDirection();
  });
  document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") held.left = false;
    else if (e.key === "ArrowRight") held.right = false;
    setDirection();
  });

  pauseBtn.addEventListener("click", requestPause);
  restartBtn.addEventListener("click", () => {
    pending.restart = true;
    resetClock();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.status === "playing") requestPause();
    else resetClock();
  });
  window.addEventListener("resize", resize);

  resize();
  updateText();
  requestAnimationFrame(frame);
}

if (typeof document !== "undefined") init();
