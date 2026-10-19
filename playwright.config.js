const { defineConfig } = require('@playwright/test');

const PORT = process.env.PORT || 4173;
const BASE = `http://localhost:${PORT}`;

module.exports = defineConfig({
  testDir: 'tests',
  retries: process.env.CI ? 2 : 0,
  forbidOnly: !!process.env.CI,
  use: { channel: 'chrome', baseURL: BASE },
  webServer: {
    command: `npx http-server -p ${PORT} -s -c-1`,
    url: BASE,
    reuseExistingServer: false,
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1373, height: 900 } } },
    { name: 'phone', use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
  ],
});
