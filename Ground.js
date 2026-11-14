// The ground is just a big static slab. It's drawn as part of the cached
// background in sketch.js, so this class only has to exist in the physics world.
class Ground {
  constructor(x, y, width, height) {
    this.body = Bodies.rectangle(x, y, width, height, { isStatic: true, friction: 1 });
    this.body.owner = this; // collision code checks body.owner, ground has no hurt() so it's ignored
    World.add(world, this.body);
  }
}
