const { test, expect } = require('@playwright/test');

const MAIL = 'mailto:devsondeck.crew@gmail.com?subject=yo%20devs%20on%20deck%20%F0%9F%91%8B&body=';

test('mail links', async ({ page }) => {
  await page.goto('/');
  const hrefs = await page.locator('.js-mail').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
  expect(hrefs.length).toBeGreaterThan(0);
  for (const h of hrefs) expect(h.startsWith(MAIL)).toBe(true);
  await expect(page.locator('.js-mail-text')).toHaveText('devsondeck.crew@gmail.com');
});

test('github links', async ({ page }) => {
  await page.goto('/');
  const links = page.locator('a[href="https://github.com/devsondeck"]');
  expect(await links.count()).toBeGreaterThanOrEqual(3);
  const attrs = await links.evaluateAll((els) => els.map((e) => [e.getAttribute('target'), e.getAttribute('rel')]));
  for (const [target, rel] of attrs) {
    expect(target).toBe('_blank');
    expect(rel).toContain('noopener');
  }
});

test('book a call hidden by default', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#book-call')).toBeHidden();
});

async function landsOn(page, sel) {
  await page.click(`nav a[href="${sel}"]`);
  await page.waitForTimeout(2000);
  const top = await page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top, sel);
  expect(top).toBeGreaterThan(-40);
  expect(top).toBeLessThan(40);
}

test('nav links land on sections', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await landsOn(page, '#lab');
  await landsOn(page, '#contact');
  await page.click('nav a[href="#top"]');
  await page.waitForTimeout(2500);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test('works when Lenis is blocked', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('**/lenis*', (r) => r.abort());
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await landsOn(page, '#lab');
  expect(errors).toEqual([]);
});
