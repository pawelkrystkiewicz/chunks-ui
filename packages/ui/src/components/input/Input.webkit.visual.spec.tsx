import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { page } from "vitest/browser";
import { Input } from "./index";

/**
 * Whether the browser paints its own clear button in `input`: its screenshot changes when a style
 * hides that button. Neither WebKit nor Chromium reports the computed style of
 * `::-webkit-search-cancel-button`, so a screenshot is the check. A copy of the one in
 * Input.visual.spec.tsx, which only the Chromium projects run.
 */
async function paintsNativeClear(input: HTMLElement) {
  const shot = () => page.screenshot({ element: input, save: false });
  const shown = await shot();
  const probe = document.createElement("style");
  probe.textContent = "[data-probe]::-webkit-search-cancel-button { display: none !important; }";
  document.head.append(probe);
  input.setAttribute("data-probe", "");
  try {
    return (await shot()) !== shown;
  } finally {
    input.removeAttribute("data-probe");
    probe.remove();
  }
}

// The browser's clear button showed beside ours in a type="search" input (#686). WebKit paints its
// button while the input has text, focused or not, read-only and disabled too, where ours hides.
describe("Input type=search in WebKit", () => {
  it.each([
    { has: "with the clear button, shows only ours", props: { clearable: true }, ours: 1 },
    { has: "without it, keeps the browser's", props: {}, ours: 0, native: true },
    {
      has: "read-only, with the clear button, shows none",
      props: { clearable: true, readOnly: true },
      ours: 0,
    },
    {
      has: "disabled, with the clear button, shows none",
      props: { clearable: true, disabled: true },
      ours: 0,
    },
  ])("$has", async ({ props, ours, native = false }) => {
    render(
      <div style={{ padding: 40, width: 300 }}>
        <Input type="search" aria-label="Search" defaultValue="Hello" {...props} />
      </div>,
    );
    expect(await paintsNativeClear(screen.getByRole("searchbox"))).toBe(native);
    expect(screen.queryAllByRole("button", { name: "Clear" })).toHaveLength(ours);
  });
});
