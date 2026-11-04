export class Sfx {
  private ctx: AudioContext | null = null;
  muted = false;

  unlock() {
    if (this.muted) return;
    const ctx = this.ensure();
    if (ctx.state === "suspended") void ctx.resume();
  }

  private ensure(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  private tone(
    freq: number,
    dur: number,
    type: OscillatorType,
    gain: number,
    slideTo?: number,
    delay = 0,
  ) {
    if (this.muted) return;
    const ctx = this.ensure();
    if (ctx.state === "suspended") void ctx.resume();
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t0 + dur);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  private noise(dur: number, gain: number, hp = 400) {
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
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(ctx.destination);
    src.start();
  }

  shoot() {
    const pitch = 520 + Math.random() * 80;
    this.tone(pitch, 0.09, "square", 0.045, 220);
    this.tone(pitch * 0.5, 0.07, "triangle", 0.03, 140);
  }

  hit() {
    this.tone(180 + Math.random() * 40, 0.08, "square", 0.04, 70);
  }

  kill() {
    this.tone(320, 0.12, "triangle", 0.05, 90);
    this.noise(0.12, 0.04, 900);
  }

  explode() {
    this.noise(0.35, 0.12, 180);
    this.tone(90, 0.3, "sawtooth", 0.05, 40);
  }

  pickup() {
    this.tone(520, 0.08, "triangle", 0.05);
    this.tone(780, 0.12, "sine", 0.04, undefined, 0.06);
  }

  hurt() {
    this.tone(140, 0.22, "sawtooth", 0.06, 50);
    this.noise(0.18, 0.08, 200);
  }

  wave() {
    this.tone(440, 0.1, "square", 0.04);
    this.tone(660, 0.14, "square", 0.035, undefined, 0.09);
  }

  ui() {
    this.tone(660, 0.05, "sine", 0.03);
  }
}

export const sfx = new Sfx();
