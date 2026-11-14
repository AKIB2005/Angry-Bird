// A wooden plank. `angle` rotates it from vertical, so PI/2 = lying flat.
class Log extends Block {
  constructor(x, y, length, angle) {
    super(Bodies.rectangle(x, y, 20, length, { restitution: 0.15, friction: 0.6, density: 0.002 }), 20, length, 120, 4, 9);
    Body.setAngle(this.body, angle);
    this.dust = '#e0a85c';
  }
  paint() {
    rectMode(CENTER);
    stroke('#8a5522'); strokeWeight(4); fill('#e0a85c');
    rect(0, 0, this.w, this.h);
    stroke('#b9803c'); strokeWeight(2); // wood grain, cheap but it sells it
    for (let y = -this.h / 2 + 18; y < this.h / 2 - 8; y += 26) line(-4, y, 4, y + 8);
  }
}
