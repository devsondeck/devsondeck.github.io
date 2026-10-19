// Renders assets/og.png (1200x630) and assets/apple-touch-icon.png (180x180) from tools/og.html.
// Usage: node tools/render-assets.cjs   (needs network for Google Fonts)
const { chromium } = require('@playwright/test');
const path = require('path');
const url = 'file://' + path.resolve(__dirname, 'og.html');
const out = (f) => path.resolve(__dirname, '..', 'assets', f);

(async () => {
  const browser = await chromium.launch({ channel: 'chrome' });
  const shot = async (size, hash, file) => {
    const page = await browser.newPage({ viewport: size });
    await page.goto(url + hash, { waitUntil: 'networkidle' });
    if (hash) await page.evaluate(() => document.body.classList.add('icon-mode'));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: out(file) });
    await page.close();
  };
  await shot({ width: 1200, height: 630 }, '', 'og.png');
  await shot({ width: 180, height: 180 }, '#icon', 'apple-touch-icon.png');
  await browser.close();
})();
