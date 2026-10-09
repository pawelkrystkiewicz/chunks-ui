/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";
import theme from "../theme.css?raw";
import { cn, cnState } from "./cn";

describe("cn", () => {
  it("lets height overrides beat h-ui-height", () => {
    expect(cn("h-ui-height", "h-8")).toBe("h-8");
    expect(cn("min-h-ui-height", "min-h-24")).toBe("min-h-24");
  });

  it("treats font-heading as a font family", () => {
    expect(cn("font-heading", "text-lg", "font-semibold")).toBe(
      "font-heading text-lg font-semibold",
    );
    expect(cn("font-heading", "font-mono")).toBe("font-mono");
  });

  // A token added to theme.css but not to cn keeps both classes, so the override silently loses
  it("merges every z-index, spacing, font and ease token in theme.css", () => {
    const stockClass = {
      "z-index": ["z", "z-50"],
      spacing: ["h", "h-8"],
      font: ["font", "font-serif"],
      ease: ["ease", "ease-in"],
    } as const;
    const tokens = [...theme.matchAll(/--(z-index|spacing|font|ease)-([\w-]+):/g)];
    expect(tokens.length).toBeGreaterThan(0);
    for (const [, namespace, key] of tokens) {
      const [prefix, stock] = stockClass[namespace as keyof typeof stockClass];
      expect(cn(`${prefix}-${key}`, stock), `${prefix}-${key}`).toBe(stock);
    }
  });
});

describe("cnState", () => {
  it("merges a string className like cn", () => {
    expect(cnState("p-2 text-sm", false && "hidden", "p-4")).toBe("text-sm p-4");
    expect(cnState("p-2", undefined)).toBe("p-2");
  });

  it("turns a className function into a function of the part's state", () => {
    const className = cnState("p-2 text-sm", (state: { open: boolean }) =>
      state.open ? "p-4" : undefined,
    );
    expect(typeof className).toBe("function");
    if (typeof className !== "function") return;
    expect(className({ open: true })).toBe("text-sm p-4");
    expect(className({ open: false })).toBe("p-2 text-sm");
  });
});
