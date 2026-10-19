const { test, expect } = require('@playwright/test');

test('title is exact', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('devs on deck · small crew, big output.');
});

test('has meta description and OG tags', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[name=description]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:description"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /assets\/og\.png$/);
  await expect(page.locator('link[rel=icon][href="assets/favicon.svg"]')).toHaveCount(1);
});

test('no visible version or dev labels', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).not.toContainText(/\bv\d+\b|mockup|todo|lorem/i);
});

test('no console errors on load', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/');
  await page.waitForLoadState('load');
  expect(errors).toEqual([]);
});

test('tokens are exact', async ({ page }) => {
  await page.goto('/');
  const tokens = {
    '--bg': '#11100f', '--panel': '#1a1613', '--line': '#2c241f', '--ink': '#ede8df',
    '--dim': '#9a8f84', '--acc': '#f95721', '--acc2': '#ffab85', '--on-acc': '#11100f',
  };
  const got = await page.evaluate((names) => {
    const cs = getComputedStyle(document.documentElement);
    return Object.fromEntries(names.map((n) => [n, cs.getPropertyValue(n).trim()]));
  }, Object.keys(tokens));
  expect(got).toEqual(tokens);
});
