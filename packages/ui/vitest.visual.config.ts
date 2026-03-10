import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [(await import("@tailwindcss/postcss")).default()],
    },
  },
  test: {
    globals: true,
    include: ["src/**/*.visual.spec.tsx"],
    setupFiles: ["./vitest.visual.setup.ts"],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [
        {
          browser: "chromium",
          context: { reducedMotion: "reduce" },
        },
      ],
      expect: {
        toMatchScreenshot: {
          comparatorOptions: {
            allowedMismatchedPixelRatio: 0.05,
          },
        },
      },
    },
  },
});
