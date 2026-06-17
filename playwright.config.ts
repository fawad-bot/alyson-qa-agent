import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:8080";
const STORAGE_STATE = ".auth/user.json";
const hasStorage = fs.existsSync(STORAGE_STATE);

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "bun run dev",
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 60_000,
      },
  projects: [
    {
      name: "public",
      testMatch: /.*\.public\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "authed",
      testMatch: /.*\.authed\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: hasStorage ? STORAGE_STATE : undefined,
      },
    },
  ],
});
