# devsondeck.github.io

devs on deck · small crew, big output. This repo is our one-page site at https://devsondeck.github.io, plain HTML, CSS and JS with no build step.

## Run it locally

```
npm ci
npx http-server -p 4173
```

Then open http://localhost:4173.

## Test it

```
npm test          # Playwright, uses the installed Google Chrome
npm run validate  # html-validate on index.html
```

The tests serve the repo root on port 4173. If that port is busy, set another one: `PORT=4183 npm test`.

## Making changes

1. Branch off `main` and open a pull request. Fill in the PR template.
2. CI runs three checks: validate, test and links. All need to be green.
3. One approval from another crew member is required before merging.

## Config

Contact details live in `js/config.js`: the email address (plus the subject and body for the mail links) and an optional Cal link (`calLink`, leave it empty to hide it).

## Share image

`assets/og.png` and `assets/apple-touch-icon.png` are generated from `tools/og.html`. To redo them: `node tools/render-assets.cjs`.

## Deploy

Merging to `main` deploys the site through GitHub Actions (`.github/workflows/pages.yml`). Only `index.html`, `styles.css`, `js/`, `assets/` and `.nojekyll` are published. You can also re-run it by hand from the Actions tab.
