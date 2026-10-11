import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";
import { toHaveNoViolations } from "jest-axe";
import { expect } from "vitest";

expect.extend(toHaveNoViolations);

// Consumers develop under StrictMode (Next.js turns it on), which double-renders and re-runs
// effects. Every render and renderHook runs under it, so missing cleanup fails here first.
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
