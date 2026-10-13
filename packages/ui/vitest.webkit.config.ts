import { defineConfig } from "vitest/config";
import visual, { playwrightProvider } from "./vitest.visual.config";

/**
 * WebKit (Playwright's Safari engine) smoke project: a few geometry and paint checks, no
 * screenshot baselines. It shares the plugins, CSS, setup file, commands and runner window of
 * the Chromium visual suite, and runs only the `*.webkit.visual.spec.tsx` specs, which that
 * suite excludes.
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
