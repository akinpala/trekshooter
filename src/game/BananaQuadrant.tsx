import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Trophy, Volume2, VolumeX, Vibrate } from "lucide-react";
import { loadSprites, spriteUrls, type SpriteSet } from "./assets";
import { sfx } from "./audio";
import { render } from "./draw";
import {
  bestScore,
  loadScores,
  loadSettings,
  qualifies,
  saveSettings,
  submitScore,
  type ScoreEntry,
} from "./scores";
import { createInput, createSim, frame, resizeSim, startRun, type Input, type Sim } from "./sim";

type View = "title" | "play" | "pause" | "over" | "scores" | "howto";

type Result = { score: number; wave: number; listed: boolean };

export function BananaQuadrant() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const simRef = useRef<Sim | null>(null);
  const inputRef = useRef<Input>(createInput());
  const viewRef = useRef<View>("title");
  const spritesRef = useRef<SpriteSet | null>(null);
  const [view, setView] = useState<View>("title");
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [best, setBest] = useState(0);
  const [muted, setMuted] = useState(false);
  const [shakeOn, setShakeOn] = useState(true);
  const [result, setResult] = useState<Result | null>(null);
  const [name, setName] = useState("ACE");
  const [saved, setSaved] = useState(false);
  const [backTo, setBackTo] = useState<View>("title");

  const bestHold = useRef(0);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const waveRef = useRef<HTMLSpanElement>(null);
  const bestRef = useRef<HTMLSpanElement>(null);
  const comboRef = useRef<HTMLSpanElement>(null);
  const bombRef = useRef<HTMLSpanElement>(null);
  const multiRef = useRef<HTMLDivElement>(null);
  const shieldRef = useRef<HTMLDivElement>(null);
  const speedRef = useRef<HTMLDivElement>(null);
  const lifeRefs = useRef<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    const loaded = loadScores();
    setScores(loaded);
    setBest(bestScore(loaded));
    bestHold.current = bestScore(loaded);
    const settings = loadSettings();
    setMuted(settings.mute);
    setShakeOn(settings.shake);
    sfx.muted = settings.mute;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sim = createSim(800, 600);
    sim.shake = shakeOn;
    sim.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    simRef.current = sim;
    const input = inputRef.current;

    let dead = false;
    let last = performance.now();

    const fit = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      resizeSim(sim, rect.width, rect.height);
    };
    fit();
    window.addEventListener("resize", fit);

    void loadSprites().then((set) => {
      if (!dead) spritesRef.current = set;
    });

    const qa =
      import.meta.env.DEV || new URLSearchParams(window.location.search).has("qa");
    if (qa) {
      window.__controlsTest = {
        getYaw: () => sim.player.aim,
        getSpeed: () => Math.hypot(sim.player.vx, sim.player.vy),
        getX: () => sim.player.x,
        getY: () => sim.player.y,
        setKeys: (codes: string[]) => {
          input.injected = [...codes];
        },
        setSteer: (v: number) => {
          input.steer = v;
        },
      };
    }

    const loop = (now: number) => {
      if (dead) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      frame(sim, input, dt);
      render(ctx, sim, spritesRef.current);
      paintHud(sim);
      for (const ev of sim.events) {
        if (ev === "shoot") sfx.shoot();
        else if (ev === "hit") sfx.hit();
        else if (ev === "kill") sfx.kill();
        else if (ev === "explode" || ev === "bomb") sfx.explode();
        else if (ev === "pickup") sfx.pickup();
        else if (ev === "hurt") sfx.hurt();
        else if (ev === "wave") sfx.wave();
      }
      if (sim.mode === "over" && viewRef.current === "play") {
        const board = loadScores();
        const listed = qualifies(sim.score, board);
        viewRef.current = "over";
        setResult({ score: sim.score, wave: sim.wave, listed });
        setSaved(false);
        setName("ACE");
        setView("over");
      }
      requestAnimationFrame(loop);
    };
    const raf = requestAnimationFrame(loop);

    const paintHud = (s: Sim) => {
      if (scoreRef.current) scoreRef.current.textContent = String(s.score);
      if (waveRef.current) waveRef.current.textContent = String(s.wave);
      if (bestRef.current) bestRef.current.textContent = String(Math.max(bestHold.current, s.score));
      if (comboRef.current) {
        comboRef.current.textContent = s.combo > 1 ? `x${s.combo}` : "";
      }
      if (bombRef.current) bombRef.current.textContent = String(s.player.bombs);
      setBar(multiRef.current, s.player.multiT / 14);
      setBar(shieldRef.current, s.player.shieldHp > 0 ? s.player.shieldT / 12 : 0);
      setBar(speedRef.current, s.player.speedT / 10);
      for (let i = 0; i < 3; i++) {
        const el = lifeRefs.current[i];
        if (el) el.style.opacity = i < s.player.lives ? "1" : "0.2";
      }
    };

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", fit);
      if (qa) delete window.__controlsTest;
    };
    // Settings are applied by the dedicated effect below. Mount once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const sim = simRef.current;
    if (sim) sim.shake = shakeOn && !sim.reduced;
    sfx.muted = muted;
    saveSettings({ mute: muted, shake: shakeOn });
  }, [muted, shakeOn]);

  useEffect(() => {
    const input = inputRef.current;
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space" || e.code.startsWith("Arrow")) e.preventDefault();
      input.codes.add(e.code);
      if (e.code === "Escape" || e.code === "KeyP") {
        e.preventDefault();
        togglePause();
      }
    };
    const up = (e: KeyboardEvent) => {
      input.codes.delete(e.code);
    };
    const blur = () => {
      input.codes.clear();
      input.pointerDown = false;
      input.seek = false;
      input.joyActive = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const input = inputRef.current;
    const pos = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      input.pointerX = e.clientX - r.left;
      input.pointerY = e.clientY - r.top;
      input.pointerInside = true;
      input.pointerSeen = true;
      input.pointerType = e.pointerType;
    };
    const onDown = (e: PointerEvent) => {
      pos(e);
      input.pointerDown = true;
      input.seek = true;
      sfx.unlock();
    };
    const onMove = (e: PointerEvent) => pos(e);
    const onUp = () => {
      input.pointerDown = false;
      input.seek = false;
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    return () => {
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, []);

  function togglePause() {
    const sim = simRef.current;
    if (!sim) return;
    if (viewRef.current === "play") {
      sim.mode = "pause";
      viewRef.current = "pause";
      setView("pause");
      sfx.ui();
    } else if (viewRef.current === "pause") {
      sim.mode = "play";
      viewRef.current = "play";
      setView("play");
      sfx.ui();
    }
  }

  function start() {
    const sim = simRef.current;
    if (!sim) return;
    sfx.unlock();
    sfx.ui();
    inputRef.current.injected = null;
    inputRef.current.steer = 0;
    startRun(sim);
    viewRef.current = "play";
    setView("play");
  }

  function openBoard(from: View) {
    setBackTo(from);
    setScores(loadScores());
    viewRef.current = "scores";
    setView("scores");
  }

  function saveScore() {
    if (!result || saved) return;
    const next = submitScore(name, result.score, result.wave);
    setScores(next);
    setBest(bestScore(next));
    bestHold.current = bestScore(next);
    setSaved(true);
    sfx.ui();
  }

  const showHud = view === "play" || view === "pause";

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-bg text-fg">
      <h1 className="sr-only">Banana Quadrant</h1>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-none"
        aria-label="Banana Quadrant playfield"
      />
      <div className="pointer-events-none absolute inset-0">
        {showHud && (
          <header className="flex items-start justify-between gap-3 p-4 sm:p-5">
            <div className="pointer-events-none min-w-0">
              <p className="font-display text-xs tracking-widest text-muted">SCORE</p>
              <p className="font-display text-xl text-primary sm:text-2xl">
                <span ref={scoreRef}>0</span>
              </p>
              <p className="text-xs text-muted">
                BEST <span ref={bestRef}>{best}</span>
                <span ref={comboRef} className="ml-2 text-accent" />
              </p>
            </div>
            <div className="pointer-events-none text-center">
              <p className="font-display text-xs tracking-widest text-muted">WAVE</p>
              <p className="font-display text-xl sm:text-2xl">
                <span ref={waveRef}>1</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <img src={spriteUrls.bomb} alt="" className="h-6 w-6 object-contain" />
                <span ref={bombRef} className="font-display text-sm text-primary">
                  0
                </span>
              </div>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <img
                    key={i}
                    ref={(el) => {
                      lifeRefs.current[i] = el;
                    }}
                    src={spriteUrls.player}
                    alt=""
                    className="h-5 w-auto sm:h-6"
                  />
                ))}
              </div>
              <button
                type="button"
                className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface text-fg"
                onClick={togglePause}
                aria-label="Pause"
              >
                <Pause className="size-5" />
              </button>
            </div>
          </header>
        )}

        {showHud && (
          <div className="absolute top-20 left-4 flex w-36 flex-col gap-2 sm:top-24">
            <Meter refEl={multiRef} label="Bananas" icon={spriteUrls.multi} />
            <Meter refEl={shieldRef} label="Shield" icon={spriteUrls.shield} />
            <Meter refEl={speedRef} label="Speed" icon={spriteUrls.speed} />
          </div>
        )}

        {view === "title" && (
          <Title
            best={best}
            onStart={start}
            onScores={() => openBoard("title")}
            onHow={() => {
              setBackTo("title");
              setView("howto");
            }}
          />
        )}

        {view === "pause" && (
          <Panel
            kicker="Hold"
            title="Paused"
            onClose={togglePause}
            closeLabel="Resume"
            closeIcon={<Play className="size-4" />}
          >
            <div className="grid gap-2">
              <Ghost
                onClick={() => {
                  sfx.ui();
                  start();
                }}
              >
                <RotateCcw className="size-4" /> Restart
              </Ghost>
              <Ghost
                onClick={() => {
                  sfx.ui();
                  openBoard("pause");
                }}
              >
                <Trophy className="size-4" /> High scores
              </Ghost>
              <Ghost
                onClick={() => {
                  setBackTo("pause");
                  setView("howto");
                }}
              >
                How to fly
              </Ghost>
              <Ghost onClick={() => setMuted((m) => !m)}>
                {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                {muted ? "Sound off" : "Sound on"}
              </Ghost>
              <Ghost onClick={() => setShakeOn((s) => !s)}>
                <Vibrate className="size-4" />
                {shakeOn ? "Shake on" : "Shake off"}
              </Ghost>
            </div>
          </Panel>
        )}

        {view === "over" && result && (
          <Panel kicker="Hull lost" title="Patrol over">
            <p className="text-sm text-muted">
              Wave {result.wave} · <span className="text-primary">{result.score}</span> points
            </p>
            {result.listed && !saved ? (
              <form
                className="mt-4 grid gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveScore();
                }}
              >
                <label className="grid gap-1 text-sm text-muted">
                  Initials for the board
                  <input
                    value={name}
                    maxLength={3}
                    autoFocus
                    onChange={(e) => setName(e.target.value.toUpperCase())}
                    className="h-12 rounded-xl border border-border bg-surface-2 text-center font-display text-xl tracking-widest text-fg outline-none"
                  />
                </label>
                <button
                  type="submit"
                  className="h-12 rounded-xl bg-primary font-display text-sm tracking-widest text-primary-fg"
                >
                  Log score
                </button>
              </form>
            ) : (
              <p className="mt-3 text-sm text-muted">
                {saved ? "Logged on the board." : "Not a top score this time."}
              </p>
            )}
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                className="h-12 rounded-xl bg-primary font-display text-sm tracking-widest text-primary-fg"
                onClick={start}
              >
                Fly again
              </button>
              <Ghost
                onClick={() => {
                  openBoard("over");
                }}
              >
                <Trophy className="size-4" /> High scores
              </Ghost>
              <Ghost
                onClick={() => {
                  const sim = simRef.current;
                  if (sim) sim.mode = "title";
                  viewRef.current = "title";
                  setView("title");
                }}
              >
                Title
              </Ghost>
            </div>
          </Panel>
        )}

        {view === "scores" && (
          <Panel
            kicker="Local board"
            title="High scores"
            onClose={() => {
              viewRef.current = backTo;
              setView(backTo);
            }}
            closeLabel="Back"
          >
            <ScoreList scores={scores} />
          </Panel>
        )}

        {view === "howto" && (
          <Panel
            kicker="Flight manual"
            title="How to fly"
            onClose={() => {
              viewRef.current = backTo;
              setView(backTo);
            }}
            closeLabel="Back"
          >
            <HowTo />
          </Panel>
        )}

        {showHud && (
          <div className="touch-only pointer-events-none absolute inset-x-0 bottom-0 items-end justify-between p-4">
            <Joystick
              onChange={(x, y, active) => {
                const input = inputRef.current;
                input.joyX = x;
                input.joyY = y;
                input.joyActive = active;
              }}
            />
            <button
              type="button"
              className="pointer-events-auto flex h-16 w-16 flex-col items-center justify-center rounded-full border border-border bg-surface"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                inputRef.current.bombEdge = true;
                sfx.unlock();
              }}
              aria-label="Detonate pineapple"
            >
              <img src={spriteUrls.bomb} alt="" className="h-8 w-8 object-contain" />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function setBar(el: HTMLDivElement | null, amount: number) {
  if (!el) return;
  const meter = el.parentElement?.parentElement;
  if (meter) meter.style.display = amount > 0.01 ? "grid" : "none";
  el.style.width = `${Math.max(0, Math.min(1, amount)) * 100}%`;
}

function Meter({
  refEl,
  label,
  icon,
}: {
  refEl: React.RefObject<HTMLDivElement | null>;
  label: string;
  icon: string;
}) {
  return (
    <div className="grid gap-1" style={{ display: "none" }}>
      <div className="flex items-center gap-2 text-xs text-muted">
        <img src={icon} alt="" className="h-4 w-4 object-contain" />
        {label}
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-surface-2">
        <div ref={refEl} className="h-full w-0 bg-accent" />
      </div>
    </div>
  );
}

function Title({
  best,
  onStart,
  onScores,
  onHow,
}: {
  best: number;
  onStart: () => void;
  onScores: () => void;
  onHow: () => void;
}) {
  return (
    <div className="absolute inset-0 flex items-end p-4 sm:items-center sm:p-10">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-border bg-surface/90 p-6 backdrop-blur-md">
        <p className="font-display text-xs tracking-widest text-accent">ORCHARD FLEET</p>
        <img src={spriteUrls.player} alt="" className="bq-bob mt-3 h-24 w-auto sm:hidden" />
        <h2 className="mt-2 font-display text-4xl leading-none text-primary">BANANA QUADRANT</h2>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
          Saucer cruisers only. Ordinance is fruit — bananas out, berries in, pineapple when the
          screen gets rude.
        </p>
        <p className="mt-2 text-xs text-muted">Best patrol {best}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            className="h-12 rounded-xl bg-primary px-6 font-display text-sm tracking-widest text-primary-fg"
            onClick={onStart}
          >
            Start
          </button>
          <button
            type="button"
            className="h-12 rounded-xl border border-border px-4 text-sm text-fg"
            onClick={onScores}
          >
            High scores
          </button>
          <button
            type="button"
            className="h-12 rounded-xl border border-border px-4 text-sm text-fg"
            onClick={onHow}
          >
            How to fly
          </button>
        </div>
      </div>
      <img
        src={spriteUrls.player}
        alt=""
        className="bq-bob pointer-events-none absolute top-16 right-4 hidden w-40 sm:block"
      />
    </div>
  );
}

function Panel({
  kicker,
  title,
  children,
  onClose,
  closeLabel,
  closeIcon,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
  closeLabel?: string;
  closeIcon?: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      <div className="pointer-events-auto panel-scroll w-full max-w-md rounded-2xl border border-border bg-surface/95 p-6 backdrop-blur-md">
        <p className="font-display text-xs tracking-widest text-accent">{kicker}</p>
        <h2 className="mt-1 font-display text-2xl text-fg">{title}</h2>
        <div className="mt-4">{children}</div>
        {onClose && (
          <button
            type="button"
            className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-display text-sm tracking-widest text-primary-fg"
            onClick={onClose}
          >
            {closeIcon}
            {closeLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function Ghost({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      className="flex h-11 items-center gap-2 rounded-xl border border-border px-3 text-left text-sm text-fg"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ScoreList({ scores }: { scores: ScoreEntry[] }) {
  if (scores.length === 0) {
    return <p className="text-sm text-muted">No scores yet. Be the first captain on this ship.</p>;
  }
  return (
    <ol className="grid gap-2">
      {scores.map((s, i) => (
        <li
          key={`${s.at}-${s.name}-${i}`}
          className="flex items-center justify-between rounded-xl border border-border bg-surface-2 px-3 py-2"
        >
          <span className="font-display text-sm text-muted">{i + 1}</span>
          <span className="font-display tracking-widest text-fg">{s.name}</span>
          <span className="text-sm text-muted">W{s.wave}</span>
          <span className="font-display text-primary">{s.score}</span>
        </li>
      ))}
    </ol>
  );
}

function HowTo() {
  return (
    <div className="grid gap-3 text-sm leading-relaxed text-muted">
      <p>
        <span className="text-fg">Move</span> with WASD or arrows. A and left go left, D and right
        go right. On a phone, use the stick or drag the ship.
      </p>
      <p>
        <span className="text-fg">Aim</span> with the pointer. The cruiser faces the cursor and
        fires bananas on its own. Without a pointer, it tracks the nearest hostile.
      </p>
      <p>
        <span className="text-fg">Fruit</span> — banana volleys from you, berry shots and melon
        bombs from them. Catch a bunch for a spread, a lime for a shield, a mango for speed, a
        pineapple to clear the screen (F or the bomb button).
      </p>
      <p>
        <span className="text-fg">Pause</span> with Esc, P, or the pause button. Three lives. Scores
        stay on this device.
      </p>
    </div>
  );
}

function Joystick({ onChange }: { onChange: (x: number, y: number, active: boolean) => void }) {
  const base = useRef<HTMLDivElement | null>(null);
  const knobRef = useRef<HTMLSpanElement | null>(null);
  const active = useRef(false);

  function moveKnob(x: number, y: number) {
    const el = knobRef.current;
    if (el) el.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  }

  function setFrom(clientX: number, clientY: number) {
    const el = base.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let x = (clientX - cx) / (r.width * 0.38);
    let y = (clientY - cy) / (r.height * 0.38);
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    if (len < 0.18) {
      onChange(0, 0, true);
      moveKnob(0, 0);
      return;
    }
    onChange(x, y, true);
    moveKnob(x * 28, y * 28);
  }

  return (
    <div
      ref={base}
      className="pointer-events-auto relative h-28 w-28 rounded-full border border-border bg-surface/80"
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        active.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        sfx.unlock();
        setFrom(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (!active.current) return;
        setFrom(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        active.current = false;
        onChange(0, 0, false);
        moveKnob(0, 0);
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}
      aria-label="Move"
      role="application"
    >
      <span
        ref={knobRef}
        className="absolute top-1/2 left-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
      />
    </div>
  );
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      getX: () => number;
      getY: () => number;
      setKeys: (codes: string[]) => void;
      setSteer: (v: number) => void;
    };
  }
}
