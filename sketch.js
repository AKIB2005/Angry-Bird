// Angry Bird - main game file.
// Flow: intro -> play -> won / lost -> (click or R) -> play again.

const { Engine, World, Bodies, Body, Events, Sleeping } = Matter;

const W = 1200, H = 400;
const GROUND_Y = 390;               // top surface of the ground
const SLING = { x: 150, y: 290 };   // where the bird rests in the slingshot
const MAX_PULL = 90;                // how far you can stretch the band
const POWER = 0.22;                 // pull distance -> launch speed
const STEP = 1000 / 60;             // physics always advances in exact 60 Hz steps
const START_BIRDS = 3;

let engine, world;
let bg, cloud;                      // pre-rendered images (see buildBackground)
let blocks = [], spent = [], bird = null;
let state = 'intro', phase = 'aim'; // phase: aim | fly | load | done
let stateAt = 0, loadAt = 0, doneAt = 0;
let birdsLeft = START_BIRDS, score = 0, frames = 0, acc = 0, lastMs = 0, shake = 0;
let flyFrames = 0, calm = 0, pigsLeft = 0;
const aim = { on: false, x: SLING.x, y: SLING.y };

function setup() {
  pixelDensity(Math.min(window.devicePixelRatio || 1, 2)); // 3x phone screens would just burn battery
  createCanvas(W, H);
  textFont('Trebuchet MS');
  cloud = makeCloud();
  buildBackground();
  resetLevel();
  lastMs = millis();
}

// The sky, hills and ground never change, so paint them once and reuse the image.
// This replaced redrawing everything every frame.
function buildBackground() {
  bg = createGraphics(W, H);
  const g = bg.drawingContext.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#5bb8f5'); g.addColorStop(1, '#d8f1ff');
  bg.drawingContext.fillStyle = g;
  bg.drawingContext.fillRect(0, 0, W, H);
  bg.noStroke();
  bg.fill(255, 240, 150); bg.ellipse(1050, 70, 70, 70);                 // sun
  for (const [col, base, amp, freq] of [['#8fc7a0', 330, 40, 0.004], ['#6fb585', 360, 28, 0.007]]) {
    bg.fill(col); bg.beginShape(); bg.vertex(0, H);
    for (let x = 0; x <= W; x += 10) bg.vertex(x, base - Math.sin(x * freq + base) * amp);
    bg.vertex(W, H); bg.endShape(CLOSE);
  }
  bg.fill('#6b4423'); bg.rect(0, GROUND_Y, W, H - GROUND_Y);
  bg.fill('#4caf50'); bg.rect(0, GROUND_Y - 6, W, 10);
}

function resetLevel() {
  engine = Engine.create({ enableSleeping: true }); // resting bodies stop costing CPU
  world = engine.world;
  Events.on(engine, 'collisionStart', onCollide);
  new Ground(W / 2, GROUND_Y + 10, W * 2, 20);

  // Same tower as the original sketch, just with the positions fixed so it
  // starts at rest instead of dropping a few pixels on spawn.
  blocks = [
    new Box(700, 355, 70, 70), new Box(920, 355, 70, 70), new Pig(810, 368),
    new Log(810, 310, 300, Math.PI / 2),
    new Box(700, 265, 70, 70), new Box(920, 265, 70, 70), new Pig(810, 278),
    new Log(810, 220, 300, Math.PI / 2),
    new Box(810, 175, 70, 70),
    new Log(750, 135, 150, Math.PI / 7), new Log(870, 135, 150, -Math.PI / 7),
    new Pig(810, 118),
  ];
  pigsLeft = blocks.filter(b => b instanceof Pig).length;
  spent = []; bird = null;
  phase = 'aim'; birdsLeft = START_BIRDS; score = 0; frames = 0; acc = 0; shake = 0;
  aim.on = false; aim.x = SLING.x; aim.y = SLING.y;
  lastMs = millis();
}

function setState(s) { state = s; stateAt = millis(); }

// ---- physics -----------------------------------------------------------

function onCollide(e) {
  if (frames < 45) return; // let the tower settle before anything can break
  for (const p of e.pairs) {
    const a = p.bodyA, b = p.bodyB;
    const speed = Math.hypot(a.velocity.x - b.velocity.x, a.velocity.y - b.velocity.y);
    if (speed < 2.5) continue; // gentle touches are free
    if (a.owner && a.owner.hurt) a.owner.hurt(speed);
    if (b.owner && b.owner.hurt) b.owner.hurt(speed);
    if (speed > 5) {
      shake = Math.min(shake + speed * 0.4, 10);
      burst((a.position.x + b.position.x) / 2, (a.position.y + b.position.y) / 2, Math.min(speed | 0, 8), '#e8d9b5');
    }
  }
}

// Fixed timestep: if a frame takes long (tab was in the background, slow phone),
// we run several small steps instead of one big one. Big steps make boxes tunnel through each other.
function stepPhysics() {
  const now = millis();
  acc += Math.min(now - lastMs, 100); // clamp so we never try to catch up on a huge gap
  lastMs = now;
  while (acc >= STEP) {
    Engine.update(engine, STEP);
    acc -= STEP; frames++;
    afterStep();
  }
}

function afterStep() {
  let broke = false;
  for (let i = blocks.length - 1; i >= 0; i--) {
    if (blocks[i].hp > 0) continue;
    blocks[i].die(); blocks.splice(i, 1); broke = true;
  }
  if (broke) {
    // heads up: sleeping bodies don't notice their support vanished, so wake everyone
    for (const b of blocks) Sleeping.set(b.body, false);
    pigsLeft = blocks.filter(b => b instanceof Pig).length;
    if (pigsLeft === 0 && state === 'play') setState('won');
  }
  if (bird && phase === 'fly') {
    flyFrames++;
    if (flyFrames % 4 === 0 && bird.trail.length < 40) bird.trail.push({ x: bird.body.position.x, y: bird.body.position.y });
    calm = bird.body.speed < 0.35 ? calm + 1 : 0;
    // bird is "done" once it stops, falls off the world, or has been flying way too long
    if (calm > 70 || flyFrames > 900 || bird.body.position.x > W + 150) finishBird();
  }
}

function finishBird() {
  spent.push(bird); bird = null;
  if (birdsLeft > 0) { phase = 'load'; loadAt = millis(); }
  else { phase = 'done'; doneAt = millis(); }
}

function launch(dx, dy) {
  bird = new Bird(aim.x, aim.y);
  Body.setVelocity(bird.body, { x: dx * POWER, y: dy * POWER });
  phase = 'fly'; birdsLeft--; flyFrames = 0; calm = 0;
  aim.x = SLING.x; aim.y = SLING.y;
  shake = 3;
}

// ---- input -------------------------------------------------------------

function mousePressed() {
  if (state === 'intro') { setState('play'); return false; }
  if (state !== 'play') {
    if (millis() - stateAt > 900) { resetLevel(); setState('play'); } // small delay so a stray click doesn't skip the banner
    return false;
  }
  if (phase === 'aim' && dist(mouseX, mouseY, SLING.x, SLING.y) < 50) aim.on = true;
  return false;
}

function mouseDragged() {
  if (!aim.on) return false;
  const dx = mouseX - SLING.x, dy = mouseY - SLING.y;
  const d = Math.hypot(dx, dy) || 1, k = Math.min(d, MAX_PULL) / d;
  aim.x = SLING.x + dx * k;
  aim.y = Math.min(SLING.y + dy * k, GROUND_Y - 30); // don't let the bird get pulled into the dirt
  return false;
}

function mouseReleased() {
  if (!aim.on) return;
  aim.on = false;
  const dx = SLING.x - aim.x, dy = SLING.y - aim.y;
  if (Math.hypot(dx, dy) < 15) { aim.x = SLING.x; aim.y = SLING.y; return false; } // tiny pull = cancelled
  launch(dx, dy);
  return false;
}

function keyPressed() { if (key === 'r' || key === 'R') { resetLevel(); setState('play'); } }

// ---- drawing -----------------------------------------------------------

function draw() {
  stepPhysics();
  if (phase === 'load' && millis() - loadAt > 700) phase = 'aim';
  if (phase === 'done' && state === 'play' && millis() - doneAt > 2200 && pigsLeft > 0) setState('lost');

  image(bg, 0, 0, W, H);
  drawClouds();

  push();
  shake *= 0.9;
  if (shake > 0.2) translate(random(-shake, shake), random(-shake, shake));

  drawSlingBack();
  waitingBirds();
  for (const b of blocks) b.display();
  for (const s of spent) s.display();
  if (bird) { drawTrail(bird); bird.display(); }
  drawLoadedBird();
  drawParticles();
  pop();

  drawHud();
  if (state === 'intro') drawIntro();
  else if (state !== 'play') drawEnd();
}

function drawClouds() {
  const t = millis() * 0.01;
  for (let i = 0; i < 4; i++) {
    const x = ((i * 330 + t * (0.8 + i * 0.3)) % (W + 400)) - 200; // each cloud drifts at its own speed = cheap parallax
    image(cloud, x, 30 + i * 28);
  }
}

function drawSlingBack() {
  stroke('#5a3716'); strokeWeight(14); strokeCap(ROUND);
  line(SLING.x, GROUND_Y, SLING.x, SLING.y + 40);
  strokeWeight(10);
  line(SLING.x, SLING.y + 40, SLING.x - 14, SLING.y); // left prong
  line(SLING.x, SLING.y + 40, SLING.x + 14, SLING.y); // right prong
  if (bird === null && (phase === 'aim' || phase === 'load')) {
    stroke('#2b1608'); strokeWeight(6);
    line(SLING.x + 14, SLING.y, aim.x, aim.y); // the far band goes behind the bird
  }
}

function waitingBirds() {
  const waiting = (phase === 'aim' || phase === 'load') ? birdsLeft - 1 : birdsLeft;
  for (let i = 0; i < waiting; i++) Bird.draw(50 + i * 36, GROUND_Y - 22 + Math.sin(millis() / 300 + i) * 1.5, 0, 0.9, 0.9, false);
}

function drawLoadedBird() {
  if (phase !== 'aim' && phase !== 'load') return;
  let x = aim.x, y = aim.y, ang = 0, s = 1;
  if (phase === 'load') {
    // the next bird hops from the ground up onto the sling
    const t = constrain((millis() - loadAt) / 700, 0, 1);
    x = lerp(50, SLING.x, t); y = lerp(GROUND_Y - 22, SLING.y, easeOutBack(t)) - Math.sin(Math.PI * t) * 60;
    ang = t * TWO_PI;
  } else if (!aim.on) {
    s = 1 + Math.sin(millis() / 250) * 0.02; // idle breathing so he feels alive
  } else {
    ang = Math.atan2(SLING.y - aim.y, SLING.x - aim.x) * 0.15;
    drawAimDots();
  }
  Bird.draw(x, y, ang, s, s, aim.on);
  if (phase === 'aim') {
    stroke('#2b1608'); strokeWeight(6);
    line(SLING.x - 14, SLING.y, x - 6, y); // near band goes in front
  }
}

// Previews the flight path using roughly the same maths Matter uses
// (air friction 0.01, gravity ~0.278 px/step^2). It's an estimate, not exact.
function drawAimDots() {
  let x = aim.x, y = aim.y, vx = (SLING.x - aim.x) * POWER, vy = (SLING.y - aim.y) * POWER;
  noStroke();
  for (let i = 0; i < 40; i++) {
    vx *= 0.99; vy = vy * 0.99 + 0.278; x += vx; y += vy;
    if (i % 3 === 2) { fill(255, 255, 255, 230 - i * 5); ellipse(x, y, 7, 7); }
    if (y > GROUND_Y) break;
  }
}

function drawTrail(b) {
  noStroke();
  for (let i = 0; i < b.trail.length; i++) {
    fill(255, 255, 255, (i / b.trail.length) * 160);
    ellipse(b.trail[i].x, b.trail[i].y, 4 + i * 0.12, 4 + i * 0.12);
  }
}

function drawHud() {
  textAlign(LEFT, TOP); textSize(22); strokeWeight(4); stroke(0, 90); fill(255);
  text('SCORE  ' + score, 20, 14);
  textAlign(RIGHT, TOP);
  text('PIGS  ' + pigsLeft, W - 20, 14);
}

function drawIntro() {
  const t = (millis() - stateAt) / 1000; // stateAt is reset at boot, so the drop-in plays from the start
  const it = millis() / 1000;
  noStroke(); fill(0, 0, 0, 120); rect(0, 0, W, H);
  // title falls in and bounces like a rubber ball
  const y = lerp(-80, 140, easeOutBounce(constrain(t / 1.3, 0, 1)));
  textAlign(CENTER, CENTER); textSize(92); strokeWeight(10); stroke('#7a1010'); fill('#ff5a4f');
  text('ANGRY BIRD', W / 2, y);
  const hop = Math.abs(Math.sin(it * 3)) * 18; // the two mascots hop on opposite beats
  Bird.draw(W / 2 - 330, 150 - hop, -0.1, 1.6, 1.6, true);
  Bird.draw(W / 2 + 330, 150 - Math.abs(Math.cos(it * 3)) * 18, 0.1, -1.6, 1.6, true);
  if (t > 1.4) {
    textSize(26); strokeWeight(5); stroke(0, 120); fill(255, 255, 255, 140 + Math.sin(it * 4) * 100);
    text('click to play', W / 2, 250);
    textSize(16); strokeWeight(3); fill(255, 255, 255, 200);
    text('drag the bird back, let go, smash the pigs', W / 2, 290);
  }
}

function drawEnd() {
  const won = state === 'won';
  const t = (millis() - stateAt) / 1000 - (won ? 0.6 : 0.2); // won banner waits a beat so you see the last pig pop
  if (t < 0) return;
  noStroke(); fill(0, 0, 0, 130 * constrain(t * 3, 0, 1)); rect(0, 0, W, H);
  const s = easeOutBack(constrain(t / 0.6, 0, 1));
  push(); translate(W / 2, 130); scale(s);
  textAlign(CENTER, CENTER); textSize(70); strokeWeight(9);
  stroke(won ? '#2e7d32' : '#7a1010'); fill(won ? '#8bf06b' : '#ff5a4f');
  text(won ? 'LEVEL CLEARED!' : 'OUT OF BIRDS', 0, 0);
  pop();
  if (won) {
    const earned = constrain(birdsLeft + 1, 1, 3); // spare birds = more stars
    for (let i = 0; i < 3; i++) {
      const st = constrain((t - 0.7 - i * 0.25) / 0.4, 0, 1); // stars pop in one after another
      if (st > 0) star(W / 2 - 90 + i * 90, 235, 34 * easeOutBack(st), i < earned);
    }
  }
  if (t > 1.2) {
    textAlign(CENTER, CENTER); textSize(22); strokeWeight(4); stroke(0, 120);
    fill(255, 255, 255, 140 + Math.sin(millis() / 250) * 100);
    text('click or press R to play again', W / 2, 320);
  }
}

function star(cx, cy, r, filled) {
  stroke(filled ? '#b8860b' : '#555'); strokeWeight(4); fill(filled ? '#ffd54f' : '#444');
  beginShape();
  for (let i = 0; i < 10; i++) {
    const a = -HALF_PI + i * PI / 5, rr = i % 2 ? r * 0.45 : r;
    vertex(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  endShape(CLOSE);
}
