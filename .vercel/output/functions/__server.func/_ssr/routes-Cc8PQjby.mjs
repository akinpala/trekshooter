import { i as __toESM } from "../_runtime.mjs";
import { K as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as Pause, i as Trophy, n as Volume2, o as RotateCcw, r as Vibrate, s as Play, t as VolumeX } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-Cc8PQjby.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var spriteUrls = {
	player: "/assets/player-DvmG08aN.png",
	raider: "/assets/raider-B1W9hflc.png",
	scout: "/assets/scout-BllHlllP.png",
	dread: "/assets/dread-gxQ3yfs1.png",
	banana: "/assets/banana-CQQhgWHu.png",
	berry: "/assets/berry-yrTrO57W.png",
	melon: "/assets/melon-1XTgK110.png",
	multi: "/assets/multi-BgmsSSfb.png",
	shield: "/assets/shield-BRBEA5aw.png",
	speed: "/assets/speed-BcFNSQ66.png",
	bomb: "/assets/bomb-aLAH_Q7f.png"
};
function loadSprites() {
	const entries = Object.entries(spriteUrls);
	return Promise.all(entries.map(([key, src]) => new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => resolve([key, img]);
		img.onerror = () => reject(/* @__PURE__ */ new Error(`sprite ${key}`));
		img.src = src;
	}))).then((list) => {
		const out = {};
		for (const [k, img] of list) out[k] = img;
		return out;
	});
}
var Sfx = class {
	ctx = null;
	muted = false;
	unlock() {
		if (this.muted) return;
		const ctx = this.ensure();
		if (ctx.state === "suspended") ctx.resume();
	}
	ensure() {
		if (!this.ctx) this.ctx = new AudioContext();
		return this.ctx;
	}
	tone(freq, dur, type, gain, slideTo, delay = 0) {
		if (this.muted) return;
		const ctx = this.ensure();
		if (ctx.state === "suspended") ctx.resume();
		const t0 = ctx.currentTime + delay;
		const osc = ctx.createOscillator();
		const g = ctx.createGain();
		osc.type = type;
		osc.frequency.setValueAtTime(freq, t0);
		if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t0 + dur);
		g.gain.setValueAtTime(gain, t0);
		g.gain.exponentialRampToValueAtTime(1e-4, t0 + dur);
		osc.connect(g);
		g.connect(ctx.destination);
		osc.start(t0);
		osc.stop(t0 + dur + .02);
	}
	noise(dur, gain, hp = 400) {
		if (this.muted) return;
		const ctx = this.ensure();
		const n = Math.floor(ctx.sampleRate * dur);
		const buf = ctx.createBuffer(1, n, ctx.sampleRate);
		const data = buf.getChannelData(0);
		for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
		const src = ctx.createBufferSource();
		src.buffer = buf;
		const filter = ctx.createBiquadFilter();
		filter.type = "highpass";
		filter.frequency.value = hp;
		const g = ctx.createGain();
		g.gain.setValueAtTime(gain, ctx.currentTime);
		g.gain.exponentialRampToValueAtTime(1e-4, ctx.currentTime + dur);
		src.connect(filter);
		filter.connect(g);
		g.connect(ctx.destination);
		src.start();
	}
	shoot() {
		const pitch = 520 + Math.random() * 80;
		this.tone(pitch, .09, "square", .045, 220);
		this.tone(pitch * .5, .07, "triangle", .03, 140);
	}
	hit() {
		this.tone(180 + Math.random() * 40, .08, "square", .04, 70);
	}
	kill() {
		this.tone(320, .12, "triangle", .05, 90);
		this.noise(.12, .04, 900);
	}
	explode() {
		this.noise(.35, .12, 180);
		this.tone(90, .3, "sawtooth", .05, 40);
	}
	pickup() {
		this.tone(520, .08, "triangle", .05);
		this.tone(780, .12, "sine", .04, void 0, .06);
	}
	hurt() {
		this.tone(140, .22, "sawtooth", .06, 50);
		this.noise(.18, .08, 200);
	}
	wave() {
		this.tone(440, .1, "square", .04);
		this.tone(660, .14, "square", .035, void 0, .09);
	}
	ui() {
		this.tone(660, .05, "sine", .03);
	}
};
var sfx = new Sfx();
var MAX_PARTICLES = 240;
function createInput() {
	return {
		codes: /* @__PURE__ */ new Set(),
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
		seek: false
	};
}
function rnd(sim) {
	sim.rng = (sim.rng * 16807 + 11) % 2147483647;
	return sim.rng / 2147483647;
}
function makePlayer(w, h) {
	return {
		x: w * .5,
		y: h * .78,
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
		alive: true
	};
}
function createSim(w, h) {
	const sim = {
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
		rng: 4919
	};
	seedStars(sim);
	return sim;
}
function seedStars(sim) {
	sim.stars = [];
	const count = 140;
	for (let i = 0; i < count; i++) sim.stars.push({
		x: Math.random() * Math.max(sim.w, 1),
		y: Math.random() * Math.max(sim.h, 1),
		z: i % 3,
		s: .8 + i % 5 * .35,
		tw: Math.random() * Math.PI * 2
	});
}
function resizeSim(sim, w, h) {
	sim.w = Math.max(1, w);
	sim.h = Math.max(1, h);
	if (sim.stars.length === 0) seedStars(sim);
	clampPlayer(sim);
}
function startRun(sim) {
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
	sim.player.invuln = .6;
	beginWave(sim, 1);
}
function beginWave(sim, n) {
	sim.wave = n;
	sim.queue = planWave(n);
	sim.spawnT = .35;
	sim.banner = n % 5 === 0 ? `WAVE ${n}  ·  DREADNOUGHT` : `WAVE ${n}`;
	sim.bannerT = 1.5;
	sim.events.push("wave");
}
function planWave(n) {
	const list = [];
	const scouts = 4 + n;
	const raiders = Math.max(0, n - 1);
	const bombers = n >= 3 ? Math.floor((n - 1) / 2) : 0;
	for (let i = 0; i < scouts; i++) list.push("scout");
	for (let i = 0; i < raiders; i++) list.push("raider");
	for (let i = 0; i < bombers; i++) list.push("bomber");
	if (n % 5 === 0) list.push("dread");
	for (let i = list.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const tmp = list[i];
		list[i] = list[j];
		list[j] = tmp;
	}
	if (n % 5 === 0) {
		const idx = list.indexOf("dread");
		if (idx > 0) {
			const [d] = list.splice(idx, 1);
			list.push(d);
		}
	}
	return list;
}
function held(input, code) {
	if (input.injected) return input.injected.includes(code);
	return input.codes.has(code);
}
function moveAxes(input) {
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
	return {
		x,
		y
	};
}
function frame(sim, input, dt) {
	sim.events.length = 0;
	const real = Math.min(.05, Math.max(0, dt));
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
function tick(sim, input, dt) {
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
	const keyboard = Math.abs(axes.x) + Math.abs(axes.y) > .01;
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
	if (Math.abs(ix) + Math.abs(iy) > .01) {
		p.vx += ix * accel * dt;
		p.vy += iy * accel * dt;
		const sp = Math.hypot(p.vx, p.vy);
		if (sp > maxSp) {
			p.vx = p.vx / sp * maxSp;
			p.vy = p.vy / sp * maxSp;
		}
	} else {
		const damp = Math.exp(-8 * dt);
		p.vx *= damp;
		p.vy *= damp;
	}
	p.x += p.vx * dt;
	p.y += p.vy * dt;
	clampPlayer(sim);
	let diff = desiredAim(sim, input) - p.aim;
	diff = Math.atan2(Math.sin(diff), Math.cos(diff));
	p.aim += diff * (1 - Math.exp(-16 * dt));
	if (p.alive && sim.dying <= 0 && p.fireCd <= 0) {
		fireBananas(sim);
		p.fireCd = p.multiLevel > 0 ? .13 : .15;
	}
	if (input.bombEdge) {
		input.bombEdge = false;
		detonate(sim);
	}
	if (edgeWas(input, "KeyF") || edgeWas(input, "KeyQ")) detonate(sim);
	if (p.speedT > 0 && sim.time % .05 < dt) burst(sim, p.x, p.y, 1, "#3ec8e8", 40, .25, "dot");
	stepWorld(sim, dt, true);
	trySpawn(sim, dt);
	maybeClearWave(sim);
}
var edgeState = {
	f: false,
	q: false
};
function edgeWas(input, code) {
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
function desiredAim(sim, input) {
	if (input.injected) return -Math.PI / 2;
	if (input.aimActive) {
		if (Math.hypot(input.aimX, input.aimY) > .22) return Math.atan2(input.aimY, input.aimX);
	}
	const mouseAim = input.pointerSeen && input.pointerType !== "touch";
	const touchAim = input.pointerSeen && input.pointerDown && input.pointerType === "touch";
	if (mouseAim || touchAim) return Math.atan2(input.pointerY - sim.player.y, input.pointerX - sim.player.x);
	let best = null;
	let bestD = 230400;
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
function fireBananas(sim) {
	const p = sim.player;
	const level = p.multiLevel;
	const spreads = level >= 2 ? [
		-.34,
		-.17,
		0,
		.17,
		.34
	] : level >= 1 ? [
		-.18,
		0,
		.18
	] : [0];
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
			spin: (Math.random() > .5 ? 1 : -1) * (7 + Math.random() * 4),
			rot: a + Math.PI / 2,
			kind: "banana"
		});
	}
	p.flash = .055;
	p.recoil = .06;
	sim.events.push("shoot");
	const back = p.aim + Math.PI;
	burst(sim, p.x + ox, p.y + oy, 5, "#f0c14b", 160, .22, "peel");
	burst(sim, p.x + Math.cos(back) * 8, p.y + Math.sin(back) * 8, 2, "#fff6d0", 80, .08, "dot");
}
function detonate(sim) {
	const p = sim.player;
	if (!p.alive || p.bombs <= 0 || sim.dying > 0) return;
	p.bombs -= 1;
	const radius = Math.max(sim.w, sim.h) * .72;
	sim.blasts.push({
		x: p.x,
		y: p.y,
		life: .45,
		max: .45,
		radius
	});
	const victims = [...sim.enemies];
	for (const e of victims) if (Math.hypot(e.x - p.x, e.y - p.y) < radius * .85) damageEnemy(sim, e, 8, true);
	sim.bullets = sim.bullets.filter((b) => b.friendly);
	sim.melons = [];
	sim.trauma = Math.min(1, sim.trauma + .75);
	sim.hitstop = sim.reduced ? 0 : .05;
	sim.events.push("bomb");
	burst(sim, p.x, p.y, 28, "#e23d6a", 420, .5, "dot");
	burst(sim, p.x, p.y, 18, "#f0c14b", 360, .45, "peel");
	burst(sim, p.x, p.y, 12, "#7dff6a", 300, .4, "dot");
}
function clampPlayer(sim) {
	const m = 28;
	const p = sim.player;
	p.x = Math.max(m, Math.min(sim.w - m, p.x));
	p.y = Math.max(m, Math.min(sim.h - m, p.y));
}
function stepWorld(sim, dt, live) {
	driftStars(sim, dt);
	const p = sim.player;
	for (let i = sim.enemies.length - 1; i >= 0; i--) {
		const e = sim.enemies[i];
		e.flash = Math.max(0, e.flash - dt);
		e.telegraph = Math.max(0, e.telegraph - dt);
		if (live && p.alive) steerEnemy(sim, e, dt);
		e.x += e.vx * dt;
		e.y += e.vy * dt;
		if (e.y > sim.h + 80 || e.x < -120 || e.x > sim.w + 120 || e.y < -160) {
			sim.enemies.splice(i, 1);
			continue;
		}
		if (live && p.alive && e.fireCd <= 0 && e.telegraph <= 0) considerFire(sim, e);
		else if (live) e.fireCd = Math.max(0, e.fireCd - dt);
	}
	if (live) separateEnemies(sim);
	for (let i = sim.bullets.length - 1; i >= 0; i--) {
		const b = sim.bullets[i];
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
			for (const e of sim.enemies) if (Math.hypot(e.x - b.x, e.y - b.y) < e.r + b.r) {
				damageEnemy(sim, e, 1, false);
				sim.bullets.splice(i, 1);
				burst(sim, b.x, b.y, 4, "#f0c14b", 120, .2, "peel");
				break;
			}
		} else if (p.invuln <= 0 && Math.hypot(p.x - b.x, p.y - b.y) < p.r + b.r) {
			hurtPlayer(sim);
			sim.bullets.splice(i, 1);
		}
	}
	for (let i = sim.melons.length - 1; i >= 0; i--) {
		const m = sim.melons[i];
		m.x += m.vx * dt;
		m.y += m.vy * dt;
		m.vx *= Math.exp(-.6 * dt);
		m.vy *= Math.exp(-.6 * dt);
		m.life -= dt;
		const near = p.alive && Math.hypot(p.x - m.x, p.y - m.y) < 36;
		if (m.life <= 0 || near) {
			explodeMelon(sim, m);
			sim.melons.splice(i, 1);
		}
	}
	for (let i = sim.pickups.length - 1; i >= 0; i--) {
		const u = sim.pickups[i];
		u.life -= dt;
		u.bob += dt;
		if (live && p.alive) {
			const dx = p.x - u.x;
			const dy = p.y - u.y;
			const d = Math.hypot(dx, dy);
			if (d < 120 && d > .1) {
				u.vx += dx / d * 420 * dt;
				u.vy += dy / d * 420 * dt;
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
		const q = sim.particles[i];
		q.life -= dt;
		q.x += q.vx * dt;
		q.y += q.vy * dt;
		q.vx *= Math.exp(-1.5 * dt);
		q.vy *= Math.exp(-1.5 * dt);
		q.rot += q.spin * dt;
		if (q.life <= 0) sim.particles.splice(i, 1);
	}
	for (let i = sim.texts.length - 1; i >= 0; i--) {
		const t = sim.texts[i];
		t.life -= dt;
		t.y -= 28 * dt;
		if (t.life <= 0) sim.texts.splice(i, 1);
	}
	for (let i = sim.blasts.length - 1; i >= 0; i--) {
		const b = sim.blasts[i];
		b.life -= dt;
		if (b.life <= 0) sim.blasts.splice(i, 1);
	}
	sim.trauma = Math.max(0, sim.trauma - dt * 1.7);
}
function steerEnemy(sim, e, dt) {
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
		const dx = sim.w * .5 - e.x;
		e.vx += (Math.max(-1, Math.min(1, dx / 80)) * 40 - e.vx) * k;
		const targetY = sim.h * .22;
		e.vy += ((e.y < targetY ? 36 : 0) - e.vy) * k;
		return;
	}
	const dx = p.x - e.x;
	const dy = p.y - e.y;
	const d = Math.hypot(dx, dy) || 1;
	const desired = d > 230 ? 1 : d < 150 ? -.45 : .05;
	const strafe = Math.cos(sim.time * 1.4 + e.phase);
	e.vx += (dx / d * desired * 150 + strafe * 80 - e.vx) * k;
	e.vy += (dy / d * desired * 150 - e.vy) * k;
}
function separateEnemies(sim) {
	const list = sim.enemies;
	for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
		const a = list[i];
		const b = list[j];
		const dx = b.x - a.x;
		const dy = b.y - a.y;
		const d = Math.hypot(dx, dy) || .001;
		const min = a.r + b.r + 8;
		if (d < min) {
			const push = (min - d) / d * .5;
			a.x -= dx * push;
			a.y -= dy * push;
			b.x += dx * push;
			b.y += dy * push;
		}
	}
}
function considerFire(sim, e) {
	const p = sim.player;
	const dx = p.x - e.x;
	const dy = p.y - e.y;
	const d = Math.hypot(dx, dy);
	if (e.kind === "scout") {
		if (d < 520 && dy > -20) {
			e.fireCd = Math.max(.85, 1.45 - sim.wave * .04);
			shootBerry(sim, e, Math.atan2(dy, dx), 250);
		}
		return;
	}
	if (e.kind === "raider") {
		if (d < 640) {
			e.fireCd = Math.max(.7, 1.2 - sim.wave * .035);
			shootBerry(sim, e, Math.atan2(dy, dx), 290);
		}
		return;
	}
	if (e.kind === "bomber") {
		if (e.y > 30 && e.y < sim.h * .72) {
			e.fireCd = 2.1;
			const ang = Math.atan2(dy, dx);
			sim.melons.push({
				x: e.x,
				y: e.y + e.r,
				vx: Math.cos(ang) * 90,
				vy: Math.max(40, Math.sin(ang) * 90),
				life: 1.25,
				max: 1.25,
				r: 14
			});
		}
		return;
	}
	if (d < 760) {
		e.fireCd = .85;
		const base = Math.atan2(dy, dx);
		for (const s of [
			-.28,
			0,
			.28
		]) shootBerry(sim, e, base + s, 270);
	}
}
function shootBerry(sim, e, ang, speed) {
	e.telegraph = .12;
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
		kind: "berry"
	});
}
function explodeMelon(sim, m) {
	sim.blasts.push({
		x: m.x,
		y: m.y,
		life: .32,
		max: .32,
		radius: 78
	});
	sim.events.push("explode");
	sim.trauma = Math.min(1, sim.trauma + .35);
	burst(sim, m.x, m.y, 10, "#7dff6a", 180, .35, "dot");
	burst(sim, m.x, m.y, 6, "#e23d6a", 140, .3, "dot");
	const p = sim.player;
	if (p.alive && p.invuln <= 0 && Math.hypot(p.x - m.x, p.y - m.y) < p.r + 48) hurtPlayer(sim);
	for (const e of [...sim.enemies]) if (Math.hypot(e.x - m.x, e.y - m.y) < e.r + 56) damageEnemy(sim, e, 2, false);
}
function damageEnemy(sim, e, dmg, silent) {
	if (e.hp <= 0) return;
	e.hp -= dmg;
	e.flash = .08;
	if (!silent) {
		sim.hitstop = sim.reduced ? 0 : .028;
		sim.events.push("hit");
	}
	if (e.hp <= 0) killEnemy(sim, e);
}
function killEnemy(sim, e) {
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
		life: .7,
		max: .7,
		color: sim.combo > 1 ? "#3ec8e8" : "#f0c14b"
	});
	if (sim.combo > 1) sim.texts.push({
		x: e.x,
		y: e.y - 16,
		text: `x${sim.combo}`,
		life: .7,
		max: .7,
		color: "#e7eef8"
	});
	sim.trauma = Math.min(1, sim.trauma + (e.kind === "dread" ? .7 : .22));
	sim.hitstop = sim.reduced ? 0 : e.kind === "dread" ? .09 : .04;
	sim.events.push(e.kind === "dread" || e.kind === "bomber" ? "explode" : "kill");
	const color = e.kind === "scout" ? "#3ec8e8" : e.kind === "dread" ? "#e23d6a" : "#d7c4a1";
	burst(sim, e.x, e.y, e.kind === "dread" ? 22 : 10, color, 240, .45, "dot");
	burst(sim, e.x, e.y, 6, "#f0c14b", 180, .35, "peel");
	if (Math.random() < (e.kind === "dread" ? 1 : .26)) dropPickup(sim, e.x, e.y);
}
function dropPickup(sim, x, y) {
	const roll = rnd(sim);
	const kind = roll < .32 ? "multi" : roll < .58 ? "shield" : roll < .82 ? "speed" : "bomb";
	sim.pickups.push({
		kind,
		x,
		y,
		vx: (rnd(sim) - .5) * 40,
		vy: 20 + rnd(sim) * 30,
		r: 16,
		life: 9,
		bob: rnd(sim) * 6
	});
}
function applyPickup(sim, kind) {
	const p = sim.player;
	sim.events.push("pickup");
	sim.texts.push({
		x: p.x,
		y: p.y - 28,
		text: kind === "multi" ? "MULTI BANANA" : kind === "shield" ? "LIME SHIELD" : kind === "speed" ? "MANGO BOOST" : "PINEAPPLE",
		life: .9,
		max: .9,
		color: "#e7eef8"
	});
	if (kind === "multi") {
		p.multiLevel = Math.min(2, p.multiLevel + 1);
		p.multiT = 14;
	} else if (kind === "shield") {
		p.shieldT = 12;
		p.shieldHp = 3;
	} else if (kind === "speed") p.speedT = 10;
	else p.bombs = Math.min(3, p.bombs + 1);
}
function hurtPlayer(sim) {
	const p = sim.player;
	if (!p.alive || p.invuln > 0) return;
	if (p.shieldHp > 0) {
		p.shieldHp -= 1;
		p.invuln = .28;
		if (p.shieldHp <= 0) p.shieldT = 0;
		sim.trauma = Math.min(1, sim.trauma + .28);
		sim.events.push("hit");
		burst(sim, p.x, p.y, 8, "#3ec8e8", 160, .3, "dot");
		return;
	}
	p.lives -= 1;
	p.invuln = 1.7;
	p.vx *= .15;
	p.vy *= .15;
	sim.combo = 1;
	sim.comboT = 0;
	sim.trauma = Math.min(1, sim.trauma + .8);
	sim.hitstop = sim.reduced ? 0 : .08;
	sim.events.push("hurt");
	burst(sim, p.x, p.y, 16, "#e23d6a", 280, .45, "dot");
	burst(sim, p.x, p.y, 8, "#f0c14b", 200, .4, "peel");
	if (p.lives <= 0) {
		p.alive = false;
		sim.dying = .85;
		sim.events.push("explode");
	}
}
function trySpawn(sim, dt) {
	if (sim.bannerT > .4 || sim.queue.length === 0) return;
	sim.spawnT -= dt;
	if (sim.spawnT > 0) return;
	const kind = sim.queue.shift();
	spawnEnemy(sim, kind);
	const pace = Math.max(.28, .62 - sim.wave * .03);
	sim.spawnT = kind === "dread" ? .2 : pace;
}
function spawnEnemy(sim, kind) {
	const x = 46 + rnd(sim) * Math.max(10, sim.w - 92);
	const base = {
		x,
		y: kind === "dread" ? -70 : -36,
		vx: 0,
		vy: 40,
		flash: 0,
		telegraph: 0,
		phase: rnd(sim) * Math.PI * 2,
		originX: x
	};
	if (kind === "scout") sim.enemies.push({
		...base,
		kind,
		r: 16,
		hp: 1,
		maxHp: 1,
		fireCd: .8 + rnd(sim),
		score: 100
	});
	else if (kind === "raider") {
		const hp = 3;
		sim.enemies.push({
			...base,
			kind,
			r: 24,
			hp,
			maxHp: hp,
			fireCd: .6,
			score: 180
		});
	} else if (kind === "bomber") {
		const hp = 4;
		sim.enemies.push({
			...base,
			kind,
			r: 28,
			hp,
			maxHp: hp,
			fireCd: 1.2,
			score: 260
		});
	} else {
		const hp = 16 + sim.wave;
		sim.enemies.push({
			...base,
			x: sim.w * .5,
			originX: sim.w * .5,
			kind,
			r: 42,
			hp,
			maxHp: hp,
			fireCd: 1.1,
			score: 900
		});
	}
}
function maybeClearWave(sim) {
	if (sim.queue.length > 0 || sim.enemies.length > 0 || sim.dying > 0) return;
	if (sim.bannerT > 0) return;
	sim.score += 200 * sim.wave;
	sim.texts.push({
		x: sim.w * .5,
		y: sim.h * .4,
		text: `WAVE CLEAR +${200 * sim.wave}`,
		life: 1.2,
		max: 1.2,
		color: "#f0c14b"
	});
	beginWave(sim, sim.wave + 1);
}
function burst(sim, x, y, n, color, speed, life, shape) {
	for (let i = 0; i < n; i++) {
		if (sim.particles.length >= MAX_PARTICLES) sim.particles.shift();
		const a = rnd(sim) * Math.PI * 2;
		const s = speed * (.35 + rnd(sim) * .75);
		sim.particles.push({
			x,
			y,
			vx: Math.cos(a) * s,
			vy: Math.sin(a) * s,
			life: life * (.6 + rnd(sim) * .5),
			max: life,
			size: shape === "peel" ? 3 + rnd(sim) * 3 : 1.5 + rnd(sim) * 2.4,
			color,
			rot: rnd(sim) * 6,
			spin: (rnd(sim) - .5) * 10,
			shape
		});
	}
}
function driftStars(sim, dt) {
	const speeds = [
		18,
		46,
		98
	];
	for (const s of sim.stars) {
		s.y += (speeds[s.z] ?? 40) * dt;
		s.tw += dt * (.8 + s.z);
		if (s.y > sim.h + 4) {
			s.y = -4;
			s.x = Math.random() * sim.w;
		}
	}
}
function shakeOffset(sim) {
	if (!sim.shake || sim.reduced) return {
		x: 0,
		y: 0,
		rot: 0
	};
	const mag = sim.trauma * sim.trauma;
	if (mag < .001) return {
		x: 0,
		y: 0,
		rot: 0
	};
	const t = sim.time * 40;
	return {
		x: Math.sin(t * 1.7) * 12 * mag,
		y: Math.cos(t * 2.3) * 10 * mag,
		rot: Math.sin(t * 1.3) * .02 * mag
	};
}
var HEIGHT = {
	scout: 62,
	raider: 96,
	bomber: 108,
	dread: 154,
	player: 92
};
function render(ctx, sim, sprites) {
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
function drawStars(ctx, sim) {
	const focusX = sim.player.x - sim.w / 2;
	for (const s of sim.stars) {
		const factor = .015 + s.z * .03;
		let x = s.x - focusX * factor;
		x = (x % sim.w + sim.w) % sim.w;
		ctx.globalAlpha = (.35 + s.z * .22) * (.65 + Math.sin(s.tw) * .35);
		ctx.fillStyle = s.z === 2 && s.s > 1.8 ? "#f0c14b" : s.z === 0 ? "#9fb4d4" : "#e7eef8";
		ctx.fillRect(x, s.y, s.s, s.s);
	}
	ctx.globalAlpha = 1;
}
function drawNebula(ctx, sim) {
	const t = sim.time;
	const g1 = ctx.createRadialGradient(sim.w * .2 + Math.sin(t * .05) * 20, sim.h * .3, 10, sim.w * .2, sim.h * .3, sim.w * .45);
	g1.addColorStop(0, "rgba(62, 200, 232, 0.08)");
	g1.addColorStop(1, "rgba(62, 200, 232, 0)");
	ctx.fillStyle = g1;
	ctx.fillRect(0, 0, sim.w, sim.h);
	const g2 = ctx.createRadialGradient(sim.w * .8, sim.h * .7, 10, sim.w * .75, sim.h * .75, sim.w * .4);
	g2.addColorStop(0, "rgba(226, 61, 106, 0.05)");
	g2.addColorStop(1, "rgba(226, 61, 106, 0)");
	ctx.fillStyle = g2;
	ctx.fillRect(0, 0, sim.w, sim.h);
}
function drawSprite(ctx, img, x, y, aim, height, alpha = 1) {
	const w = height * (img.width / Math.max(1, img.height));
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(aim + Math.PI / 2);
	ctx.globalAlpha = alpha;
	ctx.drawImage(img, -w / 2, -hSafe(height) / 2, w, height);
	ctx.restore();
}
function hSafe(h) {
	return h;
}
function drawPlayer(ctx, sim, sprites) {
	const p = sim.player;
	const alpha = p.invuln > 0 && Math.floor(sim.time * 14) % 2 === 0 ? .4 : 1;
	const kick = p.recoil * 12;
	const x = p.x - Math.cos(p.aim) * kick;
	const y = p.y - Math.sin(p.aim) * kick;
	drawEngines(ctx, x, y, p.aim, p.speedT > 0);
	drawSprite(ctx, sprites.player, x, y, p.aim, HEIGHT.player, alpha);
	if (p.flash > 0) drawMuzzle(ctx, x, y, p.aim, p.flash / .055);
	if (p.shieldHp > 0) {
		ctx.save();
		ctx.strokeStyle = "rgba(62, 200, 232, 0.85)";
		ctx.lineWidth = 2;
		ctx.globalAlpha = .45 + Math.sin(sim.time * 6) * .15;
		ctx.beginPath();
		ctx.arc(x, y, 36, 0, Math.PI * 2);
		ctx.stroke();
		ctx.restore();
	}
}
function drawEngines(ctx, x, y, aim, boost) {
	const rot = aim + Math.PI / 2;
	const spots = [[-16, 26], [16, 26]];
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
function drawMuzzle(ctx, x, y, aim, a) {
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
function drawEnemy(ctx, sprites, e, sim) {
	const ang = Math.atan2(e.vy, e.vx) || Math.PI / 2;
	const img = e.kind === "scout" ? sprites.scout : e.kind === "raider" ? sprites.raider : sprites.dread;
	const h = HEIGHT[e.kind] ?? 90;
	if (e.flash > 0) {
		ctx.save();
		ctx.globalCompositeOperation = "lighter";
		drawSprite(ctx, img, e.x, e.y, ang, h, .85);
		ctx.restore();
	}
	drawSprite(ctx, img, e.x, e.y, ang, h, 1);
	if (e.fireCd > 0 && e.fireCd < .22) {
		ctx.save();
		ctx.fillStyle = "#e23d6a";
		ctx.globalAlpha = .8;
		ctx.beginPath();
		ctx.arc(e.x + Math.cos(ang) * (e.r + 6), e.y + Math.sin(ang) * (e.r + 6), 3.5, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}
	if (e.maxHp > 1) {
		const w = 36;
		const k = Math.max(0, e.hp / e.maxHp);
		ctx.fillStyle = "rgba(7, 11, 20, 0.7)";
		ctx.fillRect(e.x - w / 2, e.y - h * .5 - 8, w, 3);
		ctx.fillStyle = e.kind === "dread" ? "#e23d6a" : "#f0c14b";
		ctx.fillRect(e.x - w / 2, e.y - h * .5 - 8, w * k, 3);
	}
}
function drawBullet(ctx, sprites, b) {
	if (b.kind === "banana") {
		const ang = Math.atan2(b.vy, b.vx);
		drawSprite(ctx, sprites.banana, b.x, b.y, ang + Math.sin(b.rot) * .15, 30, 1);
	} else drawSprite(ctx, sprites.berry, b.x, b.y, b.rot, 20, 1);
}
function drawMelon(ctx, sprites, m) {
	const pulse = m.life < .4 ? 1 + (.4 - m.life) * .8 : 1;
	drawSprite(ctx, sprites.melon, m.x, m.y, -Math.PI / 2, 36 * pulse, 1);
}
function drawPickup(ctx, sim, sprites, u) {
	const img = u.kind === "multi" ? sprites.multi : u.kind === "shield" ? sprites.shield : u.kind === "speed" ? sprites.speed : sprites.bomb;
	const y = u.y + Math.sin(sim.time * 3 + u.bob) * 4;
	const fade = u.life < 2 ? .45 + Math.sin(sim.time * 16) * .35 : 1;
	drawSprite(ctx, img, u.x, y, -Math.PI / 2 + Math.sin(sim.time + u.bob) * .2, 40, fade);
}
function drawParticle(ctx, q) {
	const a = Math.max(0, q.life / q.max);
	ctx.save();
	ctx.globalAlpha = a;
	ctx.translate(q.x, q.y);
	ctx.rotate(q.rot);
	ctx.fillStyle = q.color;
	if (q.shape === "peel") ctx.fillRect(-q.size, -q.size * .35, q.size * 2, q.size * .7);
	else {
		ctx.beginPath();
		ctx.arc(0, 0, q.size, 0, Math.PI * 2);
		ctx.fill();
	}
	ctx.restore();
}
function drawBlast(ctx, b) {
	const k = 1 - b.life / b.max;
	ctx.save();
	ctx.globalAlpha = (1 - k) * .65;
	ctx.strokeStyle = k > .35 ? "#f0c14b" : "#e23d6a";
	ctx.lineWidth = 3;
	const span = b.radius > 240 ? b.radius * .55 : b.radius;
	ctx.beginPath();
	ctx.arc(b.x, b.y, 10 + span * k, 0, Math.PI * 2);
	ctx.stroke();
	ctx.restore();
}
function drawText(ctx, t) {
	ctx.save();
	ctx.globalAlpha = Math.max(0, t.life / t.max);
	ctx.fillStyle = t.color;
	ctx.font = "600 14px Sora, sans-serif";
	ctx.textAlign = "center";
	ctx.fillText(t.text, t.x, t.y);
	ctx.restore();
}
function drawBanner(ctx, sim) {
	const a = Math.min(1, sim.bannerT) * Math.min(1, (1.5 - sim.bannerT) * 4 + .2);
	ctx.save();
	ctx.globalAlpha = Math.max(0, Math.min(1, a));
	ctx.fillStyle = "#f0c14b";
	ctx.font = "700 28px Orbitron, sans-serif";
	ctx.textAlign = "center";
	ctx.fillText(sim.banner, sim.w / 2, sim.h * .38);
	ctx.restore();
}
function drawVignette(ctx, w, h) {
	const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .35, w / 2, h / 2, Math.max(w, h) * .72);
	g.addColorStop(0, "rgba(0,0,0,0)");
	g.addColorStop(1, "rgba(0,0,0,0.45)");
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, w, h);
}
var KEY = "banana-quadrant-scores-v1";
var SET_KEY = "banana-quadrant-settings-v1";
var MAX = 8;
function loadScores() {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return [];
		const data = JSON.parse(raw);
		if (!data || !Array.isArray(data.scores)) return [];
		return data.scores.filter((e) => e && typeof e.name === "string" && typeof e.score === "number" && typeof e.wave === "number").slice(0, MAX);
	} catch {
		return [];
	}
}
function bestScore(entries) {
	return entries.reduce((m, e) => Math.max(m, e.score), 0);
}
function qualifies(score, entries) {
	if (score <= 0) return false;
	if (entries.length < MAX) return true;
	return score > entries[entries.length - 1].score;
}
function submitScore(name, score, wave) {
	const clean = (name || "ACE").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3) || "ACE";
	const next = loadScores();
	next.push({
		name: clean,
		score,
		wave,
		at: Date.now()
	});
	next.sort((a, b) => b.score - a.score || a.at - b.at);
	const trimmed = next.slice(0, MAX);
	localStorage.setItem(KEY, JSON.stringify({
		version: 1,
		scores: trimmed
	}));
	return trimmed;
}
function loadSettings() {
	try {
		const raw = localStorage.getItem(SET_KEY);
		if (!raw) return {
			mute: false,
			shake: true
		};
		const data = JSON.parse(raw);
		return {
			mute: Boolean(data.mute),
			shake: data.shake !== false
		};
	} catch {
		return {
			mute: false,
			shake: true
		};
	}
}
function saveSettings(s) {
	localStorage.setItem(SET_KEY, JSON.stringify(s));
}
function BananaQuadrant() {
	const canvasRef = (0, import_react.useRef)(null);
	const simRef = (0, import_react.useRef)(null);
	const inputRef = (0, import_react.useRef)(createInput());
	const viewRef = (0, import_react.useRef)("title");
	const spritesRef = (0, import_react.useRef)(null);
	const [view, setView] = (0, import_react.useState)("title");
	const [scores, setScores] = (0, import_react.useState)([]);
	const [best, setBest] = (0, import_react.useState)(0);
	const [muted, setMuted] = (0, import_react.useState)(false);
	const [shakeOn, setShakeOn] = (0, import_react.useState)(true);
	const [result, setResult] = (0, import_react.useState)(null);
	const [name, setName] = (0, import_react.useState)("ACE");
	const [saved, setSaved] = (0, import_react.useState)(false);
	const [backTo, setBackTo] = (0, import_react.useState)("title");
	const bestHold = (0, import_react.useRef)(0);
	const scoreRef = (0, import_react.useRef)(null);
	const waveRef = (0, import_react.useRef)(null);
	const bestRef = (0, import_react.useRef)(null);
	const comboRef = (0, import_react.useRef)(null);
	const bombRef = (0, import_react.useRef)(null);
	const multiRef = (0, import_react.useRef)(null);
	const shieldRef = (0, import_react.useRef)(null);
	const speedRef = (0, import_react.useRef)(null);
	const lifeRefs = (0, import_react.useRef)([]);
	(0, import_react.useEffect)(() => {
		const loaded = loadScores();
		setScores(loaded);
		setBest(bestScore(loaded));
		bestHold.current = bestScore(loaded);
		const settings = loadSettings();
		setMuted(settings.mute);
		setShakeOn(settings.shake);
		sfx.muted = settings.mute;
	}, []);
	(0, import_react.useEffect)(() => {
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
		loadSprites().then((set) => {
			if (!dead) spritesRef.current = set;
		});
		const qa = new URLSearchParams(window.location.search).has("qa");
		if (qa) window.__controlsTest = {
			getYaw: () => sim.player.aim,
			getSpeed: () => Math.hypot(sim.player.vx, sim.player.vy),
			getX: () => sim.player.x,
			getY: () => sim.player.y,
			setKeys: (codes) => {
				input.injected = [...codes];
			},
			setSteer: (v) => {
				input.steer = v;
			}
		};
		const loop = (now) => {
			if (dead) return;
			const dt = Math.min(.05, (now - last) / 1e3);
			last = now;
			frame(sim, input, dt);
			render(ctx, sim, spritesRef.current);
			paintHud(sim);
			for (const ev of sim.events) if (ev === "shoot") sfx.shoot();
			else if (ev === "hit") sfx.hit();
			else if (ev === "kill") sfx.kill();
			else if (ev === "explode" || ev === "bomb") sfx.explode();
			else if (ev === "pickup") sfx.pickup();
			else if (ev === "hurt") sfx.hurt();
			else if (ev === "wave") sfx.wave();
			if (sim.mode === "over" && viewRef.current === "play") {
				const board = loadScores();
				const listed = qualifies(sim.score, board);
				viewRef.current = "over";
				setResult({
					score: sim.score,
					wave: sim.wave,
					listed
				});
				setSaved(false);
				setName("ACE");
				setView("over");
			}
			requestAnimationFrame(loop);
		};
		const raf = requestAnimationFrame(loop);
		const paintHud = (s) => {
			if (scoreRef.current) scoreRef.current.textContent = String(s.score);
			if (waveRef.current) waveRef.current.textContent = String(s.wave);
			if (bestRef.current) bestRef.current.textContent = String(Math.max(bestHold.current, s.score));
			if (comboRef.current) comboRef.current.textContent = s.combo > 1 ? `x${s.combo}` : "";
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
	}, []);
	(0, import_react.useEffect)(() => {
		const sim = simRef.current;
		if (sim) sim.shake = shakeOn && !sim.reduced;
		sfx.muted = muted;
		saveSettings({
			mute: muted,
			shake: shakeOn
		});
	}, [muted, shakeOn]);
	(0, import_react.useEffect)(() => {
		const input = inputRef.current;
		const down = (e) => {
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
			if (e.code === "Space" || e.code.startsWith("Arrow")) e.preventDefault();
			input.codes.add(e.code);
			if (e.code === "Escape" || e.code === "KeyP") {
				e.preventDefault();
				togglePause();
			}
		};
		const up = (e) => {
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
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const input = inputRef.current;
		const pos = (e) => {
			const r = canvas.getBoundingClientRect();
			input.pointerX = e.clientX - r.left;
			input.pointerY = e.clientY - r.top;
			input.pointerInside = true;
			input.pointerSeen = true;
			input.pointerType = e.pointerType;
		};
		const onDown = (e) => {
			pos(e);
			input.pointerDown = true;
			input.seek = true;
			sfx.unlock();
		};
		const onMove = (e) => pos(e);
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
	function openBoard(from) {
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative h-dvh w-full overflow-hidden bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "sr-only",
				children: "Banana Quadrant"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: canvasRef,
				className: "absolute inset-0 h-full w-full touch-none",
				"aria-label": "Banana Quadrant playfield"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pointer-events-none absolute inset-0",
				children: [
					showHud && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "flex items-start justify-between gap-3 p-4 sm:p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "pointer-events-none min-w-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-display text-xs tracking-widest text-muted",
										children: "SCORE"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-display text-xl text-primary sm:text-2xl",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											ref: scoreRef,
											children: "0"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs text-muted",
										children: [
											"BEST ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												ref: bestRef,
												children: best
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												ref: comboRef,
												className: "ml-2 text-accent"
											})
										]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "pointer-events-none text-center",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-display text-xs tracking-widest text-muted",
									children: "WAVE"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-display text-xl sm:text-2xl",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										ref: waveRef,
										children: "1"
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: spriteUrls.bomb,
											alt: "",
											className: "h-6 w-6 object-contain"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											ref: bombRef,
											className: "font-display text-sm text-primary",
											children: "0"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex gap-1",
										children: [
											0,
											1,
											2
										].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											ref: (el) => {
												lifeRefs.current[i] = el;
											},
											src: spriteUrls.player,
											alt: "",
											className: "h-5 w-auto sm:h-6"
										}, i))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "pointer-events-auto flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface text-fg",
										onClick: togglePause,
										"aria-label": "Pause",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-5" })
									})
								]
							})
						]
					}),
					showHud && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute top-20 left-4 flex w-36 flex-col gap-2 sm:top-24",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
								refEl: multiRef,
								label: "Bananas",
								icon: spriteUrls.multi
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
								refEl: shieldRef,
								label: "Shield",
								icon: spriteUrls.shield
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
								refEl: speedRef,
								label: "Speed",
								icon: spriteUrls.speed
							})
						]
					}),
					view === "title" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Title, {
						best,
						onStart: start,
						onScores: () => openBoard("title"),
						onHow: () => {
							setBackTo("title");
							setView("howto");
						}
					}),
					view === "pause" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
						kicker: "Hold",
						title: "Paused",
						onClose: togglePause,
						closeLabel: "Resume",
						closeIcon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" }),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Ghost, {
									onClick: () => {
										sfx.ui();
										start();
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-4" }), " Restart"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Ghost, {
									onClick: () => {
										sfx.ui();
										openBoard("pause");
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trophy, { className: "size-4" }), " High scores"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ghost, {
									onClick: () => {
										setBackTo("pause");
										setView("howto");
									},
									children: "How to fly"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Ghost, {
									onClick: () => setMuted((m) => !m),
									children: [muted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-4" }), muted ? "Sound off" : "Sound on"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Ghost, {
									onClick: () => setShakeOn((s) => !s),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Vibrate, { className: "size-4" }), shakeOn ? "Shake on" : "Shake off"]
								})
							]
						})
					}),
					view === "over" && result && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
						kicker: "Hull lost",
						title: "Patrol over",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-muted",
								children: [
									"Wave ",
									result.wave,
									" · ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-primary",
										children: result.score
									}),
									" points"
								]
							}),
							result.listed && !saved ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								className: "mt-4 grid gap-3",
								onSubmit: (e) => {
									e.preventDefault();
									saveScore();
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "grid gap-1 text-sm text-muted",
									children: ["Initials for the board", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: name,
										maxLength: 3,
										autoFocus: true,
										onChange: (e) => setName(e.target.value.toUpperCase()),
										className: "h-12 rounded-xl border border-border bg-surface-2 text-center font-display text-xl tracking-widest text-fg outline-none"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "submit",
									className: "h-12 rounded-xl bg-primary font-display text-sm tracking-widest text-primary-fg",
									children: "Log score"
								})]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-sm text-muted",
								children: saved ? "Logged on the board." : "Not a top score this time."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 grid gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "h-12 rounded-xl bg-primary font-display text-sm tracking-widest text-primary-fg",
										onClick: start,
										children: "Fly again"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Ghost, {
										onClick: () => {
											openBoard("over");
										},
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trophy, { className: "size-4" }), " High scores"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Ghost, {
										onClick: () => {
											const sim = simRef.current;
											if (sim) sim.mode = "title";
											viewRef.current = "title";
											setView("title");
										},
										children: "Title"
									})
								]
							})
						]
					}),
					view === "scores" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
						kicker: "Local board",
						title: "High scores",
						onClose: () => {
							viewRef.current = backTo;
							setView(backTo);
						},
						closeLabel: "Back",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ScoreList, { scores })
					}),
					view === "howto" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Panel, {
						kicker: "Flight manual",
						title: "How to fly",
						onClose: () => {
							viewRef.current = backTo;
							setView(backTo);
						},
						closeLabel: "Back",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HowTo, {})
					}),
					showHud && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "touch-only pointer-events-none absolute inset-x-0 bottom-0 items-end justify-between p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Joystick, { onChange: (x, y, active) => {
							const input = inputRef.current;
							input.joyX = x;
							input.joyY = y;
							input.joyActive = active;
						} }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "pointer-events-auto flex h-16 w-16 flex-col items-center justify-center rounded-full border border-border bg-surface",
							onPointerDown: (e) => {
								e.preventDefault();
								e.stopPropagation();
								inputRef.current.bombEdge = true;
								sfx.unlock();
							},
							"aria-label": "Detonate pineapple",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: spriteUrls.bomb,
								alt: "",
								className: "h-8 w-8 object-contain"
							})
						})]
					})
				]
			})
		]
	});
}
function setBar(el, amount) {
	if (!el) return;
	const meter = el.parentElement?.parentElement;
	if (meter) meter.style.display = amount > .01 ? "grid" : "none";
	el.style.width = `${Math.max(0, Math.min(1, amount)) * 100}%`;
}
function Meter({ refEl, label, icon }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-1",
		style: { display: "none" },
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 text-xs text-muted",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: icon,
				alt: "",
				className: "h-4 w-4 object-contain"
			}), label]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "h-1 overflow-hidden rounded-full bg-surface-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				ref: refEl,
				className: "h-full w-0 bg-accent"
			})
		})]
	});
}
function Title({ best, onStart, onScores, onHow }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "absolute inset-0 flex items-end p-4 sm:items-center sm:p-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "pointer-events-auto w-full max-w-md rounded-2xl border border-border bg-surface/90 p-6 backdrop-blur-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-xs tracking-widest text-accent",
					children: "ORCHARD FLEET"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: spriteUrls.player,
					alt: "",
					className: "bq-bob mt-3 h-24 w-auto sm:hidden"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-2 font-display text-4xl leading-none text-primary",
					children: "BANANA QUADRANT"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-sm text-sm leading-relaxed text-muted",
					children: "Saucer cruisers only. Ordinance is fruit — bananas out, berries in, pineapple when the screen gets rude."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 text-xs text-muted",
					children: ["Best patrol ", best]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-12 rounded-xl bg-primary px-6 font-display text-sm tracking-widest text-primary-fg",
							onClick: onStart,
							children: "Start"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-12 rounded-xl border border-border px-4 text-sm text-fg",
							onClick: onScores,
							children: "High scores"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-12 rounded-xl border border-border px-4 text-sm text-fg",
							onClick: onHow,
							children: "How to fly"
						})
					]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: spriteUrls.player,
			alt: "",
			className: "bq-bob pointer-events-none absolute top-16 right-4 hidden w-40 sm:block"
		})]
	});
}
function Panel({ kicker, title, children, onClose, closeLabel, closeIcon }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-0 flex items-center justify-center p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "pointer-events-auto panel-scroll w-full max-w-md rounded-2xl border border-border bg-surface/95 p-6 backdrop-blur-md",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-xs tracking-widest text-accent",
					children: kicker
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-1 font-display text-2xl text-fg",
					children: title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4",
					children
				}),
				onClose && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-display text-sm tracking-widest text-primary-fg",
					onClick: onClose,
					children: [closeIcon, closeLabel]
				})
			]
		})
	});
}
function Ghost({ children, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: "flex h-11 items-center gap-2 rounded-xl border border-border px-3 text-left text-sm text-fg",
		onClick,
		children
	});
}
function ScoreList({ scores }) {
	if (scores.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm text-muted",
		children: "No scores yet. Be the first captain on this ship."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
		className: "grid gap-2",
		children: scores.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "flex items-center justify-between rounded-xl border border-border bg-surface-2 px-3 py-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-display text-sm text-muted",
					children: i + 1
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-display tracking-widest text-fg",
					children: s.name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-sm text-muted",
					children: ["W", s.wave]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-display text-primary",
					children: s.score
				})
			]
		}, `${s.at}-${s.name}-${i}`))
	});
}
function HowTo() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-3 text-sm leading-relaxed text-muted",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-fg",
				children: "Move"
			}), " with WASD or arrows. A and left go left, D and right go right. On a phone, use the stick or drag the ship."] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-fg",
				children: "Aim"
			}), " with the pointer. The cruiser faces the cursor and fires bananas on its own. Without a pointer, it tracks the nearest hostile."] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-fg",
				children: "Fruit"
			}), " — banana volleys from you, berry shots and melon bombs from them. Catch a bunch for a spread, a lime for a shield, a mango for speed, a pineapple to clear the screen (F or the bomb button)."] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-fg",
				children: "Pause"
			}), " with Esc, P, or the pause button. Three lives. Scores stay on this device."] })
		]
	});
}
function Joystick({ onChange }) {
	const base = (0, import_react.useRef)(null);
	const knobRef = (0, import_react.useRef)(null);
	const active = (0, import_react.useRef)(false);
	function moveKnob(x, y) {
		const el = knobRef.current;
		if (el) el.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
	}
	function setFrom(clientX, clientY) {
		const el = base.current;
		if (!el) return;
		const r = el.getBoundingClientRect();
		const cx = r.left + r.width / 2;
		const cy = r.top + r.height / 2;
		let x = (clientX - cx) / (r.width * .38);
		let y = (clientY - cy) / (r.height * .38);
		const len = Math.hypot(x, y);
		if (len > 1) {
			x /= len;
			y /= len;
		}
		if (len < .18) {
			onChange(0, 0, true);
			moveKnob(0, 0);
			return;
		}
		onChange(x, y, true);
		moveKnob(x * 28, y * 28);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: base,
		className: "pointer-events-auto relative h-28 w-28 rounded-full border border-border bg-surface/80",
		onPointerDown: (e) => {
			e.preventDefault();
			e.stopPropagation();
			active.current = true;
			e.currentTarget.setPointerCapture(e.pointerId);
			sfx.unlock();
			setFrom(e.clientX, e.clientY);
		},
		onPointerMove: (e) => {
			if (!active.current) return;
			setFrom(e.clientX, e.clientY);
		},
		onPointerUp: (e) => {
			active.current = false;
			onChange(0, 0, false);
			moveKnob(0, 0);
			e.currentTarget.releasePointerCapture(e.pointerId);
		},
		"aria-label": "Move",
		role: "application",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			ref: knobRef,
			className: "absolute top-1/2 left-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
		})
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BananaQuadrant, {});
}
//#endregion
export { Home as component };
