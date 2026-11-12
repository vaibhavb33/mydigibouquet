import fs from "node:fs";
import { defineConfig, devices } from "@playwright/test";

const CACHED_HEADLESS_SHELL =
  "/Users/vaibhavborkar/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60000,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    ...(fs.existsSync(CACHED_HEADLESS_SHELL)
      ? { launchOptions: { executablePath: CACHED_HEADLESS_SHELL } }
      : {}),
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run start -- -p 3100 -H 127.0.0.1",
    url: "http://127.0.0.1:3100/api/health",
    reuseExistingServer: false,
    timeout: 60000,
  },
});
