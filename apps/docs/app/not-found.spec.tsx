// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import NotFound from "./not-found";

// nextra-theme-docs builds an IntersectionObserver at import time; jsdom has none
vi.hoisted(() => {
  globalThis.IntersectionObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  } as never;
});

afterEach(cleanup);

it("tells the reader the page is missing and links back into the docs", () => {
  render(<NotFound />);

  expect(screen.getByRole("heading", { level: 1, name: "404: Page Not Found" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Go to Getting Started" }).getAttribute("href")).toBe(
    "/getting-started",
  );
});
