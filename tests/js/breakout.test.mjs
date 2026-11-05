import assert from "node:assert";
import test from "node:test";

import {
  CONFIG,
  bounceVelocity,
  buildBricks,
  newGame,
  speedForLevel,
  step,
} from "../../app/static/breakout/logic.js";

const { WIDTH, HEIGHT } = CONFIG;

// A playing state with the ball placed by hand and no bricks in the way
// (one far-away brick stays alive so the level is not cleared).
function playing(ball, extra = {}) {
  const s = newGame();
  s.status = "playing";
  s.ball = { ...s.ball, attached: false, ...ball };
  s.bricks = s.bricks.map((b, i) => ({ ...b, alive: i === 0 }));
  return Object.assign(s, extra);
}

test("newGame sets up the start state", () => {
  const s = newGame();
  assert.strictEqual(s.paddle.x, WIDTH / 2);
  assert.strictEqual(s.ball.attached, true);
  assert.strictEqual(s.ball.x, s.paddle.x);
  assert.strictEqual(s.ball.y, s.paddle.y - s.ball.r);
  assert.strictEqual(s.bricks.length, 40);
  assert.ok(s.bricks.every((b) => b.alive));
  assert.strictEqual(s.score, 0);
  assert.strictEqual(s.lives, 3);
  assert.strictEqual(s.level, 1);
  assert.strictEqual(s.status, "ready");
});

test("bricks fit inside the play area", () => {
  for (const b of buildBricks()) {
    assert.ok(b.x >= 0 && b.x + b.w <= WIDTH);
  }
});

test("ball bounces off the left, right and top walls", () => {
  let s = step(playing({ x: 10, y: 300, vx: -100, vy: -200, speed: 320 }), {}, 0.1);
  assert.ok(s.ball.vx > 0);
  assert.ok(s.ball.x >= s.ball.r);

  s = step(playing({ x: WIDTH - 10, y: 300, vx: 100, vy: -200, speed: 320 }), {}, 0.1);
  assert.ok(s.ball.vx < 0);
  assert.ok(s.ball.x <= WIDTH - s.ball.r);

  s = step(playing({ x: 240, y: 10, vx: 0, vy: -320, speed: 320 }), {}, 0.1);
  assert.ok(s.ball.vy > 0);
  assert.ok(s.ball.y >= s.ball.r);
});

test("paddle stays in bounds with target and held direction", () => {
  let s = step(newGame(), { target: -1000 }, 0.01);
  assert.strictEqual(s.paddle.x, s.paddle.w / 2);
  s = step(newGame(), { target: 5000 }, 0.01);
  assert.strictEqual(s.paddle.x, WIDTH - s.paddle.w / 2);

  s = newGame();
  for (let i = 0; i < 200; i++) s = step(s, { direction: 1 }, 0.05);
  assert.strictEqual(s.paddle.x, WIDTH - s.paddle.w / 2);
  for (let i = 0; i < 400; i++) s = step(s, { direction: -1 }, 0.05);
  assert.strictEqual(s.paddle.x, s.paddle.w / 2);
});

test("attached ball follows the paddle, launch goes straight up", () => {
  let s = step(newGame(), { target: 100 }, 0.01);
  assert.strictEqual(s.ball.x, 100);
  s = step(s, { launch: true }, 0.01);
  assert.strictEqual(s.status, "playing");
  assert.strictEqual(s.ball.attached, false);
  assert.strictEqual(s.ball.vx, 0);
  assert.ok(s.ball.vy < 0);
});

test("pause toggles and freezes the paddle and ball", () => {
  let s = step(playing({ x: 240, y: 300, vx: 0, vy: -320, speed: 320 }), { pause: true }, 0.01);
  assert.strictEqual(s.status, "paused");
  const frozen = step(s, { target: 10, direction: 1 }, 0.5);
  assert.deepStrictEqual(frozen, s);
  s = step(s, { pause: true }, 0.01);
  assert.strictEqual(s.status, "playing");
});

test("step does not mutate its input and is deterministic", () => {
  const s = playing({ x: 100, y: 300, vx: 50, vy: -300, speed: 320 });
  const copy = structuredClone(s);
  const a = step(s, { target: 200 }, 0.05);
  assert.deepStrictEqual(s, copy);
  assert.deepStrictEqual(step(s, { target: 200 }, 0.05), a);
});

test("paddle bounce: centre straight up, edges steep and outward", () => {
  const p = newGame().paddle;
  const hit = (x) =>
    step(
      playing({ x, y: p.y - 8, vx: 0, vy: 320, speed: 320 }, { paddle: { ...p } }),
      {},
      0.01,
    ).ball;

  const centre = hit(p.x);
  assert.ok(Math.abs(centre.vx) < 1e-9);
  assert.ok(centre.vy < 0);

  const left = hit(p.x - p.w / 2);
  assert.ok(left.vx < 0 && left.vy < 0);
  assert.ok(Math.abs(left.vx) > Math.abs(left.vy));

  const right = hit(p.x + p.w / 2);
  assert.ok(right.vx > 0 && right.vy < 0);
  assert.ok(Math.abs(right.vx) > Math.abs(right.vy));
});

test("bounceVelocity never goes horizontal and keeps speed", () => {
  for (const o of [-5, -1, -0.5, 0, 0.5, 1, 5]) {
    const v = bounceVelocity(o, 400);
    assert.ok(v.vy <= -200 + 1e-9);
    assert.ok(Math.abs(Math.hypot(v.vx, v.vy) - 400) < 1e-9);
  }
});

test("brick hit removes the brick, adds 10 and reflects vertically", () => {
  const s0 = newGame();
  const b = s0.bricks[35];
  const start = playing({
    x: b.x + b.w / 2,
    y: b.y + b.h + 9,
    vx: 0,
    vy: -320,
    speed: 320,
  });
  start.bricks = s0.bricks.map((x) => ({ ...x }));
  const s = step(start, {}, 0.02);
  assert.strictEqual(s.bricks[35].alive, false);
  assert.strictEqual(s.score, 10);
  assert.strictEqual(s.bricks.filter((x) => !x.alive).length, 1);
  assert.ok(s.ball.vy > 0);
});

test("brick hit from the side reflects horizontally", () => {
  const s0 = newGame();
  const b = s0.bricks[0];
  const start = playing({
    x: b.x - 3,
    y: b.y + b.h / 2,
    vx: 200,
    vy: -100,
    speed: Math.hypot(200, 100),
  });
  start.bricks = s0.bricks.map((x) => ({ ...x }));
  const s = step(start, {}, 0.02);
  assert.strictEqual(s.bricks[0].alive, false);
  assert.ok(s.ball.vx < 0);
});

test("missing the ball costs a life and re-attaches it", () => {
  const s = step(playing({ x: 20, y: HEIGHT + 5, vx: 0, vy: 320, speed: 320 }), {}, 0.05);
  assert.strictEqual(s.lives, 2);
  assert.strictEqual(s.status, "ready");
  assert.strictEqual(s.ball.attached, true);
  assert.strictEqual(s.ball.x, s.paddle.x);
});

test("third miss ends the game; steps are ignored; restart resets", () => {
  const miss = { x: 20, y: HEIGHT + 5, vx: 0, vy: 320, speed: 320 };
  let s = step(playing(miss, { lives: 1, score: 70 }), {}, 0.05);
  assert.strictEqual(s.status, "gameover");
  assert.strictEqual(s.lives, 0);
  assert.strictEqual(s.score, 70);
  assert.deepStrictEqual(step(s, { target: 10, launch: true, pause: true }, 1), s);
  s = step(s, { restart: true }, 0.01);
  assert.deepStrictEqual(s, newGame());
});

test("clearing the last brick starts the next level", () => {
  const s0 = newGame();
  const b = s0.bricks[0];
  const start = playing(
    { x: b.x + b.w / 2, y: b.y + b.h + 9, vx: 0, vy: -320, speed: 320 },
    { score: 100, lives: 2 },
  );
  start.bricks = s0.bricks.map((x, i) => ({ ...x, alive: i === 0 }));
  const s = step(start, {}, 0.02);
  assert.strictEqual(s.level, 2);
  assert.ok(s.bricks.every((x) => x.alive));
  assert.strictEqual(s.status, "ready");
  assert.strictEqual(s.ball.attached, true);
  assert.strictEqual(s.score, 110);
  assert.strictEqual(s.lives, 2);
  assert.ok(Math.abs(s.ball.speed - 320 * 1.1) < 1e-9);
});

test("ball speed is capped at twice the start speed", () => {
  assert.ok(Math.abs(speedForLevel(2) - 352) < 1e-9);
  assert.strictEqual(speedForLevel(50), 640);
});

test("a large time step does not tunnel through a brick", () => {
  const s0 = newGame();
  const b = s0.bricks[35];
  const start = playing({
    x: b.x + b.w / 2,
    y: b.y + b.h + 150,
    vx: 0,
    vy: -320,
    speed: 320,
  });
  start.bricks = s0.bricks.map((x) => ({ ...x }));
  const s = step(start, {}, 0.5);
  assert.strictEqual(s.bricks[35].alive, false);
  assert.ok(s.ball.y > b.y);
});

test("a large time step does not tunnel through the paddle", () => {
  const p = newGame().paddle;
  const s = step(
    playing({ x: p.x, y: p.y - 100, vx: 0, vy: 320, speed: 320 }, { paddle: { ...p } }),
    {},
    0.6,
  );
  assert.strictEqual(s.lives, 3);
  assert.ok(s.ball.vy < 0);
  assert.ok(s.ball.y < p.y);
});
