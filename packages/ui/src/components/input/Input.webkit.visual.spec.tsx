import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { paintedPixels } from "../../VisualTest.utils";
import { Input } from "./index";

// The browser's clear button showed beside ours in a type="search" input (#686). WebKit paints its
// button while the input has text, focused or not, read-only and disabled too, where ours hides.
// Neither engine reports the computed style of the button, so the rows count the pixels it paints.
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
    const input = screen.getByRole("searchbox");
    const painted = await paintedPixels(input, "::-webkit-search-cancel-button");
    expect(painted > 0, "the browser paints its clear button").toBe(native);
    expect(screen.queryAllByRole("button", { name: "Clear" })).toHaveLength(ours);
  });
});
