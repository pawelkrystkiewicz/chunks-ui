import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.spec.{ts,tsx}"],
    exclude: ["src/**/*.visual.spec.tsx"],
    passWithNoTests: false,
    // jsdom role queries over a calendar grid cost ~115ms each under coverage, and CI runs 10-20x
    // slower than a laptop: DatePicker and Calendar tests reach 3-5s there, against the default 5s.
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
