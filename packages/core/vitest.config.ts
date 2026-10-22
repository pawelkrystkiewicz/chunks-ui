import { defineConfig } from "vitest/config";

// Off UTC (CI is UTC), so a local date read through UTC fails here too;
// see TESTING_STRATEGY "Time zone".
process.env.TZ = "Europe/Warsaw";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.spec.ts"],
    // Vitest blanks CSS imports by default; cn.spec.ts reads the theme tokens as text
    css: { include: [/theme\.css\?raw$/] },
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "json"],
      include: ["src/**/*.ts"],
      exclude: ["**/*.spec.*", "src/index.ts", "**/*.Variants.ts"],
      thresholds: {
        statements: 88,
        branches: 72,
        functions: 88,
        lines: 90,
      },
    },
  },
});
