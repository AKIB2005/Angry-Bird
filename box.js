// Block is the shared base for everything that can get smashed: crates, logs, pigs.
// It owns the physics body, the health bar (invisible) and the "I broke" logic,
// so the subclasses only have to describe how they look.
class Block {
  constructor(body, w, h, hp, tough, soft) {
    this.body = body;
    this.w = w; this.h = h;
    this.hp = this.maxHp = hp;
    this.tough = tough; // impacts slower than this do nothing
    this.soft = soft;   // how much each extra bit of speed hurts
    this.dust = '#d9b382';
    body.owner = this;  // lets the collision handler jump from a Matter body back to us
    World.add(world, body);
  }
  hurt(speed) { this.hp -= Math.max(0, speed - this.tough) * this.soft; }
  get damage() { return 1 - Math.max(this.hp, 0) / this.maxHp; }
  die() {
    World.remove(world, this.body);
    burst(this.body.position.x, this.body.position.y, 14, this.dust);
  }
  display() {
    const p = this.body.position;
    push();
    translate(p.x, p.y);
    rotate(this.body.angle);
    this.paint();
    this.scar();
    pop();
  }
  // darker + cracked as it takes damage, so you can tell what's about to fall
  scar() {
    const d = this.damage;
    if (d < 0.05) return;
    noStroke(); fill(0, 0, 0, d * 110);
    rectMode(CENTER); rect(0, 0, this.w, this.h);
    if (d > 0.5) {
      stroke(40, 20, 10); strokeWeight(2);
      line(-this.w * 0.3, -this.h * 0.4, 0, 0); line(0, 0, this.w * 0.25, this.h * 0.35);
    }
  }
}

class Box extends Block {
  constructor(x, y, w, h) {
    // density is what makes a crate feel heavier than a pig; restitution kept low so stacks don't jitter
    super(Bodies.rectangle(x, y, w, h, { restitution: 0.15, friction: 0.8, density: 0.002 }), w, h, 150, 4, 7);
  }
  paint() {
    rectMode(CENTER);
    stroke('#7a4a1d'); strokeWeight(4); fill('#c68642');
    rect(0, 0, this.w, this.h);
    strokeWeight(3); // the little X brace
    line(-this.w / 2, -this.h / 2, this.w / 2, this.h / 2);
    line(this.w / 2, -this.h / 2, -this.w / 2, this.h / 2);
  }
}
