// Mushukcha - asosiy o'yin logikasi
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;
const GROUND = H - 70;

const ui = {
  lives: document.getElementById("lives"),
  level: document.getElementById("level"),
  fish: document.getElementById("fish"),
  score: document.getElementById("score"),
  dist: document.getElementById("dist"),
  best: document.getElementById("best"),
  menu: document.getElementById("menu"),
  over: document.getElementById("over"),
  result: document.getElementById("result"),
  mute: document.getElementById("muteBtn"),
  diffInfo: document.getElementById("diffInfo"),
  hud: document.getElementById("hud")
};

// ---- qiyinlik darajalari ----
const DIFFS = {
  easy:   { name: "Oson",  lives: 5, speed: 5,   accel: 0.0018, spawnMul: 1.25, info: "5 jon, sekinroq boshlanadi" },
  normal: { name: "O'rta", lives: 3, speed: 6,   accel: 0.0025, spawnMul: 1,    info: "3 jon, oddiy tezlik" },
  hard:   { name: "Qiyin", lives: 1, speed: 7.5, accel: 0.0035, spawnMul: 0.8,  info: "1 jon, tez va to'siqlar ko'p" }
};
const LEVEL_LEN = 400;   // har necha metrda yangi daraja
const MAX_LIVES = 5;
const COMBO_TIME = 1.5;  // shu soniya ichida keyingi baliqni olsangiz kombo oshadi

const cat = new Cat(GROUND);

let diffKey = "normal";
try { diffKey = localStorage.getItem("mushukcha_diff") || "normal"; } catch (e) {}
if (!DIFFS[diffKey]) diffKey = "normal";

let state = "menu"; // menu | play | pause | over
let speed, distance, score, fishCount, spawnTimer, itemTimer;
let lives, level, combo, comboTimer, magnet, star, shake, banner;
let obstacles = [], items = [], particles = [], popups = [];
let stars = [], buildings = [];
let lastTime = 0;
let best = 0;

function bestKey() { return "mushukcha_best_" + diffKey; }
function loadBest() {
  best = 0;
  try { best = parseInt(localStorage.getItem(bestKey())) || 0; } catch (e) {}
  ui.best.textContent = best;
}

// ---- fon ----
for (let i = 0; i < 60; i++) {
  stars.push({ x: Math.random() * W, y: Math.random() * GROUND * 0.6, r: Math.random() * 1.5 + 0.3 });
}
function makeBuilding(x) {
  return { x, w: 60 + Math.random() * 80, h: 80 + Math.random() * 160, wins: Math.random() };
}
for (let x = 0; x < W + 200; x += 90) buildings.push(makeBuilding(x));

function resetGame() {
  const d = DIFFS[diffKey];
  speed = d.speed;
  distance = 0;
  score = 0;
  fishCount = 0;
  spawnTimer = 60;
  itemTimer = 40;
  lives = d.lives;
  level = 1;
  combo = 0;
  comboTimer = 0;
  magnet = 0;
  star = 0;
  shake = 0;
  banner = { text: "Daraja 1", t: 90 };
  obstacles = [];
  items = [];
  particles = [];
  popups = [];
  cat.reset();
  updateHud();
}

// ---- dushmanlar va to'siqlar ----
// har bir darajada qaysi to'siqlar chiqishi mumkin [turi, ehtimollik og'irligi]
function obstaclePool() {
  const p = [["dog", 4], ["puddle", 3], ["box", 3]];
  if (level >= 2) p.push(["bird", 3], ["gap", 3]);
  if (level >= 3) p.push(["chimney", 2], ["bat", 3]);
  if (level >= 4) p.push(["hopdog", 3], ["boxes", 2]);
  if (level >= 5) p.push(["gap", 2], ["bat", 2], ["combo", 2]);
  return p;
}

function pick(pool) {
  let total = pool.reduce((s, p) => s + p[1], 0);
  let r = Math.random() * total;
  for (const [type, w] of pool) {
    if ((r -= w) < 0) return type;
  }
  return pool[0][0];
}

function addObstacle(type, x) {
  switch (type) {
    case "dog":
      obstacles.push({ type, x, y: GROUND - 42, w: 54, h: 42, t: 0 });
      break;
    case "hopdog":
      obstacles.push({ type, x, y: GROUND - 42, w: 54, h: 42, t: Math.random() * 40 });
      break;
    case "puddle":
      obstacles.push({ type, x, y: GROUND - 8, w: 70, h: 10 });
      break;
    case "box":
      obstacles.push({ type, x, y: GROUND - 34, w: 34, h: 34 });
      break;
    case "boxes":
      // uchta qutidan piramida
      obstacles.push({ type: "box", x, y: GROUND - 34, w: 34, h: 34 });
      obstacles.push({ type: "box", x: x + 34, y: GROUND - 34, w: 34, h: 34 });
      obstacles.push({ type: "box", x: x + 17, y: GROUND - 68, w: 34, h: 34 });
      break;
    case "bird":
      // past uchadi - egilish kerak
      obstacles.push({ type, x, y: GROUND - 52, w: 44, h: 22, t: 0 });
      break;
    case "bat": {
      const baseY = GROUND - 95;
      obstacles.push({ type, x, baseY, y: baseY, w: 34, h: 20, t: Math.random() * 80 });
      break;
    }
    case "chimney":
      obstacles.push({ type, x, y: GROUND - 74, w: 38, h: 74 });
      break;
    case "gap": {
      const w = Math.min(80 + Math.random() * 50 + level * 8, 180);
      obstacles.push({ type, x, y: GROUND, w, h: H - GROUND });
      break;
    }
    case "combo":
      // chuqurlik va uning ortidan qarg'a
      addObstacle("gap", x);
      addObstacle("bird", x + 260 + speed * 10);
      break;
  }
}

function spawnObstacle() {
  addObstacle(pick(obstaclePool()), W + 20);
}

function spawnItem() {
  const high = Math.random() < 0.5;
  const y = high ? GROUND - 130 - Math.random() * 40 : GROUND - 40;
  const r = Math.random();
  let type = null;
  if (r < 0.05) type = "milk";
  else if (r < 0.09 && level >= 2) type = "magnet";
  else if (r < 0.12 && level >= 2) type = "star";
  else if (r < 0.145 && lives < MAX_LIVES) type = "heart";

  if (type) {
    items.push({ type, x: W + 20, y, w: 24, h: 28 });
  } else {
    // baliqlarni qatorasiga yoki yoy shaklida qo'yamiz
    const n = 2 + Math.floor(Math.random() * 4);
    const arc = high && Math.random() < 0.5;
    for (let i = 0; i < n; i++) {
      const dy = arc ? -Math.sin((i / (n - 1)) * Math.PI) * 40 : 0;
      items.push({ type: "fish", x: W + 20 + i * 36, y: y + dy, w: 28, h: 16 });
    }
  }
}

function hit(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function burst(x, y, color, n = 10) {
  for (let i = 0; i < n; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 1) * 5,
      life: 30 + Math.random() * 20,
      color
    });
  }
}

function popup(x, y, text, color = "#fff") {
  popups.push({ x, y, text, color, life: 50 });
}

// mushuk ostida tom bormi?
function solidUnder() {
  const l = cat.x + 12, r = cat.x + cat.w - 18;
  for (const o of obstacles) {
    if (o.type === "gap" && l >= o.x && r <= o.x + o.w) return false;
  }
  return true;
}

// jon yo'qotish; o'yin tugasa true qaytaradi
function loseLife() {
  lives--;
  combo = 0;
  shake = 14;
  burst(cat.x + 30, cat.y + 20, "#f4a23c", 16);
  updateHud();
  if (lives <= 0) {
    gameOver();
    return true;
  }
  Sound.hurt();
  cat.hurt = 1.5;
  return false;
}

// chuqurlikka tushgandan keyin tomga qaytarish
function respawn() {
  obstacles = obstacles.filter(o => !(o.x < cat.x + cat.w + 60));
  cat.y = GROUND - cat.h;
  cat.vy = 0;
  cat.jumps = 0;
  cat.onGround = true;
  cat.hurt = 2;
}

// ---- yangilash ----
function update(dt) {
  const d = DIFFS[diffKey];
  speed += d.accel * dt;
  const step = speed * dt * 0.1;
  distance += step;
  score += step * (star > 0 ? 2 : 1);

  // yangi daraja
  const newLevel = 1 + Math.floor(distance / LEVEL_LEN);
  if (newLevel > level) {
    level = newLevel;
    speed += 0.4;
    banner = { text: "Daraja " + level, t: 110 };
    Sound.level();
  }

  cat.update(dt, speed, solidUnder());

  // chuqurlikka tushdi
  if (cat.y > H + 20) {
    if (loseLife()) return;
    respawn();
  }

  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnObstacle();
    // tezlik va daraja oshgani sari to'siqlar tez-tez chiqadi
    spawnTimer = (55 + Math.random() * 70 - Math.min(speed * 2, 30) - Math.min(level * 3, 15)) * d.spawnMul;
    spawnTimer = Math.max(spawnTimer, 32);
  }
  itemTimer -= dt;
  if (itemTimer <= 0) {
    spawnItem();
    itemTimer = 70 + Math.random() * 90;
  }

  if (comboTimer > 0) {
    comboTimer -= dt / 60;
    if (comboTimer <= 0) combo = 0;
  }
  if (magnet > 0) magnet -= dt / 60;
  if (star > 0) star -= dt / 60;
  if (shake > 0) shake -= dt;
  if (banner.t > 0) banner.t -= dt;

  const catBox = cat.box();

  for (const o of obstacles) {
    const extra = o.type === "bird" ? 2 : o.type === "bat" ? 1 : 0;
    o.x -= (speed + extra) * dt;
    if (o.t !== undefined) o.t += dt;
    if (o.type === "bat") o.y = o.baseY + Math.sin(o.t * 0.07) * 45;
    if (o.type === "hopdog") o.y = GROUND - 42 - Math.abs(Math.sin(o.t * 0.06)) * 75;

    if (o.type === "gap" || o.dead) continue;
    if (hit(catBox, o)) {
      if (cat.shield > 0) {
        o.dead = true;
        burst(o.x + o.w / 2, o.y + o.h / 2, "#bde7ff", 14);
        popup(o.x, o.y, "+20", "#bde7ff");
        score += 20;
        Sound.meow();
      } else if (cat.hurt <= 0) {
        o.dead = true;
        if (loseLife()) return;
      }
    }
  }
  obstacles = obstacles.filter(o => o.x + o.w > -20 && !o.dead);

  const cx = cat.x + cat.w / 2, cy = cat.y + cat.h / 2;
  for (const it of items) {
    it.x -= speed * dt;
    // magnit baliqlarni tortadi
    if (magnet > 0 && it.type === "fish") {
      const dx = cx - it.x, dy = cy - it.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 260) {
        it.x += (dx / dist) * 9 * dt;
        it.y += (dy / dist) * 9 * dt;
      }
    }
    if (!it.taken && hit(catBox, it)) {
      it.taken = true;
      collect(it);
    }
  }
  items = items.filter(it => it.x > -40 && !it.taken);

  for (const p of particles) {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 0.2 * dt;
    p.life -= dt;
  }
  particles = particles.filter(p => p.life > 0);
  for (const p of popups) {
    p.y -= 0.8 * dt;
    p.life -= dt;
  }
  popups = popups.filter(p => p.life > 0);

  for (const b of buildings) b.x -= speed * 0.3 * dt;
  if (buildings[0].x + buildings[0].w < 0) {
    buildings.shift();
    const last = buildings[buildings.length - 1];
    buildings.push(makeBuilding(last.x + last.w + 10));
  }

  updateHud();
}

function collect(it) {
  switch (it.type) {
    case "fish": {
      fishCount++;
      combo = comboTimer > 0 ? Math.min(combo + 1, 5) : 1;
      comboTimer = COMBO_TIME;
      const pts = 10 * combo * (star > 0 ? 2 : 1);
      score += pts;
      popup(it.x, it.y, "+" + pts, combo > 1 ? "#ffd76a" : "#7fd3ff");
      Sound.fish();
      burst(it.x, it.y, "#7fd3ff", 6);
      break;
    }
    case "milk":
      cat.shield = 5;
      Sound.milk();
      burst(it.x, it.y, "#ffffff", 16);
      break;
    case "magnet":
      magnet = 8;
      Sound.power();
      popup(it.x, it.y, "Magnit!", "#ff6b6b");
      burst(it.x, it.y, "#ff6b6b", 14);
      break;
    case "star":
      star = 8;
      Sound.power();
      popup(it.x, it.y, "x2 ochko!", "#ffd76a");
      burst(it.x, it.y, "#ffd76a", 16);
      break;
    case "heart":
      lives = Math.min(lives + 1, MAX_LIVES);
      Sound.heart();
      popup(it.x, it.y, "+1 jon", "#ff7aa2");
      burst(it.x, it.y, "#ff7aa2", 14);
      break;
  }
}

function updateHud() {
  ui.lives.textContent = "❤️".repeat(Math.max(lives, 0)) + "🖤".repeat(Math.max(DIFFS[diffKey].lives - lives, 0));
  ui.level.textContent = level;
  ui.fish.textContent = fishCount;
  ui.score.textContent = Math.floor(score);
  ui.dist.textContent = Math.floor(distance);
}

// ---- chizish ----
function drawBackground() {
  // har darajada osmon rangi biroz o'zgaradi
  const hue = (level - 1) * 18;
  const g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, `hsl(${245 + hue}, 52%, 15%)`);
  g.addColorStop(1, `hsl(${258 + hue}, 35%, 36%)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#fff";
  for (const s of stars) {
    ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 500 + s.x) * 0.4;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // oy
  ctx.fillStyle = "rgba(255, 246, 201, 0.15)";
  ctx.beginPath();
  ctx.arc(W - 110, 80, 50, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff6c9";
  ctx.beginPath();
  ctx.arc(W - 110, 80, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e8dca8";
  ctx.beginPath();
  ctx.arc(W - 120, 72, 6, 0, Math.PI * 2);
  ctx.arc(W - 100, 92, 4, 0, Math.PI * 2);
  ctx.fill();

  // uzoqdagi binolar
  for (const b of buildings) {
    ctx.fillStyle = "#2a2450";
    ctx.fillRect(b.x, GROUND - b.h, b.w, b.h);
    ctx.fillStyle = "#ffd76a";
    for (let wy = GROUND - b.h + 12; wy < GROUND - 14; wy += 22) {
      for (let wx = b.x + 8; wx < b.x + b.w - 10; wx += 16) {
        if ((wx * 7 + wy * 3 + b.wins * 100) % 5 < 2) ctx.fillRect(wx, wy, 7, 10);
      }
    }
  }

  // tom (yer)
  ctx.fillStyle = "#8b3a3a";
  ctx.fillRect(0, GROUND, W, H - GROUND);
  ctx.fillStyle = "#6e2c2c";
  const off = (distance * 10) % 40;
  for (let x = -off; x < W; x += 40) {
    ctx.fillRect(x, GROUND, 4, H - GROUND);
  }
  ctx.fillStyle = "#a54848";
  ctx.fillRect(0, GROUND, W, 6);
}

function drawGap(o) {
  const g = ctx.createLinearGradient(0, GROUND, 0, H);
  g.addColorStop(0, "#15122e");
  g.addColorStop(1, "#05040d");
  ctx.fillStyle = g;
  ctx.fillRect(o.x, GROUND, o.w, H - GROUND);
  // tom chetlari
  ctx.fillStyle = "#5e2222";
  ctx.fillRect(o.x - 4, GROUND, 4, H - GROUND);
  ctx.fillRect(o.x + o.w, GROUND, 4, H - GROUND);
}

function drawDog(o) {
  const bob = o.type === "dog" ? Math.sin(o.t * 0.3) * 2 : 0;
  ctx.fillStyle = o.type === "hopdog" ? "#8a6a3b" : "#6b5b4b";
  roundRect(ctx, o.x + 6, o.y + 12 + bob, 42, 22, 8);
  ctx.fill();
  ctx.fillRect(o.x + 10, o.y + 32, 6, 10);
  ctx.fillRect(o.x + 36, o.y + 32, 6, 10);
  ctx.beginPath();
  ctx.arc(o.x + 8, o.y + 12 + bob, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#4a3e33";
  ctx.beginPath();
  ctx.ellipse(o.x + 14, o.y + 6 + bob, 4, 9, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c22";
  ctx.beginPath();
  ctx.arc(o.x + 3, o.y + 10 + bob, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(o.x - 3, o.y + 15 + bob, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawObstacle(o) {
  switch (o.type) {
    case "gap":
      break; // fonda alohida chiziladi
    case "dog":
    case "hopdog":
      drawDog(o);
      break;
    case "puddle":
      ctx.fillStyle = "#4aa8e0";
      ctx.beginPath();
      ctx.ellipse(o.x + o.w / 2, o.y + 6, o.w / 2, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillRect(o.x + 18, o.y + 3, 14, 2);
      break;
    case "bird": {
      const flap = Math.sin(o.t * 0.4) * 10;
      ctx.fillStyle = "#222";
      ctx.beginPath();
      ctx.ellipse(o.x + 22, o.y + 12, 16, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(o.x + 14, o.y + 10);
      ctx.lineTo(o.x + 24, o.y - 4 + flap);
      ctx.lineTo(o.x + 30, o.y + 10);
      ctx.fill();
      ctx.fillStyle = "#f6b93b";
      ctx.beginPath();
      ctx.moveTo(o.x + 4, o.y + 10);
      ctx.lineTo(o.x - 4, o.y + 13);
      ctx.lineTo(o.x + 6, o.y + 15);
      ctx.fill();
      break;
    }
    case "bat": {
      const flap = Math.sin(o.t * 0.6) * 8;
      ctx.fillStyle = "#6c3fa0";
      ctx.beginPath();
      ctx.moveTo(o.x + 17, o.y + 10);
      ctx.lineTo(o.x - 2, o.y + 2 + flap);
      ctx.lineTo(o.x + 6, o.y + 14);
      ctx.moveTo(o.x + 17, o.y + 10);
      ctx.lineTo(o.x + 36, o.y + 2 + flap);
      ctx.lineTo(o.x + 28, o.y + 14);
      ctx.fill();
      ctx.fillStyle = "#3e2160";
      ctx.beginPath();
      ctx.ellipse(o.x + 17, o.y + 11, 7, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff4d4d";
      ctx.fillRect(o.x + 13, o.y + 8, 2, 2);
      ctx.fillRect(o.x + 19, o.y + 8, 2, 2);
      break;
    }
    case "chimney":
      ctx.fillStyle = "#7a3b2e";
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = "#5c2b21";
      ctx.fillRect(o.x - 4, o.y, o.w + 8, 10);
      ctx.strokeStyle = "#5c2b21";
      ctx.lineWidth = 1;
      for (let yy = o.y + 18; yy < o.y + o.h; yy += 12) {
        ctx.beginPath();
        ctx.moveTo(o.x, yy);
        ctx.lineTo(o.x + o.w, yy);
        ctx.stroke();
      }
      // tutun
      ctx.fillStyle = "rgba(200,200,220,0.25)";
      for (let i = 0; i < 3; i++) {
        const s = (Date.now() / 30 + i * 20) % 60;
        ctx.beginPath();
        ctx.arc(o.x + o.w / 2 + s * 0.3, o.y - s, 6 + s * 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case "box":
      ctx.fillStyle = "#b07d45";
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.strokeStyle = "#7a5228";
      ctx.lineWidth = 2;
      ctx.strokeRect(o.x + 1, o.y + 1, o.w - 2, o.h - 2);
      ctx.beginPath();
      ctx.moveTo(o.x, o.y); ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.moveTo(o.x + o.w, o.y); ctx.lineTo(o.x, o.y + o.h);
      ctx.stroke();
      break;
  }
}

function drawHeart(x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.3);
  ctx.bezierCurveTo(x, y, x - s / 2, y, x - s / 2, y + s * 0.3);
  ctx.bezierCurveTo(x - s / 2, y + s * 0.6, x, y + s * 0.8, x, y + s);
  ctx.bezierCurveTo(x, y + s * 0.8, x + s / 2, y + s * 0.6, x + s / 2, y + s * 0.3);
  ctx.bezierCurveTo(x + s / 2, y, x, y, x, y + s * 0.3);
  ctx.fill();
}

function drawStar(x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.45;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

function drawItem(it) {
  const float = Math.sin(Date.now() / 200 + it.x / 30) * 3;
  const y = it.y + float;
  switch (it.type) {
    case "fish":
      ctx.fillStyle = "#7fd3ff";
      ctx.beginPath();
      ctx.ellipse(it.x + 11, y + 8, 11, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(it.x + 20, y + 8);
      ctx.lineTo(it.x + 28, y + 1);
      ctx.lineTo(it.x + 28, y + 15);
      ctx.fill();
      ctx.fillStyle = "#123";
      ctx.beginPath();
      ctx.arc(it.x + 5, y + 6, 1.8, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "milk":
      ctx.fillStyle = "#fff";
      roundRect(ctx, it.x, y + 8, 22, 22, 4);
      ctx.fill();
      ctx.fillRect(it.x + 6, y, 10, 10);
      ctx.fillStyle = "#3d8bfd";
      ctx.fillRect(it.x + 5, y - 2, 12, 4);
      ctx.fillRect(it.x + 2, y + 16, 18, 6);
      break;
    case "magnet":
      ctx.strokeStyle = "#e63946";
      ctx.lineWidth = 7;
      ctx.lineCap = "butt";
      ctx.beginPath();
      ctx.arc(it.x + 12, y + 12, 9, Math.PI, 0, true);
      ctx.stroke();
      ctx.fillStyle = "#ddd";
      ctx.fillRect(it.x - 0.5, y + 2, 7, 8);
      ctx.fillRect(it.x + 17.5, y + 2, 7, 8);
      break;
    case "star":
      drawStar(it.x + 12, y + 14, 14, "#ffd76a");
      break;
    case "heart":
      drawHeart(it.x + 12, y + 2, 24, "#ff4d7a");
      break;
  }
}

function drawStatus() {
  ctx.font = "bold 15px sans-serif";
  let y = 58;
  const line = (text, color) => {
    ctx.fillStyle = color;
    ctx.fillText(text, 20, y);
    y += 20;
  };
  if (cat.shield > 0) line("🥛 Himoya: " + cat.shield.toFixed(1) + "s", "#bde7ff");
  if (magnet > 0) line("🧲 Magnit: " + magnet.toFixed(1) + "s", "#ff8b8b");
  if (star > 0) line("⭐ x2 ochko: " + star.toFixed(1) + "s", "#ffd76a");
  if (combo > 1) line("Kombo x" + combo, "#ffd76a");
}

function draw() {
  ctx.save();
  if (shake > 0) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);

  drawBackground();
  obstacles.forEach(o => o.type === "gap" && drawGap(o));
  items.forEach(drawItem);
  obstacles.forEach(drawObstacle);
  cat.draw(ctx);

  for (const p of particles) {
    ctx.globalAlpha = Math.max(p.life / 50, 0);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 4, 4);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  ctx.font = "bold 16px sans-serif";
  for (const p of popups) {
    ctx.globalAlpha = Math.min(p.life / 25, 1);
    ctx.fillStyle = p.color;
    ctx.fillText(p.text, p.x, p.y);
  }
  ctx.globalAlpha = 1;

  if (state === "play" || state === "pause") drawStatus();

  if (state !== "menu" && banner.t > 0) {
    ctx.globalAlpha = Math.min(banner.t / 30, 1);
    ctx.fillStyle = "#ffb347";
    ctx.font = "bold 44px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(banner.text, W / 2, H / 2 - 40);
    ctx.textAlign = "left";
    ctx.globalAlpha = 1;
  }

  if (state === "pause") {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 40px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PAUZA", W / 2, H / 2);
    ctx.textAlign = "left";
  }
}

function loop(time) {
  // dt = 60fps ga nisbatan, shunda har xil monitorlarda tezlik bir xil
  const dt = Math.min((time - lastTime) / 16.67, 3);
  lastTime = time;
  if (state === "play") update(dt);
  else if (shake > 0) shake -= dt;
  draw();
  requestAnimationFrame(loop);
}

// ---- holatlar ----
function startGame() {
  Sound.init();
  resetGame();
  state = "play";
  ui.menu.classList.add("hidden");
  ui.over.classList.add("hidden");
  ui.hud.classList.remove("hidden");
}

function showMenu() {
  state = "menu";
  resetGame();
  ui.over.classList.add("hidden");
  ui.menu.classList.remove("hidden");
  ui.hud.classList.add("hidden");
}

function gameOver() {
  state = "over";
  Sound.hit();
  shake = 18;
  burst(cat.x + 30, cat.y + 20, "#f4a23c", 20);

  const final = Math.floor(score);
  let msg = `${DIFFS[diffKey].name} rejim · Daraja ${level}<br>` +
            `Masofa: ${Math.floor(distance)} m, baliqlar: ${fishCount}<br>Umumiy ochko: <b>${final}</b>`;
  if (final > best) {
    best = final;
    try { localStorage.setItem(bestKey(), best); } catch (e) {}
    ui.best.textContent = best;
    msg += "<br>🎉 Yangi rekord!";
  }
  ui.result.innerHTML = msg;
  setTimeout(() => ui.over.classList.remove("hidden"), 500);
}

function togglePause() {
  if (state === "play") state = "pause";
  else if (state === "pause") state = "play";
}

function setDiff(key) {
  diffKey = key;
  try { localStorage.setItem("mushukcha_diff", key); } catch (e) {}
  document.querySelectorAll("#diffs button").forEach(b => {
    b.classList.toggle("active", b.dataset.diff === key);
  });
  ui.diffInfo.textContent = DIFFS[key].info;
  loadBest();
  resetGame();
}

// ---- boshqaruv ----
document.addEventListener("keydown", e => {
  if (["Space", "ArrowUp", "ArrowDown"].includes(e.code)) e.preventDefault();

  if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
    if (state === "play") cat.jump();
    else if (state === "menu" || (state === "over" && !ui.over.classList.contains("hidden"))) startGame();
  }
  if (e.code === "ArrowDown" || e.code === "KeyS") cat.duck(true);
  if (e.code === "KeyP") togglePause();
});

document.addEventListener("keyup", e => {
  if (e.code === "ArrowDown" || e.code === "KeyS") cat.duck(false);
});

canvas.addEventListener("pointerdown", e => {
  e.preventDefault();
  if (state === "play") cat.jump();
});

// boshqa oynaga o'tilsa avtomatik pauza
window.addEventListener("blur", () => { if (state === "play") state = "pause"; });

document.querySelectorAll("#diffs button").forEach(b => {
  b.onclick = () => setDiff(b.dataset.diff);
});
document.getElementById("startBtn").onclick = startGame;
document.getElementById("againBtn").onclick = startGame;
document.getElementById("menuBtn").onclick = showMenu;
ui.mute.onclick = () => {
  Sound.muted = !Sound.muted;
  ui.mute.textContent = Sound.muted ? "🔇" : "🔊";
};

setDiff(diffKey);
requestAnimationFrame(loop);
