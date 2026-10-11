// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { LandingPage } from "./LandingPage";

// jsdom lacks these. nextra-theme-docs builds an IntersectionObserver at import time, and
// useReducedMotion queries media; Motion below 12.20.4 subscribes with the deprecated addListener.
vi.hoisted(() => {
  globalThis.IntersectionObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as never;
  window.matchMedia ??= (media) =>
    ({
      matches: false,
      media,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
    }) as never;
});

afterEach(cleanup);

it.each([
  ["Read the docs", "/getting-started"],
  ["Open Create", "/create"],
])("the %s CTA is a link with the contained primary Button colours", (name, href) => {
  render(<LandingPage />);
  // The exact name also proves the arrow icon stays out of it
  const cta = screen.getByRole("link", { name });
  expect(cta.getAttribute("href")).toBe(href);
  expect([...cta.classList]).toEqual(
    expect.arrayContaining(["bg-primary", "text-primary-foreground"]),
  );
});
