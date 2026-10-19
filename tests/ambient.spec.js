const { test, expect } = require('@playwright/test');

// Coarse-grid sample of the field canvas: returns the count of non-transparent
// samples and a signature string to compare two moments in time.
const sample = (page) =>
  page.evaluate(() => {
    const cv = document.getElementById('field');
    if (!cv) return { n: -1, sig: '' };
    const ctx = cv.getContext('2d');
    const { width: w, height: h } = cv;
    const d = ctx.getImageData(0, 0, w, h).data;
    let n = 0;
    let sig = '';
    for (let y = 0; y < h; y += 6) {
      for (let x = 0; x < w; x += 6) {
        const a = d[(y * w + x) * 4 + 3];
        if (a) n++;
        sig += a >> 4;
      }
    }
    return { n, sig };
  });

test('field draws', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop only');
  await page.goto('/');
  await page.waitForTimeout(500);
  expect((await sample(page)).n).toBeGreaterThan(0);
});

test('field idle still moves', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop only');
  await page.goto('/');
  await page.waitForTimeout(500);
  const a = await sample(page);
  await page.waitForTimeout(600);
  const b = await sample(page);
  expect(a.sig).not.toBe(b.sig);
});

test('reduced motion: no field, no custom cursor', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop only');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.mouse.move(300, 300);
  await page.waitForTimeout(500);
  expect((await sample(page)).n).toBe(0);
  await expect(page.locator('.cur-dot')).not.toBeVisible();
});

test('touch: no custom cursor', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone only');
  await page.goto('/');
  await expect(page.locator('.cur-dot')).not.toBeVisible();
  await expect(page.locator('.cur-ring')).not.toBeVisible();
  expect(await page.evaluate(() => getComputedStyle(document.body).cursor)).toBe('auto');
  await page.locator('.t1').tap();
  expect(await page.locator('.t1').evaluate((el) => getComputedStyle(el).transform)).toBe('none');
});

test('field colours are on-theme', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop only');
  await page.addInitScript(() => {
    window.__strokes = new Set();
    const desc = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'strokeStyle');
    Object.defineProperty(CanvasRenderingContext2D.prototype, 'strokeStyle', {
      configurable: true,
      get: desc.get,
      set(v) {
        window.__strokes.add(String(v));
        desc.set.call(this, v);
      },
    });
  });
  await page.goto('/');
  await page.waitForTimeout(500);
  const seen = await page.evaluate(() => [...window.__strokes]);
  expect(seen.length).toBeGreaterThan(0);
  for (const c of seen) expect(['#f95721', '#ffab85', '#ede8df']).toContain(c);
});
