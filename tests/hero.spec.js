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
  // sample which messages are on, over time, from before the page script runs
  // (the load event can land after the first message when the web fonts are slow)
  await page.addInitScript(() => {
    window.__samples = [];
    const read = () => [...document.querySelectorAll('#chat .msg')].map((m, i) => (m.classList.contains('on') ? i : -1)).filter((i) => i >= 0);
    // only sample once the chat is parsed, so the first sample is a real start state
    const tick = () => { if (document.querySelector('#chat .msg')) window.__samples.push(read()); };
    window.__timer = setInterval(tick, 25);
  });
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => Math.max(...window.__samples.map((s) => s.length))), { timeout: 10000 }).toBe(4);
  const samples = await page.evaluate(() => {
    clearInterval(window.__timer);
    return window.__samples;
  });
  expect(samples[0]).toEqual([]);
  let prev = 0;
  for (const s of samples) {
    // on-set is always messages [0..n)
    expect(s).toEqual(s.map((_, i) => i));
    // within the first cycle the count never goes down
    expect(s.length).toBeGreaterThanOrEqual(prev);
    prev = s.length;
  }
});

test('no spinning sticker', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.sticker')).toHaveCount(0);
});

test('headline is set in Cabinet Grotesk', async ({ page }) => {
  await page.goto('/');
  const family = await page.locator('#h1').evaluate((e) => getComputedStyle(e).fontFamily);
  expect(family.split(',')[0].replace(/["']/g, '').trim()).toBe('Cabinet Grotesk');
});

test('longest rotating word fits line 2', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const r = await page.evaluate(() => {
    const rot = document.getElementById('rot');
    const right = Math.max(...[...rot.querySelectorAll('.word')].map((w) => w.getBoundingClientRect().right));
    return { right, vw: document.documentElement.clientWidth };
  });
  expect(r.right).toBeLessThanOrEqual(r.vw - 16);
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
    if (desktop) expect((await box(page, '#chat')).width).toBeCloseTo(420, 0);
  }
});

test('js-motion is set before main.js runs and hero shows with Lenis blocked', async ({ page }) => {
  await page.route('**/lenis*', (r) => r.abort());
  await page.addInitScript(() => {
    document.addEventListener('readystatechange', () => {
      if (document.readyState === 'interactive') window.__early = document.documentElement.classList.contains('js-motion');
    });
  });
  await page.goto('/');
  expect(await page.evaluate(() => window.__early)).toBe(true);
  await expect(page.locator('#h1 .w > span').first()).toHaveCSS('transform', 'none', { timeout: 3000 });
  await expect(page.locator('#sub')).toHaveCSS('opacity', '1', { timeout: 3000 });
});

test('content is revealed when the module graph fails to load', async ({ page }) => {
  await page.route('**/js/hero.js', (r) => r.abort());
  await page.goto('/');
  await expect(page.locator('html')).not.toHaveClass(/js-motion/, { timeout: 4000 });
  await expect(page.locator('#h1 .w > span').first()).toHaveCSS('transform', 'none');
  await expect(page.locator('#sub')).toHaveCSS('opacity', '1');
});
