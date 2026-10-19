const { test, expect } = require('@playwright/test');

const scrollManiTo = (page, frac) =>
  page.evaluate((f) => {
    const m = document.getElementById('mani');
    window.scrollTo(0, m.getBoundingClientRect().top + window.scrollY - innerHeight * f);
  }, frac);

const counts = (page) =>
  page.evaluate(() => ({
    lit: document.querySelectorAll('#mani .wd.lit').length,
    total: document.querySelectorAll('#mani .wd').length,
  }));

test('vibe lights up with scroll', async ({ page }) => {
  await page.goto('/');
  await scrollManiTo(page, 1);
  await page.waitForTimeout(300);
  const before = await counts(page);
  expect(before.total).toBeGreaterThan(10);
  expect(before.lit).toBe(0);
  await scrollManiTo(page, 0.2);
  await page.waitForTimeout(300);
  const after = await counts(page);
  expect(after.lit).toBe(after.total);
});

test('stripe has logo separators and moves', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('.marquee .track svg use').count()).toBeGreaterThanOrEqual(4);
  const read = () => page.evaluate(() => document.querySelector('.marquee .track').style.transform);
  const a = await read();
  await page.waitForTimeout(300);
  const b = await read();
  expect(a).not.toBe(b);
  expect(b).toContain('translate3d');
});

test('cards reveal on scroll', async ({ page }) => {
  await page.goto('/');
  await page.locator('#services').scrollIntoViewIfNeeded();
  await page.evaluate(() => document.querySelector('.bento').scrollIntoView());
  await expect(page.locator('.tile.t1')).toHaveClass(/show/);
  await expect(page.locator('.tile.t1')).toHaveCSS('opacity', '1');
});

test('dossier never tilts', async ({ page, isMobile }) => {
  test.skip(isMobile, 'hover only');
  await page.goto('/');
  const d = page.locator('#dossier');
  await d.scrollIntoViewIfNeeded();
  const b = await d.boundingBox();
  await page.mouse.move(b.x + 6, b.y + 6);
  await page.mouse.move(b.x + 10, b.y + 10);
  await page.waitForTimeout(200);
  await expect(d).toHaveCSS('transform', 'none');
});

test('cards tilt on hover-capable devices', async ({ page, isMobile }) => {
  test.skip(isMobile, 'hover only');
  await page.goto('/');
  const t = page.locator('.tile.t2');
  await t.scrollIntoViewIfNeeded();
  await expect(t).toHaveClass(/show/);
  await page.waitForTimeout(1200);
  const b = await t.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + 100);
  await page.mouse.move(b.x + b.width / 2 + 30, b.y + 110);
  await page.waitForTimeout(300);
  const tr = await t.evaluate((e) => e.querySelector('.tilt').style.transform);
  expect(tr).toContain('rotateY');
});

test.describe('reduced motion', () => {
  test('vibe fully lit, cards visible', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const words = await page.$$eval('#mani .wd', (els) =>
      els.map((e) => [getComputedStyle(e).color, getComputedStyle(e).opacity]),
    );
    expect(words.length).toBeGreaterThan(10);
    for (const [c, o] of words) {
      expect(['rgb(237, 232, 223)', 'rgb(249, 87, 33)']).toContain(c);
      expect(o).toBe('1');
    }
    const ops = await page.$$eval('.tile', (els) => els.map((e) => getComputedStyle(e).opacity));
    expect(ops.length).toBeGreaterThan(0);
    for (const o of ops) expect(o).toBe('1');
  });
});

test('stripe wraps without a visible jump', async ({ page }) => {
  await page.addInitScript(() => {
    window.__tx = [];
    const rec = () => {
      const k = document.querySelector('.marquee .track');
      if (k && k.style.transform) window.__tx.push(parseFloat(k.style.transform.slice(12)));
      requestAnimationFrame(rec);
    };
    requestAnimationFrame(rec);
  });
  await page.clock.install();
  await page.goto('/');
  await page.clock.runFor(45000);
  const tx = await page.evaluate(() => window.__tx);
  const period = await page.evaluate(() => {
    const k = document.querySelector('.marquee .track').children;
    return k[8].offsetLeft - k[0].offsetLeft;
  });
  expect(period).toBeGreaterThan(500);
  let wraps = 0;
  for (let i = 1; i < tx.length; i++) {
    const diff = tx[i] - tx[i - 1];
    if (diff > 0) wraps++;
    const m = ((diff % period) + period) % period;
    expect(Math.min(m, period - m), `step ${i}`).toBeLessThanOrEqual(3);
  }
  expect(wraps).toBeGreaterThan(0);
});

test('tile hit area is stable near a corner', async ({ page, isMobile }) => {
  test.skip(isMobile, 'hover only');
  await page.goto('/');
  const t = page.locator('.tile.t2');
  await t.scrollIntoViewIfNeeded();
  await expect(t).toHaveClass(/show/);
  await page.waitForTimeout(1200);
  const b = await t.boundingBox();
  const x = b.x + b.width - 10; // inside the 26px corner radius
  const y = b.y + 10;
  await page.mouse.move(x - 20, y + 20);
  for (let i = 0; i < 8; i++) {
    await page.mouse.move(x - (i % 2), y + (i % 2));
    await page.waitForTimeout(40);
    const tr = await t.evaluate((e) => e.querySelector('.tilt').style.transform);
    expect(tr, `move ${i}`).toContain('rotateY');
  }
});

test('reduced motion: cards do not tilt', async ({ page, isMobile }) => {
  test.skip(isMobile, 'hover only');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const t = page.locator('.tile.t2');
  await t.scrollIntoViewIfNeeded();
  const b = await t.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + 100);
  await page.mouse.move(b.x + b.width / 2 + 30, b.y + 110);
  await page.waitForTimeout(200);
  await expect(t.locator('.tilt')).toHaveCSS('transform', 'none');
  expect(await t.evaluate((e) => e.querySelector('.tilt').style.transform)).toBe('');
});
