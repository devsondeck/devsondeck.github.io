const { test, expect } = require('@playwright/test');

const scrollToLab = (page) =>
  page.evaluate(() => {
    const d = document.getElementById('dossier');
    window.scrollTo(0, d.getBoundingClientRect().top + window.scrollY - innerHeight * 0.2);
  });

test('stamp slams once', async ({ page }) => {
  await page.goto('/');
  await scrollToLab(page);
  await expect(page.locator('#stamp')).toHaveClass(/slam/, { timeout: 1500 });
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await scrollToLab(page);
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => document.getElementById('stamp').getAnimations().length)).toBe(0);
});

test('redaction says nice try', async ({ page }) => {
  await page.goto('/');
  await scrollToLab(page);
  const red = page.locator('.red').first();
  await page.waitForTimeout(1200);
  await red.hover();
  await expect(red).toHaveText('nice try', { timeout: 2500 });
  await page.mouse.move(5, 5);
  await expect(red).not.toHaveText('nice try');
});

test('redaction works by keyboard', async ({ page }) => {
  await page.goto('/');
  await scrollToLab(page);
  await page.focus('.red');
  await expect(page.locator('.red').first()).toHaveText('nice try', { timeout: 2500 });
  await expect(page.locator('.red').first()).toHaveAttribute('aria-label', 'redacted');
});

test('no library details leak', async ({ page }) => {
  await page.goto('/');
  const text = await page.locator('#lab').innerText();
  expect(text).not.toMatch(/(toggle|slider|segmented)/i);
});

test('reduced motion shows the stamp without animation', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/');
  await scrollToLab(page);
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => getComputedStyle(document.getElementById('stamp')).opacity)).toBe('0.92');
  expect(await page.evaluate(() => document.getElementById('stamp').getAnimations().length)).toBe(0);
  await page.hover('.red');
  await expect(page.locator('.red').first()).toHaveText('nice try', { timeout: 2500 });
  await ctx.close();
});

test.describe('landscape phone', () => {
  test.use({ viewport: { width: 667, height: 375 } });
  test('stamp still slams on a short screen', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      // scroll through #lab until the stamp is mid-screen (the dossier is taller than the viewport here)
      const lab = document.getElementById('lab');
      window.scrollTo(0, lab.getBoundingClientRect().top + window.scrollY);
      window.scrollBy(0, 200);
    });
    await expect(page.locator('#stamp')).toHaveClass(/slam/, { timeout: 2000 });
  });
});
