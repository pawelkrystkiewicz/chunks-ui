import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // The docs import their own modules as `@/…` (tsconfig paths), which Vite does not read
  resolve: { alias: { "@": fileURLToPath(new URL("./app", import.meta.url)) } },
  test: {
    // Node by default; specs that render declare `// @vitest-environment jsdom`
    include: ["app/**/*.spec.{ts,tsx}", "scripts/**/*.spec.ts"],
    passWithNoTests: false,
    setupFiles: ["./vitest.setup.ts"],
  },
});
