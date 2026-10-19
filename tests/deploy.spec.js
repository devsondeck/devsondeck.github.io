const { test, expect } = require('@playwright/test');
const fs = require('fs');

test('og image exists and is 1200x630', async ({ request }) => {
  const res = await request.get('/assets/og.png');
  expect(res.status()).toBe(200);
  const buf = await res.body();
  expect(buf.readUInt32BE(16)).toBe(1200);
  expect(buf.readUInt32BE(20)).toBe(630);
});

test('deploy ships only site files', () => {
  const yml = fs.readFileSync('.github/workflows/pages.yml', 'utf8');
  const copy = 'cp -r index.html styles.css js assets .nojekyll _site/';
  expect(yml).toContain(copy);
  const line = yml.split('\n').find((l) => l.includes(copy));
  for (const bad of ['tests', 'tools', 'node_modules', '.github']) expect(line).not.toContain(bad);
});
