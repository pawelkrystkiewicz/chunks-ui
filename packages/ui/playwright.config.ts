import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./visual-tests",
  testMatch: "**/*.visual.ts",
  snapshotDir: "./visual-tests/__screenshots__",
  snapshotPathTemplate: "{snapshotDir}/{testFilePath}/{arg}{ext}",

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: process.env.CI ? "github" : "list",

  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.005,
    },
  },

  use: {
    baseURL: "http://localhost:5173",
    contextOptions: {
      reducedMotion: "reduce",
    },
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "bunx vite --config visual-tests/vite.config.ts",
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
});
