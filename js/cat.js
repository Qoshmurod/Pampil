// Mushuk klassi - harakat, fizika va chizish
class Cat {
  constructor(groundY) {
    this.x = 120;
    this.groundY = groundY;
    this.w = 56;
    this.h = 40;
    this.reset();
  }

  reset() {
    this.y = this.groundY - this.h;
    this.vy = 0;
    this.jumps = 0;       // nechta sakragani (double jump uchun)
    this.ducking = false;
    this.onGround = true;
    this.frame = 0;
    this.shield = 0;      // sut ichsa himoya vaqti
  }

  jump() {
    if (this.jumps < 2) {
      this.vy = this.jumps === 0 ? -13 : -11;
      this.jumps++;
      this.onGround = false;
      Sound.jump();
    }
  }

  duck(on) {
    this.ducking = on && this.onGround;
  }

  update(dt, speed) {
    this.vy += 0.65 * dt;  // gravitatsiya
    this.y += this.vy * dt;

    const h = this.ducking ? 26 : this.h;
    if (this.y + h >= this.groundY) {
      this.y = this.groundY - h;
      this.vy = 0;
      this.jumps = 0;
      this.onGround = true;
    }

    this.frame += speed * 0.04 * dt;
    if (this.shield > 0) this.shield -= dt / 60;
  }

  // to'qnashuv uchun biroz kichikroq quti - o'yinchiga adolatliroq
  box() {
    const h = this.ducking ? 26 : this.h;
    return { x: this.x + 8, y: this.y + 6, w: this.w - 16, h: h - 8 };
  }

  draw(ctx) {
    const h = this.ducking ? 26 : this.h;
    const x = this.x, y = this.y;
    const run = Math.sin(this.frame) * (this.onGround ? 5 : 0);

    ctx.save();

    // himoya halqasi
    if (this.shield > 0) {
      ctx.globalAlpha = 0.35 + Math.sin(Date.now() / 100) * 0.15;
      ctx.fillStyle = "#bde7ff";
      ctx.beginPath();
      ctx.ellipse(x + this.w / 2, y + h / 2, this.w * 0.8, h * 0.95, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    const body = "#f4a23c";
    const dark = "#c9761d";

    // dum
    ctx.strokeStyle = body;
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x + 4, y + h * 0.45);
    ctx.quadraticCurveTo(x - 18, y - 4 + run, x - 8, y - 16 + run);
    ctx.stroke();

    // oyoqlar
    ctx.fillStyle = dark;
    const legY = y + h - 10;
    ctx.fillRect(x + 8 + run, legY, 7, 10);
    ctx.fillRect(x + 20 - run, legY, 7, 10);
    ctx.fillRect(x + 34 + run, legY, 7, 10);
    ctx.fillRect(x + 44 - run, legY, 7, 10);

    // tana
    ctx.fillStyle = body;
    roundRect(ctx, x, y + h * 0.25, this.w - 6, h * 0.6, 12);
    ctx.fill();

    // chiziqlar
    ctx.strokeStyle = dark;
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x + 12 + i * 9, y + h * 0.28);
      ctx.lineTo(x + 16 + i * 9, y + h * 0.5);
      ctx.stroke();
    }

    // bosh
    const hx = x + this.w - 10;
    const hy = this.ducking ? y + 10 : y + 8;
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(hx, hy, 14, 0, Math.PI * 2);
    ctx.fill();

    // quloqlar
    ctx.beginPath();
    ctx.moveTo(hx - 12, hy - 6);
    ctx.lineTo(hx - 8, hy - 22);
    ctx.lineTo(hx - 1, hy - 11);
    ctx.moveTo(hx + 1, hy - 11);
    ctx.lineTo(hx + 9, hy - 22);
    ctx.lineTo(hx + 13, hy - 5);
    ctx.fill();
    ctx.fillStyle = "#ffc9d6";
    ctx.beginPath();
    ctx.moveTo(hx - 9, hy - 9);
    ctx.lineTo(hx - 7, hy - 17);
    ctx.lineTo(hx - 3, hy - 11);
    ctx.fill();

    // ko'z
    ctx.fillStyle = "#222";
    ctx.beginPath();
    ctx.arc(hx + 5, hy - 2, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(hx + 5, hy - 4, 1.5, 1.5);

    // burun va mo'ylov
    ctx.fillStyle = "#e8677d";
    ctx.beginPath();
    ctx.arc(hx + 12, hy + 3, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#5a3a1a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hx + 10, hy + 5); ctx.lineTo(hx + 22, hy + 3);
    ctx.moveTo(hx + 10, hy + 6); ctx.lineTo(hx + 22, hy + 8);
    ctx.stroke();

    ctx.restore();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
