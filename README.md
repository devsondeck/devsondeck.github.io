# devsondeck.github.io

devs on deck · small crew, big output. Website at devsondeck.github.io

## Develop

```
npm ci
npm test          # Playwright, uses the installed Google Chrome
npm run validate  # html-validate on index.html
```

The tests serve the repo root on port 4173 (override with `PORT`).

## Deploy

GitHub Pages serves `index.html`, `styles.css`, `js/`, `assets/` and `.nojekyll`.
