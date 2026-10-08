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
    .map((el) => `${el.className}|${el.getAttribute("style")}`)
    .join("||");

it("applies the theme to the preview only, never to <html> or <body>", () => {
  render(<CreatePage />);
  const before = pageChrome();
  const sidebar = screen.getByRole("complementary", { name: "Theme" });

  // Every preset, mode, swatch, base, chart, radius stop, shadow, shuffle and reset.
  // "Get code" is excluded: its dialog locks page scroll by design.
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
});
