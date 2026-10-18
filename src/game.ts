// Carom — a top-down paddle duel with spin and swaying, spinning obstacles.
import type { Game, InitApi, RenderApi } from "@clockwyrks/simple-2d";
import type { DeepReadonly } from "ts-essentials";
import {
  ACTIONS,
  AI_DEADZONE,
  AI_HOME_DEADZONE,
  AI_HOME_Y,
  AI_REACT,
  AI_SPEED,
  BALL_R,
  BINDINGS,
  CAROM_DEBUG_VERSION,
  CUES,
  FIELD_CX,
  FIELD_CY,
  FIELD_H,
  FIELD_W,
  HOLD_TIME,
  MATCHOVER_ITEMS,
  MAX_BOUNCE_ANGLE,
  MAX_SUBSTEP,
  NET_X,
  OBSTACLE_CENTERS,
  OBSTACLE_HH,
  OBSTACLE_HW,
  OBSTACLE_SPIN_RATE,
  OBSTACLE_SWAY_AMP,
  OBSTACLE_SWAY_PERIOD,
  P1_X0,
  P1_X1,
  P2_X0,
  P2_X1,
  PADDLE_HALF,
  PADDLE_H,
  PADDLE_MAX_CY,
  PADDLE_MIN_CY,
  PADDLE_SPEED,
  PADDLE_W,
  PAUSE_ITEMS,
  SERVE_ANGLE,
  SERVE_SPEED,
  SPEED_CAP,
  SPEED_MULT,
  SPIN_CLAMP,
  SPIN_FROM_PADDLE,
  SPIN_HALFLIFE,
  TITLE_ITEMS,
  TITLE_TEXT,
  TRAIL_TIME,
  WIN_LEAD,
  WIN_SCORE,
} from "./constants";

export const BACKGROUND = "#0a0f1e";

export type Screen =
  "title" | "howto" | "countdown" | "playing" | "paused" | "matchover";

export type Mode = "solo" | "versus";

export type Side = "left" | "right";

export interface PaddleState {
  readonly cy: number;
  readonly vy: number;
  readonly driven: boolean;
  readonly drivenVy: number;
}

export interface AiState {
  readonly tracking: boolean;
  readonly movement: boolean;
}

export interface TrailSample {
  readonly x: number;
  readonly y: number;
  readonly t: number;
}

export interface BallState {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly spin: number;
  readonly held: boolean;
  readonly holdTimer: number;
  readonly serveSign: 1 | -1;
  readonly trail: readonly TrailSample[];
}

export interface ObstacleState {
  readonly index: number;
  readonly cx: number;
  readonly cy: number;
  readonly theta: number;
}

export interface CaromState {
  readonly screen: Screen;
  readonly mode: Mode;
  readonly menuIndex: number;
  readonly titleIndex: number;
  readonly resumeScreen: "countdown" | "playing";

  readonly score: { readonly p1: number; readonly p2: number };
  readonly winner: Side | null;

  readonly paddles: { readonly left: PaddleState; readonly right: PaddleState };
  readonly ai: AiState;

  readonly receiver: Side;
  readonly ball: BallState | null;
  readonly obstacles: readonly ObstacleState[];
  readonly obstacleClock: number;
  readonly obstacleClockRunning: boolean;

  readonly simTime: number;
  readonly muted: boolean;
}

export interface SnapshotBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  spin: number;
  held: boolean;
  holdTimer: number;
  serveSign: 1 | -1;
  trail: { x: number; y: number; t: number }[];
}

export interface CaromSnapshot {
  version: number;
  screen: Screen;
  mode: Mode;
  menuIndex: number;
  titleIndex: number;
  resumeScreen: "countdown" | "playing";
  score: { p1: number; p2: number };
  winner: Side | null;
  muted: boolean;
  paddles: {
    left: { cy: number; vy: number; drivenVy: number; driven: boolean };
    right: { cy: number; vy: number; drivenVy: number; driven: boolean };
  };
  ai: { tracking: boolean; movement: boolean };
  receiver: Side;
  ball: SnapshotBall | null;
  obstacles: { index: number; cx: number; cy: number; theta: number }[];
  obstacleClock: number;
  obstacleClockRunning: boolean;
  simTime: number;
}

export interface MenuRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CaromDebugApi {
  readonly version: number;
  clearWorld(state: DeepReadonly<CaromState>): CaromState;
  spawnBall(state: DeepReadonly<CaromState>): CaromState;
  spawnObstacle(state: DeepReadonly<CaromState>, index: number): CaromState;
  reset(state: DeepReadonly<CaromState>): CaromState;
  reconcile(state: DeepReadonly<CaromState>): CaromState;
  setScreen(state: DeepReadonly<CaromState>, screen: Screen): CaromState;
  setMode(state: DeepReadonly<CaromState>, mode: Mode): CaromState;
  setMenuIndex(state: DeepReadonly<CaromState>, index: number): CaromState;
  setTitleIndex(state: DeepReadonly<CaromState>, index: number): CaromState;
  setResumeScreen(
    state: DeepReadonly<CaromState>,
    screen: "countdown" | "playing",
  ): CaromState;
  setScore(state: DeepReadonly<CaromState>, p1: number, p2: number): CaromState;
  setWinner(state: DeepReadonly<CaromState>, side: Side | null): CaromState;
  setReceiver(state: DeepReadonly<CaromState>, side: Side): CaromState;
  setPaddleCy(
    state: DeepReadonly<CaromState>,
    side: Side,
    cy: number,
  ): CaromState;
  setPaddleVy(
    state: DeepReadonly<CaromState>,
    side: Side,
    vy: number,
  ): CaromState;
  setPaddleDriven(
    state: DeepReadonly<CaromState>,
    side: Side,
    driven: boolean,
  ): CaromState;
  setBallPosition(
    state: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallVelocity(
    state: DeepReadonly<CaromState>,
    vx: number,
    vy: number,
  ): CaromState;
  setBallSpin(state: DeepReadonly<CaromState>, spin: number): CaromState;
  setBallHeld(state: DeepReadonly<CaromState>, held: boolean): CaromState;
  setBallHoldTimer(
    state: DeepReadonly<CaromState>,
    seconds: number,
  ): CaromState;
  setBallServeSign(state: DeepReadonly<CaromState>, sign: 1 | -1): CaromState;
  drawBallServeSign(state: DeepReadonly<CaromState>): CaromState;
  setAiTracking(state: DeepReadonly<CaromState>, enabled: boolean): CaromState;
  setAiMovement(state: DeepReadonly<CaromState>, enabled: boolean): CaromState;
  setMuted(state: DeepReadonly<CaromState>, muted: boolean): CaromState;
  setObstacleClock(state: DeepReadonly<CaromState>, t: number): CaromState;
  setObstacleClockRunning(
    state: DeepReadonly<CaromState>,
    running: boolean,
  ): CaromState;
  snapshot(state: DeepReadonly<CaromState>): CaromSnapshot;
  menuItemRect(state: DeepReadonly<CaromState>, index: number): MenuRect | null;
}

// ---- Helpers --------------------------------------------------------------

const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, v));

const drawServeSign = (): 1 | -1 => (Math.random() < 0.5 ? 1 : -1);

interface MutablePaddle {
  cy: number;
  vy: number;
  driven: boolean;
  drivenVy: number;
}

interface MutableBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  spin: number;
  held: boolean;
  holdTimer: number;
  serveSign: 1 | -1;
  trail: TrailSample[];
}

function parkedBall(): BallState {
  return {
    x: FIELD_CX,
    y: FIELD_CY,
    vx: 0,
    vy: 0,
    spin: 0,
    held: true,
    holdTimer: HOLD_TIME,
    serveSign: drawServeSign(),
    trail: [],
  };
}

function obstaclePose(
  index: number,
  clock: number,
): { cx: number; cy: number; theta: number } {
  const base = OBSTACLE_CENTERS[index] ?? { x: FIELD_CX, y: FIELD_CY };
  const sway =
    OBSTACLE_SWAY_AMP * Math.sin((2 * Math.PI * clock) / OBSTACLE_SWAY_PERIOD);
  return {
    cx: base.x,
    cy: base.y + (index === 0 ? sway : -sway),
    theta: OBSTACLE_SPIN_RATE * clock,
  };
}

function syncedObstacles(
  obstacles: readonly ObstacleState[],
  clock: number,
): ObstacleState[] {
  return obstacles.map((o) => ({
    index: o.index,
    ...obstaclePose(o.index, clock),
  }));
}

function allObstacles(clock: number): ObstacleState[] {
  return OBSTACLE_CENTERS.map((_, i) => ({
    index: i,
    ...obstaclePose(i, clock),
  }));
}

function initialState(
  muted: boolean,
  simTime: number,
  titleIndex: number,
): CaromState {
  return {
    screen: "title",
    mode: "solo",
    menuIndex: titleIndex,
    titleIndex,
    resumeScreen: "playing",
    score: { p1: 0, p2: 0 },
    winner: null,
    paddles: {
      left: { cy: FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
      right: { cy: FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
    },
    ai: { tracking: true, movement: true },
    receiver: "left",
    ball: parkedBall(),
    obstacles: allObstacles(0),
    obstacleClock: 0,
    obstacleClockRunning: true,
    simTime,
    muted,
  };
}

function menuCount(screen: Screen): number {
  switch (screen) {
    case "title":
      return TITLE_ITEMS.length;
    case "howto":
      return 1;
    case "paused":
      return PAUSE_ITEMS.length;
    case "matchover":
      return MATCHOVER_ITEMS.length;
    default:
      return 0;
  }
}

export function menuItemsFor(screen: Screen): readonly string[] {
  switch (screen) {
    case "title":
      return TITLE_ITEMS;
    case "howto":
      return ["BACK"];
    case "paused":
      return PAUSE_ITEMS;
    case "matchover":
      return MATCHOVER_ITEMS;
    default:
      return [];
  }
}

export function rectForItem(screen: Screen, index: number): MenuRect | null {
  const count = menuCount(screen);
  if (count === 0 || !Number.isInteger(index) || index < 0 || index >= count)
    return null;
  const w = 400;
  const h = 58;
  const gap = 14;
  const x = (FIELD_W - w) / 2;
  let startY = 330;
  if (screen === "howto") startY = 602;
  else if (screen === "paused") startY = 292;
  else if (screen === "matchover") startY = 392;
  return { x, y: startY + index * (h + gap), w, h };
}

function itemAt(screen: Screen, x: number, y: number): number | null {
  const count = menuCount(screen);
  for (let i = 0; i < count; i++) {
    const r = rectForItem(screen, i);
    if (r && x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return i;
  }
  return null;
}

function integratePaddle(p: MutablePaddle, rawVy: number, dt: number): void {
  let vy = rawVy;
  const next = clamp(p.cy + vy * dt, PADDLE_MIN_CY, PADDLE_MAX_CY);
  if (next !== p.cy + vy * dt && dt > 0) vy = (next - p.cy) / dt;
  // When dt === 0 the position cannot move; keep the commanded velocity.
  p.cy = next;
  p.vy = vy;
}

// ---- Debug surface --------------------------------------------------------

function requireBall(state: DeepReadonly<CaromState>): DeepReadonly<BallState> {
  if (!state.ball) throw new Error("Carom: no ball on the field");
  return state.ball;
}

function withBall(
  state: DeepReadonly<CaromState>,
  patch: Partial<BallState>,
): CaromState {
  const ball = requireBall(state);
  return { ...state, ball: { ...ball, ...patch } };
}

const debugApi: CaromDebugApi = {
  version: CAROM_DEBUG_VERSION,
  clearWorld: (s) => ({ ...s, ball: null, obstacles: [] }),
  spawnBall: (s) => ({ ...s, ball: parkedBall() }),
  spawnObstacle: (s, index) => {
    if (index !== 0 && index !== 1)
      throw new Error(`Carom: no obstacle with index ${index}`);
    const rest = s.obstacles.filter((o) => o.index !== index);
    const placed: ObstacleState = {
      index,
      ...obstaclePose(index, s.obstacleClock),
    };
    return {
      ...s,
      obstacles: [...rest, placed].sort((a, b) => a.index - b.index),
    };
  },
  reset: (s) => initialState(s.muted, 0, 0),
  reconcile: (s) => ({
    ...s,
    obstacles: syncedObstacles(s.obstacles, s.obstacleClock),
  }),
  setScreen: (s, screen) => ({ ...s, screen }),
  setMode: (s, mode) => ({ ...s, mode }),
  setMenuIndex: (s, index) => ({ ...s, menuIndex: index }),
  setTitleIndex: (s, index) => ({ ...s, titleIndex: index }),
  setResumeScreen: (s, screen) => ({ ...s, resumeScreen: screen }),
  setScore: (s, p1, p2) => ({ ...s, score: { p1, p2 } }),
  setWinner: (s, side) => ({ ...s, winner: side }),
  setReceiver: (s, side) => ({ ...s, receiver: side }),
  setPaddleCy: (s, side, cy) => ({
    ...s,
    paddles: {
      ...s.paddles,
      [side]: { ...s.paddles[side], cy },
    },
  }),
  setPaddleVy: (s, side, vy) => ({
    ...s,
    paddles: {
      ...s.paddles,
      [side]: { ...s.paddles[side], drivenVy: vy },
    },
  }),
  setPaddleDriven: (s, side, driven) => ({
    ...s,
    paddles: {
      ...s.paddles,
      [side]: { ...s.paddles[side], driven },
    },
  }),
  setBallPosition: (s, x, y) => withBall(s, { x, y }),
  setBallVelocity: (s, vx, vy) => withBall(s, { vx, vy }),
  setBallSpin: (s, spin) => withBall(s, { spin }),
  setBallHeld: (s, held) => withBall(s, { held }),
  setBallHoldTimer: (s, seconds) => withBall(s, { holdTimer: seconds }),
  setBallServeSign: (s, sign) => withBall(s, { serveSign: sign }),
  drawBallServeSign: (s) => withBall(s, { serveSign: drawServeSign() }),
  setAiTracking: (s, enabled) => ({ ...s, ai: { ...s.ai, tracking: enabled } }),
  setAiMovement: (s, enabled) => ({
    ...s,
    ai: { ...s.ai, movement: enabled },
  }),
  setMuted: (s, muted) => ({ ...s, muted }),
  setObstacleClock: (s, t) => ({
    ...s,
    obstacleClock: t,
    obstacles: syncedObstacles(s.obstacles, t),
  }),
  setObstacleClockRunning: (s, running) => ({
    ...s,
    obstacleClockRunning: running,
  }),
  snapshot: (s) => ({
    version: CAROM_DEBUG_VERSION,
    screen: s.screen,
    mode: s.mode,
    menuIndex: s.menuIndex,
    titleIndex: s.titleIndex,
    resumeScreen: s.resumeScreen,
    score: { p1: s.score.p1, p2: s.score.p2 },
    winner: s.winner,
    muted: s.muted,
    paddles: {
      left: {
        cy: s.paddles.left.cy,
        vy: s.paddles.left.vy,
        drivenVy: s.paddles.left.drivenVy,
        driven: s.paddles.left.driven,
      },
      right: {
        cy: s.paddles.right.cy,
        vy: s.paddles.right.vy,
        drivenVy: s.paddles.right.drivenVy,
        driven: s.paddles.right.driven,
      },
    },
    ai: { tracking: s.ai.tracking, movement: s.ai.movement },
    receiver: s.receiver,
    ball: s.ball
      ? {
          x: s.ball.x,
          y: s.ball.y,
          vx: s.ball.vx,
          vy: s.ball.vy,
          speed: Math.hypot(s.ball.vx, s.ball.vy),
          spin: s.ball.spin,
          held: s.ball.held,
          holdTimer: s.ball.holdTimer,
          serveSign: s.ball.serveSign,
          trail: s.ball.trail.map((t) => ({ x: t.x, y: t.y, t: t.t })),
        }
      : null,
    obstacles: s.obstacles.map((o) => ({
      index: o.index,
      cx: o.cx,
      cy: o.cy,
      theta: o.theta,
    })),
    obstacleClock: s.obstacleClock,
    obstacleClockRunning: s.obstacleClockRunning,
    simTime: s.simTime,
  }),
  menuItemRect: (s, index) => rectForItem(s.screen, index),
};

// ---- Collision helpers ----------------------------------------------------

interface HitFlags {
  paddle: boolean;
  wall: boolean;
  obstacle: boolean;
}

/** Axis-aligned paddle / expanded-rect rule from specs/balls.md. */
function resolvePaddle(
  ball: MutableBall,
  x0: number,
  x1: number,
  paddle: MutablePaddle,
  side: Side,
  flags: HitFlags,
): void {
  const y0 = paddle.cy - PADDLE_HALF;
  const y1 = paddle.cy + PADDLE_HALF;
  if (!(
    ball.x > x0 - BALL_R &&
    ball.x < x1 + BALL_R &&
    ball.y > y0 - BALL_R &&
    ball.y < y1 + BALL_R
  ))
    return;
  const depths = [
    ball.x - (x0 - BALL_R),
    x1 + BALL_R - ball.x,
    ball.y - (y0 - BALL_R),
    y1 + BALL_R - ball.y,
  ];
  let face = 0;
  for (let i = 1; i < 4; i++) if (depths[i]! < depths[face]!) face = i;
  if (face === 0 || face === 1) {
    // Paddle hit on a vertical face.
    const offset = clamp((ball.y - paddle.cy) / PADDLE_HALF, -1, 1);
    const theta = offset * MAX_BOUNCE_ANGLE;
    const speed = Math.min(
      Math.hypot(ball.vx, ball.vy) * SPEED_MULT,
      SPEED_CAP,
    );
    const dir = side === "left" ? 1 : -1;
    ball.vx = dir * speed * Math.cos(theta);
    ball.vy = speed * Math.sin(theta);
    ball.spin = clamp(
      ball.spin + paddle.vy * SPIN_FROM_PADDLE,
      -SPIN_CLAMP,
      SPIN_CLAMP,
    );
    ball.x = side === "left" ? P1_X1 + BALL_R : P2_X0 - BALL_R;
    flags.paddle = true;
  } else if (face === 2) {
    ball.y = y0 - BALL_R;
    if (ball.vy > 0) ball.vy = -ball.vy;
    flags.wall = true;
  } else {
    ball.y = y1 + BALL_R;
    if (ball.vy < 0) ball.vy = -ball.vy;
    flags.wall = true;
  }
}

function resolveObstacle(
  ball: MutableBall,
  obstacle: ObstacleState,
  flags: HitFlags,
): void {
  const { cx, cy, theta } = obstacle;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const dx = ball.x - cx;
  const dy = ball.y - cy;
  const lx = dx * cos + dy * sin;
  const ly = -dx * sin + dy * cos;
  const qx = clamp(lx, -OBSTACLE_HW, OBSTACLE_HW);
  const qy = clamp(ly, -OBSTACLE_HH, OBSTACLE_HH);
  const ox = lx - qx;
  const oy = ly - qy;
  const dist = Math.hypot(ox, oy);
  const inside =
    lx >= -OBSTACLE_HW &&
    lx <= OBSTACLE_HW &&
    ly >= -OBSTACLE_HH &&
    ly <= OBSTACLE_HH;
  if (!inside && dist >= BALL_R) return;
  if (inside && dist >= BALL_R) return;

  let nlx: number;
  let nly: number;
  let newLx = lx;
  let newLy = ly;
  if (!inside) {
    if (dist === 0) return;
    nlx = ox / dist;
    nly = oy / dist;
    newLx = qx + nlx * BALL_R;
    newLy = qy + nly * BALL_R;
  } else {
    const penL = lx + OBSTACLE_HW;
    const penR = OBSTACLE_HW - lx;
    const penT = ly + OBSTACLE_HH;
    const penB = OBSTACLE_HH - ly;
    const minPen = Math.min(penL, penR, penT, penB);
    if (minPen === penL) {
      nlx = -1;
      nly = 0;
      newLx = -OBSTACLE_HW - BALL_R;
    } else if (minPen === penR) {
      nlx = 1;
      nly = 0;
      newLx = OBSTACLE_HW + BALL_R;
    } else if (minPen === penT) {
      nlx = 0;
      nly = -1;
      newLy = -OBSTACLE_HH - BALL_R;
    } else {
      nlx = 0;
      nly = 1;
      newLy = OBSTACLE_HH + BALL_R;
    }
  }
  const nx = nlx * cos - nly * sin;
  const ny = nlx * sin + nly * cos;
  const dot = ball.vx * nx + ball.vy * ny;
  if (dot < 0) {
    ball.vx -= 2 * dot * nx;
    ball.vy -= 2 * dot * ny;
    flags.obstacle = true;
  }
  ball.x = cx + (newLx * cos - newLy * sin);
  ball.y = cy + (newLx * sin + newLy * cos);
}

// ---- Game -----------------------------------------------------------------

export const game: Game<CaromState, CaromDebugApi> = {
  initialize(api: InitApi<CaromState>): [CaromState, CaromDebugApi] {
    for (const name of ACTIONS)
      api.input.register(name, { keys: [...BINDINGS[name]] });
    api.audio.define(CUES.paddleHit, {
      wave: "square",
      freq: 620,
      freqTo: 880,
      durationMs: 70,
      gain: 0.16,
    });
    api.audio.define(CUES.wallBounce, {
      wave: "sine",
      freq: 240,
      freqTo: 170,
      durationMs: 70,
      gain: 0.14,
    });
    api.audio.define(CUES.obstacleBounce, {
      wave: "triangle",
      freq: 340,
      freqTo: 250,
      durationMs: 90,
      gain: 0.18,
    });
    api.audio.define(CUES.score, {
      wave: "square",
      freq: 520,
      freqTo: 1040,
      durationMs: 160,
      gain: 0.16,
    });
    api.diagnostics.register("screen", (s) => s.screen);
    api.diagnostics.register("mode", (s) => s.mode);
    api.diagnostics.register("score-p1", (s) => s.score.p1);
    api.diagnostics.register("score-p2", (s) => s.score.p2);
    api.diagnostics.register("ball-position", (s) =>
      s.ball ? `${s.ball.x.toFixed(1)}, ${s.ball.y.toFixed(1)}` : "none",
    );
    api.diagnostics.register("ball-velocity", (s) =>
      s.ball ? `${s.ball.vx.toFixed(1)}, ${s.ball.vy.toFixed(1)}` : "none",
    );
    api.diagnostics.register("ball-speed", (s) =>
      s.ball ? Math.hypot(s.ball.vx, s.ball.vy) : 0,
    );
    api.diagnostics.register("ball-spin", (s) => (s.ball ? s.ball.spin : 0));
    api.diagnostics.register("paddle-left-cy", (s) => s.paddles.left.cy);
    api.diagnostics.register("paddle-left-vy", (s) => s.paddles.left.vy);
    api.diagnostics.register("paddle-right-cy", (s) => s.paddles.right.cy);
    api.diagnostics.register("paddle-right-vy", (s) => s.paddles.right.vy);
    return [initialState(false, 0, 0), debugApi];
  },

  update(state, api, dt): CaromState {
    // Mutable local copies of every field.
    let screen: Screen = state.screen;
    let mode: Mode = state.mode;
    let menuIndex = state.menuIndex;
    let titleIndex = state.titleIndex;
    let resumeScreen: "countdown" | "playing" = state.resumeScreen;
    let p1 = state.score.p1;
    let p2 = state.score.p2;
    let winner: Side | null = state.winner;
    let receiver: Side = state.receiver;
    const left: MutablePaddle = { ...state.paddles.left };
    const right: MutablePaddle = { ...state.paddles.right };
    let tracking = state.ai.tracking;
    let movement = state.ai.movement;
    let ball: MutableBall | null = state.ball
      ? { ...state.ball, trail: [...state.ball.trail] }
      : null;
    let obstacles: ObstacleState[] = syncedObstacles(
      state.obstacles,
      state.obstacleClock,
    );
    let obstacleClock = state.obstacleClock;
    let obstacleClockRunning = state.obstacleClockRunning;
    const simTime = state.simTime + dt;
    let muted = state.muted;

    const startScreen: Screen = state.screen;
    const flags: HitFlags = { paddle: false, wall: false, obstacle: false };
    let scored = false;

    // --- Closures over the locals above ------------------------------------
    const parkBall = (): void => {
      ball = { ...parkedBall(), trail: [] };
    };
    const startMatch = (m: Mode): void => {
      mode = m;
      screen = "countdown";
      resumeScreen = "playing";
      menuIndex = 0;
      p1 = 0;
      p2 = 0;
      winner = null;
      receiver = "left";
      parkBall();
      left.cy = FIELD_CY;
      left.vy = 0;
      right.cy = FIELD_CY;
      right.vy = 0;
      obstacleClock = 0;
      obstacleClockRunning = true;
      obstacles = allObstacles(0);
    };
    const returnToTitle = (): void => {
      const fresh = initialState(muted, simTime, titleIndex);
      screen = fresh.screen;
      mode = fresh.mode;
      menuIndex = fresh.titleIndex;
      resumeScreen = fresh.resumeScreen;
      p1 = 0;
      p2 = 0;
      winner = null;
      receiver = fresh.receiver;
      left.cy = fresh.paddles.left.cy;
      left.vy = 0;
      left.driven = false;
      left.drivenVy = 0;
      right.cy = fresh.paddles.right.cy;
      right.vy = 0;
      right.driven = false;
      right.drivenVy = 0;
      tracking = true;
      movement = true;
      ball = fresh.ball ? { ...fresh.ball, trail: [] } : null;
      obstacles = [...fresh.obstacles];
      obstacleClock = 0;
      obstacleClockRunning = true;
    };
    const confirmItem = (index: number): void => {
      if (screen === "title") {
        titleIndex = index;
        if (index === 0) startMatch("solo");
        else if (index === 1) startMatch("versus");
        else if (index === 2) {
          screen = "howto";
          menuIndex = 0;
        }
      } else if (screen === "howto") {
        returnToTitle();
      } else if (screen === "paused") {
        if (index === 0) screen = resumeScreen;
        else if (index === 1) startMatch(mode);
        else if (index === 2) returnToTitle();
      } else if (screen === "matchover") {
        if (index === 0) startMatch(mode);
        else if (index === 1) returnToTitle();
      }
    };

    // --- Input ---------------------------------------------------------------
    if (api.input.pressed("mute")) {
      api.audio.setMuted(!api.audio.muted());
      muted = api.audio.muted();
    } else if (muted !== api.audio.muted()) {
      // A debug pose (or any other state-level change) set the bit: the
      // runtime follows the state so the posed value survives the frame.
      api.audio.setMuted(muted);
    }

    let keyboardConfirmed = false;
    let resumedFromPause = false;

    if (
      startScreen === "title" ||
      startScreen === "howto" ||
      startScreen === "paused" ||
      startScreen === "matchover"
    ) {
      const upEdge = api.input.pressed("p1-up") || api.input.pressed("p2-up");
      const downEdge =
        api.input.pressed("p1-down") || api.input.pressed("p2-down");
      // `pause`/`back` are read on paused before the menu edges. They are
      // also read where the spec reads `back`, so consume them exactly once.
      let pauseEdge = false;
      let backEdge = false;
      if (startScreen === "paused") pauseEdge = api.input.pressed("pause");
      if (
        startScreen === "title" ||
        startScreen === "howto" ||
        startScreen === "paused" ||
        startScreen === "matchover"
      )
        backEdge = api.input.pressed("back");

      if (startScreen === "paused" && (pauseEdge || backEdge)) {
        screen = resumeScreen;
        resumedFromPause = true;
      } else if (startScreen === "howto" && backEdge) {
        returnToTitle();
        keyboardConfirmed = true;
      } else {
        const count = menuCount(startScreen);
        let moved = false;
        if (count > 0 && (upEdge || downEdge)) {
          if (upEdge) menuIndex = (menuIndex - 1 + count) % count;
          else menuIndex = (menuIndex + 1) % count;
          moved = true;
        }
        if (!moved && api.input.pressed("confirm")) {
          keyboardConfirmed = true;
          confirmItem(menuIndex);
        } else if (
          startScreen === "matchover" &&
          backEdge &&
          screen === "matchover"
        ) {
          returnToTitle();
          keyboardConfirmed = true;
        }
      }

      // Pointer / touch, applied after keyboard edges and only while the
      // screen the frame began on is still the menu being shown.
      if (!keyboardConfirmed && !resumedFromPause && screen === startScreen) {
        const samples = api.input.pointerSamples();
        const snap = api.input.pointer();
        let pressItem: number | null | undefined;
        let pointerConfirmItem: number | null = null;

        const select = (x: number, y: number): void => {
          const item = itemAt(screen, x, y);
          if (item !== null) menuIndex = item;
        };
        if (!snap.down) select(snap.x, snap.y);

        for (const sample of samples) {
          if (sample.type === "down") {
            pressItem = itemAt(screen, sample.x, sample.y);
            if (pressItem !== null && pressItem !== undefined)
              menuIndex = pressItem;
          } else if (sample.type === "move") {
            // A mouse drag keeps the pressed item as the prospective
            // confirm target; hover and touch travel select freely.
            const draggingMouse =
              sample.device !== "touch" && sample.buttons.length > 0;
            if (!draggingMouse) select(sample.x, sample.y);
          } else {
            const releaseItem = itemAt(screen, sample.x, sample.y);
            if (pressItem !== undefined) {
              if (
                pressItem !== null &&
                releaseItem !== null &&
                pressItem === releaseItem
              )
                pointerConfirmItem = releaseItem;
            } else if (releaseItem !== null && releaseItem === menuIndex) {
              pointerConfirmItem = releaseItem;
            }
          }
        }
        // Touch contacts currently on an item also select it (covers a
        // contact whose move samples were not delivered this frame).
        if (samples.length === 0) {
          for (const contact of api.input.pointerContacts()) {
            if (contact.device === "touch") select(contact.x, contact.y);
          }
        }
        if (pointerConfirmItem !== null) {
          menuIndex = pointerConfirmItem;
          confirmItem(pointerConfirmItem);
        }
      }
    } else {
      // countdown / playing
      if (api.input.pressed("pause")) {
        resumeScreen = startScreen;
        screen = "paused";
        menuIndex = 0;
      }
    }

    // --- Advancement for the screen input left us on -------------------------
    if (screen === "countdown" || screen === "playing") {
      // Paddles.
      const movePaddle = (
        paddle: MutablePaddle,
        upVal: number,
        downVal: number,
      ): void => {
        if (paddle.driven) {
          integratePaddle(paddle, paddle.drivenVy, dt);
        } else {
          const axis = downVal - upVal;
          integratePaddle(paddle, axis * PADDLE_SPEED, dt);
        }
      };
      const aiPaddle = (): void => {
        if (!movement) {
          integratePaddle(right, 0, dt);
          return;
        }
        let target = AI_HOME_Y;
        let deadzone: number = AI_HOME_DEADZONE;
        if (tracking && screen === "playing" && ball && ball.vx > 0) {
          target = ball.y - ball.vy * AI_REACT;
          deadzone = AI_DEADZONE;
        }
        const diff = target - right.cy;
        let vy = 0;
        if (Math.abs(diff) > deadzone) {
          const reach = dt > 0 ? Math.abs(diff) / dt : AI_SPEED;
          vy = Math.sign(diff) * Math.min(AI_SPEED, reach);
        }
        integratePaddle(right, vy, dt);
      };

      if (mode === "solo") {
        if (left.driven) integratePaddle(left, left.drivenVy, dt);
        else
          movePaddle(
            left,
            Math.max(api.input.value("p1-up"), api.input.value("p2-up")),
            Math.max(api.input.value("p1-down"), api.input.value("p2-down")),
          );
        if (right.driven) integratePaddle(right, right.drivenVy, dt);
        else aiPaddle();
      } else {
        movePaddle(left, api.input.value("p1-up"), api.input.value("p1-down"));
        movePaddle(right, api.input.value("p2-up"), api.input.value("p2-down"));
      }

      // Obstacle poses for this frame come from the clock at frame start.
      const frameObstacles = obstacles;

      if (screen === "countdown") {
        let served = false;
        if (ball) {
          ball.holdTimer -= dt;
          if (ball.holdTimer <= 0) {
            ball.holdTimer = 0;
            ball.held = false;
            ball.trail = [];
            const dir = receiver === "left" ? -1 : 1;
            ball.vx = dir * SERVE_SPEED * Math.cos(SERVE_ANGLE);
            ball.vy = ball.serveSign * SERVE_SPEED * Math.sin(SERVE_ANGLE);
            screen = "playing";
            served = true;
          }
        }
        if (ball && !served) {
          ball.trail = [
            ...ball.trail.filter((t) => simTime - t.t <= TRAIL_TIME),
            { x: ball.x, y: ball.y, t: simTime },
          ];
        }
      } else {
        // playing
        if (ball && !ball.held) {
          const speed0 = Math.hypot(ball.vx, ball.vy);
          const n = Math.max(1, Math.ceil((speed0 * dt) / MAX_SUBSTEP));
          const h = dt / n;
          for (let step = 0; step < n; step++) {
            const speed = Math.hypot(ball.vx, ball.vy);
            if (speed > 0) {
              const angle = (ball.spin / speed) * h;
              const cos = Math.cos(angle);
              const sin = Math.sin(angle);
              const vx = ball.vx * cos - ball.vy * sin;
              const vy = ball.vx * sin + ball.vy * cos;
              ball.vx = vx;
              ball.vy = vy;
            }
            ball.spin *= Math.pow(0.5, h / SPIN_HALFLIFE);
            ball.x += ball.vx * h;
            ball.y += ball.vy * h;
            // Walls.
            if (ball.y - BALL_R < 0 && ball.vy < 0) {
              ball.y = BALL_R;
              ball.vy = -ball.vy;
              flags.wall = true;
            } else if (ball.y + BALL_R > FIELD_H && ball.vy > 0) {
              ball.y = FIELD_H - BALL_R;
              ball.vy = -ball.vy;
              flags.wall = true;
            }
            resolvePaddle(ball, P1_X0, P1_X1, left, "left", flags);
            resolvePaddle(ball, P2_X0, P2_X1, right, "right", flags);
            for (const obstacle of frameObstacles)
              resolveObstacle(ball, obstacle, flags);
          }
          ball.trail = [
            ...ball.trail.filter((t) => simTime - t.t <= TRAIL_TIME),
            { x: ball.x, y: ball.y, t: simTime },
          ];
          // Scoring.
          let scorer: Side | null = null;
          if (ball.x - BALL_R > FIELD_W) scorer = "left";
          else if (ball.x + BALL_R < 0) scorer = "right";
          if (scorer) {
            scored = true;
            if (scorer === "left") p1 += 1;
            else p2 += 1;
            const scorerScore = scorer === "left" ? p1 : p2;
            const otherScore = scorer === "left" ? p2 : p1;
            if (
              scorerScore >= WIN_SCORE &&
              scorerScore - otherScore >= WIN_LEAD
            ) {
              winner = scorer;
              screen = "matchover";
              menuIndex = 0;
            } else {
              receiver = scorer === "left" ? "right" : "left";
              parkBall();
              screen = "countdown";
            }
          }
        } else if (ball && ball.held) {
          ball.trail = [
            ...ball.trail.filter((t) => simTime - t.t <= TRAIL_TIME),
            { x: ball.x, y: ball.y, t: simTime },
          ];
        }
      }

      if (obstacleClockRunning) obstacleClock += dt;
      obstacles = syncedObstacles(frameObstacles, obstacleClock);
    }

    if (flags.paddle) api.audio.play(CUES.paddleHit);
    if (flags.wall) api.audio.play(CUES.wallBounce);
    if (flags.obstacle) api.audio.play(CUES.obstacleBounce);
    if (scored) api.audio.play(CUES.score);

    return {
      screen,
      mode,
      menuIndex,
      titleIndex,
      resumeScreen,
      score: { p1, p2 },
      winner,
      paddles: { left: { ...left }, right: { ...right } },
      ai: { tracking, movement },
      receiver,
      ball: ball ? { ...ball, trail: [...ball.trail] } : null,
      obstacles,
      obstacleClock,
      obstacleClockRunning,
      simTime,
      muted,
    };
  },

  render(state, api): void {
    draw(state, api);
  },
};

// ---- Rendering --------------------------------------------------------------

type Ctx = CanvasRenderingContext2D;

function roundRect(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

const LEFT_COLOR = "#38e1ff";
const RIGHT_COLOR = "#ff5f8f";
const OBSTACLE_COLOR = "#ffb02e";
const BALL_COLOR = "#fff3a6";

function drawField(state: DeepReadonly<CaromState>, ctx: Ctx): void {
  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, FIELD_W, FIELD_H);
  // Subtle border glow.
  ctx.strokeStyle = "rgba(90,140,255,0.35)";
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, FIELD_W - 4, FIELD_H - 4);
  // Net.
  ctx.save();
  ctx.strokeStyle = "rgba(200,220,255,0.4)";
  ctx.lineWidth = 4;
  ctx.setLineDash([18, 16]);
  ctx.beginPath();
  ctx.moveTo(NET_X, 8);
  ctx.lineTo(NET_X, FIELD_H - 8);
  ctx.stroke();
  ctx.restore();

  // Obstacles.
  for (const obstacle of state.obstacles) {
    ctx.save();
    ctx.translate(obstacle.cx, obstacle.cy);
    ctx.rotate(obstacle.theta);
    ctx.shadowColor = OBSTACLE_COLOR;
    ctx.shadowBlur = 18;
    ctx.fillStyle = OBSTACLE_COLOR;
    roundRect(
      ctx,
      -OBSTACLE_HW,
      -OBSTACLE_HH,
      OBSTACLE_HW * 2,
      OBSTACLE_HH * 2,
      9,
    );
    ctx.fill();
    ctx.restore();
  }

  // Paddles.
  const drawPaddle = (x: number, cy: number, color: string): void => {
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = color;
    roundRect(ctx, x, cy - PADDLE_HALF, PADDLE_W, PADDLE_H, 8);
    ctx.fill();
    ctx.restore();
  };
  drawPaddle(P1_X0, state.paddles.left.cy, LEFT_COLOR);
  drawPaddle(P2_X0, state.paddles.right.cy, RIGHT_COLOR);

  // Ball and trail.
  const ball = state.ball;
  if (ball) {
    if (ball.trail.length > 1) {
      ctx.save();
      ctx.lineCap = "round";
      for (let i = 1; i < ball.trail.length; i++) {
        const a = ball.trail[i - 1]!;
        const b = ball.trail[i]!;
        const frac = i / ball.trail.length;
        ctx.strokeStyle = `rgba(255,220,120,${(0.12 + 0.5 * frac).toFixed(3)})`;
        ctx.lineWidth = 2 + 8 * frac;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.save();
    ctx.shadowColor = BALL_COLOR;
    ctx.shadowBlur = 22;
    ctx.fillStyle = BALL_COLOR;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (ball.spin !== 0) {
      ctx.save();
      ctx.strokeStyle = ball.spin > 0 ? LEFT_COLOR : RIGHT_COLOR;
      ctx.lineWidth = 3;
      ctx.beginPath();
      const sweep = clamp(Math.abs(ball.spin) / 900, 0.15, 1) * Math.PI * 1.4;
      ctx.arc(
        ball.x,
        ball.y,
        BALL_R + 6,
        -Math.PI / 2,
        -Math.PI / 2 + (ball.spin > 0 ? sweep : -sweep),
        ball.spin < 0,
      );
      ctx.stroke();
      ctx.restore();
    }
  }
}

function drawScores(state: DeepReadonly<CaromState>, ctx: Ctx): void {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 64px system-ui, sans-serif";
  ctx.fillStyle = LEFT_COLOR;
  ctx.fillText(String(state.score.p1), FIELD_CX - 110, 62);
  ctx.fillStyle = RIGHT_COLOR;
  ctx.fillText(String(state.score.p2), FIELD_CX + 110, 62);
  ctx.font = "600 22px system-ui, sans-serif";
  ctx.fillStyle = "rgba(230,240,255,0.85)";
  ctx.fillText(state.mode === "solo" ? "SOLO" : "VERSUS", FIELD_CX, 30);
  ctx.font = "500 16px system-ui, sans-serif";
  ctx.fillStyle = "rgba(200,215,245,0.6)";
  ctx.fillText("first to 11 · win by 2", FIELD_CX, 112);
  ctx.restore();
}

function drawMenu(
  state: DeepReadonly<CaromState>,
  ctx: Ctx,
  items: readonly string[],
): void {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  items.forEach((item, i) => {
    const r = rectForItem(state.screen, i);
    if (!r) return;
    const selected = i === state.menuIndex;
    ctx.fillStyle = selected ? "rgba(56,225,255,0.9)" : "rgba(20,30,58,0.9)";
    roundRect(ctx, r.x, r.y, r.w, r.h, 12);
    ctx.fill();
    ctx.strokeStyle = selected ? "#ffffff" : "rgba(140,170,230,0.5)";
    ctx.lineWidth = selected ? 3 : 1.5;
    ctx.stroke();
    ctx.fillStyle = selected ? "#06121f" : "#dce9ff";
    ctx.font = "700 26px system-ui, sans-serif";
    ctx.fillText(item, r.x + r.w / 2, r.y + r.h / 2 + 1);
  });
  ctx.restore();
}

function overlay(ctx: Ctx, alpha: number): void {
  ctx.fillStyle = `rgba(4,7,16,${alpha})`;
  ctx.fillRect(0, 0, FIELD_W, FIELD_H);
}

function draw(state: DeepReadonly<CaromState>, api: RenderApi): void {
  const ctx = api.ctx;
  const inMatch =
    state.screen === "playing" ||
    state.screen === "countdown" ||
    state.screen === "paused" ||
    state.screen === "matchover";
  if (inMatch || state.screen === "title" || state.screen === "howto") {
    if (state.screen === "title" || state.screen === "howto") {
      ctx.save();
      ctx.globalAlpha = 0.55;
    }
    drawField(state, ctx);
    if (state.screen === "title" || state.screen === "howto") ctx.restore();
  }
  if (inMatch) drawScores(state, ctx);

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (state.screen === "title") {
    overlay(ctx, 0.45);
    ctx.shadowColor = LEFT_COLOR;
    ctx.shadowBlur = 34;
    ctx.fillStyle = "#f2f8ff";
    ctx.font = "900 118px system-ui, sans-serif";
    ctx.fillText(TITLE_TEXT, FIELD_CX, 190);
    ctx.shadowBlur = 0;
    ctx.font = "600 24px system-ui, sans-serif";
    ctx.fillStyle = "rgba(210,228,255,0.85)";
    ctx.fillText(
      "Bend the ball. Bank it off the spinning bars.",
      FIELD_CX,
      272,
    );
    drawMenu(state, ctx, menuItemsFor(state.screen));
    ctx.font = "500 17px system-ui, sans-serif";
    ctx.fillStyle = "rgba(180,200,235,0.65)";
    ctx.fillText(
      "W/S or ↑/↓ to choose · Enter to confirm · M to mute",
      FIELD_CX,
      650,
    );
  } else if (state.screen === "howto") {
    overlay(ctx, 0.72);
    ctx.fillStyle = "#f2f8ff";
    ctx.font = "800 54px system-ui, sans-serif";
    ctx.fillText("HOW TO PLAY", FIELD_CX, 92);
    ctx.font = "500 23px system-ui, sans-serif";
    ctx.fillStyle = "#d7e6ff";
    const lines = [
      "Solo: move the left paddle with W/S (or ↑/↓).",
      "Versus: player two uses ↑/↓ on the right paddle.",
      "Move as you strike: your paddle's motion spins the ball,",
      "and spin curves its flight until it fades.",
      "The two amber bars sway and rotate — bank shots off",
      "their tilted faces, or thread the gap between them.",
      "Score past your opponent. First to 11, win by 2.",
      "P or Esc pauses · M mutes",
    ];
    lines.forEach((line, i) => ctx.fillText(line, FIELD_CX, 176 + i * 44));
    drawMenu(state, ctx, menuItemsFor(state.screen));
  } else if (state.screen === "countdown") {
    ctx.font = "800 44px system-ui, sans-serif";
    ctx.fillStyle = "rgba(242,248,255,0.92)";
    const secs = state.ball ? Math.max(1, Math.ceil(state.ball.holdTimer)) : 1;
    ctx.fillText(
      state.receiver === "left" ? "BALL TO THE LEFT" : "BALL TO THE RIGHT",
      FIELD_CX,
      190,
    );
    ctx.font = "900 84px system-ui, sans-serif";
    ctx.fillText(String(secs), FIELD_CX, 272);
  } else if (state.screen === "paused") {
    overlay(ctx, 0.55);
    ctx.fillStyle = "#f2f8ff";
    ctx.font = "800 58px system-ui, sans-serif";
    ctx.fillText("PAUSED", FIELD_CX, 210);
    drawMenu(state, ctx, menuItemsFor(state.screen));
  } else if (state.screen === "matchover") {
    overlay(ctx, 0.5);
    ctx.fillStyle = "#f2f8ff";
    ctx.font = "900 66px system-ui, sans-serif";
    const label =
      state.winner === "left"
        ? state.mode === "solo"
          ? "YOU WIN!"
          : "LEFT WINS!"
        : state.mode === "solo"
          ? "RIGHT WINS!"
          : "RIGHT WINS!";
    ctx.fillText(label, FIELD_CX, 190);
    ctx.font = "700 40px system-ui, sans-serif";
    ctx.fillStyle = "#d7e6ff";
    ctx.fillText(`${state.score.p1} — ${state.score.p2}`, FIELD_CX, 268);
    drawMenu(state, ctx, menuItemsFor(state.screen));
  }
  ctx.restore();
}
