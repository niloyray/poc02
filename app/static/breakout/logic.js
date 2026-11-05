// Pure breakout rules. No DOM, no canvas, no time, no randomness.

export const CONFIG = {
  WIDTH: 480,
  HEIGHT: 640,
  PADDLE_W: 80,
  PADDLE_H: 12,
  PADDLE_Y: 600,
  PADDLE_SPEED: 420,
  BALL_R: 7,
  BALL_SPEED: 320,
  SPEED_FACTOR: 1.1,
  MAX_SPEED_FACTOR: 2,
  COLS: 8,
  ROWS: 5,
  BRICK_W: 52,
  BRICK_H: 18,
  BRICK_GAP: 6,
  BRICK_TOP: 60,
  BRICK_POINTS: 10,
  LIVES: 3,
  MAX_SUBSTEP: 4,
  MAX_ANGLE: Math.PI / 3,
};

export function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

export function speedForLevel(level) {
  const base = CONFIG.BALL_SPEED;
  return Math.min(
    base * CONFIG.SPEED_FACTOR ** (level - 1),
    base * CONFIG.MAX_SPEED_FACTOR,
  );
}

export function buildBricks() {
  const { COLS, ROWS, BRICK_W, BRICK_H, BRICK_GAP, BRICK_TOP, WIDTH } = CONFIG;
  const total = COLS * BRICK_W + (COLS - 1) * BRICK_GAP;
  const left = (WIDTH - total) / 2;
  const bricks = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      bricks.push({
        x: left + c * (BRICK_W + BRICK_GAP),
        y: BRICK_TOP + r * (BRICK_H + BRICK_GAP),
        w: BRICK_W,
        h: BRICK_H,
        alive: true,
      });
    }
  }
  return bricks;
}

export function newGame() {
  const paddle = {
    x: CONFIG.WIDTH / 2,
    y: CONFIG.PADDLE_Y,
    w: CONFIG.PADDLE_W,
    h: CONFIG.PADDLE_H,
  };
  return {
    paddle,
    ball: {
      x: paddle.x,
      y: paddle.y - CONFIG.BALL_R,
      vx: 0,
      vy: 0,
      r: CONFIG.BALL_R,
      speed: speedForLevel(1),
      attached: true,
    },
    bricks: buildBricks(),
    score: 0,
    lives: CONFIG.LIVES,
    level: 1,
    status: "ready",
  };
}

function clone(state) {
  return {
    ...state,
    paddle: { ...state.paddle },
    ball: { ...state.ball },
    bricks: state.bricks.map((b) => ({ ...b })),
  };
}

// Velocity for a paddle hit: offset in [-1, 1], always upward.
export function bounceVelocity(offset, speed) {
  const angle = clamp(offset, -1, 1) * CONFIG.MAX_ANGLE;
  return { vx: speed * Math.sin(angle), vy: -speed * Math.cos(angle) };
}

// Keep the speed constant and never let the ball travel (nearly) horizontally.
function normalize(ball) {
  const maxVx = ball.speed * Math.sin(CONFIG.MAX_ANGLE);
  const vx = clamp(ball.vx, -maxVx, maxVx);
  const sign = ball.vy >= 0 ? 1 : -1;
  ball.vx = vx;
  ball.vy = sign * Math.sqrt(ball.speed * ball.speed - vx * vx);
}

function attach(s) {
  s.ball.attached = true;
  s.ball.vx = 0;
  s.ball.vy = 0;
  s.ball.x = s.paddle.x;
  s.ball.y = s.paddle.y - s.ball.r;
  s.status = "ready";
}

function movePaddle(s, input, dt) {
  const half = s.paddle.w / 2;
  let x = s.paddle.x;
  if (typeof input.target === "number") x = input.target;
  else if (input.direction) x += input.direction * CONFIG.PADDLE_SPEED * dt;
  s.paddle.x = clamp(x, half, CONFIG.WIDTH - half);
  if (s.ball.attached) s.ball.x = s.paddle.x;
}

function collideBricks(s) {
  const ball = s.ball;
  for (const b of s.bricks) {
    if (!b.alive) continue;
    const cx = clamp(ball.x, b.x, b.x + b.w);
    const cy = clamp(ball.y, b.y, b.y + b.h);
    const dx = ball.x - cx;
    const dy = ball.y - cy;
    if (dx * dx + dy * dy > ball.r * ball.r) continue;
    b.alive = false;
    s.score += CONFIG.BRICK_POINTS;
    const ox = Math.min(ball.x + ball.r - b.x, b.x + b.w - (ball.x - ball.r));
    const oy = Math.min(ball.y + ball.r - b.y, b.y + b.h - (ball.y - ball.r));
    if (ox < oy) {
      ball.vx = ball.x < b.x + b.w / 2 ? -Math.abs(ball.vx) : Math.abs(ball.vx);
    } else {
      ball.vy = ball.y < b.y + b.h / 2 ? -Math.abs(ball.vy) : Math.abs(ball.vy);
    }
    normalize(ball);
    return;
  }
}

function subStep(s, dt) {
  const ball = s.ball;
  const p = s.paddle;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  if (ball.x - ball.r < 0) {
    ball.x = ball.r;
    ball.vx = Math.abs(ball.vx);
  } else if (ball.x + ball.r > CONFIG.WIDTH) {
    ball.x = CONFIG.WIDTH - ball.r;
    ball.vx = -Math.abs(ball.vx);
  }
  if (ball.y - ball.r < 0) {
    ball.y = ball.r;
    ball.vy = Math.abs(ball.vy);
  }
  normalize(ball);

  if (
    ball.vy > 0 &&
    ball.y + ball.r >= p.y &&
    ball.y - ball.r <= p.y + p.h &&
    Math.abs(ball.x - p.x) <= p.w / 2 + ball.r
  ) {
    ball.y = p.y - ball.r;
    Object.assign(ball, bounceVelocity((ball.x - p.x) / (p.w / 2), ball.speed));
  }

  collideBricks(s);
}

export function step(state, input = {}, dt = 0) {
  const s = clone(state);

  if (s.status === "gameover") {
    return input.restart ? newGame() : s;
  }
  if (input.pause) {
    if (s.status === "playing") s.status = "paused";
    else if (s.status === "paused") s.status = "playing";
    return s;
  }
  if (s.status === "paused") return s;

  movePaddle(s, input, dt);

  if (s.status === "ready" && input.launch) {
    s.status = "playing";
    s.ball.attached = false;
    s.ball.vx = 0;
    s.ball.vy = -s.ball.speed;
  }

  if (s.status !== "playing" || !(dt > 0)) return s;

  const n = Math.max(1, Math.ceil((s.ball.speed * dt) / CONFIG.MAX_SUBSTEP));
  const sub = dt / n;
  for (let i = 0; i < n; i++) {
    subStep(s, sub);
    if (s.ball.y > CONFIG.HEIGHT + s.ball.r) {
      s.lives -= 1;
      if (s.lives > 0) {
        attach(s);
      } else {
        s.status = "gameover";
        s.ball.attached = false;
        s.ball.vx = 0;
        s.ball.vy = 0;
      }
      return s;
    }
    if (!s.bricks.some((b) => b.alive)) {
      s.level += 1;
      s.bricks = buildBricks();
      s.ball.speed = speedForLevel(s.level);
      attach(s);
      return s;
    }
  }
  return s;
}
