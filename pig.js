// The enemy. Round now (squares were hard to roll), softer than wood so they pop first.
class Pig extends Block {
  constructor(x, y) {
    super(Bodies.circle(x, y, 22, { restitution: 0.2, friction: 0.5, density: 0.0015 }), 44, 44, 100, 2.5, 12);
    this.dust = '#7ed957';
    this.seed = Math.random() * 1000; // so the pigs don't all blink in sync
  }
  die() { super.die(); score += 5000; }
  scar() {} // pigs show damage with their face instead
  paint() {
    const t = millis() / 1000 + this.seed;
    const breathe = 1 + Math.sin(t * 3) * 0.03;
    const blink = (t % 3.2) > 3.05;
    const hurt = this.damage > 0.4;
    scale(breathe, 2 - breathe);
    stroke('#3f8f2a'); strokeWeight(3); fill('#7ed957');
    ellipse(0, 0, 44, 44);
    ellipse(-17, -16, 12, 12); ellipse(17, -16, 12, 12); // ears
    fill('#a6e88a'); ellipse(0, 6, 20, 15);              // snout
    fill('#3f8f2a'); noStroke(); ellipse(-4, 6, 3, 5); ellipse(4, 6, 3, 5);
    stroke(20); strokeWeight(2);
    if (blink || hurt) { line(-12, -5, -6, -5); line(6, -5, 12, -5); } // squint
    else { fill(255); ellipse(-9, -5, 10, 10); ellipse(9, -5, 10, 10); fill(20); noStroke(); ellipse(-8, -4, 4, 4); ellipse(10, -4, 4, 4); }
  }
}
