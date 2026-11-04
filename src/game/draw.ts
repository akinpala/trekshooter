import type { SpriteSet } from "./assets";
import { shakeOffset, type Sim } from "./sim";

const HEIGHT: Record<string, number> = {
  scout: 62,
  raider: 96,
  bomber: 108,
  dread: 154,
  player: 92,
};

export function render(ctx: CanvasRenderingContext2D, sim: Sim, sprites: SpriteSet | null) {
  const { w, h } = sim;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#070b14";
  ctx.fillRect(0, 0, w, h);

  const shake = shakeOffset(sim);
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(shake.rot);
  ctx.translate(-w / 2 + shake.x, -h / 2 + shake.y);

  drawStars(ctx, sim);
  drawNebula(ctx, sim);
  if (sprites) {
    for (const b of sim.blasts) drawBlast(ctx, b);
    for (const u of sim.pickups) drawPickup(ctx, sim, sprites, u);
    for (const m of sim.melons) drawMelon(ctx, sprites, m);
    for (const b of sim.bullets) drawBullet(ctx, sprites, b);
    for (const q of sim.particles) drawParticle(ctx, q);
    for (const e of sim.enemies) drawEnemy(ctx, sprites, e, sim);
    if (sim.mode !== "title" && sim.player.alive) drawPlayer(ctx, sim, sprites);
    for (const t of sim.texts) drawText(ctx, t);
    if (sim.bannerT > 0 && sim.mode === "play") drawBanner(ctx, sim);
  }

  ctx.restore();
  drawVignette(ctx, w, h);
}

function drawStars(ctx: CanvasRenderingContext2D, sim: Sim) {
  const focusX = sim.player.x - sim.w / 2;
  for (const s of sim.stars) {
    const factor = 0.015 + s.z * 0.03;
    let x = s.x - focusX * factor;
    x = ((x % sim.w) + sim.w) % sim.w;
    const alpha = (0.35 + s.z * 0.22) * (0.65 + Math.sin(s.tw) * 0.35);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = s.z === 2 && s.s > 1.8 ? "#f0c14b" : s.z === 0 ? "#9fb4d4" : "#e7eef8";
    ctx.fillRect(x, s.y, s.s, s.s);
  }
  ctx.globalAlpha = 1;
}

function drawNebula(ctx: CanvasRenderingContext2D, sim: Sim) {
  const t = sim.time;
  const g1 = ctx.createRadialGradient(
    sim.w * 0.2 + Math.sin(t * 0.05) * 20,
    sim.h * 0.3,
    10,
    sim.w * 0.2,
    sim.h * 0.3,
    sim.w * 0.45,
  );
  g1.addColorStop(0, "rgba(62, 200, 232, 0.08)");
  g1.addColorStop(1, "rgba(62, 200, 232, 0)");
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, sim.w, sim.h);
  const g2 = ctx.createRadialGradient(sim.w * 0.8, sim.h * 0.7, 10, sim.w * 0.75, sim.h * 0.75, sim.w * 0.4);
  g2.addColorStop(0, "rgba(226, 61, 106, 0.05)");
  g2.addColorStop(1, "rgba(226, 61, 106, 0)");
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, sim.w, sim.h);
}

function drawSprite(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  aim: number,
  height: number,
  alpha = 1,
) {
  const w = height * (img.width / Math.max(1, img.height));
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(aim + Math.PI / 2);
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, -w / 2, -hSafe(height) / 2, w, height);
  ctx.restore();
}

function hSafe(h: number) {
  return h;
}

function drawPlayer(ctx: CanvasRenderingContext2D, sim: Sim, sprites: SpriteSet) {
  const p = sim.player;
  const blink = p.invuln > 0 && Math.floor(sim.time * 14) % 2 === 0;
  const alpha = blink ? 0.4 : 1;
  const kick = p.recoil * 12;
  const x = p.x - Math.cos(p.aim) * kick;
  const y = p.y - Math.sin(p.aim) * kick;
  drawEngines(ctx, x, y, p.aim, p.speedT > 0);
  drawSprite(ctx, sprites.player, x, y, p.aim, HEIGHT.player, alpha);
  if (p.flash > 0) drawMuzzle(ctx, x, y, p.aim, p.flash / 0.055);
  if (p.shieldHp > 0) {
    ctx.save();
    ctx.strokeStyle = "rgba(62, 200, 232, 0.85)";
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.45 + Math.sin(sim.time * 6) * 0.15;
    ctx.beginPath();
    ctx.arc(x, y, 36, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawEngines(ctx: CanvasRenderingContext2D, x: number, y: number, aim: number, boost: boolean) {
  const rot = aim + Math.PI / 2;
  const spots = [
    [-16, 26],
    [16, 26],
  ];
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const [lx, ly] of spots) {
    const wx = x + Math.cos(rot) * lx - Math.sin(rot) * ly;
    const wy = y + Math.sin(rot) * lx + Math.cos(rot) * ly;
    const g = ctx.createRadialGradient(wx, wy, 0, wx, wy, boost ? 16 : 10);
    g.addColorStop(0, "rgba(190, 250, 255, 0.9)");
    g.addColorStop(1, "rgba(62, 200, 232, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(wx, wy, boost ? 16 : 10, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawMuzzle(ctx: CanvasRenderingContext2D, x: number, y: number, aim: number, a: number) {
  const nose = 48;
  const nx = x + Math.cos(aim) * nose;
  const ny = y + Math.sin(aim) * nose;
  ctx.save();
  ctx.translate(nx, ny);
  ctx.rotate(aim);
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = Math.max(0, Math.min(1, a));
  ctx.fillStyle = "#fff8dc";
  ctx.beginPath();
  ctx.ellipse(0, 0, 8 + 10 * a, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f0c14b";
  ctx.beginPath();
  ctx.ellipse(10, 0, 18 * a + 6, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawEnemy(
  ctx: CanvasRenderingContext2D,
  sprites: SpriteSet,
  e: Sim["enemies"][number],
  sim: Sim,
) {
  const ang = Math.atan2(e.vy, e.vx) || Math.PI / 2;
  const img = e.kind === "scout" ? sprites.scout : e.kind === "raider" ? sprites.raider : sprites.dread;
  const h = HEIGHT[e.kind] ?? 90;
  if (e.flash > 0) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    drawSprite(ctx, img, e.x, e.y, ang, h, 0.85);
    ctx.restore();
  }
  drawSprite(ctx, img, e.x, e.y, ang, h, 1);
  if (e.fireCd > 0 && e.fireCd < 0.22) {
    ctx.save();
    ctx.fillStyle = "#e23d6a";
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(e.x + Math.cos(ang) * (e.r + 6), e.y + Math.sin(ang) * (e.r + 6), 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  if (e.maxHp > 1) {
    const w = 36;
    const k = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = "rgba(7, 11, 20, 0.7)";
    ctx.fillRect(e.x - w / 2, e.y - h * 0.5 - 8, w, 3);
    ctx.fillStyle = e.kind === "dread" ? "#e23d6a" : "#f0c14b";
    ctx.fillRect(e.x - w / 2, e.y - h * 0.5 - 8, w * k, 3);
  }
  void sim;
}

function drawBullet(ctx: CanvasRenderingContext2D, sprites: SpriteSet, b: Sim["bullets"][number]) {
  if (b.kind === "banana") {
    const ang = Math.atan2(b.vy, b.vx);
    drawSprite(ctx, sprites.banana, b.x, b.y, ang + Math.sin(b.rot) * 0.15, 30, 1);
  } else {
    drawSprite(ctx, sprites.berry, b.x, b.y, b.rot, 20, 1);
  }
}

function drawMelon(ctx: CanvasRenderingContext2D, sprites: SpriteSet, m: Sim["melons"][number]) {
  const pulse = m.life < 0.4 ? 1 + (0.4 - m.life) * 0.8 : 1;
  drawSprite(ctx, sprites.melon, m.x, m.y, -Math.PI / 2, 36 * pulse, 1);
}

function drawPickup(
  ctx: CanvasRenderingContext2D,
  sim: Sim,
  sprites: SpriteSet,
  u: Sim["pickups"][number],
) {
  const img =
    u.kind === "multi" ? sprites.multi : u.kind === "shield" ? sprites.shield : u.kind === "speed" ? sprites.speed : sprites.bomb;
  const y = u.y + Math.sin(sim.time * 3 + u.bob) * 4;
  const fade = u.life < 2 ? 0.45 + Math.sin(sim.time * 16) * 0.35 : 1;
  drawSprite(ctx, img, u.x, y, -Math.PI / 2 + Math.sin(sim.time + u.bob) * 0.2, 40, fade);
}

function drawParticle(ctx: CanvasRenderingContext2D, q: Sim["particles"][number]) {
  const a = Math.max(0, q.life / q.max);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(q.x, q.y);
  ctx.rotate(q.rot);
  ctx.fillStyle = q.color;
  if (q.shape === "peel") {
    ctx.fillRect(-q.size, -q.size * 0.35, q.size * 2, q.size * 0.7);
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, q.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBlast(ctx: CanvasRenderingContext2D, b: Sim["blasts"][number]) {
  const k = 1 - b.life / b.max;
  ctx.save();
  ctx.globalAlpha = (1 - k) * 0.65;
  ctx.strokeStyle = k > 0.35 ? "#f0c14b" : "#e23d6a";
  ctx.lineWidth = 3;
  const span = b.radius > 240 ? b.radius * 0.55 : b.radius;
  ctx.beginPath();
  ctx.arc(b.x, b.y, 10 + span * k, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawText(ctx: CanvasRenderingContext2D, t: Sim["texts"][number]) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, t.life / t.max);
  ctx.fillStyle = t.color;
  ctx.font = "600 14px Sora, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(t.text, t.x, t.y);
  ctx.restore();
}

function drawBanner(ctx: CanvasRenderingContext2D, sim: Sim) {
  const a = Math.min(1, sim.bannerT) * Math.min(1, (1.5 - sim.bannerT) * 4 + 0.2);
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, a));
  ctx.fillStyle = "#f0c14b";
  ctx.font = "700 28px Orbitron, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(sim.banner, sim.w / 2, sim.h * 0.38);
  ctx.restore();
}

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.72);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.45)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}
