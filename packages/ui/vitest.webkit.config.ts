import { defineConfig } from "vitest/config";
import visual, { playwrightProvider } from "./vitest.visual.config.ts";

/**
 * WebKit (Playwright's Safari engine) smoke project, no screenshot baselines: geometry, paint and
 * focus-ring checks, focus and pick-count rows for closing popups, the time-zone canary, the
 * Input's paint rows, and the tab-order and axe rows of the toast. It shares the plugins, CSS,
 * setup file, commands and time zone of the Chromium visual suite, and runs only
 * the `*.webkit.visual.spec.tsx` specs, which that suite excludes.
 */
export default defineConfig({
  ...visual,
  // Its own dependency cache: this project imports fewer dependencies, and a Chromium run that
  // found the shared cache without the rest bundled them mid-run and failed to import its specs
  cacheDir: "node_modules/.vite-webkit",
  test: {
    ...visual.test,
    include: ["src/**/*.webkit.visual.spec.tsx"],
    browser: {
      ...visual.test?.browser,
      // No reduced-motion preference, as most Safari users have: Motion drives the springs
      instances: [
        {
          browser: "webkit",
          provider: playwrightProvider("no-preference"),
        },
      ],
    },
  },
});
