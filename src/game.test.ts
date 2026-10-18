import { createCanvas } from "@napi-rs/canvas";
import { ConstantClock, createEngine } from "@clockwyrks/simple-2d";
import type { SurfaceMetrics } from "@clockwyrks/simple-2d";
import { describe, expect, it } from "vitest";
import { BACKGROUND, game } from "./game";
import type { CaromDebugApi, CaromState } from "./game";

type Engine = Awaited<ReturnType<typeof makeEngine>>["engine"];

async function makeEngine(stepMs = 1000 / 60) {
  const canvas = createCanvas(1280, 720) as unknown as HTMLCanvasElement;
  const events = new EventTarget();
  const surface: SurfaceMetrics = {
    cssWidth: () => 1280,
    cssHeight: () => 720,
    dpr: () => 1,
    events: () => events,
    origin: () => ({ x: 0, y: 0 }),
  };
  const engine = createEngine<CaromState, CaromDebugApi>({
    canvas,
    width: 1280,
    height: 720,
    game,
    background: BACKGROUND,
    layout: "dual-vertical",
    clock: new ConstantClock(stepMs),
    surface,
  });
  await engine.initialize();
  return { engine, events };
}

function key(events: EventTarget, type: string, code: string): void {
  const e = new Event(type) as Event & Record<string, unknown>;
  e.code = code;
  e.repeat = false;
  events.dispatchEvent(e);
}

function pointer(
  events: EventTarget,
  type: string,
  x: number,
  y: number,
  pointerType = "mouse",
): void {
  const e = new Event(type) as Event & Record<string, unknown>;
  e.clientX = x;
  e.clientY = y;
  e.pointerId = 1;
  e.pointerType = pointerType;
  e.isPrimary = true;
  e.button = type === "pointerup" ? 0 : 0;
  e.buttons = type === "pointerdown" || type === "pointermove" ? 1 : 0;
  if (type === "pointermove") e.buttons = 0;
  events.dispatchEvent(e);
}

const snap = (e: Engine) => e.debug.snapshot(e.state);

function startSolo(e: Engine): void {
  e.apply((s) => e.debug.setScreen(s, "title"));
  e.apply((s) => e.debug.setMenuIndex(s, 0));
  // Drive through the real confirm path: press Enter.
}

describe("initial state", () => {
  it("opens on the title with the declared defaults", async () => {
    const { engine } = await makeEngine();
    const s = snap(engine);
    expect(s.version).toBe(1);
    expect(s.screen).toBe("title");
    expect(s.mode).toBe("solo");
    expect(s.menuIndex).toBe(0);
    expect(s.score).toEqual({ p1: 0, p2: 0 });
    expect(s.winner).toBeNull();
    expect(s.ball).not.toBeNull();
    expect(s.ball?.x).toBe(640);
    expect(s.ball?.y).toBe(360);
    expect(s.ball?.held).toBe(true);
    expect(s.ball?.holdTimer).toBe(1);
    expect(s.obstacles).toHaveLength(2);
    expect(s.obstacles[0]).toMatchObject({ index: 0, cx: 490, cy: 220 });
    expect(s.obstacles[1]).toMatchObject({ index: 1, cx: 790, cy: 500 });
    expect(s.obstacleClock).toBe(0);
    expect(engine.diagnostics().length).toBeGreaterThanOrEqual(10);
  });
});

describe("countdown and serve", () => {
  it("serves toward the left first after the hold", async () => {
    const { engine } = await makeEngine();
    startSolo(engine);
    engine.apply((s) => engine.debug.setScreen(s, "countdown"));
    engine.apply((s) => engine.debug.setBallServeSign(s, 1));
    await engine.advance(70);
    const s = snap(engine);
    expect(s.screen).toBe("playing");
    expect(s.ball?.held).toBe(false);
    expect(s.ball!.vx).toBeLessThan(0);
    expect(s.ball!.vy).toBeGreaterThan(0);
    expect(s.ball!.speed).toBeCloseTo(520, 0);
  });

  it("does not advance the ball on the serve frame", async () => {
    const { engine } = await makeEngine(16);
    engine.apply((s) => engine.debug.setScreen(s, "countdown"));
    engine.apply((s) => engine.debug.setBallHoldTimer(s, 0));
    await engine.advance(1);
    const s = snap(engine);
    expect(s.screen).toBe("playing");
    expect(s.ball?.x).toBe(640);
  });
});

describe("physics", () => {
  async function playingBall(e: Engine) {
    e.apply((s) => e.debug.setScreen(s, "playing"));
    e.apply((s) => e.debug.setBallHeld(s, false));
    e.apply((s) => e.debug.setObstacleClockRunning(s, false));
  }

  it("reflects off the top wall", async () => {
    const { engine } = await makeEngine();
    await playingBall(engine);
    engine.apply((s) => engine.debug.setBallPosition(s, 640, 30));
    engine.apply((s) => engine.debug.setBallVelocity(s, 0, -400));
    await engine.advance(10);
    expect(snap(engine).ball!.vy).toBeGreaterThan(0);
  });

  it("bounces off the left paddle and gains speed and spin", async () => {
    const { engine } = await makeEngine();
    await playingBall(engine);
    engine.apply((s) => engine.debug.setPaddleCy(s, "left", 360));
    engine.apply((s) => engine.debug.setBallPosition(s, 120, 360));
    engine.apply((s) => engine.debug.setBallVelocity(s, -400, 0));
    engine.apply((s) => engine.debug.setBallSpin(s, 0));
    await engine.advance(20);
    const b = snap(engine).ball!;
    expect(b.vx).toBeGreaterThan(0);
    expect(b.speed).toBeCloseTo(416, 0);
  });

  it("a moving paddle adds spin that curves the ball", async () => {
    const { engine } = await makeEngine();
    await playingBall(engine);
    engine.apply((s) => engine.debug.setPaddleDriven(s, "left", true));
    engine.apply((s) => engine.debug.setPaddleVy(s, "left", 500));
    engine.apply((s) => engine.debug.setBallPosition(s, 120, 360));
    engine.apply((s) => engine.debug.setBallVelocity(s, -400, 0));
    await engine.advance(30);
    const b = snap(engine).ball!;
    expect(b.spin).not.toBe(0);
    expect(b.vy).not.toBe(0);
  });

  it("scores for player one past the right edge and re-parks", async () => {
    const { engine } = await makeEngine();
    await playingBall(engine);
    engine.apply((s) => engine.debug.clearWorld(s));
    engine.apply((s) => engine.debug.spawnBall(s));
    engine.apply((s) => engine.debug.setScreen(s, "playing"));
    engine.apply((s) => engine.debug.setBallHeld(s, false));
    engine.apply((s) => engine.debug.setBallPosition(s, 1240, 100));
    engine.apply((s) => engine.debug.setBallVelocity(s, 600, 0));
    await engine.advance(10);
    const s = snap(engine);
    expect(s.score.p1).toBe(1);
    expect(s.screen).toBe("countdown");
    expect(s.receiver).toBe("right");
    expect(s.ball?.x).toBe(640);
  });

  it("ends the match at 11 with a two-point lead", async () => {
    const { engine } = await makeEngine();
    await playingBall(engine);
    engine.apply((s) => engine.debug.setScore(s, 10, 5));
    engine.apply((s) => engine.debug.setBallPosition(s, 1240, 100));
    engine.apply((s) => engine.debug.setBallVelocity(s, 600, 0));
    await engine.advance(10);
    const s = snap(engine);
    expect(s.screen).toBe("matchover");
    expect(s.winner).toBe("left");
  });

  it("bounces off an upright obstacle face", async () => {
    const { engine } = await makeEngine();
    await playingBall(engine);
    engine.apply((s) => engine.debug.setBallPosition(s, 430, 220));
    engine.apply((s) => engine.debug.setBallVelocity(s, 400, 0));
    await engine.advance(20);
    expect(snap(engine).ball!.vx).toBeLessThan(0);
  });

  it("keeps the ball inside the field at top speed", async () => {
    const { engine } = await makeEngine(16);
    await playingBall(engine);
    engine.apply((s) => engine.debug.setBallPosition(s, 640, 360));
    engine.apply((s) => engine.debug.setBallVelocity(s, 700, 700));
    for (let i = 0; i < 30; i++) {
      await engine.advance(10);
      const b = snap(engine).ball;
      if (b) {
        expect(b.y).toBeGreaterThanOrEqual(11 - 1e-6);
        expect(b.y).toBeLessThanOrEqual(709 + 1e-6);
      }
    }
  });
});

describe("debug surface", () => {
  it("poses and reads back fields, and fails loudly with no ball", async () => {
    const { engine } = await makeEngine();
    engine.apply((s) => engine.debug.setPaddleVy(s, "left", 321));
    expect(snap(engine).paddles.left.drivenVy).toBe(321);
    expect(snap(engine).paddles.left.vy).toBe(0);
    engine.apply((s) => engine.debug.clearWorld(s));
    expect(snap(engine).ball).toBeNull();
    expect(snap(engine).obstacles).toEqual([]);
    expect(() =>
      engine.apply((s) => engine.debug.setBallPosition(s, 1, 2)),
    ).toThrow();
    engine.apply((s) => engine.debug.spawnBall(s));
    expect(snap(engine).ball?.x).toBe(640);
    engine.apply((s) => engine.debug.spawnObstacle(s, 1));
    expect(snap(engine).obstacles).toHaveLength(1);
    expect(() =>
      engine.apply((s) => engine.debug.spawnObstacle(s, 5)),
    ).toThrow();
  });

  it("obstacle clock drives the poses", async () => {
    const { engine } = await makeEngine();
    engine.apply((s) => engine.debug.setObstacleClock(s, 0.9));
    const s = snap(engine);
    expect(s.obstacles[0]!.cy).toBeCloseTo(300, 5);
    expect(s.obstacles[1]!.cy).toBeCloseTo(420, 5);
    expect(s.obstacles[0]!.theta).toBeCloseTo(0.3 * Math.PI, 5);
    engine.apply((st) => engine.debug.reconcile(st));
    expect(snap(engine).obstacles[0]!.cy).toBeCloseTo(300, 5);
  });

  it("reset restores the title and preserves muted", async () => {
    const { engine } = await makeEngine();
    engine.apply((s) => engine.debug.setMuted(s, true));
    engine.apply((s) => engine.debug.setScore(s, 4, 3));
    engine.apply((s) => engine.debug.reset(s));
    const s = snap(engine);
    expect(s.screen).toBe("title");
    expect(s.score).toEqual({ p1: 0, p2: 0 });
    expect(s.muted).toBe(true);
    expect(s.simTime).toBe(0);
  });

  it("menuItemRect is null in play and valid on menus", async () => {
    const { engine } = await makeEngine();
    expect(engine.debug.menuItemRect(engine.state, 0)).not.toBeNull();
    expect(engine.debug.menuItemRect(engine.state, 9)).toBeNull();
    engine.apply((s) => engine.debug.setScreen(s, "playing"));
    expect(engine.debug.menuItemRect(engine.state, 0)).toBeNull();
  });

  it("driven paddle reaches vy on the next frame", async () => {
    const { engine } = await makeEngine();
    engine.apply((s) => engine.debug.setScreen(s, "playing"));
    engine.apply((s) => engine.debug.setPaddleVy(s, "right", 200));
    engine.apply((s) => engine.debug.setPaddleDriven(s, "right", true));
    const before = snap(engine).paddles.right.cy;
    await engine.advance(1);
    const after = snap(engine).paddles.right;
    expect(after.cy).toBeGreaterThan(before);
    expect(after.vy).toBeCloseTo(200, 3);
  });
});

describe("menus and input", () => {
  it("keyboard: down wraps and Enter starts a solo match", async () => {
    const { engine, events } = await makeEngine();
    key(events, "keydown", "KeyS");
    await engine.advance(1);
    key(events, "keyup", "KeyS");
    await engine.advance(1);
    expect(snap(engine).menuIndex).toBe(1);
    key(events, "keydown", "Enter");
    await engine.advance(1);
    key(events, "keyup", "Enter");
    const s = snap(engine);
    expect(s.screen).toBe("countdown");
    expect(s.mode).toBe("versus");
    expect(s.titleIndex).toBe(1);
  });

  it("pause and resume with Escape stays paused after one press", async () => {
    const { engine, events } = await makeEngine();
    engine.apply((s) => engine.debug.setScreen(s, "playing"));
    key(events, "keydown", "Escape");
    await engine.advance(1);
    expect(snap(engine).screen).toBe("paused");
    key(events, "keyup", "Escape");
    await engine.advance(2);
    expect(snap(engine).screen).toBe("paused");
    key(events, "keydown", "Escape");
    await engine.advance(1);
    key(events, "keyup", "Escape");
    expect(snap(engine).screen).toBe("playing");
  });

  it("pointer press and release inside an item confirms it", async () => {
    const { engine, events } = await makeEngine();
    const r = engine.debug.menuItemRect(engine.state, 2)!;
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    pointer(events, "pointerdown", cx, cy);
    await engine.advance(1);
    pointer(events, "pointerup", cx, cy);
    await engine.advance(1);
    expect(snap(engine).screen).toBe("howto");
    expect(snap(engine).titleIndex).toBe(2);
  });

  it("hover selects without confirming", async () => {
    const { engine, events } = await makeEngine();
    const r = engine.debug.menuItemRect(engine.state, 1)!;
    pointer(events, "pointermove", r.x + 10, r.y + 10);
    await engine.advance(1);
    expect(snap(engine).menuIndex).toBe(1);
    expect(snap(engine).screen).toBe("title");
  });

  it("mute toggles via the M key", async () => {
    const { engine, events } = await makeEngine();
    key(events, "keydown", "KeyM");
    await engine.advance(1);
    key(events, "keyup", "KeyM");
    expect(snap(engine).muted).toBe(true);
    await engine.advance(2);
    expect(snap(engine).muted).toBe(true);
  });

  it("paddles move from held keys in countdown (versus)", async () => {
    const { engine, events } = await makeEngine();
    engine.apply((s) => engine.debug.setMode(s, "versus"));
    engine.apply((s) => engine.debug.setScreen(s, "countdown"));
    key(events, "keydown", "KeyW");
    await engine.advance(10);
    key(events, "keyup", "KeyW");
    expect(snap(engine).paddles.left.cy).toBeLessThan(360);
  });
});

describe("AI", () => {
  it("tracks an incoming ball in solo", async () => {
    const { engine } = await makeEngine();
    engine.apply((s) => engine.debug.setScreen(s, "playing"));
    engine.apply((s) => engine.debug.setBallHeld(s, false));
    engine.apply((s) => engine.debug.setBallPosition(s, 900, 200));
    engine.apply((s) => engine.debug.setBallVelocity(s, 400, 0));
    engine.apply((s) => engine.debug.setPaddleCy(s, "right", 500));
    await engine.advance(10);
    expect(snap(engine).paddles.right.cy).toBeLessThan(500);
  });

  it("movement off leaves the AI paddle still", async () => {
    const { engine } = await makeEngine();
    engine.apply((s) => engine.debug.setAiMovement(s, false));
    engine.apply((s) => engine.debug.setScreen(s, "playing"));
    engine.apply((s) => engine.debug.setBallHeld(s, false));
    engine.apply((s) => engine.debug.setBallPosition(s, 900, 200));
    engine.apply((s) => engine.debug.setBallVelocity(s, 400, 0));
    engine.apply((s) => engine.debug.setPaddleCy(s, "right", 500));
    await engine.advance(10);
    const p = snap(engine).paddles.right;
    expect(p.cy).toBe(500);
    expect(p.vy).toBe(0);
  });
});

describe("determinism across step sizes", () => {
  it("reaches the same paddle contact at 4ms and 16ms", async () => {
    const run = async (stepMs: number) => {
      const { engine } = await makeEngine(stepMs);
      engine.apply((s) => engine.debug.setScreen(s, "playing"));
      engine.apply((s) => engine.debug.setBallHeld(s, false));
      engine.apply((s) => engine.debug.setObstacleClockRunning(s, false));
      engine.apply((s) => engine.debug.setBallPosition(s, 640, 360));
      engine.apply((s) => engine.debug.setBallVelocity(s, -500, 60));
      const frames = Math.round(2000 / stepMs);
      await engine.advance(frames);
      return snap(engine).ball!;
    };
    const a = await run(4);
    const b = await run(16);
    expect(Math.sign(a.vx)).toBe(Math.sign(b.vx));
    expect(Math.abs(a.speed - b.speed)).toBeLessThan(10);
  });
});
