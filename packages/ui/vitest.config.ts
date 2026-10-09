import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.spec.{ts,tsx}"],
    exclude: ["src/**/*.visual.spec.tsx"],
    passWithNoTests: false,
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
