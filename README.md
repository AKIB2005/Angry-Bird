# Angry Bird

A physics-based slingshot game built with **p5.js** and **Matter.js**. Pull back, aim, and knock out every pig using as few birds as possible.

I started this project in 9th grade and left it unfinished. It has since been revived into a complete, playable game with a slingshot, destructible structures, animations and a performance-minded rendering pipeline.

## Features

- **Slingshot mechanics:** drag and release, with a dotted trajectory preview while aiming.
- **Destructible world:** crates, logs and pigs take damage from impact speed, show cracks as they weaken, and break apart.
- **Polished animation:** bouncing title screen, breathing and blinking pigs, speed-based bird squash and stretch, flight trails, screen shake, dust particles, bird reload hop and an animated star rating.
- **Scoring and win/lose states:** 3 birds per level, with up to 3 stars depending on how many birds you have left.
- **Zero build step:** plain HTML, CSS and JavaScript. Open it and play.

## Controls

| Action | Input |
| --- | --- |
| Aim and launch | Click and drag the bird back, then release |
| Cancel a shot | Release with a very small pull |
| Restart the level | `R` key, or click after the end screen appears |
| Start the game | Click on the title screen |

## Run Locally

```bash
git clone https://github.com/AKIB2005/Angry-Bird.git
cd Angry-Bird
```

Then open `index.html` in any modern browser. If you prefer a local server, use VS Code's Live Server extension or run `npx serve .`.

## Project Structure

```
Angry-Bird/
├── index.html      # Page shell and script loading order
├── style.css       # Page and canvas styling
├── sketch.js       # Game loop, input, physics stepping, rendering, game states
├── fx.js           # Easing functions, particle pool, cloud sprite
├── box.js          # Block base class (health, damage, death) and Box
├── log.js          # Wooden plank
├── pig.js          # Pig enemy with animated face
├── redbird.js      # Bird body and shared bird drawing routine
├── Ground.js       # Static ground body
├── p5.min.js       # p5.js 0.7.2
├── matter.js       # Matter.js 0.12.0
└── vercel.json     # Vercel deployment configuration
```

## How It Works

**Physics.** Matter.js simulates the world in fixed 60 Hz steps. If a frame runs long, the game takes several small steps instead of one large one, which prevents objects from tunnelling through each other. Resting bodies are put to sleep so a settled tower costs almost nothing.

**Damage.** Every collision measures the relative speed of the two bodies. Impacts below a threshold are free. Above it, each object loses health in proportion to the extra speed, using its own toughness values.

**Rendering.** The sky, hills and ground are painted once into an off-screen image and reused every frame. Particles come from a fixed pool, so nothing is allocated during play and there are no garbage-collection stutters.

## Performance Notes

- Static background is cached instead of redrawn each frame.
- Particle system uses a fixed-size pool and draws through the canvas context directly.
- Fixed timestep with a clamped frame gap for stable physics on slow devices.
- Body sleeping enabled for resting objects.
- Device pixel ratio capped at 2 to save battery on high-density phone screens.
- Unused libraries (`p5.dom`, `p5.sound`) removed, saving about 170 KB.

## Tuning the Game

Gameplay values are plain constants, so they are easy to adjust.

| Setting | File | Effect |
| --- | --- | --- |
| `POWER` | `sketch.js` | Launch speed per unit of pull |
| `MAX_PULL` | `sketch.js` | Maximum stretch of the sling |
| `START_BIRDS` | `sketch.js` | Birds per level |
| `hp`, `tough`, `soft` | constructors in `box.js`, `log.js`, `pig.js` | Health, minimum damaging speed, and damage per extra speed |

The level layout lives in `resetLevel()` in `sketch.js`.

## Deployment

This is a static site with no build step.

**Vercel (recommended)**

1. Import the repository in Vercel.
2. Set the Framework Preset to **Other**.
3. Leave the build command and output directory empty.
4. Click **Deploy**.

**GitHub Pages**

Go to Settings → Pages and set Source to **GitHub Actions**. The workflow in `.github/workflows/pages.yml` deploys on every push to `main`.

## Roadmap

- [ ] Multiple levels with increasing difficulty
- [ ] Sound effects and music
- [ ] Additional bird types with special abilities
- [ ] Responsive canvas scaling for small screens
- [ ] Upgrade to current p5.js and Matter.js releases

## Tech Stack

- [p5.js](https://p5js.org/) for drawing and input
- [Matter.js](https://brm.io/matter-js/) for 2D rigid-body physics
- Vanilla JavaScript, HTML and CSS

## Author

**Akib** · [GitHub @AKIB2005](https://github.com/AKIB2005)

## Acknowledgements

Inspired by Rovio's Angry Birds. This is an unofficial fan project made for learning and is not affiliated with Rovio Entertainment.