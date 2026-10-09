// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, expect, it } from "vitest";
import { CreatePage } from "./CreatePage";

beforeAll(() => {
  // jsdom lacks both: ToggleGroup measures its items, useReducedMotion queries media
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  window.matchMedia ??= (media) =>
    ({ matches: false, media, addEventListener() {}, removeEventListener() {} }) as never;
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

const pageChrome = () =>
  [document.documentElement, document.body]
    .map((el) => Array.from(el.attributes, (a) => `${a.name}=${a.value}`).join(" "))
    .join("||");

// 47 full-page interactions. Measured on 18 cores: 0.6-1.3s idle, 2.5-3.9s at load 40-65,
// 5.1-6.8s at load ~90 (turbo running the ui suite alongside, or 72 busy loops).
it("applies the theme to the preview only, never to <html> or <body>", () => {
  const before = pageChrome();
  render(<CreatePage />);
  expect(pageChrome()).toBe(before);
  const sidebar = screen.getByRole("complementary", { name: "Theme" });

  // Every preset, mode, swatch, base, chart, radius stop, shadow, shuffle and reset.
  // "Get code" is excluded: its dialog locks page scroll by design.
  // The Select-driven font pickers (role=combobox) are not driven here.
  for (const button of sidebar.querySelectorAll("button:not([role=combobox])")) {
    if (button.textContent?.includes("Get code")) continue;
    fireEvent.click(button);
  }
  for (const slider of screen.getAllByRole("slider")) {
    fireEvent.keyDown(slider, { key: "End" });
    fireEvent.keyDown(slider, { key: "Home" });
  }

  expect(pageChrome()).toBe(before);
  const scope = screen
    .getByRole("region", { name: "Preview" })
    .querySelector("[style*='--radius']");
  expect(scope).not.toBeNull();
}, 10_000);
