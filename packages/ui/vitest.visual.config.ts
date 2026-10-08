import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";
import type { BrowserCommand } from "vitest/node";
import type { EmulatedMedia } from "./src/VisualTest.utils";

/** Emulates media features (e.g. no reduced-motion preference, to reach the Motion path). */
const emulateMedia: BrowserCommand<[options: EmulatedMedia]> = async ({ page }, options) => {
  await page.emulateMedia(options);
};

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
      commands: { emulateMedia },
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
