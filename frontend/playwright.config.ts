import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/playwright",
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "Desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "Tablet",  use: { viewport: { width: 768, height: 1024 } } },
    { name: "Mobile",  use: { viewport: { width: 320, height: 568 } } },
  ],
  webServer: {
    command: "npm run dev",
    port: 3000,
    reuseExistingServer: true,
    timeout: 60000,
  },
});
