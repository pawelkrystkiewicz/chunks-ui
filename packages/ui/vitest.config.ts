import { defaultClientConditions } from "vite";
import { defineConfig } from "vitest/config";

// Off UTC (CI is UTC), so a local date read through UTC fails here too;
// see TESTING_STRATEGY "Time zone".
process.env.TZ = "Europe/Warsaw";

export default defineConfig({
  // chunks-ui-core from its src/, so the specs run against core's source without a core build
  resolve: { conditions: ["chunks-ui-source", ...defaultClientConditions] },
  test: {
    environment: "jsdom",
    include: ["src/**/*.spec.{ts,tsx}"],
    exclude: ["src/**/*.visual.spec.tsx"],
    passWithNoTests: false,
    // About 3x the slowest test on CI. Measured on the 94 unit.tests.yml runs from #311 (serial
    // suites) to 2026-10-13: the slowest test of a run took 1.18s at the median, 1.60s at p90 and
    // 1.86s at most (DatePicker's form remount test), hooks included. About 0.3s on a laptop.
    testTimeout: 6_000,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "json"],
      include: ["src/components/**/*.{ts,tsx}"],
      exclude: ["**/*.spec.*", "**/index.ts", "**/*.Variants.{ts,tsx}"],
      thresholds: {
        statements: 88,
        branches: 72,
        functions: 88,
        lines: 90,
      },
    },
  },
});
