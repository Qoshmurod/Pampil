// Mushukcha - asosiy o'yin logikasi
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const W = canvas.width;
const H = canvas.height;
const GROUND = H - 70;

const ui = {
  fish: document.getElementById("fish"),
  dist: document.getElementById("dist"),
  best: document.getElementById("best"),
  menu: document.getElementById("menu"),
  over: document.getElementById("over"),
  result: document.getElementById("result"),
  mute: document.getElementById("muteBtn")
};

const cat = new Cat(GROUND);

let state = "menu"; // menu | play | pause | over
let speed, distance, fishCount, spawnTimer, itemTimer;
let obstacles = [], items = [], particles = [];
let stars = [], buildings = [];
let lastTime = 0;

let best = 0;
try { best = parseInt(localStorage.getItem("mushukcha_best")) || 0; } catch (e) {}
ui.best.textContent = best;

// ---- fon ----
for (let i = 0; i < 60; i++) {
  stars.push({ x: Math.random() * W, y: Math.random() * GROUND * 0.6, r: Math.random() * 1.5 + 0.3 });
}
function makeBuilding(x) {
  return { x, w: 60 + Math.random() * 80, h: 80 + Math.random() * 160, wins: Math.random() };
}
for (let x = 0; x < W + 200; x += 90) buildings.push(makeBuilding(x));

function resetGame() {
  speed = 6;
  distance = 0;
  fishCount = 0;
  spawnTimer = 60;
  itemTimer = 40;
  obstacles = [];
  items = [];
  particles = [];
  cat.reset();
}

// ---- dushmanlar va to'siqlar ----
function spawnObstacle() {
  const r = Math.random();
  if (r < 0.4) {
    obstacles.push({ type: "dog", x: W + 20, y: GROUND - 42, w: 54, h: 42, t: 0 });
  } else if (r < 0.65) {
    obstacles.push({ type: "puddle", x: W + 20, y: GROUND - 8, w: 70, h: 10 });
  } else if (r < 0.85 && distance > 300) {
    // qarg'a - faqat biroz yugurgandan keyin chiqadi
    obstacles.push({ type: "bird", x: W + 20, y: GROUND - 70, w: 44, h: 22, t: 0 });
  } else {
    obstacles.push({ type: "box", x: W + 20, y: GROUND - 34, w: 34, h: 34 });
  }
}

function spawnItem() {
  const high = Math.random() < 0.5;
  const y = high ? GROUND - 130 - Math.random() * 40 : GROUND - 40;
  if (Math.random() < 0.08) {
    items.push({ type: "milk", x: W + 20, y, w: 22, h: 30 });
  } else {
    // baliqlarni qatorasiga qo'yamiz
    const n = 1 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      items.push({ type: "fish", x: W + 20 + i * 36, y, w: 28, h: 16 });
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

// ---- yangilash ----
function update(dt) {
  speed += 0.0025 * dt;
  distance += speed * dt * 0.1;

  cat.update(dt, speed);

  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnObstacle();
    // tezlik oshgani sari to'siqlar tez-tez chiqadi
    spawnTimer = 55 + Math.random() * 70 - Math.min(speed * 2, 30);
  }
  itemTimer -= dt;
  if (itemTimer <= 0) {
    spawnItem();
    itemTimer = 70 + Math.random() * 90;
  }

  const catBox = cat.box();

  for (const o of obstacles) {
    o.x -= (o.type === "bird" ? speed + 2 : speed) * dt;
    if (o.t !== undefined) o.t += dt;
    if (!o.dead && hit(catBox, o)) {
      if (cat.shield > 0) {
        o.dead = true;
        burst(o.x + o.w / 2, o.y + o.h / 2, "#bde7ff", 14);
        Sound.meow();
      } else {
        gameOver();
        return;
      }
    }
  }
  obstacles = obstacles.filter(o => o.x + o.w > -20 && !o.dead);

  for (const it of items) {
    it.x -= speed * dt;
    if (!it.taken && hit(catBox, it)) {
      it.taken = true;
      if (it.type === "fish") {
        fishCount++;
        Sound.fish();
        burst(it.x, it.y, "#7fd3ff", 6);
      } else {
        cat.shield = 5;
        Sound.milk();
        burst(it.x, it.y, "#ffffff", 16);
      }
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

  for (const b of buildings) b.x -= speed * 0.3 * dt;
  if (buildings[0].x + buildings[0].w < 0) {
    buildings.shift();
    const last = buildings[buildings.length - 1];
    buildings.push(makeBuilding(last.x + last.w + 10));
  }

  ui.fish.textContent = fishCount;
  ui.dist.textContent = Math.floor(distance);
}

// ---- chizish ----
function drawBackground() {
  const g = ctx.createLinearGradient(0, 0, 0, GROUND);
  g.addColorStop(0, "#14123a");
  g.addColorStop(1, "#4b3b7a");
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

function drawObstacle(o) {
  switch (o.type) {
    case "dog": {
      const bob = Math.sin(o.t * 0.3) * 2;
      ctx.fillStyle = "#6b5b4b";
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
      break;
    }
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

function drawItem(it) {
  const float = Math.sin(Date.now() / 200 + it.x / 30) * 3;
  if (it.type === "fish") {
    ctx.fillStyle = "#7fd3ff";
    ctx.beginPath();
    ctx.ellipse(it.x + 11, it.y + 8 + float, 11, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(it.x + 20, it.y + 8 + float);
    ctx.lineTo(it.x + 28, it.y + 1 + float);
    ctx.lineTo(it.x + 28, it.y + 15 + float);
    ctx.fill();
    ctx.fillStyle = "#123";
    ctx.beginPath();
    ctx.arc(it.x + 5, it.y + 6 + float, 1.8, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // sut shishasi
    ctx.fillStyle = "#fff";
    roundRect(ctx, it.x, it.y + 8 + float, 22, 22, 4);
    ctx.fill();
    ctx.fillRect(it.x + 6, it.y + float, 10, 10);
    ctx.fillStyle = "#3d8bfd";
    ctx.fillRect(it.x + 5, it.y - 2 + float, 12, 4);
    ctx.fillRect(it.x + 2, it.y + 16 + float, 18, 6);
  }
}

function draw() {
  drawBackground();
  items.forEach(drawItem);
  obstacles.forEach(drawObstacle);
  cat.draw(ctx);

  for (const p of particles) {
    ctx.globalAlpha = Math.max(p.life / 50, 0);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 4, 4);
  }
  ctx.globalAlpha = 1;

  if (cat.shield > 0) {
    ctx.fillStyle = "#bde7ff";
    ctx.font = "16px sans-serif";
    ctx.fillText("Himoya: " + cat.shield.toFixed(1) + "s", 20, 60);
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
}

function gameOver() {
  state = "over";
  Sound.hit();
  burst(cat.x + 30, cat.y + 20, "#f4a23c", 20);

  const score = Math.floor(distance) + fishCount * 10;
  let msg = `Masofa: ${Math.floor(distance)} m, baliqlar: ${fishCount}<br>Umumiy ochko: <b>${score}</b>`;
  if (score > best) {
    best = score;
    try { localStorage.setItem("mushukcha_best", best); } catch (e) {}
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

document.getElementById("startBtn").onclick = startGame;
document.getElementById("againBtn").onclick = startGame;
ui.mute.onclick = () => {
  Sound.muted = !Sound.muted;
  ui.mute.textContent = Sound.muted ? "🔇" : "🔊";
};

resetGame();
requestAnimationFrame(loop);
