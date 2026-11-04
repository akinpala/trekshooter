export type Mode = "title" | "play" | "pause" | "over";

export type Input = {
  codes: Set<string>;
  /** QA override. Null means use the real keyboard. */
  injected: string[] | null;
  pointerX: number;
  pointerY: number;
  pointerInside: boolean;
  pointerDown: boolean;
  pointerSeen: boolean;
  pointerType: string;
  joyX: number;
  joyY: number;
  joyActive: boolean;
  aimX: number;
  aimY: number;
  aimActive: boolean;
  bombEdge: boolean;
  /** +1 moves left, -1 moves right. QA steer probe. */
  steer: number;
  seek: boolean;
};

export type EnemyKind = "scout" | "raider" | "bomber" | "dread";
export type PickupKind = "multi" | "shield" | "speed" | "bomb";

type Enemy = {
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hp: number;
  maxHp: number;
  flash: number;
  fireCd: number;
  phase: number;
  originX: number;
  score: number;
  telegraph: number;
};

type Bullet = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  friendly: boolean;
  spin: number;
  rot: number;
  kind: "banana" | "berry";
};

type Melon = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  r: number;
};

type Pickup = {
  kind: PickupKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  bob: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  rot: number;
  spin: number;
  shape: "dot" | "peel";
};

type Floater = {
  x: number;
  y: number;
  text: string;
  life: number;
  max: number;
  color: string;
};

type Blast = {
  x: number;
  y: number;
  life: number;
  max: number;
  radius: number;
};

export type Player = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  aim: number;
  r: number;
  lives: number;
  invuln: number;
  fireCd: number;
  multiT: number;
  multiLevel: number;
  shieldT: number;
  shieldHp: number;
  speedT: number;
  bombs: number;
  flash: number;
  recoil: number;
  alive: boolean;
};

export type Sim = {
  w: number;
  h: number;
  mode: Mode;
  time: number;
  score: number;
  wave: number;
  banner: string;
  bannerT: number;
  queue: EnemyKind[];
  spawnT: number;
  combo: number;
  comboT: number;
  trauma: number;
  hitstop: number;
  shake: boolean;
  reduced: boolean;
  player: Player;
  enemies: Enemy[];
  bullets: Bullet[];
  melons: Melon[];
  pickups: Pickup[];
  particles: Particle[];
  texts: Floater[];
  blasts: Blast[];
  stars: { x: number; y: number; z: number; s: number; tw: number }[];
  events: string[];
  dying: number;
  acc: number;
  rng: number;
};

const MAX_PARTICLES = 240;

export function createInput(): Input {
  return {
    codes: new Set(),
    injected: null,
    pointerX: 0,
    pointerY: 0,
    pointerInside: false,
    pointerDown: false,
    pointerSeen: false,
    pointerType: "",
    joyX: 0,
    joyY: 0,
    joyActive: false,
    aimX: 0,
    aimY: 0,
    aimActive: false,
    bombEdge: false,
    steer: 0,
    seek: false,
  };
}

function rnd(sim: Sim) {
  sim.rng = (sim.rng * 16807 + 11) % 2147483647;
  return sim.rng / 2147483647;
}

function makePlayer(w: number, h: number): Player {
  return {
    x: w * 0.5,
    y: h * 0.78,
    vx: 0,
    vy: 0,
    aim: -Math.PI / 2,
    r: 16,
    lives: 3,
    invuln: 0,
    fireCd: 0,
    multiT: 0,
    multiLevel: 0,
    shieldT: 0,
    shieldHp: 0,
    speedT: 0,
    bombs: 0,
    flash: 0,
    recoil: 0,
    alive: true,
  };
}

export function createSim(w: number, h: number): Sim {
  const sim: Sim = {
    w,
    h,
    mode: "title",
    time: 0,
    score: 0,
    wave: 1,
    banner: "",
    bannerT: 0,
    queue: [],
    spawnT: 0,
    combo: 1,
    comboT: 0,
    trauma: 0,
    hitstop: 0,
    shake: true,
    reduced: false,
    player: makePlayer(w, h),
    enemies: [],
    bullets: [],
    melons: [],
    pickups: [],
    particles: [],
    texts: [],
    blasts: [],
    stars: [],
    events: [],
    dying: 0,
    acc: 0,
    rng: 4919,
  };
  seedStars(sim);
  return sim;
}

function seedStars(sim: Sim) {
  sim.stars = [];
  const count = 140;
  for (let i = 0; i < count; i++) {
    sim.stars.push({
      x: Math.random() * Math.max(sim.w, 1),
      y: Math.random() * Math.max(sim.h, 1),
      z: i % 3,
      s: 0.8 + (i % 5) * 0.35,
      tw: Math.random() * Math.PI * 2,
    });
  }
}

export function resizeSim(sim: Sim, w: number, h: number) {
  sim.w = Math.max(1, w);
  sim.h = Math.max(1, h);
  if (sim.stars.length === 0) seedStars(sim);
  clampPlayer(sim);
}

export function startRun(sim: Sim) {
  const w = sim.w;
  const h = sim.h;
  const shake = sim.shake;
  const reduced = sim.reduced;
  const stars = sim.stars;
  const rng = sim.rng;
  Object.assign(sim, createSim(w, h));
  sim.stars = stars.length ? stars : sim.stars;
  sim.shake = shake;
  sim.reduced = reduced;
  sim.rng = rng;
  sim.mode = "play";
  sim.player = makePlayer(w, h);
  sim.player.invuln = 0.6;
  beginWave(sim, 1);
}

function beginWave(sim: Sim, n: number) {
  sim.wave = n;
  sim.queue = planWave(n);
  sim.spawnT = 0.35;
  const dread = n % 5 === 0;
  sim.banner = dread ? `WAVE ${n}  ·  DREADNOUGHT` : `WAVE ${n}`;
  sim.bannerT = 1.5;
  sim.events.push("wave");
}

function planWave(n: number): EnemyKind[] {
  const list: EnemyKind[] = [];
  const scouts = 4 + n;
  const raiders = Math.max(0, n - 1);
  const bombers = n >= 3 ? Math.floor((n - 1) / 2) : 0;
  for (let i = 0; i < scouts; i++) list.push("scout");
  for (let i = 0; i < raiders; i++) list.push("raider");
  for (let i = 0; i < bombers; i++) list.push("bomber");
  if (n % 5 === 0) list.push("dread");
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = list[i]!;
    list[i] = list[j]!;
    list[j] = tmp;
  }
  if (n % 5 === 0) {
    const idx = list.indexOf("dread");
    if (idx > 0) {
      const [d] = list.splice(idx, 1);
      list.push(d!);
    }
  }
  return list;
}

function held(input: Input, code: string) {
  if (input.injected) return input.injected.includes(code);
  return input.codes.has(code);
}

function moveAxes(input: Input): { x: number; y: number } {
  let x = 0;
  let y = 0;
  if (held(input, "KeyA") || held(input, "ArrowLeft")) x -= 1;
  if (held(input, "KeyD") || held(input, "ArrowRight")) x += 1;
  if (held(input, "KeyW") || held(input, "ArrowUp")) y -= 1;
  if (held(input, "KeyS") || held(input, "ArrowDown")) y += 1;
  if (input.steer) x -= input.steer;
  if (input.joyActive) {
    x = input.joyX;
    y = input.joyY;
  }
  const len = Math.hypot(x, y);
  if (len > 1) {
    x /= len;
    y /= len;
  }
  return { x, y };
}

export function frame(sim: Sim, input: Input, dt: number) {
  sim.events.length = 0;
  const real = Math.min(0.05, Math.max(0, dt));
  if (sim.mode !== "play") {
    if (sim.mode !== "pause") driftStars(sim, real);
    return;
  }
  if (sim.hitstop > 0) {
    sim.hitstop = Math.max(0, sim.hitstop - real);
    sim.player.flash = Math.max(0, sim.player.flash - real);
    for (const e of sim.enemies) e.flash = Math.max(0, e.flash - real);
    return;
  }
  sim.acc += real;
  const step = 1 / 60;
  let guard = 0;
  while (sim.acc >= step && guard < 5) {
    tick(sim, input, step);
    sim.acc -= step;
    guard++;
  }
  if (sim.acc > step) sim.acc = 0;
  input.bombEdge = false;
}

function tick(sim: Sim, input: Input, dt: number) {
  sim.time += dt;
  const p = sim.player;

  if (sim.dying > 0) {
    sim.dying -= dt;
    stepWorld(sim, dt, false);
    if (sim.dying <= 0) sim.mode = "over";
    return;
  }

  if (!p.alive) return;

  p.invuln = Math.max(0, p.invuln - dt);
  p.fireCd = Math.max(0, p.fireCd - dt);
  p.flash = Math.max(0, p.flash - dt);
  p.recoil = Math.max(0, p.recoil - dt);
  if (p.multiT > 0) {
    p.multiT -= dt;
    if (p.multiT <= 0) p.multiLevel = 0;
  }
  if (p.shieldT > 0) {
    p.shieldT -= dt;
    if (p.shieldT <= 0) p.shieldHp = 0;
  }
  p.speedT = Math.max(0, p.speedT - dt);
  if (sim.comboT > 0) {
    sim.comboT -= dt;
    if (sim.comboT <= 0) sim.combo = 1;
  }
  if (sim.bannerT > 0) sim.bannerT -= dt;

  const axes = moveAxes(input);
  const keyboard = Math.abs(axes.x) + Math.abs(axes.y) > 0.01;
  let ix = axes.x;
  let iy = axes.y;
  if (!keyboard && input.seek && input.pointerDown && !input.injected && !input.joyActive) {
    const dx = input.pointerX - p.x;
    const dy = input.pointerY - p.y;
    const d = Math.hypot(dx, dy);
    if (d > 14) {
      ix = dx / d;
      iy = dy / d;
    }
  }

  const maxSp = p.speedT > 0 ? 470 : 310;
  const accel = p.speedT > 0 ? 2100 : 1500;
  if (Math.abs(ix) + Math.abs(iy) > 0.01) {
    p.vx += ix * accel * dt;
    p.vy += iy * accel * dt;
    const sp = Math.hypot(p.vx, p.vy);
    if (sp > maxSp) {
      p.vx = (p.vx / sp) * maxSp;
      p.vy = (p.vy / sp) * maxSp;
    }
  } else {
    const damp = Math.exp(-8 * dt);
    p.vx *= damp;
    p.vy *= damp;
  }
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  clampPlayer(sim);

  const want = desiredAim(sim, input);
  let diff = want - p.aim;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  p.aim += diff * (1 - Math.exp(-16 * dt));

  const firing = p.alive && sim.dying <= 0;
  if (firing && p.fireCd <= 0) {
    fireBananas(sim);
    p.fireCd = p.multiLevel > 0 ? 0.13 : 0.15;
  }

  if (input.bombEdge) {
    input.bombEdge = false;
    detonate(sim);
  }
  if (edgeWas(input, "KeyF") || edgeWas(input, "KeyQ")) detonate(sim);

  if (p.speedT > 0 && sim.time % 0.05 < dt) {
    burst(sim, p.x, p.y, 1, "#3ec8e8", 40, 0.25, "dot");
  }

  stepWorld(sim, dt, true);
  trySpawn(sim, dt);
  maybeClearWave(sim);
}

const edgeState = { f: false, q: false };

function edgeWas(input: Input, code: string) {
  const down = held(input, code);
  if (code === "KeyF") {
    const edge = down && !edgeState.f;
    edgeState.f = down;
    return edge;
  }
  const edge = down && !edgeState.q;
  edgeState.q = down;
  return edge;
}

function desiredAim(sim: Sim, input: Input): number {
  if (input.injected) return -Math.PI / 2;
  if (input.aimActive) {
    const m = Math.hypot(input.aimX, input.aimY);
    if (m > 0.22) return Math.atan2(input.aimY, input.aimX);
  }
  const mouseAim = input.pointerSeen && input.pointerType !== "touch";
  const touchAim = input.pointerSeen && input.pointerDown && input.pointerType === "touch";
  if (mouseAim || touchAim) {
    return Math.atan2(input.pointerY - sim.player.y, input.pointerX - sim.player.x);
  }
  let best: Enemy | null = null;
  let bestD = 480 * 480;
  for (const e of sim.enemies) {
    const dx = e.x - sim.player.x;
    const dy = e.y - sim.player.y;
    const d = dx * dx + dy * dy;
    if (d < bestD) {
      bestD = d;
      best = e;
    }
  }
  if (best) return Math.atan2(best.y - sim.player.y, best.x - sim.player.x);
  return -Math.PI / 2;
}

function fireBananas(sim: Sim) {
  const p = sim.player;
  const level = p.multiLevel;
  const spreads = level >= 2 ? [-0.34, -0.17, 0, 0.17, 0.34] : level >= 1 ? [-0.18, 0, 0.18] : [0];
  const nose = 40;
  const ox = Math.cos(p.aim) * nose;
  const oy = Math.sin(p.aim) * nose;
  for (const s of spreads) {
    const a = p.aim + s;
    const speed = 700;
    sim.bullets.push({
      x: p.x + ox,
      y: p.y + oy,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed,
      r: 9,
      life: 1.15,
      friendly: true,
      spin: (Math.random() > 0.5 ? 1 : -1) * (7 + Math.random() * 4),
      rot: a + Math.PI / 2,
      kind: "banana",
    });
  }
  p.flash = 0.055;
  p.recoil = 0.06;
  sim.events.push("shoot");
  const back = p.aim + Math.PI;
  burst(
    sim,
    p.x + ox,
    p.y + oy,
    5,
    "#f0c14b",
    160,
    0.22,
    "peel",
  );
  burst(sim, p.x + Math.cos(back) * 8, p.y + Math.sin(back) * 8, 2, "#fff6d0", 80, 0.08, "dot");
}

function detonate(sim: Sim) {
  const p = sim.player;
  if (!p.alive || p.bombs <= 0 || sim.dying > 0) return;
  p.bombs -= 1;
  const radius = Math.max(sim.w, sim.h) * 0.72;
  sim.blasts.push({ x: p.x, y: p.y, life: 0.45, max: 0.45, radius });
  const victims = [...sim.enemies];
  for (const e of victims) {
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d < radius * 0.85) damageEnemy(sim, e, 8, true);
  }
  sim.bullets = sim.bullets.filter((b) => b.friendly);
  sim.melons = [];
  sim.trauma = Math.min(1, sim.trauma + 0.75);
  sim.hitstop = sim.reduced ? 0 : 0.05;
  sim.events.push("bomb");
  burst(sim, p.x, p.y, 28, "#e23d6a", 420, 0.5, "dot");
  burst(sim, p.x, p.y, 18, "#f0c14b", 360, 0.45, "peel");
  burst(sim, p.x, p.y, 12, "#7dff6a", 300, 0.4, "dot");
}

function clampPlayer(sim: Sim) {
  const m = 28;
  const p = sim.player;
  p.x = Math.max(m, Math.min(sim.w - m, p.x));
  p.y = Math.max(m, Math.min(sim.h - m, p.y));
}

function stepWorld(sim: Sim, dt: number, live: boolean) {
  driftStars(sim, dt);
  const p = sim.player;

  for (let i = sim.enemies.length - 1; i >= 0; i--) {
    const e = sim.enemies[i]!;
    e.flash = Math.max(0, e.flash - dt);
    e.telegraph = Math.max(0, e.telegraph - dt);
    if (live && p.alive) steerEnemy(sim, e, dt);
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    if (e.y > sim.h + 80 || e.x < -120 || e.x > sim.w + 120 || e.y < -160) {
      sim.enemies.splice(i, 1);
      continue;
    }
    if (live && p.alive && e.fireCd <= 0 && e.telegraph <= 0) {
      considerFire(sim, e);
    } else if (live) {
      e.fireCd = Math.max(0, e.fireCd - dt);
    }
  }
  if (live) separateEnemies(sim);

  for (let i = sim.bullets.length - 1; i >= 0; i--) {
    const b = sim.bullets[i]!;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    b.rot += b.spin * dt;
    if (b.life <= 0 || b.x < -40 || b.y < -40 || b.x > sim.w + 40 || b.y > sim.h + 40) {
      sim.bullets.splice(i, 1);
      continue;
    }
    if (!live || !p.alive) continue;
    if (b.friendly) {
      for (const e of sim.enemies) {
        if (Math.hypot(e.x - b.x, e.y - b.y) < e.r + b.r) {
          damageEnemy(sim, e, 1, false);
          sim.bullets.splice(i, 1);
          burst(sim, b.x, b.y, 4, "#f0c14b", 120, 0.2, "peel");
          break;
        }
      }
    } else if (p.invuln <= 0 && Math.hypot(p.x - b.x, p.y - b.y) < p.r + b.r) {
      hurtPlayer(sim);
      sim.bullets.splice(i, 1);
    }
  }

  for (let i = sim.melons.length - 1; i >= 0; i--) {
    const m = sim.melons[i]!;
    m.x += m.vx * dt;
    m.y += m.vy * dt;
    m.vx *= Math.exp(-0.6 * dt);
    m.vy *= Math.exp(-0.6 * dt);
    m.life -= dt;
    const near = p.alive && Math.hypot(p.x - m.x, p.y - m.y) < 36;
    if (m.life <= 0 || near) {
      explodeMelon(sim, m);
      sim.melons.splice(i, 1);
    }
  }

  for (let i = sim.pickups.length - 1; i >= 0; i--) {
    const u = sim.pickups[i]!;
    u.life -= dt;
    u.bob += dt;
    if (live && p.alive) {
      const dx = p.x - u.x;
      const dy = p.y - u.y;
      const d = Math.hypot(dx, dy);
      if (d < 120 && d > 0.1) {
        u.vx += (dx / d) * 420 * dt;
        u.vy += (dy / d) * 420 * dt;
      }
      u.x += u.vx * dt;
      u.y += u.vy * dt;
      if (d < p.r + u.r) {
        applyPickup(sim, u.kind);
        sim.pickups.splice(i, 1);
        continue;
      }
    }
    if (u.life <= 0) sim.pickups.splice(i, 1);
  }

  for (let i = sim.particles.length - 1; i >= 0; i--) {
    const q = sim.particles[i]!;
    q.life -= dt;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    q.vx *= Math.exp(-1.5 * dt);
    q.vy *= Math.exp(-1.5 * dt);
    q.rot += q.spin * dt;
    if (q.life <= 0) sim.particles.splice(i, 1);
  }
  for (let i = sim.texts.length - 1; i >= 0; i--) {
    const t = sim.texts[i]!;
    t.life -= dt;
    t.y -= 28 * dt;
    if (t.life <= 0) sim.texts.splice(i, 1);
  }
  for (let i = sim.blasts.length - 1; i >= 0; i--) {
    const b = sim.blasts[i]!;
    b.life -= dt;
    if (b.life <= 0) sim.blasts.splice(i, 1);
  }

  sim.trauma = Math.max(0, sim.trauma - dt * 1.7);
}

function steerEnemy(sim: Sim, e: Enemy, dt: number) {
  const p = sim.player;
  const k = 1 - Math.exp(-3.2 * dt);
  if (e.kind === "scout") {
    e.vx = Math.cos(sim.time * 2.3 + e.phase) * 130;
    e.vy += (105 + sim.wave * 4 - e.vy) * k;
    return;
  }
  if (e.kind === "bomber") {
    const dx = p.x - e.x;
    e.vx += (Math.max(-1, Math.min(1, dx / 180)) * 70 - e.vx) * k;
    e.vy += (62 - e.vy) * k;
    return;
  }
  if (e.kind === "dread") {
    const dx = sim.w * 0.5 - e.x;
    e.vx += (Math.max(-1, Math.min(1, dx / 80)) * 40 - e.vx) * k;
    const targetY = sim.h * 0.22;
    e.vy += ((e.y < targetY ? 36 : 0) - e.vy) * k;
    return;
  }
  const dx = p.x - e.x;
  const dy = p.y - e.y;
  const d = Math.hypot(dx, dy) || 1;
  const desired = d > 230 ? 1 : d < 150 ? -0.45 : 0.05;
  const strafe = Math.cos(sim.time * 1.4 + e.phase);
  e.vx += ((dx / d) * desired * 150 + strafe * 80 - e.vx) * k;
  e.vy += ((dy / d) * desired * 150 - e.vy) * k;
}

function separateEnemies(sim: Sim) {
  const list = sim.enemies;
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i]!;
      const b = list[j]!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 0.001;
      const min = a.r + b.r + 8;
      if (d < min) {
        const push = ((min - d) / d) * 0.5;
        a.x -= dx * push;
        a.y -= dy * push;
        b.x += dx * push;
        b.y += dy * push;
      }
    }
  }
}

function considerFire(sim: Sim, e: Enemy) {
  const p = sim.player;
  const dx = p.x - e.x;
  const dy = p.y - e.y;
  const d = Math.hypot(dx, dy);
  if (e.kind === "scout") {
    if (d < 520 && dy > -20) {
      e.fireCd = Math.max(0.85, 1.45 - sim.wave * 0.04);
      shootBerry(sim, e, Math.atan2(dy, dx), 250);
    }
    return;
  }
  if (e.kind === "raider") {
    if (d < 640) {
      e.fireCd = Math.max(0.7, 1.2 - sim.wave * 0.035);
      shootBerry(sim, e, Math.atan2(dy, dx), 290);
    }
    return;
  }
  if (e.kind === "bomber") {
    if (e.y > 30 && e.y < sim.h * 0.72) {
      e.fireCd = 2.1;
      const ang = Math.atan2(dy, dx);
      sim.melons.push({
        x: e.x,
        y: e.y + e.r,
        vx: Math.cos(ang) * 90,
        vy: Math.max(40, Math.sin(ang) * 90),
        life: 1.25,
        max: 1.25,
        r: 14,
      });
    }
    return;
  }
  if (d < 760) {
    e.fireCd = 0.85;
    const base = Math.atan2(dy, dx);
    for (const s of [-0.28, 0, 0.28]) shootBerry(sim, e, base + s, 270);
  }
}

function shootBerry(sim: Sim, e: Enemy, ang: number, speed: number) {
  e.telegraph = 0.12;
  sim.bullets.push({
    x: e.x + Math.cos(ang) * (e.r + 4),
    y: e.y + Math.sin(ang) * (e.r + 4),
    vx: Math.cos(ang) * speed,
    vy: Math.sin(ang) * speed,
    r: 8,
    life: 3.2,
    friendly: false,
    spin: 2,
    rot: 0,
    kind: "berry",
  });
}

function explodeMelon(sim: Sim, m: Melon) {
  sim.blasts.push({ x: m.x, y: m.y, life: 0.32, max: 0.32, radius: 78 });
  sim.events.push("explode");
  sim.trauma = Math.min(1, sim.trauma + 0.35);
  burst(sim, m.x, m.y, 10, "#7dff6a", 180, 0.35, "dot");
  burst(sim, m.x, m.y, 6, "#e23d6a", 140, 0.3, "dot");
  const p = sim.player;
  if (p.alive && p.invuln <= 0 && Math.hypot(p.x - m.x, p.y - m.y) < p.r + 48) hurtPlayer(sim);
  for (const e of [...sim.enemies]) {
    if (Math.hypot(e.x - m.x, e.y - m.y) < e.r + 56) damageEnemy(sim, e, 2, false);
  }
}

function damageEnemy(sim: Sim, e: Enemy, dmg: number, silent: boolean) {
  if (e.hp <= 0) return;
  e.hp -= dmg;
  e.flash = 0.08;
  if (!silent) {
    sim.hitstop = sim.reduced ? 0 : 0.028;
    sim.events.push("hit");
  }
  if (e.hp <= 0) killEnemy(sim, e);
}

function killEnemy(sim: Sim, e: Enemy) {
  e.hp = 0;
  const idx = sim.enemies.indexOf(e);
  if (idx >= 0) sim.enemies.splice(idx, 1);
  if (sim.comboT > 0) sim.combo = Math.min(8, sim.combo + 1);
  else sim.combo = 1;
  sim.comboT = 2;
  const gained = e.score * sim.combo;
  sim.score += gained;
  sim.texts.push({
    x: e.x,
    y: e.y,
    text: `+${gained}`,
    life: 0.7,
    max: 0.7,
    color: sim.combo > 1 ? "#3ec8e8" : "#f0c14b",
  });
  if (sim.combo > 1) {
    sim.texts.push({
      x: e.x,
      y: e.y - 16,
      text: `x${sim.combo}`,
      life: 0.7,
      max: 0.7,
      color: "#e7eef8",
    });
  }
  sim.trauma = Math.min(1, sim.trauma + (e.kind === "dread" ? 0.7 : 0.22));
  sim.hitstop = sim.reduced ? 0 : e.kind === "dread" ? 0.09 : 0.04;
  sim.events.push(e.kind === "dread" || e.kind === "bomber" ? "explode" : "kill");
  const color = e.kind === "scout" ? "#3ec8e8" : e.kind === "dread" ? "#e23d6a" : "#d7c4a1";
  burst(sim, e.x, e.y, e.kind === "dread" ? 22 : 10, color, 240, 0.45, "dot");
  burst(sim, e.x, e.y, 6, "#f0c14b", 180, 0.35, "peel");
  if (Math.random() < (e.kind === "dread" ? 1 : 0.26)) dropPickup(sim, e.x, e.y);
}

function dropPickup(sim: Sim, x: number, y: number) {
  const roll = rnd(sim);
  const kind: PickupKind = roll < 0.32 ? "multi" : roll < 0.58 ? "shield" : roll < 0.82 ? "speed" : "bomb";
  sim.pickups.push({
    kind,
    x,
    y,
    vx: (rnd(sim) - 0.5) * 40,
    vy: 20 + rnd(sim) * 30,
    r: 16,
    life: 9,
    bob: rnd(sim) * 6,
  });
}

function applyPickup(sim: Sim, kind: PickupKind) {
  const p = sim.player;
  sim.events.push("pickup");
  sim.texts.push({
    x: p.x,
    y: p.y - 28,
    text: kind === "multi" ? "MULTI BANANA" : kind === "shield" ? "LIME SHIELD" : kind === "speed" ? "MANGO BOOST" : "PINEAPPLE",
    life: 0.9,
    max: 0.9,
    color: "#e7eef8",
  });
  if (kind === "multi") {
    p.multiLevel = Math.min(2, p.multiLevel + 1);
    p.multiT = 14;
  } else if (kind === "shield") {
    p.shieldT = 12;
    p.shieldHp = 3;
  } else if (kind === "speed") {
    p.speedT = 10;
  } else {
    p.bombs = Math.min(3, p.bombs + 1);
  }
}

function hurtPlayer(sim: Sim) {
  const p = sim.player;
  if (!p.alive || p.invuln > 0) return;
  if (p.shieldHp > 0) {
    p.shieldHp -= 1;
    p.invuln = 0.28;
    if (p.shieldHp <= 0) p.shieldT = 0;
    sim.trauma = Math.min(1, sim.trauma + 0.28);
    sim.events.push("hit");
    burst(sim, p.x, p.y, 8, "#3ec8e8", 160, 0.3, "dot");
    return;
  }
  p.lives -= 1;
  p.invuln = 1.7;
  p.vx *= 0.15;
  p.vy *= 0.15;
  sim.combo = 1;
  sim.comboT = 0;
  sim.trauma = Math.min(1, sim.trauma + 0.8);
  sim.hitstop = sim.reduced ? 0 : 0.08;
  sim.events.push("hurt");
  burst(sim, p.x, p.y, 16, "#e23d6a", 280, 0.45, "dot");
  burst(sim, p.x, p.y, 8, "#f0c14b", 200, 0.4, "peel");
  if (p.lives <= 0) {
    p.alive = false;
    sim.dying = 0.85;
    sim.events.push("explode");
  }
}

function trySpawn(sim: Sim, dt: number) {
  if (sim.bannerT > 0.4 || sim.queue.length === 0) return;
  sim.spawnT -= dt;
  if (sim.spawnT > 0) return;
  const kind = sim.queue.shift()!;
  spawnEnemy(sim, kind);
  const pace = Math.max(0.28, 0.62 - sim.wave * 0.03);
  sim.spawnT = kind === "dread" ? 0.2 : pace;
}

function spawnEnemy(sim: Sim, kind: EnemyKind) {
  const margin = 46;
  const x = margin + rnd(sim) * Math.max(10, sim.w - margin * 2);
  const base = {
    x,
    y: kind === "dread" ? -70 : -36,
    vx: 0,
    vy: 40,
    flash: 0,
    telegraph: 0,
    phase: rnd(sim) * Math.PI * 2,
    originX: x,
  };
  if (kind === "scout") {
    sim.enemies.push({ ...base, kind, r: 16, hp: 1, maxHp: 1, fireCd: 0.8 + rnd(sim), score: 100 });
  } else if (kind === "raider") {
    const hp = 3;
    sim.enemies.push({ ...base, kind, r: 24, hp, maxHp: hp, fireCd: 0.6, score: 180 });
  } else if (kind === "bomber") {
    const hp = 4;
    sim.enemies.push({ ...base, kind, r: 28, hp, maxHp: hp, fireCd: 1.2, score: 260 });
  } else {
    const hp = 16 + sim.wave;
    sim.enemies.push({
      ...base,
      x: sim.w * 0.5,
      originX: sim.w * 0.5,
      kind,
      r: 42,
      hp,
      maxHp: hp,
      fireCd: 1.1,
      score: 900,
    });
  }
}

function maybeClearWave(sim: Sim) {
  if (sim.queue.length > 0 || sim.enemies.length > 0 || sim.dying > 0) return;
  if (sim.bannerT > 0) return;
  sim.score += 200 * sim.wave;
  sim.texts.push({
    x: sim.w * 0.5,
    y: sim.h * 0.4,
    text: `WAVE CLEAR +${200 * sim.wave}`,
    life: 1.2,
    max: 1.2,
    color: "#f0c14b",
  });
  beginWave(sim, sim.wave + 1);
}

function burst(
  sim: Sim,
  x: number,
  y: number,
  n: number,
  color: string,
  speed: number,
  life: number,
  shape: Particle["shape"],
) {
  for (let i = 0; i < n; i++) {
    if (sim.particles.length >= MAX_PARTICLES) sim.particles.shift();
    const a = rnd(sim) * Math.PI * 2;
    const s = speed * (0.35 + rnd(sim) * 0.75);
    sim.particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: life * (0.6 + rnd(sim) * 0.5),
      max: life,
      size: shape === "peel" ? 3 + rnd(sim) * 3 : 1.5 + rnd(sim) * 2.4,
      color,
      rot: rnd(sim) * 6,
      spin: (rnd(sim) - 0.5) * 10,
      shape,
    });
  }
}

function driftStars(sim: Sim, dt: number) {
  const speeds = [18, 46, 98];
  for (const s of sim.stars) {
    s.y += (speeds[s.z] ?? 40) * dt;
    s.tw += dt * (0.8 + s.z);
    if (s.y > sim.h + 4) {
      s.y = -4;
      s.x = Math.random() * sim.w;
    }
  }
}

export function shakeOffset(sim: Sim): { x: number; y: number; rot: number } {
  if (!sim.shake || sim.reduced) return { x: 0, y: 0, rot: 0 };
  const mag = sim.trauma * sim.trauma;
  if (mag < 0.001) return { x: 0, y: 0, rot: 0 };
  const t = sim.time * 40;
  return {
    x: Math.sin(t * 1.7) * 12 * mag,
    y: Math.cos(t * 2.3) * 10 * mag,
    rot: Math.sin(t * 1.3) * 0.02 * mag,
  };
}

export type DrawEnemy = Enemy;
export type DrawBullet = Bullet;
export type DrawMelon = Melon;
export type DrawPickup = Pickup;
export type DrawParticle = Particle;
export type DrawFloater = Floater;
export type DrawBlast = Blast;

export function readEnemies(sim: Sim) {
  return sim.enemies;
}
export function readBullets(sim: Sim) {
  return sim.bullets;
}
export function readMelons(sim: Sim) {
  return sim.melons;
}
export function readPickups(sim: Sim) {
  return sim.pickups;
}
export function readParticles(sim: Sim) {
  return sim.particles;
}
export function readTexts(sim: Sim) {
  return sim.texts;
}
export function readBlasts(sim: Sim) {
  return sim.blasts;
}
