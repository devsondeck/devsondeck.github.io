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
  const tr = await t.evaluate((e) => e.style.transform);
  expect(tr).toContain('rotateY');
});

test.describe('reduced motion', () => {
  test('vibe fully lit, cards visible', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const colors = await page.$$eval('#mani .wd', (els) => els.map((e) => getComputedStyle(e).color));
    expect(colors.length).toBeGreaterThan(10);
    for (const c of colors) expect(['rgb(237, 232, 223)', 'rgb(249, 87, 33)']).toContain(c);
    const ops = await page.$$eval('.tile', (els) => els.map((e) => getComputedStyle(e).opacity));
    expect(ops.length).toBeGreaterThan(0);
    for (const o of ops) expect(o).toBe('1');
  });
});
