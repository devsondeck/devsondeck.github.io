const { test, expect } = require('@playwright/test');

const norm = (s) => s.replace(/ /g, ' ').replace(/\s+/g, ' ').toLowerCase();

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('sections exist in order', async ({ page }) => {
  const order = await page.evaluate(() => {
    const els = ['top', 'services', 'lab', 'contact'].map((id) => document.getElementById(id));
    if (els.some((e) => !e)) return null;
    return els.slice(1).every((e, i) => !!(els[i].compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING));
  });
  expect(order).toBe(true);
});

test('key copy present', async ({ page }) => {
  const text = norm(await page.evaluate(() => document.body.innerText));
  for (const s of [
    'ur busywork', 'is our', 'side quest.', "three things we're", 'lowkey cracked at.',
    "stuff we're", 'cooking rn.', 'classified', 'hmu.', 'A dev replies, not a salesperson.',
  ]) {
    expect(text, s).toContain(norm(s));
  }
});

test('no horizontal overflow', async ({ page }) => {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(over).toBeLessThanOrEqual(0);
});

test('phone nav shows only the logo and hmu', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone');
  const texts = await page.$$eval('nav a', (as) =>
    as.filter((a) => a.getClientRects().length > 0).map((a) => a.textContent.trim()));
  expect(texts).toHaveLength(2);
  expect(texts[1]).toBe('hmu');
  await expect(page.locator('nav a.logo')).toBeVisible();
});

test('hero chat column is fixed', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  const w = await page.locator('#chat').evaluate((e) => e.getBoundingClientRect().width);
  expect(w).toBe(400);
});

test('story visuals render finished', async ({ page }) => {
  // the finished state is what reduced-motion visitors see; with motion on, the intro hides some of it
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#n-inbox small')).toHaveText('141 new');
  await expect(page.locator('#n-agent small')).toHaveText('2 done · 0 humans');
  await expect(page.locator('#build')).toHaveClass(/s1.*s2.*s3.*s7/);
  await expect(page.locator('#term .l')).toHaveCount(6);
  await expect(page.locator('#chat .msg')).toHaveCount(4);
  for (const m of await page.locator('#chat .msg').all()) {
    expect(await m.evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
  }
});

test('keyboard tab order is DOM order with visible focus', async ({ page }) => {
  const total = await page.evaluate(() =>
    [...document.querySelectorAll('a[href], button, [tabindex]')].filter(
      (e) => e.tabIndex >= 0 && !e.hidden && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden'
    ).length);
  expect(total).toBeGreaterThan(8);

  const seen = [];
  for (let i = 0; i < total; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      window.__seq = window.__seq || [];
      const prev = window.__seq[window.__seq.length - 1];
      const inOrder = !prev || !!(prev.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
      window.__seq.push(el);
      const cs = getComputedStyle(el);
      return { inOrder, outline: parseFloat(cs.outlineWidth), style: cs.outlineStyle, label: el.textContent.trim() || el.className };
    });
    expect(info.inOrder, `order at ${info.label}`).toBe(true);
    expect(info.style, info.label).not.toBe('none');
    expect(info.outline, info.label).toBeGreaterThanOrEqual(2);
    seen.push(info.label);
  }
  const distinct = await page.evaluate(() => new Set(window.__seq).size);
  expect(distinct).toBe(total);
  // every visible link was reached
  const links = await page.evaluate(() => window.__seq.filter((e) => e.matches('a')).length);
  const allLinks = await page.evaluate(() =>
    [...document.querySelectorAll('a[href]')].filter((e) => !e.hidden && e.getClientRects().length > 0).length);
  expect(links).toBe(allLinks);
});
