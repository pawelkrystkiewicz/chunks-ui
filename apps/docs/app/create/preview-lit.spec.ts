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
  it("reads a colour utility with the token's name, with or without opacity", () => {
    expect(paintsWith(el("flex bg-primary"), ["primary"])).toBe(true);
    expect(paintsWith(el("border-primary/40"), ["primary"])).toBe(true);
    expect(paintsWith(el("text-primary-text"), ["primary-text"])).toBe(true);
    expect(paintsWith(el("bg-chart-1"), ["chart-1"])).toBe(true);
  });

  it("does not take a longer token, or a utility that is not a colour, for the token", () => {
    expect(paintsWith(el("text-primary-foreground"), ["primary"])).toBe(false);
    expect(paintsWith(el("text-muted-foreground"), ["foreground"])).toBe(false);
    expect(paintsWith(el("rounded-primary"), ["primary"])).toBe(false);
  });

  it("finds the token in an arbitrary value and in the inline style", () => {
    const mixed = "bg-[color-mix(in_oklch,var(--primary)_14%,var(--card))]";
    expect(paintsWith(el(mixed), ["card"])).toBe(true);
    expect(paintsWith(el(mixed), ["primary-text"])).toBe(false);
    expect(paintsWith(el("", { style: "background: var(--chart-2)" }), ["chart-2"])).toBe(true);
  });

  it("counts a state variant only in that state, and never a pointer or focus one", () => {
    expect(paintsWith(el("data-checked:bg-primary"), ["primary"])).toBe(false);
    expect(paintsWith(el("data-checked:bg-primary", { "data-checked": "" }), ["primary"])).toBe(
      true,
    );
    expect(paintsWith(el("data-[side=top]:bg-primary", { "data-side": "top" }), ["primary"])).toBe(
      true,
    );
    expect(
      paintsWith(el("aria-pressed:bg-primary", { "aria-pressed": "false" }), ["primary"]),
    ).toBe(false);
    expect(
      paintsWith(el("hover:bg-primary/90 focus-visible:outline-ring"), ["primary", "ring"]),
    ).toBe(false);
  });
});
