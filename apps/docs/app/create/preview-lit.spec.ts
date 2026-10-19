// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { paintsWith } from "./preview-lit";

const el = (className: string, attrs: Record<string, string> = {}) => {
  const node = document.createElement("span");
  node.className = className;
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
};

describe("paintsWith", () => {
  const primary = paintsWith(["primary"]);

  it("reads a colour utility with the token's name, with or without opacity", () => {
    expect(primary(el("flex bg-primary"))).toBe(true);
    expect(primary(el("border-primary/40"))).toBe(true);
    expect(paintsWith(["primary-text"])(el("text-primary-text"))).toBe(true);
    expect(paintsWith(["chart-1"])(el("bg-chart-1"))).toBe(true);
  });

  it("does not take a longer token, or a utility that is not a colour, for the token", () => {
    expect(primary(el("text-primary-foreground"))).toBe(false);
    expect(paintsWith(["foreground"])(el("text-muted-foreground"))).toBe(false);
    expect(primary(el("rounded-primary"))).toBe(false);
  });

  it("finds the token in an arbitrary value and in the inline style", () => {
    const mixed = "bg-[color-mix(in_oklch,var(--primary)_14%,var(--card))]";
    expect(paintsWith(["card"])(el(mixed))).toBe(true);
    expect(paintsWith(["primary-text"])(el(mixed))).toBe(false);
    expect(paintsWith(["chart-2"])(el("", { style: "background: var(--chart-2)" }))).toBe(true);
  });

  it("counts a state variant only in that state, and never a pointer or focus one", () => {
    expect(primary(el("data-checked:bg-primary"))).toBe(false);
    expect(primary(el("data-checked:bg-primary", { "data-checked": "" }))).toBe(true);
    expect(primary(el("data-[side=top]:bg-primary", { "data-side": "top" }))).toBe(true);
    expect(primary(el("aria-pressed:bg-primary", { "aria-pressed": "false" }))).toBe(false);
    const ring = paintsWith(["primary", "ring"]);
    expect(ring(el("hover:bg-primary/90 focus-visible:outline-ring"))).toBe(false);
    expect(primary(el("group-hover:bg-primary"))).toBe(false);
    // A focus inside the element: Slider.Thumb's, Combobox.Control's and NumberField.Group's ring
    expect(ring(el("has-[:focus-visible]:outline-ring"))).toBe(false);
  });

  it("lets a state class replace a plain colour of its kind, as it does in the CSS", () => {
    const input = paintsWith(["input"]);
    // A checked checkbox's border and fill, and a checked switch's fill, are the primary
    const checkbox = "border border-input data-checked:border-primary data-checked:bg-primary";
    expect(input(el(checkbox, { "data-checked": "" }))).toBe(false);
    expect(input(el(checkbox))).toBe(true);
    expect(input(el("bg-input aria-pressed:bg-primary", { "aria-pressed": "true" }))).toBe(false);
    // Only a colour of the same kind: a border colour leaves the fill, a border width the colour
    expect(input(el("bg-input data-checked:border-primary", { "data-checked": "" }))).toBe(true);
    expect(input(el("border-input data-checked:border-2", { "data-checked": "" }))).toBe(true);
  });

  it("reads Base UI's data-active state as a state, not as the pointer's :active", () => {
    const foreground = paintsWith(["foreground"]);
    expect(foreground(el("data-active:text-foreground", { "data-active": "" }))).toBe(true);
    expect(foreground(el("data-active:text-foreground"))).toBe(false);
  });
});
