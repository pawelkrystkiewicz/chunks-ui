/// <reference types="vite/client" />
import "./src/visual-test.css";
import cyrillicExt from "@fontsource-variable/manrope/files/manrope-cyrillic-ext-wght-normal.woff2?url";
import cyrillic from "@fontsource-variable/manrope/files/manrope-cyrillic-wght-normal.woff2?url";
import greek from "@fontsource-variable/manrope/files/manrope-greek-wght-normal.woff2?url";
import latinExt from "@fontsource-variable/manrope/files/manrope-latin-ext-wght-normal.woff2?url";
import latin from "@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2?url";
import vietnamese from "@fontsource-variable/manrope/files/manrope-vietnamese-wght-normal.woff2?url";
import unicodeRanges from "@fontsource-variable/manrope/unicode.json";
import { configure } from "@testing-library/react";
import { beforeEach, chai, expect } from "vitest";
import { commands, type Locator, userEvent } from "vitest/browser";
import { expectNoOverflow } from "./src/VisualTest.utils";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

// StrictMode on, as consumers (Next.js) and the unit suite run: an effect that misbehaves when
// run again shows in geometry, a spring or a screenshot.
configure({ reactStrictMode: true });

// Manrope, the theme's --font-sans, from local files: the weights (200–800) and subsets the docs
// app loads from Google Fonts. Without it, text fell back to each machine's sans-serif, so glyph
// widths, and with them overflow, differed between macOS and the Docker image. Added in the
// order of Google's stylesheet, which decides the subset that draws a character two ranges
// share. A file that fails to load fails the setup, and with it every spec.
await Promise.all(
  Object.entries({
    "cyrillic-ext": cyrillicExt,
    cyrillic,
    greek,
    vietnamese,
    "latin-ext": latinExt,
    latin,
  } satisfies Record<keyof typeof unicodeRanges, string>).map(([subset, url]) => {
    const face = new FontFace("Manrope", `url(${JSON.stringify(url)})`, {
      weight: "200 800",
      unicodeRange: unicodeRanges[subset as keyof typeof unicodeRanges],
    });
    document.fonts.add(face);
    return face.load().catch((error: unknown) => {
      throw new Error(`Manrope (${subset}) did not load from ${url}`, { cause: error });
    });
  }),
);

// renderFixture checks for overflow once, after the render. Content that opens or grows later
// (an expanded panel, a popup on the page) is checked here, before every screenshot, by the
// same rule, on the element the screenshot captures.
chai.util.overwriteMethod(
  chai.Assertion.prototype,
  "toMatchScreenshot",
  (toMatchScreenshot: (...args: unknown[]) => Promise<void>) =>
    async function (this: object, ...args: unknown[]) {
      const target: Element | Locator = chai.util.flag(this, "object");
      // A nullish target goes straight to Vitest's own matcher, which fails with "Expected
      // element or locator to be defined" at once, not after a poll timeout.
      if (target == null) return toMatchScreenshot.apply(this, args);
      // A locator waits for its element to exist, as Playwright does.
      await expect.element(target as HTMLElement | Locator).toBeInTheDocument();
      expectNoOverflow(target instanceof Element ? target : target.element());
      return toMatchScreenshot.apply(this, args);
    },
);

// Real browser events drive these specs, and they wait with expect.element/poll, not act().
// Testing Library turns React's act environment on in a beforeAll, so React logged
// "not wrapped in act(...)" for every update an event or a timer caused. Turn it back
// off before each test; render() and cleanup() still wrap themselves in act.
beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = false;
});

// The browser page keeps the mouse where the last click or hover left it, across tests and
// spec files, and hovers whatever renders under it next. Which spec ran before on the same
// page differs between machines, so a hover style could slip into one machine's screenshot.
// Move the mouse off the page before each test.
beforeEach(async () => {
  await commands.parkPointer();
});

// Chromium shows :focus-visible on a programmatic focus (a defaultOpen popup taking focus) only
// after a keyboard event, never after a mouse one, and the page keeps that state across tests and
// spec files. A screenshot of such a popup had a ring or none by which spec ran before it, which
// a shuffled run exposed. Start every test in keyboard modality; a spec that wants the mouse's
// (no ring) clicks first.
beforeEach(async () => {
  await userEvent.keyboard("{Escape}");
});
