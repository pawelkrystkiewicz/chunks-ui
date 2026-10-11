import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Node by default; specs that render declare `// @vitest-environment jsdom`
    include: ["app/**/*.spec.{ts,tsx}", "scripts/**/*.spec.ts"],
    passWithNoTests: false,
    setupFiles: ["./vitest.setup.ts"],
  },
});
