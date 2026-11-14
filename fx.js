// Small helpers for the "feel" of the game: easing curves, particles, clouds.

// ---- easing ----------------------------------------------------------
// t goes 0 -> 1. These are the standard easing formulas, nothing fancy.
function easeOutBack(t) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
function easeOutBounce(t) {
  const n = 7.5625, d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
}

// ---- particles -------------------------------------------------------
// Fixed pool: we never create or throw away objects while playing, so the
// garbage collector has nothing to do and there are no random frame hitches.
const POOL = 160;
const parts = Array.from({ length: POOL }, () => ({ on: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 3, col: '#fff' }));
let nextPart = 0;

function burst(x, y, n, col) {
  for (let i = 0; i < n; i++) {
    const p = parts[nextPart];
    nextPart = (nextPart + 1) % POOL; // when the pool is full we just recycle the oldest one
    const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 4;
    p.on = true; p.x = x; p.y = y;
    p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s - 2;
    p.max = p.life = 30 + Math.random() * 25;
    p.size = 2 + Math.random() * 4; p.col = col;
  }
}

function drawParticles() {
  // talking to the canvas context directly is a lot cheaper than p5's rect() for lots of tiny squares
  const ctx = drawingContext;
  for (const p of parts) {
    if (!p.on) continue;
    p.vy += 0.25; p.x += p.vx; p.y += p.vy; p.life--;
    if (p.life <= 0) { p.on = false; continue; }
    ctx.globalAlpha = p.life / p.max;
    ctx.fillStyle = p.col;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1; // easy to forget, and then everything after this turns see-through
}

// ---- clouds ----------------------------------------------------------
// Drawn once into a little image, then we just slide copies of it across the sky.
function makeCloud() {
  const g = createGraphics(200, 80);
  g.noStroke(); g.fill(255, 255, 255, 190);
  g.ellipse(60, 48, 80, 40); g.ellipse(100, 36, 90, 54); g.ellipse(140, 48, 76, 38); g.ellipse(100, 52, 120, 30);
  return g;
}
