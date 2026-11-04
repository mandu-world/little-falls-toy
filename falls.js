const cv = document.getElementById("falls");
const cx = cv.getContext("2d");
const countEl = document.getElementById("count");
let W = 0;
let H = 0;

function size() {
  W = cv.width = window.innerWidth;
  H = cv.height = window.innerHeight;
}
size();
window.addEventListener("resize", size);

const drops = [];
const ripples = [];
const spray = [];
let splashes = 0;

// stones are kept as fractions so they stay in place when the window changes
const stones = [
  { fx: 0.5, fy: 0.45, fr: 0.035 },
  { fx: 0.43, fy: 0.62, fr: 0.03 }
];

function ledgeY() { return H * 0.12; }
function poolY() { return H * 0.85; }

function spawn() {
  if (drops.length > 900) return;
  for (let i = 0; i < 3; i++) {
    drops.push({
      x: W * (0.46 + Math.random() * 0.08),
      y: ledgeY(),
      vx: (Math.random() - 0.5) * 0.4,
      vy: Math.random() * 0.5
    });
  }
}

function makeSpray(x) {
  const n = 1 + Math.floor(Math.random() * 2);
  for (let k = 0; k < n; k++) {
    spray.push({
      x: x,
      y: poolY(),
      vx: (Math.random() - 0.5) * 2,
      vy: -1.2 - Math.random() * 2,
      a: 0.9
    });
  }
}

function step() {
  spawn();
  const g = 0.15;
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    d.vy += g;
    d.x += d.vx;
    d.y += d.vy;
    for (const s of stones) {
      const sx = s.fx * W;
      const sy = s.fy * H;
      const r = s.fr * Math.min(W, H) * 2;
      const dx = d.x - sx;
      const dy = d.y - sy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < r && dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;
        d.x = sx + nx * r;
        d.y = sy + ny * r;
        const dot = d.vx * nx + d.vy * ny;
        if (dot < 0) {
          d.vx = (d.vx - 2 * dot * nx) * 0.5 + (Math.random() - 0.5) * 0.6;
          d.vy = (d.vy - 2 * dot * ny) * 0.5;
        }
      }
    }
    if (d.y > poolY()) {
      if (Math.random() < 0.08) {
        ripples.push({ x: d.x, r: 2, a: 0.8 });
      }
      if (Math.random() < 0.12) {
        makeSpray(d.x);
      }
      splashes++;
      drops.splice(i, 1);
    } else if (d.x < -20 || d.x > W + 20) {
      drops.splice(i, 1);
    }
  }
  for (let i = spray.length - 1; i >= 0; i--) {
    const p = spray[i];
    p.vy += g;
    p.x += p.vx;
    p.y += p.vy;
    p.a -= 0.01;
    if ((p.y > poolY() && p.vy > 0) || p.a <= 0) spray.splice(i, 1);
  }
  for (let i = ripples.length - 1; i >= 0; i--) {
    const rp = ripples[i];
    rp.r += 0.8;
    rp.a -= 0.015;
    if (rp.a <= 0) ripples.splice(i, 1);
  }
}

function draw() {
  cx.fillStyle = "#1d2f2a";
  cx.fillRect(0, 0, W, H);

  // mossy rocks on the sides
  cx.fillStyle = "#2f4a3a";
  cx.fillRect(0, ledgeY(), W * 0.44, H);
  cx.fillRect(W * 0.56, ledgeY(), W * 0.44, H);
  cx.fillStyle = "#3d5e45";
  cx.fillRect(0, ledgeY() - 8, W, 10);

  // stones
  for (const s of stones) {
    const r = s.fr * Math.min(W, H) * 2;
    cx.fillStyle = "#7c8580";
    cx.beginPath();
    cx.arc(s.fx * W, s.fy * H, r, 0, Math.PI * 2);
    cx.fill();
    cx.fillStyle = "#5f8a5a";
    cx.beginPath();
    cx.arc(s.fx * W - r * 0.2, s.fy * H - r * 0.4, r * 0.4, 0, Math.PI * 2);
    cx.fill();
  }

  // drops
  cx.fillStyle = "#bfe6f2";
  for (const d of drops) {
    cx.fillRect(d.x, d.y, 2, 4);
  }

  // pool
  cx.fillStyle = "#2c5d6b";
  cx.fillRect(0, poolY(), W, H - poolY());

  for (const rp of ripples) {
    cx.strokeStyle = "rgba(220, 245, 250, " + rp.a + ")";
    cx.beginPath();
    cx.ellipse(rp.x, poolY() + 6, rp.r, rp.r * 0.3, 0, 0, Math.PI * 2);
    cx.stroke();
  }

  // little jumps of water above the pool
  for (const p of spray) {
    cx.fillStyle = "rgba(230, 248, 252, " + Math.max(0, p.a) + ")";
    cx.fillRect(p.x, p.y, 2, 2);
  }

  countEl.textContent = "splashes: " + splashes;
}

function loop() {
  step();
  draw();
  requestAnimationFrame(loop);
}
loop();

cv.addEventListener("pointerdown", function (e) {
  const px = e.clientX;
  const py = e.clientY;
  for (let i = 0; i < stones.length; i++) {
    const s = stones[i];
    const r = s.fr * Math.min(W, H) * 2;
    const dx = px - s.fx * W;
    const dy = py - s.fy * H;
    if (dx * dx + dy * dy < r * r) {
      stones.splice(i, 1);
      return;
    }
  }
  if (stones.length < 12 && py > ledgeY() && py < poolY()) {
    stones.push({ fx: px / W, fy: py / H, fr: 0.02 + Math.random() * 0.02 });
  }
});
