// The red bird. Before launch it's just a drawing (no physics body at all),
// the body is only created at the moment you let go. That avoids fighting
// the physics engine while you're dragging it around.
const BIRD_R = 22;

class Bird {
  constructor(x, y) {
    // heavy on purpose: a light bird just bounces off the crates and it feels awful
    this.body = Bodies.circle(x, y, BIRD_R, { restitution: 0.35, friction: 0.7, density: 0.012, frictionAir: 0.005 });
    this.trail = [];
    World.add(world, this.body);
  }
  display() {
    const p = this.body.position, s = Math.min(this.body.speed * 0.012, 0.18); // faster = a bit stretched
    Bird.draw(p.x, p.y, this.body.angle, 1 + s, 1 - s, this.body.speed > 6);
  }
  // Static so the sling, the waiting birds and the flying bird all share one drawing routine.
  static draw(x, y, ang, sx, sy, angry) {
    push();
    translate(x, y); rotate(ang); scale(sx, sy);
    stroke('#7a1010'); strokeWeight(3); fill('#e53935');
    triangle(-6, -20, 0, -32, 6, -20);          // little crest on top
    ellipse(0, 0, BIRD_R * 2, BIRD_R * 2);
    noStroke(); fill('#f5d6b0'); ellipse(2, 9, 26, 16); // belly
    fill(255); ellipse(5, -5, 13, 13); ellipse(-6, -5, 13, 13);
    fill(20); ellipse(7, -4, 5, 5); ellipse(-4, -4, 5, 5);
    stroke(20); strokeWeight(3);                // the eyebrows are what make him angry
    line(-12, angry ? -8 : -13, 0, -9); line(0, -9, 13, angry ? -8 : -13);
    noStroke(); fill('#ffb300'); triangle(10, 0, 10, 9, 24, 5); // beak
    pop();
  }
}
