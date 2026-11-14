# Angry Bird

A tiny Angry Birds-style game I started in 9th grade and finally finished.
Built with p5.js (drawing) and Matter.js (physics).

**How to play:** drag the bird back from the slingshot, let go, knock out every pig.
Press `R` any time to restart the level.

**Run it:** just open `index.html` in a browser. No build step.

## Deploy

It's a plain static site (no build step), so any static host works.

- **Vercel:** import the repo, leave Framework Preset as "Other", no build command, output directory blank. Deploy.
- **Netlify:** import the repo, no build command, publish directory `.` (already set in `netlify.toml`).
- **GitHub Pages:** Settings -> Pages -> Source: "GitHub Actions". The workflow in `.github/workflows/pages.yml` deploys on every push to `main`.
