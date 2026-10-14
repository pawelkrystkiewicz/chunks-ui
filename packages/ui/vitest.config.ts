import { defineConfig } from "vitest/config";

// Off UTC, with DST and a positive offset, so a spec that reads a local date through UTC
// (toISOString) fails here as it would for a user; the GitHub runner is UTC. A positive offset
// puts local midnight, which nearly every date chunks-ui handles is, on the previous UTC day.
// The pin catches the midnight and early-morning reads; a late-evening read (23:59 is the next
// day in UTC west of it) is guarded only when a developer runs west of UTC.
// Node reads TZ before the workers create a Date.
process.env.TZ = "Europe/Warsaw";

export default defineConfig({
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
    // Vitest blanks CSS imports by default; cn.spec.ts reads the theme tokens as text
    css: { include: [/theme\.css\?raw$/] },
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
