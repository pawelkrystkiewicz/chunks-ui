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
        // Reduced motion: components skip Motion springs, so screenshots never catch one mid-way
        {
          browser: "chromium",
          provider: playwright({ contextOptions: { reducedMotion: "reduce" } }),
          exclude: ["src/**/*.motion.visual.spec.tsx"],
        },
        // Motion only animates when reduced motion is off
        {
          browser: "chromium",
          name: "chromium-motion",
          provider: playwright({ contextOptions: { reducedMotion: "no-preference" } }),
          include: ["src/**/*.motion.visual.spec.tsx"],
        },
      ],
      expect: {
        toMatchScreenshot: {
          comparatorOptions: {
            // Pinned image renders repeat byte for byte, so no pixel may differ.
            allowedMismatchedPixelRatio: 0,
          },
        },
      },
    },
  },
});
