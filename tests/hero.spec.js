const { test, expect } = require('@playwright/test');

const box = (page, sel) =>
  page.evaluate((s) => {
    const r = document.querySelector(s).getBoundingClientRect();
    return { left: r.left, width: r.width, height: r.height };
  }, sel);

test('no layout shift in hero', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop only');
  await page.goto('/');
  const base = { chat: await box(page, '#chat'), h1: await box(page, '#h1') };
  for (let t = 0; t < 7000; t += 250) {
    await page.waitForTimeout(250);
    for (const [key, sel] of [['chat', '#chat'], ['h1', '#h1']]) {
      const b = await box(page, sel);
      for (const k of ['left', 'width', 'height']) {
        expect(Math.abs(b[k] - base[key][k]), `${sel} ${k} at ${t}ms`).toBeLessThanOrEqual(0.5);
      }
    }
  }
});

test('words rotate', async ({ page }) => {
  await page.goto('/');
  const on = () => page.locator('#rot .word.on').innerText();
  expect(await on()).toBe('side quest.');
  await expect.poll(on, { timeout: 4000 }).toBe('problem now.');
});

test('chat plays in order', async ({ page }) => {
  await page.goto('/');
  const count = () => page.locator('#chat .msg.on').count();
  await page.waitForTimeout(1000);
  expect(await count()).toBe(1);
  await expect(page.locator('#chat .msg').first()).toHaveClass(/\bon\b/);
  await page.waitForTimeout(4200);
  expect(await count()).toBe(4);
});

test('sticker text fits one lap', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.sticker textPath')).toHaveAttribute('textLength', '301');
});

test.describe('reduced motion', () => {
  test('shows finished state', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForTimeout(600);
    for (const m of await page.locator('#chat .msg').all()) {
      await expect(m).toHaveCSS('opacity', '1');
    }
    await expect(page.locator('#rot .word.on')).toHaveText('side quest.');
    await expect(page.locator('#rot .word.on')).toHaveCSS('opacity', '1');
    expect(await page.evaluate(() => document.documentElement.classList.contains('js-motion'))).toBe(false);
  });
});

test('resize keeps layout', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop only');
  await page.goto('/');
  const noOverflow = () =>
    page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
  for (const [w, desktop] of [[1373, true], [390, false], [1373, true]]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(400);
    expect(await noOverflow(), `overflow at ${w}`).toBe(true);
    if (desktop) expect((await box(page, '#chat')).width).toBeCloseTo(400, 0);
  }
});
