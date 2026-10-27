import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";
import { toHaveNoViolations } from "jest-axe";
import { expect } from "vitest";

expect.extend(toHaveNoViolations);

// @types/jest-axe types the matcher on jest.Matchers, which Vitest 5 no longer merges into its own
declare module "vitest" {
  interface Matchers<R extends void | Promise<void> = void | Promise<void>, T = unknown> {
    toHaveNoViolations(): R;
  }
}

// Consumers develop under StrictMode (Next.js turns it on), which double-renders and re-runs
// effects. Every RTL render and renderHook runs under it, so missing cleanup fails here first.
// Specs that call hydrateRoot directly bypass it and wrap in StrictMode themselves.
configure({ reactStrictMode: true });

// jsdom does not implement window.matchMedia — provide a minimal stub. Motion below 12.20.4
// subscribes with the deprecated addListener, and the peer range allows those versions.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// axe's elementsFromPoint polyfill calls this, and without it aria-hidden-focus could never fail
document.elementFromPoint = () => null;
