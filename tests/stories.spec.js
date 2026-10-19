const { test, expect } = require('@playwright/test');

const services = (page) => page.locator('#flow').scrollIntoViewIfNeeded();
const away = (page) => page.evaluate(() => window.scrollTo(0, 0));
const toCards = (page) => page.locator('#build').scrollIntoViewIfNeeded();

// samples text/classes every 100ms and collapses repeats
async function observe(page, ms, read) {
  const seen = [];
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const v = await page.evaluate(read);
    const key = JSON.stringify(v);
    if (!seen.length || seen[seen.length - 1].key !== key) seen.push({ key, v });
    await page.waitForTimeout(100);
  }
  return seen.map((s) => s.v);
}

function inOrder(list, wanted) {
  let i = 0;
  for (const x of list) if (x === wanted[i]) i++;
  return i === wanted.length;
}

test.beforeEach(async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop only');
  await page.goto('/');
});

test('card 1 sequence order', async ({ page }) => {
  test.slow();
  await services(page);
  const agent = await observe(page, 9000, () => document.querySelector('#n-agent small').textContent);
  expect(inOrder(agent, ['waiting…', 'reading order email', 'logging the order', 'waiting…',
    'spotting overdue', 'flagging finance', '2 done · 0 humans'])).toBe(true);
});

test('card 1 sheet is filled before slack', async ({ page }) => {
  test.slow();
  await services(page);
  const all = await observe(page, 9000, () => [
    document.querySelector('#n-sheet small').textContent,
    document.querySelector('#n-slack small').textContent,
  ]);
  // drop the shipped finished state sampled before the story resets it
  const seen = all.slice(all.findIndex((s) => s[0] === '—'));
  const firstSheet = seen.findIndex((s) => s[0] === '✓ row added');
  const firstSlack = seen.findIndex((s) => s[1] === '✓ team pinged');
  expect(firstSheet).toBeGreaterThan(-1);
  expect(firstSlack).toBeGreaterThan(firstSheet);
  // the sheet was empty while slack was still waiting
  expect(seen.some((s) => s[0] === '—' && s[1] === '—')).toBe(true);
});

test('card 2 reaches deployed', async ({ page }) => {
  test.slow();
  await toCards(page);
  const all = await observe(page, 9000, () => document.querySelector('#build').className);
  // drop the shipped finished state sampled before the story resets it
  const classes = all.slice(all.indexOf('viz'));
  const firsts = ['s1', 's2', 's3', 's4', 's7'].map((c) => classes.findIndex((s) => s.split(' ').includes(c)));
  expect(firsts.every((i) => i >= 0)).toBe(true);
  expect([...firsts].sort((a, b) => a - b)).toEqual(firsts);
  await expect(page.locator('#b-pct')).toHaveText('100%', { timeout: 9000 });
  await expect(page.locator('#b-url')).toHaveText('checkout.yourstore.com');
});

test('card 3 terminal', async ({ page }) => {
  await toCards(page);
  await expect(page.locator('#term .l')).toHaveCount(1); // the story has reset the terminal
  await expect(page.locator('#term')).toContainText('23 price drops posted to #pricing', { timeout: 7000 });
  await expect(page.locator('#term .l')).toHaveCount(6);
});

test('paused off screen', async ({ page }) => {
  await services(page);
  await page.waitForTimeout(2000);
  await away(page);
  await page.waitForTimeout(600); // let the in-flight step settle
  const text = () => page.locator('#n-agent small').textContent();
  const before = await text();
  await page.waitForTimeout(3000);
  expect(await text()).toBe(before);
});

test('restart is clean', async ({ page }) => {
  test.slow();
  await toCards(page);
  await page.waitForTimeout(1500);
  await away(page);
  await page.waitForTimeout(300);
  await toCards(page);
  await page.waitForTimeout(300);
  await away(page);
  await page.waitForTimeout(300);
  await toCards(page);
  const seen = await observe(page, 9000, () => ({
    cls: document.querySelector('#build').className,
    lines: document.querySelectorAll('#term .l').length,
  }));
  const maxLines = Math.max(...seen.map((s) => s.lines));
  expect(maxLines).toBeLessThanOrEqual(6);
  expect(seen[seen.length - 1].lines).toBe(6);
  const classes = seen.map((s) => s.cls.split(' '));
  const firstS7 = classes.findIndex((c) => c.includes('s7'));
  const firstS4 = classes.findIndex((c) => c.includes('s4'));
  expect(firstS4).toBeGreaterThan(-1);
  if (firstS7 >= 0) expect(firstS7).toBeGreaterThan(firstS4);
});

test('reduced motion: finished states', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await toCards(page);
  await page.waitForTimeout(1500);
  await expect(page.locator('#n-slack small')).toHaveText('✓ team pinged');
  await expect(page.locator('#build')).toHaveClass(/s7/);
  await expect(page.locator('#term')).toContainText('23 price drops');
});

test('a throwing frame callback does not stop other consumers', async ({ page }) => {
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  const ticks = await page.evaluate(async () => {
    const { onFrame } = await import('/js/motion.js');
    let n = 0;
    onFrame(() => { throw new Error('boom'); });
    onFrame(() => { n++; });
    await new Promise((r) => setTimeout(r, 400));
    return n;
  });
  expect(ticks).toBeGreaterThan(5);
  expect(errors.some((e) => e.includes('frame callback failed'))).toBe(true);
});
