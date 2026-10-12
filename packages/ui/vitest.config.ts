import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.spec.{ts,tsx}"],
    exclude: ["src/**/*.visual.spec.tsx"],
    passWithNoTests: false,
    // Measured on CI runs where the docs and ui suites still ran in parallel: CI is ~6-14x slower
    // than a laptop, popup-opening tests take 1.3-2.1s there, too close to the 5s default.
    testTimeout: 15_000,
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
