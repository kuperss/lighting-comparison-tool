import { defineConfig, devices } from '@playwright/test';

// CHROMIUM_PATH：環境已裝好瀏覽器時指定路徑，避免重新下載
const launchOptions = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {};

export default defineConfig({
  testDir: 'e2e',
  webServer: { command: 'npx vite preview --port 4174 --strictPort', port: 4174, reuseExistingServer: true },
  use: { baseURL: 'http://localhost:4174/', launchOptions },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 }, launchOptions } },
    { name: 'mobile', use: { ...devices['Pixel 7'], launchOptions } },
  ],
});
