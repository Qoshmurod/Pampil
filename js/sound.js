// Oddiy ovozlar - fayl yuklamaslik uchun WebAudio bilan o'zim generatsiya qilaman
const Sound = {
  ctx: null,
  muted: false,

  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
  },

  beep(freq, dur, type = "square", vol = 0.08, slide = 0) {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slide) osc.frequency.linearRampToValueAtTime(freq + slide, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  },

  jump()  { this.beep(400, 0.15, "square", 0.06, 300); },
  fish()  { this.beep(900, 0.08, "triangle", 0.1); setTimeout(() => this.beep(1300, 0.1, "triangle", 0.1), 60); },
  milk()  { [500, 700, 900, 1200].forEach((f, i) => setTimeout(() => this.beep(f, 0.12, "sine", 0.1), i * 70)); },
  meow()  { this.beep(700, 0.35, "sawtooth", 0.07, -350); },
  hit()   { this.beep(150, 0.4, "sawtooth", 0.1, -100); },
  hurt()  { this.beep(220, 0.25, "square", 0.09, -120); },
  power() { [600, 900, 600, 900].forEach((f, i) => setTimeout(() => this.beep(f, 0.08, "triangle", 0.09), i * 60)); },
  heart() { [523, 659, 784].forEach((f, i) => setTimeout(() => this.beep(f, 0.14, "sine", 0.1), i * 90)); },
  level() { [392, 523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.beep(f, 0.12, "square", 0.06), i * 80)); }
};
